import { EndpointManager } from '../core/tracking-pixel-SDK';

export interface IdentifyVisitorResponse {
  visitorId: string;
  sessionId?: string | null;
  name?: string | null;
  email?: string | null;
  tel?: string | null;
  lifecycle?: string;
  isNewVisitor?: boolean;
  consentStatus?: 'granted' | 'denied' | 'pending';
  allowedActions?: string[];
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
  public async identify(
    fingerprint: string,
    apiKey?: string,
    consentInfo?: {
      hasAcceptedPrivacyPolicy: boolean;
      consentVersion: string;
    }
  ): Promise<IdentifyVisitorResponse | null> {
    try {
      const url = `${this.getBaseUrl()}/identify`;
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

      // Obtener información de consentimiento del localStorage si no se proporciona
      let hasAcceptedPrivacyPolicy = false;
      let consentVersion = 'v1.0';

      if (consentInfo) {
        hasAcceptedPrivacyPolicy = consentInfo.hasAcceptedPrivacyPolicy;
        consentVersion = consentInfo.consentVersion;
      } else if (typeof localStorage !== 'undefined') {
        // Intentar leer del ConsentManager
        const consentStateStr = localStorage.getItem('guiders_consent_state');
        if (consentStateStr) {
          try {
            const consentState = JSON.parse(consentStateStr);
            hasAcceptedPrivacyPolicy = consentState.status === 'granted';
            consentVersion = consentState.version || 'v1.0';
          } catch (e) {
            console.warn('[VisitorsV2Service] ⚠️ No se pudo parsear estado de consentimiento');
          }
        }
      }

      const payload = {
        fingerprint,
        domain: currentHost,
        apiKey: apiKey || localStorage.getItem('guidersApiKey') || '',
        hasAcceptedPrivacyPolicy,
        consentVersion,
        currentUrl: typeof window !== 'undefined' ? window.location.href : undefined
      };

      console.log('[VisitorsV2Service] 🔐 Enviando identify con consentimiento:', {
        hasAcceptedPrivacyPolicy,
        consentVersion,
        currentUrl: payload.currentUrl
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include' // Para cookie HttpOnly de sesión
      });

      // ✅ Caso exitoso: Usuario aceptó el consentimiento (HTTP 200)
      if (res.ok) {
        const data = await res.json();
        const response: IdentifyVisitorResponse = {
          visitorId: data.visitorId || data.id,
          sessionId: data.sessionId || data.session_id,
          name: data.name ?? null,
          email: data.email ?? null,
          tel: data.tel ?? null,
          lifecycle: data.lifecycle,
          isNewVisitor: data.isNewVisitor,
          consentStatus: data.consentStatus || 'granted',
          allowedActions: data.allowedActions || ['chat', 'forms', 'tracking', 'all']
        };

        if (response.visitorId) localStorage.setItem('visitorId', response.visitorId);
        if (response.sessionId) sessionStorage.setItem('guiders_backend_session_id', response.sessionId);

        console.log('[VisitorsV2Service] ✅ identify OK (consentimiento aceptado):', response.visitorId, 'session:', response.sessionId);
        return response;
      }

      // ⚠️ Caso especial: Usuario rechazó el consentimiento (HTTP 400)
      if (res.status === 400) {
        try {
          const errorData = await res.json();

          // Verificar si es un rechazo de consentimiento (no un error real)
          if (errorData.consentStatus === 'denied' && errorData.visitorId) {
            const response: IdentifyVisitorResponse = {
              visitorId: errorData.visitorId,
              sessionId: null, // No se crea sesión cuando se rechaza
              lifecycle: errorData.lifecycle || 'anon',
              isNewVisitor: errorData.isNewVisitor,
              consentStatus: 'denied',
              allowedActions: errorData.allowedActions || ['read_only']
            };

            // Guardar visitorId incluso en caso de rechazo (para audit)
            if (response.visitorId) localStorage.setItem('visitorId', response.visitorId);

            console.warn('[VisitorsV2Service] ⚠️ identify: consentimiento rechazado (modo limitado):', response.visitorId);
            console.log('[VisitorsV2Service] 📋 Acciones permitidas:', response.allowedActions);

            return response;
          }
        } catch (parseError) {
          // Si no se puede parsear el JSON, tratar como error real
          console.error('[VisitorsV2Service] ❌ Error parseando respuesta 400:', parseError);
        }
      }

      // ❌ Otros errores HTTP
      const txt = await res.text();
      console.warn('[VisitorsV2Service] ❌ Error al identificar visitante:', res.status, txt);
      return null;
    } catch (e) {
      console.warn('[VisitorsV2Service] ❌ Excepción en identify:', e);
      return null;
    }
  }

  /**
   * Envía heartbeat para mantener viva la sesión backend.
   *
   * 🆕 2025: Ahora soporta tipo de actividad para gestión de inactividad
   *
   * @param activityType (Opcional) Tipo de actividad: 'heartbeat' o 'user-interaction'
   */
  public async heartbeat(activityType?: 'heartbeat' | 'user-interaction'): Promise<boolean> {
    try {
      const sessionId = sessionStorage.getItem('guiders_backend_session_id');
      if (!sessionId) {
        console.warn('[VisitorsV2Service] ❌ No sessionId disponible para heartbeat');
        return false;
      }

      const url = `${this.getBaseUrl()}/session/heartbeat`;

      // Construir body con sessionId y activityType si se proporciona
      const body: any = { sessionId };
      if (activityType) {
        body.activityType = activityType;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guiders-sid': sessionId
        },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('[VisitorsV2Service] ❌ Heartbeat fallido:', res.status, errorText);
        return false;
      }
      console.log('[VisitorsV2Service] ✅ Heartbeat exitoso' + (activityType ? ` (${activityType})` : ''));
      return true;
    } catch (e) {
      console.warn('[VisitorsV2Service] ❌ Excepción heartbeat:', e);
      return false;
    }
  }

  /**
   * Cierra explícitamente la sesión backend.
   * Cuando useBeacon=true, usa sendBeacon para garantizar entrega durante page unload.
   * Detecta refreshes rápidos y evita desconectar al visitante innecesariamente.
   */
  public async endSession(options: { useBeacon?: boolean; reason?: string } = {}): Promise<boolean> {
    const sessionId = sessionStorage.getItem('guiders_backend_session_id');
    if (!sessionId) {
      console.warn('[VisitorsV2Service] ❌ No sessionId disponible para endSession');
      return false;
    }

    // Verificar si es un refresh rápido - NO enviar endSession si es así
    const isRefresh = sessionStorage.getItem('guiders_is_refresh') === 'true';
    if (isRefresh && options.useBeacon) {
      console.log('[VisitorsV2Service] 🔄 Refresh detectado - manteniendo sesión activa');
      // NO limpiar sessionStorage para que la nueva página pueda reanudar
      sessionStorage.removeItem('guiders_is_refresh');
      return true; // Simular éxito sin enviar beacon
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
          headers: {
            'Content-Type': 'application/json',
            'x-guiders-sid': sessionId
          },
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
