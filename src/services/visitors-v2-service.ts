import { EndpointManager } from '../core/tracking-pixel-SDK';

export interface IdentifyVisitorResponse {
  visitorId: string;
  sessionId?: string;
  name?: string | null;
  email?: string | null;
  tel?: string | null;
}

/**
 * Servicio para interactuar exclusivamente con la API Visitors V2
 * (sin fallbacks a V1).
 */
export class VisitorsV2Service {
  private static instance: VisitorsV2Service;
  private constructor() {}

  public static getInstance(): VisitorsV2Service {
    if (!VisitorsV2Service.instance) VisitorsV2Service.instance = new VisitorsV2Service();
    return VisitorsV2Service.instance;
  }

  private getBaseUrl(): string {
    const endpoint = localStorage.getItem('pixelEndpoint') || EndpointManager.getInstance().getEndpoint();
    const apiRoot = endpoint.endsWith('/api') ? endpoint : `${endpoint}/api`;
    return `${apiRoot}/visitors`;
  }

  /**
   * Identifica (o crea/actualiza) al visitante y arranca nueva sesión backend.
   * Según docs V2: usa dominio y API Key para identificación.
   * Devuelve visitorId y opcionalmente sessionId.
   */
  public async identify(fingerprint: string, apiKey?: string): Promise<IdentifyVisitorResponse | null> {
    try {
      const url = `${this.getBaseUrl()}/identify`;
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const payload = { 
        fingerprint,
        domain: currentHost,
        apiKey: apiKey || localStorage.getItem('guidersApiKey') || ''
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include' // Para cookie HttpOnly de sesión
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn('[VisitorsV2Service] ❌ Error al identificar visitante:', res.status, txt);
        return null;
      }
      const data = await res.json();
      // Normalizar nombres esperados
      const response: IdentifyVisitorResponse = {
        visitorId: data.visitorId || data.id,
        sessionId: data.sessionId || data.session_id,
        name: data.name ?? null,
        email: data.email ?? null,
        tel: data.tel ?? null
      };
      if (response.visitorId) localStorage.setItem('visitorId', response.visitorId);
      if (response.sessionId) sessionStorage.setItem('guiders_backend_session_id', response.sessionId);
      console.log('[VisitorsV2Service] ✅ identify OK:', response.visitorId, 'session:', response.sessionId);
      return response;
    } catch (e) {
      console.warn('[VisitorsV2Service] ❌ Excepción en identify:', e);
      return null;
    }
  }

  /**
   * Envía heartbeat para mantener viva la sesión backend.
   */
  public async heartbeat(): Promise<boolean> {
    try {
      const sessionId = sessionStorage.getItem('guiders_backend_session_id');
      if (!sessionId) {
        console.warn('[VisitorsV2Service] ❌ No sessionId disponible para heartbeat');
        return false;
      }
      
      const url = `${this.getBaseUrl()}/session/heartbeat`;
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'include' 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[VisitorsV2Service] ❌ Heartbeat fallido:', res.status, errorText);
        return false;
      }
      console.log('[VisitorsV2Service] ✅ Heartbeat exitoso');
      return true;
    } catch (e) {
      console.warn('[VisitorsV2Service] ❌ Excepción heartbeat:', e);
      return false;
    }
  }

  /**
   * Cierra explícitamente la sesión backend.
   * Cuando useBeacon=true, usa sendBeacon para garantizar entrega durante page unload.
   */
  public async endSession(options: { useBeacon?: boolean; reason?: string } = {}): Promise<boolean> {
    const sessionId = sessionStorage.getItem('guiders_backend_session_id');
    if (!sessionId) {
      console.warn('[VisitorsV2Service] ❌ No sessionId disponible para endSession');
      return false;
    }
    
    const url = `${this.getBaseUrl()}/session/end`;
    const payload = { 
      sessionId,
      reason: options.reason || (options.useBeacon ? 'page_unload' : 'manual')
    };
    
    // Intentar sendBeacon primero si se solicita (más confiable para page unload)
    if (options.useBeacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const success = (navigator as any).sendBeacon(url, blob);
        
        if (success) {
          console.log('[VisitorsV2Service] ✅ endSession enviado via beacon');
          sessionStorage.removeItem('guiders_backend_session_id');
          return true;
        } else {
          console.warn('[VisitorsV2Service] ⚠️ sendBeacon falló, intentando fetch...');
        }
      } catch (e) {
        console.warn('[VisitorsV2Service] ❌ Error con sendBeacon, fallback a fetch:', e);
      }
    }
    
    // Fallback a fetch normal (solo si no es page unload crítico)
    if (!options.useBeacon) {
      try {
        const res = await fetch(url, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
          keepalive: true // Permite que la petición sobreviva page unload
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.warn('[VisitorsV2Service] ❌ endSession fallido:', res.status, errorText);
          return false;
        }
        
        console.log('[VisitorsV2Service] ✅ endSession exitoso via fetch');
        sessionStorage.removeItem('guiders_backend_session_id');
        return true;
      } catch (e) {
        console.warn('[VisitorsV2Service] ❌ Excepción endSession:', e);
        return false;
      }
    }
    
    // Si llegamos aquí, beacon falló y no podemos usar fetch
    console.warn('[VisitorsV2Service] ❌ No se pudo enviar endSession');
    return false;
  }
}
