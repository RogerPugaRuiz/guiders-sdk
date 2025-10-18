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
    search: 'SEARCH'
  };

  process(event: PixelEvent): PixelEvent {
    // Solo transformar eventos de tracking
    if (event.type !== 'tracking:tracking-event') {
      return event;
    }

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

      // 2. Obtener sessionId
      const sessionId = this.getSessionId(metadata);
      if (!sessionId) {
        debugLog('[TrackingV2TransformStage] ⚠️ No se encontró sessionId');
      }

      // 3. Determinar eventType
      const rawEventType = originalData.eventType || event.type;
      const eventType = this.normalizeEventType(rawEventType);

      // 4. Construir metadata fusionando datos
      const trackingMetadata: Record<string, any> = {
        ...(originalData.metadata || {}),
        ...metadata
      };

      // Limpiar campos internos que no deben ir al backend
      delete trackingMetadata.session;
      delete trackingMetadata.token;

      // 5. Obtener timestamp en formato ISO 8601
      const occurredAt = new Date(event.timestamp).toISOString();

      // 6. Construir TrackingEventDto
      const trackingEvent: TrackingEventDto = {
        visitorId,
        sessionId: sessionId || 'unknown',
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
      console.error(
        '[TrackingV2TransformStage] ❌ Error transformando evento:',
        error
      );
      return event; // Retornar evento sin transformar
    }
  }

  /**
   * Obtiene el visitorId desde localStorage
   */
  private getVisitorId(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('visitorId') || localStorage.getItem('fingerprint');
  }

  /**
   * Obtiene el sessionId desde metadata o sessionStorage
   */
  private getSessionId(metadata: Record<string, unknown>): string | null {
    // Intentar obtener desde metadata del evento
    const sessionData = (metadata as any).session;
    if (sessionData && sessionData.sessionId) {
      return sessionData.sessionId;
    }

    // Fallback a sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      return (
        sessionStorage.getItem('guiders_backend_session_id') ||
        sessionStorage.getItem('guiders_session_id')
      );
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
}
