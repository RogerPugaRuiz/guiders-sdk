import { v4 as uuidv4 } from 'uuid';
import { PixelEvent } from '../../types';
import { PipelineStage } from '../pipeline-stage';

/**
 * TrackingEventV2Stage
 * Transforma eventos de tracking internos (type: 'tracking:tracking-event') al nuevo esquema v2 solicitado:
 * {
 *   event_id, ts_client, ts_server, api_key, device_id, session_id, visitor_id,
 *   user_id, event_name, props, ua, ip
 * }
 * Mantiene el mismo event.type para no romper listeners existentes.
 */
export class TrackingEventV2Stage implements PipelineStage<PixelEvent, PixelEvent> {
  process(event: PixelEvent): PixelEvent {
    if (event.type !== 'tracking:tracking-event') return event;

    try {
      const originalData: any = event.data || {};
      const metadata = event.metadata || {};

      // Obtener identificadores y datos auxiliares
      const apiKey = (localStorage.getItem('guidersApiKey') || (window as any).GUIDERS_CONFIG?.apiKey || '') as string;
      const fingerprint = localStorage.getItem('fingerprint') || null;
      const sessionId = (metadata as any).session?.sessionId || null;

      // Extraer user_id desde accessToken si existe
      let userId: string | null = null;
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          userId = payload?.sub || null;
        }
      } catch { /* noop */ }

      const eventName = originalData.eventType || originalData.type || event.type;

      // Construir props fusionando metadata + originalData.metadata (sin duplicar campos controlados)
      const props = {
        ...(originalData.metadata || {}),
        ...metadata,
      };

      const v2 = {
        event_id: originalData.trackingEventId || uuidv4(),
        ts_client: new Date(event.timestamp).toISOString(),
        ts_server: null as string | null,
        api_key: apiKey,
        device_id: fingerprint,
        session_id: sessionId,
        visitor_id: null as string | null,
        user_id: userId,
        event_name: eventName,
        props,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ip: null as string | null,
      };

      event.data = v2 as any; // Conserva la firma PixelEvent
      // Limpiar metadata para reducir payload (opcional)
      delete event.metadata;
    } catch (err) {
      console.warn('[TrackingEventV2Stage] ❌ Falló transformación a esquema v2, se envía original:', err);
    }
    return event;
  }
}
