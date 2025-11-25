import {
  TrackingEventDto,
  IngestTrackingEventsBatchDto,
  IngestEventsResponseDto,
  TenantMetadataDto
} from '../types';
import { EndpointManager } from '../core/tracking-pixel-SDK';
import { debugLog } from '../utils/debug-logger';
import { getCommonFetchOptions } from '../utils/http-headers';

/**
 * TrackingV2Service
 *
 * Servicio singleton para gestionar el envío de eventos al sistema de tracking V2 del backend.
 *
 * Características:
 * - Batching automático (hasta 500 eventos por request)
 * - Reintentos con backoff exponencial
 * - sendBeacon para beforeunload
 * - Caché de metadata (tenantId, siteId)
 *
 * @example
 * const service = TrackingV2Service.getInstance();
 * await service.initialize('gds_xxx');
 * const result = await service.sendBatch(events);
 */
export class TrackingV2Service {
  private static instance: TrackingV2Service;
  private static readonly METADATA_CACHE_KEY = 'guiders_tracking_metadata';
  private static readonly MAX_BATCH_SIZE = 500;
  private static readonly MAX_RETRIES = 3;
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private tenantId: string | null = null;
  private siteId: string | null = null;
  private apiKey: string | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Intentar cargar metadata desde localStorage
    this.loadMetadataFromCache();
  }

  /**
   * Valida que un evento tenga el formato TrackingEventDto correcto
   */
  private isValidTrackingEvent(event: any): event is TrackingEventDto {
    if (!event || typeof event !== 'object') {
      return false;
    }

    // Validar campos requeridos
    if (!event.visitorId || typeof event.visitorId !== 'string') {
      debugLog('[TrackingV2Service] ❌ Evento inválido: falta visitorId', event);
      return false;
    }

    if (!event.sessionId || typeof event.sessionId !== 'string') {
      debugLog('[TrackingV2Service] ❌ Evento inválido: falta sessionId', event);
      return false;
    }

    if (!event.eventType || typeof event.eventType !== 'string') {
      debugLog('[TrackingV2Service] ❌ Evento inválido: falta eventType', event);
      return false;
    }

    if (!event.metadata || typeof event.metadata !== 'object') {
      debugLog('[TrackingV2Service] ❌ Evento inválido: falta metadata', event);
      return false;
    }

    if (!event.occurredAt || typeof event.occurredAt !== 'string') {
      debugLog('[TrackingV2Service] ❌ Evento inválido: falta occurredAt', event);
      return false;
    }

    // Validar que sean UUIDs válidos
    if (!TrackingV2Service.UUID_REGEX.test(event.visitorId)) {
      debugLog('[TrackingV2Service] ❌ Evento inválido: visitorId no es UUID', event.visitorId);
      return false;
    }

    if (!TrackingV2Service.UUID_REGEX.test(event.sessionId)) {
      debugLog('[TrackingV2Service] ❌ Evento inválido: sessionId no es UUID', event.sessionId);
      return false;
    }

    // Validar que no tenga campos del formato antiguo
    if ('trackingEventId' in event || 'pageUrl' in event || 'pagePath' in event) {
      debugLog('[TrackingV2Service] ❌ Evento inválido: contiene campos del formato antiguo', event);
      return false;
    }

    return true;
  }

  public static getInstance(): TrackingV2Service {
    if (!TrackingV2Service.instance) {
      TrackingV2Service.instance = new TrackingV2Service();
    }
    return TrackingV2Service.instance;
  }

  /**
   * Inicializa el servicio obteniendo metadata del backend
   * @param apiKey API Key del tenant
   */
  public async initialize(apiKey: string): Promise<void> {
    this.apiKey = apiKey;

    // Si ya tenemos metadata cacheada, usarla
    if (this.tenantId && this.siteId) {
      debugLog('[TrackingV2Service] ✅ Usando metadata cacheada:', {
        tenantId: this.tenantId,
        siteId: this.siteId
      });
      this.initialized = true;
      return;
    }

    // Obtener metadata del backend
    try {
      const metadata = await this.fetchMetadata(apiKey);
      if (metadata) {
        this.tenantId = metadata.tenantId;
        this.siteId = metadata.siteId;
        this.cacheMetadata(metadata);
        this.initialized = true;
        debugLog('[TrackingV2Service] ✅ Metadata obtenida del backend:', metadata);
      } else {
        debugLog('[TrackingV2Service] ⚠️ No se pudo obtener metadata, usando modo degradado');
        // Modo degradado: usar apiKey como tenantId/siteId temporal
        this.tenantId = apiKey;
        this.siteId = apiKey;
        this.initialized = true;
      }
    } catch (error) {
      debugLog('[TrackingV2Service] ❌ Error obteniendo metadata:', error);
      // Fallback: usar apiKey como identificador temporal
      this.tenantId = apiKey;
      this.siteId = apiKey;
      this.initialized = true;
    }
  }

  /**
   * Envía un batch de eventos al backend
   * @param events Array de eventos a enviar
   * @returns Respuesta del backend o null si falla
   */
  public async sendBatch(
    events: TrackingEventDto[]
  ): Promise<IngestEventsResponseDto | null> {
    if (!this.initialized) {
      console.warn('[TrackingV2Service] ⚠️ Servicio no inicializado, llamar a initialize() primero');
      return null;
    }

    if (events.length === 0) {
      debugLog('[TrackingV2Service] 📭 No hay eventos para enviar');
      return null;
    }

    // ✅ FILTRAR eventos inválidos (formato antiguo, UUIDs inválidos, campos faltantes)
    const originalCount = events.length;
    const validEvents = events.filter((event) => this.isValidTrackingEvent(event));

    if (validEvents.length < originalCount) {
      console.warn(
        `[TrackingV2Service] ⚠️ Se descartaron ${originalCount - validEvents.length} eventos inválidos del batch`
      );
      console.warn('[TrackingV2Service] 💡 Limpia localStorage.removeItem("guiders_event_queue") para eliminar eventos antiguos');
    }

    if (validEvents.length === 0) {
      console.warn('[TrackingV2Service] ❌ No hay eventos válidos para enviar después del filtrado');
      return null;
    }

    // Validar tamaño del batch
    let finalEvents = validEvents;
    if (validEvents.length > TrackingV2Service.MAX_BATCH_SIZE) {
      console.warn(
        `[TrackingV2Service] ⚠️ Batch muy grande (${validEvents.length}), truncando a ${TrackingV2Service.MAX_BATCH_SIZE}`
      );
      finalEvents = validEvents.slice(0, TrackingV2Service.MAX_BATCH_SIZE);
    }

    const payload: IngestTrackingEventsBatchDto = {
      tenantId: this.tenantId!,
      siteId: this.siteId!,
      events: finalEvents
    };

    debugLog(`[TrackingV2Service] 📤 Enviando batch de ${finalEvents.length} eventos válidos...`);

    // Enviar con reintentos
    return this.sendBatchWithRetry(payload, TrackingV2Service.MAX_RETRIES);
  }

  /**
   * Envía eventos usando sendBeacon (garantía de entrega en beforeunload)
   * @param events Array de eventos a enviar
   * @returns true si sendBeacon fue exitoso
   */
  public sendBatchWithBeacon(events: TrackingEventDto[]): boolean {
    if (!this.initialized || events.length === 0) {
      return false;
    }

    if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) {
      debugLog('[TrackingV2Service] ⚠️ sendBeacon no disponible');
      return false;
    }

    // ✅ FILTRAR eventos inválidos antes de enviar
    const validEvents = events.filter((event) => this.isValidTrackingEvent(event));

    if (validEvents.length === 0) {
      debugLog('[TrackingV2Service] ❌ No hay eventos válidos para sendBeacon');
      return false;
    }

    const payload: IngestTrackingEventsBatchDto = {
      tenantId: this.tenantId!,
      siteId: this.siteId!,
      events: validEvents.slice(0, TrackingV2Service.MAX_BATCH_SIZE)
    };

    const url = this.getTrackingEndpoint();
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    try {
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        debugLog(`[TrackingV2Service] ✅ ${validEvents.length} eventos válidos enviados via sendBeacon`);
      } else {
        debugLog('[TrackingV2Service] ⚠️ sendBeacon falló');
      }
      return success;
    } catch (error) {
      debugLog('[TrackingV2Service] ❌ Error con sendBeacon:', error);
      return false;
    }
  }

  /**
   * Envía un batch con reintentos y backoff exponencial
   */
  private async sendBatchWithRetry(
    payload: IngestTrackingEventsBatchDto,
    retriesLeft: number
  ): Promise<IngestEventsResponseDto | null> {
    const url = this.getTrackingEndpoint();

    try {
      const response = await fetch(url, {
        ...getCommonFetchOptions('POST'),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[TrackingV2Service] ❌ Error HTTP ${response.status}:`,
          errorText
        );

        // Reintentar solo en errores 5xx
        if (response.status >= 500 && retriesLeft > 0) {
          const delay = Math.pow(2, TrackingV2Service.MAX_RETRIES - retriesLeft) * 1000;
          console.warn(
            `[TrackingV2Service] 🔄 Reintentando en ${delay}ms (${retriesLeft} intentos restantes)...`
          );
          await this.sleep(delay);
          return this.sendBatchWithRetry(payload, retriesLeft - 1);
        }

        return null;
      }

      const result: IngestEventsResponseDto = await response.json();
      debugLog('[TrackingV2Service] ✅ Batch enviado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('[TrackingV2Service] ❌ Error de red:', error);

      // Reintentar en caso de error de red
      if (retriesLeft > 0) {
        const delay = Math.pow(2, TrackingV2Service.MAX_RETRIES - retriesLeft) * 1000;
        console.warn(
          `[TrackingV2Service] 🔄 Reintentando en ${delay}ms (${retriesLeft} intentos restantes)...`
        );
        await this.sleep(delay);
        return this.sendBatchWithRetry(payload, retriesLeft - 1);
      }

      return null;
    }
  }

  /**
   * Obtiene metadata (tenantId, siteId) del backend
   */
  private async fetchMetadata(apiKey: string): Promise<TenantMetadataDto | null> {
    const endpoint = EndpointManager.getInstance().getEndpoint();
    // endpoint ya incluye /api, solo añadimos el path específico
    const url = `${endpoint}/pixel/metadata?apiKey=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetch(url, getCommonFetchOptions('GET'));

      if (!response.ok) {
        debugLog(
          `[TrackingV2Service] ⚠️ Error obteniendo metadata: HTTP ${response.status}`
        );
        return null;
      }

      const metadata: TenantMetadataDto = await response.json();
      return metadata;
    } catch (error) {
      debugLog('[TrackingV2Service] ❌ Error fetchMetadata:', error);
      return null;
    }
  }

  /**
   * Cachea metadata en localStorage
   */
  private cacheMetadata(metadata: TenantMetadataDto): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(
        TrackingV2Service.METADATA_CACHE_KEY,
        JSON.stringify(metadata)
      );
    } catch (error) {
      debugLog('[TrackingV2Service] ⚠️ No se pudo cachear metadata:', error);
    }
  }

  /**
   * Carga metadata desde localStorage
   */
  private loadMetadataFromCache(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const cached = localStorage.getItem(TrackingV2Service.METADATA_CACHE_KEY);
      if (cached) {
        const metadata: TenantMetadataDto = JSON.parse(cached);
        this.tenantId = metadata.tenantId;
        this.siteId = metadata.siteId;
        debugLog('[TrackingV2Service] 📂 Metadata cargada desde caché');
      }
    } catch (error) {
      debugLog('[TrackingV2Service] ⚠️ Error cargando metadata desde caché:', error);
    }
  }

  /**
   * Construye la URL del endpoint de tracking
   */
  private getTrackingEndpoint(): string {
    const endpoint = EndpointManager.getInstance().getEndpoint();
    return `${endpoint}/tracking-v2/events`;
  }

  /**
   * Utilidad para esperar (sleep)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Verifica si el servicio está inicializado
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Obtiene la metadata actual
   */
  public getMetadata(): { tenantId: string | null; siteId: string | null } {
    return {
      tenantId: this.tenantId,
      siteId: this.siteId
    };
  }
}
