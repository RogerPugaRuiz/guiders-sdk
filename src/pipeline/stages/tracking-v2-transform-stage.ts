import { PixelEvent, TrackingEventDto } from '../../types';
import { PipelineStage } from '../pipeline-stage';
import { debugLog } from '../../utils/debug-logger';

/**
 * TrackingV2TransformStage
 *
 * Transforma eventos internos del SDK al formato requerido por el backend tracking-v2:
 *
 * INPUT (PixelEvent):
 * {
 *   type: 'tracking:tracking-event',
 *   data: { trackingEventId, metadata, eventType },
 *   timestamp: 1234567890,
 *   metadata: { session: {...}, url: '...', ... }
 * }
 *
 * OUTPUT (PixelEvent con data transformada):
 * {
 *   type: 'tracking:tracking-event',
 *   data: TrackingEventDto {
 *     visitorId: 'uuid',
 *     sessionId: 'uuid',
 *     eventType: 'PAGE_VIEW',
 *     metadata: {...},
 *     occurredAt: '2025-01-15T10:30:00.000Z'
 *   },
 *   timestamp: ...
 * }
 */
export class TrackingV2TransformStage implements PipelineStage<PixelEvent, PixelEvent> {
  /**
   * Mapea tipos de eventos internos a tipos del backend
   */
  private static readonly EVENT_TYPE_MAP: Record<string, string> = {
    // Eventos de tracking estándar
    page_view: 'PAGE_VIEW',
    click: 'CLICK',
    hover: 'HOVER',
    scroll: 'SCROLL',
    mouse_move: 'MOUSE_MOVE',
    form_submit: 'FORM_SUBMIT',
    form_field_focus: 'FORM_FIELD_FOCUS',
    video_play: 'VIDEO_PLAY',
    video_pause: 'VIDEO_PAUSE',
    video_complete: 'VIDEO_COMPLETE',
    file_download: 'FILE_DOWNLOAD',
    link_click: 'LINK_CLICK',
    button_click: 'BUTTON_CLICK',
    product_view: 'PRODUCT_VIEW',
    add_to_cart: 'ADD_TO_CART',
    search: 'SEARCH',
    // Eventos de chat del visitante
    'visitor:open-chat': 'VISITOR_OPEN_CHAT',
    'visitor:close-chat': 'VISITOR_CLOSE_CHAT',
    'visitor:chat-active': 'VISITOR_CHAT_ACTIVE',
    'visitor:send-message': 'VISITOR_SEND_MESSAGE',
    'tracking:tracking-event': 'TRACKING_EVENT'
  };

  process(event: PixelEvent): PixelEvent {
    try {
      const originalData: any = event.data || {};
      const metadata = event.metadata || {};

      // 1. Obtener visitorId
      const visitorId = this.getVisitorId();
      if (!visitorId) {
        debugLog(
          '[TrackingV2TransformStage] ⚠️ No se encontró visitorId, evento no será enviado'
        );
        return event; // Retornar sin transformar, será filtrado más adelante
      }

      // 2. Obtener sessionId (REQUERIDO - sin sessionId no podemos trazar eventos)
      const sessionId = this.getSessionId(metadata);
      if (!sessionId) {
        debugLog(
          '[TrackingV2TransformStage] ⚠️ No se encontró sessionId, evento no será enviado'
        );
        return event; // Retornar sin transformar, será filtrado más adelante
      }

      // 3. Determinar eventType
      // Prioridad: originalData.eventType > event.type
      const rawEventType = originalData.eventType || event.type;
      const eventType = this.normalizeEventType(rawEventType);

      // 4. Construir metadata fusionando TODOS los datos del evento
      const trackingMetadata: Record<string, any> = {
        // Campos de originalData.metadata (si existen)
        ...(originalData.metadata || {}),
        // Campos de event.metadata (session, page, device, etc.)
        ...metadata,
        // Campos adicionales de event.data que no sean metadatos especiales
        ...this.extractAdditionalFields(originalData)
      };

      // Limpiar campos internos que no deben ir al backend
      delete trackingMetadata.session;
      delete trackingMetadata.token;
      delete trackingMetadata.trackingEventId; // Ya no es necesario en metadata

      // 5. Obtener timestamp en formato ISO 8601
      const occurredAt = new Date(event.timestamp).toISOString();

      // 6. Construir TrackingEventDto
      // sessionId siempre existe aquí porque lo validamos arriba
      const trackingEvent: TrackingEventDto = {
        visitorId,
        sessionId, // Garantizado que existe por validación previa
        eventType,
        metadata: trackingMetadata,
        occurredAt
      };

      // 7. Reemplazar data del evento
      event.data = trackingEvent as any;

      // Limpiar metadata original para reducir payload
      delete event.metadata;

      debugLog('[TrackingV2TransformStage] ✅ Evento transformado:', {
        eventType,
        visitorId: visitorId.substring(0, 8) + '...',
        sessionId: sessionId?.substring(0, 8) + '...'
      });

      return event;
    } catch (error) {
      return event; // Retornar evento sin transformar
    }
  }

