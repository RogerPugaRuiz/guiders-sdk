import {
  TrackingEventDto,
  IngestTrackingEventsBatchDto,
  IngestEventsResponseDto,
  TenantMetadataDto
} from '../types';
import { EndpointManager } from '../core/endpoint-manager';
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
  private static readonly MAX_PAYLOAD_SIZE_BYTES = 1024 * 1024; // 1 MB
  private static readonly MIN_EVENTS_PER_BATCH = 10; // Mínimo de eventos para evitar loops infinitos

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
      const discarded = originalCount - validEvents.length;
      debugLog(`[TrackingV2Service] ⚠️ ${discarded} eventos inválidos descartados (formato antiguo/UUIDs inválidos)`);
    }

    // 🔧 SI TODOS LOS EVENTOS SON INVÁLIDOS, retornar respuesta especial indicando que deben eliminarse
    if (validEvents.length === 0) {
      debugLog('[TrackingV2Service] ❌ TODOS los eventos son inválidos, deben eliminarse de la cola');
      return {
        success: true,
        received: originalCount,
        processed: 0,
        discarded: originalCount,
        aggregated: 0,
        message: 'All events were invalid and discarded (V1 format or invalid UUIDs)',
        processingTimeMs: 0
      };
    }

    // Validar tamaño del batch
    let finalEvents = validEvents;
    if (validEvents.length > TrackingV2Service.MAX_BATCH_SIZE) {
      finalEvents = validEvents.slice(0, TrackingV2Service.MAX_BATCH_SIZE);
    }

    // ✅ VERIFICAR tamaño del payload
    const payloadSize = this.estimatePayloadSize(finalEvents);

    if (payloadSize > TrackingV2Service.MAX_PAYLOAD_SIZE_BYTES) {
      debugLog(
        `[TrackingV2Service] ⚠️ Payload excede límite (${payloadSize} bytes > ${TrackingV2Service.MAX_PAYLOAD_SIZE_BYTES} bytes), recortando...`
      );

      // Intentar recortar eventos
      const trimmedEvents = this.trimEventsToFitPayload(
        finalEvents,
        TrackingV2Service.MAX_PAYLOAD_SIZE_BYTES
      );

      if (trimmedEvents.length < finalEvents.length) {
        // Si aún hay eventos restantes después del recorte, usar multi-request
        const remaining = finalEvents.slice(trimmedEvents.length);
        debugLog(
          `[TrackingV2Service] 🔄 Usando multi-request para enviar ${finalEvents.length} eventos en múltiples batches...`
        );

        const results = await this.sendBatchMultiRequest(finalEvents);
        return results.length > 0 ? results[0] : null; // Retornar primera respuesta
      }

      finalEvents = trimmedEvents;
    }

    const payload: IngestTrackingEventsBatchDto = {
      tenantId: this.tenantId!,
      siteId: this.siteId!,
      events: finalEvents
    };

    debugLog(
      `[TrackingV2Service] 📤 Enviando batch de ${finalEvents.length} eventos válidos (${payloadSize} bytes)...`
    );

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

    // ✅ sendBeacon tiene un límite de ~64KB en la mayoría de navegadores
    const BEACON_MAX_SIZE = 64 * 1024; // 64 KB
    let finalEvents = validEvents.slice(0, TrackingV2Service.MAX_BATCH_SIZE);

    // Verificar tamaño del payload
    let payloadSize = this.estimatePayloadSize(finalEvents);

    if (payloadSize > BEACON_MAX_SIZE) {
      debugLog(
        `[TrackingV2Service] ⚠️ Payload excede límite de sendBeacon (${payloadSize} bytes > ${BEACON_MAX_SIZE} bytes), recortando...`
      );

      // Recortar eventos para que quepan en el límite de sendBeacon
      finalEvents = this.trimEventsToFitPayload(finalEvents, BEACON_MAX_SIZE);
      payloadSize = this.estimatePayloadSize(finalEvents);

      if (finalEvents.length === 0) {
        debugLog(
          '[TrackingV2Service] ❌ No se pudo ajustar ningún evento al límite de sendBeacon'
        );
        return false;
      }
    }

    const payload: IngestTrackingEventsBatchDto = {
      tenantId: this.tenantId!,
      siteId: this.siteId!,
      events: finalEvents
    };

    const url = this.getTrackingEndpoint();
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    try {
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        debugLog(
          `[TrackingV2Service] ✅ ${finalEvents.length} eventos válidos enviados via sendBeacon (${payloadSize} bytes)`
        );
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

        // Reintentar solo en errores 5xx
        if (response.status >= 500 && retriesLeft > 0) {
          const delay = Math.pow(2, TrackingV2Service.MAX_RETRIES - retriesLeft) * 1000;
          await this.sleep(delay);
          return this.sendBatchWithRetry(payload, retriesLeft - 1);
        }

        return null;
      }

      const result: IngestEventsResponseDto = await response.json();
      debugLog('[TrackingV2Service] ✅ Batch enviado exitosamente:', result);
      return result;
    } catch (error) {

      // Reintentar en caso de error de red
      if (retriesLeft > 0) {
        const delay = Math.pow(2, TrackingV2Service.MAX_RETRIES - retriesLeft) * 1000;
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
   * Estima el tamaño del payload en bytes
   * @param events Array de eventos
   * @returns Tamaño estimado en bytes
   */
  private estimatePayloadSize(events: TrackingEventDto[]): number {
    const payload: IngestTrackingEventsBatchDto = {
      tenantId: this.tenantId!,
      siteId: this.siteId!,
      events
    };
    const json = JSON.stringify(payload);
    return new Blob([json]).size;
  }

  /**
   * Recorta eventos hasta que el payload quepa en el límite de tamaño
   * @param events Array de eventos original
   * @param maxSizeBytes Tamaño máximo permitido en bytes
   * @returns Array recortado de eventos que cabe en el límite
   */
  private trimEventsToFitPayload(
    events: TrackingEventDto[],
    maxSizeBytes: number
  ): TrackingEventDto[] {
    if (events.length === 0) return [];

    // Binary search para encontrar el máximo número de eventos que caben
    let left = TrackingV2Service.MIN_EVENTS_PER_BATCH;
    let right = events.length;
    let bestFit = left;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const subset = events.slice(0, mid);
      const size = this.estimatePayloadSize(subset);

      if (size <= maxSizeBytes) {
        bestFit = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    const trimmedEvents = events.slice(0, bestFit);
    debugLog(
      `[TrackingV2Service] ✂️ Payload recortado: ${events.length} → ${trimmedEvents.length} eventos (${this.estimatePayloadSize(trimmedEvents)} bytes)`
    );

    return trimmedEvents;
  }

  /**
   * Envía eventos en múltiples requests si el payload excede el límite
   * @param events Array de eventos a enviar
   * @returns Array de respuestas del backend
   */
  private async sendBatchMultiRequest(
    events: TrackingEventDto[]
  ): Promise<IngestEventsResponseDto[]> {
    const results: IngestEventsResponseDto[] = [];
    let remaining = [...events];

    while (remaining.length > 0) {
      const batch = this.trimEventsToFitPayload(
        remaining,
        TrackingV2Service.MAX_PAYLOAD_SIZE_BYTES
      );

      if (batch.length === 0) {
        debugLog(
          '[TrackingV2Service] ⚠️ No se pudo ajustar ningún evento al límite de payload, abortando'
        );
        break;
      }

      const payload: IngestTrackingEventsBatchDto = {
        tenantId: this.tenantId!,
        siteId: this.siteId!,
        events: batch
      };

      debugLog(
        `[TrackingV2Service] 📤 Enviando sub-batch ${results.length + 1} de ${batch.length} eventos...`
      );

      const result = await this.sendBatchWithRetry(
        payload,
        TrackingV2Service.MAX_RETRIES
      );

      if (result) {
        results.push(result);
      }

      // Remover eventos enviados
      remaining = remaining.slice(batch.length);
    }

    debugLog(
      `[TrackingV2Service] ✅ Multi-request completado: ${results.length} batches enviados`
    );
    return results;
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