  /**
   * Obtiene el visitorId desde localStorage
   * IMPORTANTE: Solo retorna el UUID del backend, NO el fingerprint
   */
  private getVisitorId(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const visitorId = localStorage.getItem('visitorId');

    // Validar que sea un UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    if (visitorId && this.isValidUUID(visitorId)) {
      return visitorId;
    }

    return null;
  }

  /**
   * Valida que un string sea un UUID válido (v4)
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Obtiene el sessionId desde metadata o sessionStorage
   * IMPORTANTE: Solo retorna UUIDs válidos del backend
   */
  private getSessionId(metadata: Record<string, unknown>): string | null {
    // Intentar obtener desde metadata del evento
    const sessionData = (metadata as any).session;
    if (sessionData && sessionData.sessionId && this.isValidUUID(sessionData.sessionId)) {
      return sessionData.sessionId;
    }

    // Fallback a sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const backendSessionId = sessionStorage.getItem('guiders_backend_session_id');
      if (backendSessionId && this.isValidUUID(backendSessionId)) {
        return backendSessionId;
      }

      const legacySessionId = sessionStorage.getItem('guiders_session_id');
      if (legacySessionId && this.isValidUUID(legacySessionId)) {
        return legacySessionId;
      }
    }

    return null;
  }

  /**
   * Normaliza el tipo de evento al formato del backend
   */
  private normalizeEventType(rawType: string): string {
    // Si ya está en mayúsculas, asumimos que está correcto
    if (rawType === rawType.toUpperCase()) {
      return rawType;
    }

    // Intentar mapear desde tipos internos
    const mapped = TrackingV2TransformStage.EVENT_TYPE_MAP[rawType];
    if (mapped) {
      return mapped;
    }

    // Si no hay mapeo, convertir a mayúsculas con guiones bajos
    // Ej: "customEventName" -> "CUSTOM_EVENT_NAME"
    return rawType
      .replace(/([A-Z])/g, '_$1') // Insertar _ antes de mayúsculas
      .toUpperCase()
      .replace(/^_/, ''); // Eliminar _ inicial si existe
  }

  /**
   * Extrae campos adicionales de event.data que deben ir en metadata
   * Excluye campos especiales que ya se usan para otros propósitos
   */
  private extractAdditionalFields(originalData: any): Record<string, any> {
    // Campos que NO deben incluirse en metadata porque tienen uso especial
    const excludedFields = new Set([
      'eventType',      // Se usa para determinar el tipo de evento
      'metadata',       // Ya se procesa por separado
      'trackingEventId' // ID interno, no necesario en metadata del backend
    ]);

    const additionalFields: Record<string, any> = {};

    // Copiar todos los campos de originalData excepto los excluidos
    for (const key in originalData) {
      if (originalData.hasOwnProperty(key) && !excludedFields.has(key)) {
        additionalFields[key] = originalData[key];
      }
    }

    return additionalFields;
  }
}
