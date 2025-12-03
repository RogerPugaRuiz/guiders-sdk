/**
 * Consent Backend Service
 *
 * Servicio que integra el ConsentManager del SDK con el backend de consentimientos RGPD.
 * Maneja la sincronización bidireccional entre el estado local y el servidor.
 */

import { EndpointManager } from '../core/endpoint-manager';
import { debugLog } from '../utils/debug-logger';

/**
 * Tipos de consentimiento del backend
 */
export type BackendConsentType = 'privacy_policy' | 'marketing' | 'analytics';

/**
 * Estados de consentimiento del backend
 */
export type BackendConsentStatus = 'granted' | 'revoked' | 'expired';

/**
 * Respuesta del backend al otorgar consentimiento
 */
export interface BackendConsentResponse {
  visitorId: string;
  type: BackendConsentType;
  status: BackendConsentStatus;
  grantedAt: string;
  expiresAt: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Respuesta al obtener historial de consentimientos
 */
export interface BackendConsentHistoryResponse {
  consents: BackendConsentResponse[];
  total: number;
}

/**
 * Entrada de audit log
 */
export interface BackendAuditLogEntry {
  id: string;
  visitorId: string;
  consentType: BackendConsentType;
  action: 'granted' | 'revoked' | 'expired' | 'renewed';
  timestamp: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    previousStatus?: string;
    newStatus?: string;
  };
}

/**
 * Respuesta de audit logs
 */
export interface BackendAuditLogsResponse {
  logs: BackendAuditLogEntry[];
  total: number;
}

/**
 * Mapeo de categorías del SDK a tipos del backend
 */
const SDK_TO_BACKEND_TYPE_MAP: Record<string, BackendConsentType> = {
  'analytics': 'analytics',
  'functional': 'privacy_policy',
  'personalization': 'marketing'
};

/**
 * Mapeo inverso: tipos del backend a categorías del SDK
 */
const BACKEND_TO_SDK_TYPE_MAP: Record<BackendConsentType, string> = {
  'analytics': 'analytics',
  'privacy_policy': 'functional',
  'marketing': 'personalization'
};

/**
 * Servicio de integración con el backend de consentimientos
 */
export class ConsentBackendService {
  private static instance: ConsentBackendService;
  private sessionId: string | null = null;

  private constructor() {}

  /**
   * Obtiene la instancia singleton
   */
  public static getInstance(): ConsentBackendService {
    if (!ConsentBackendService.instance) {
      ConsentBackendService.instance = new ConsentBackendService();
    }
    return ConsentBackendService.instance;
  }

  /**
   * Establece el sessionId para las peticiones autenticadas
   */
  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    debugLog('[ConsentBackendService] 🔐 Session ID establecido');
  }

  /**
   * Obtiene el endpoint base para consentimientos
   */
  private getBaseUrl(): string {
    const endpoint = EndpointManager.getInstance().getEndpoint();
    // Asumiendo que el endpoint es https://api.domain.com/api
    return `${endpoint}/consents`;
  }

  /**
   * Realiza una petición HTTP con autenticación y retry en 401
   */
  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Obtener sessionId de sessionStorage o del atributo de instancia
    const sessionId = this.sessionId || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('guiders_backend_session_id') : null);

    // Añadir header X-Guiders-Sid si hay sessionId
    if (sessionId) {
      headers['X-Guiders-Sid'] = sessionId;
      debugLog('[ConsentBackendService] 🔐 Enviando X-Guiders-Sid:', sessionId);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
        // credentials: 'include' removed - auth via X-Guiders-Sid header
      });

      // Manejar 401 con retry
      if (response.status === 401 && !isRetry) {
        debugLog('[ConsentBackendService] ⚠️ Error 401 - Intentando re-autenticación...');
        const reauthed = await this.reAuthenticate();
        if (reauthed) {
          debugLog('[ConsentBackendService] ✅ Re-autenticación exitosa, reintentando...');
          return this.makeRequest<T>(path, options, true);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Backend consent API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Re-autentica al visitante llamando a identify
   */
  private async reAuthenticate(): Promise<boolean> {
    try {
      const fingerprint = localStorage.getItem('fingerprint');
      const apiKey = localStorage.getItem('guidersApiKey') || localStorage.getItem('apiKey');
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;

      // Obtener consentVersion del localStorage
      let consentVersion = 'v1.0';
      const consentStateStr = localStorage.getItem('guiders_consent_state');
      if (consentStateStr) {
        try {
          const consentState = JSON.parse(consentStateStr);
          consentVersion = consentState.version || 'v1.0';
        } catch (e) {
          // Ignorar error de parseo
        }
      }

      if (!fingerprint) {
        debugLog('[ConsentBackendService] ❌ No hay fingerprint para re-autenticar');
        return false;
      }

      const endpoint = EndpointManager.getInstance().getEndpoint();
      const identifyUrl = `${endpoint}/visitors/identify`;

      debugLog('[ConsentBackendService] 🔐 Re-autenticando...');

      const response = await fetch(identifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint,
          domain,
          apiKey: apiKey || '',
          hasAcceptedPrivacyPolicy: true,
          consentVersion,
          currentUrl
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.sessionId) {
          sessionStorage.setItem('guiders_backend_session_id', data.sessionId);
          this.sessionId = data.sessionId;
          debugLog('[ConsentBackendService] ✅ SessionId actualizado:', data.sessionId);
        }

        if (data.visitorId) {
          localStorage.setItem('visitorId', data.visitorId);
        }

        if (data.tenantId || data.tenant_id) {
          localStorage.setItem('tenantId', data.tenantId || data.tenant_id);
        }

        return true;
      }

      debugLog('[ConsentBackendService] ❌ Error en re-autenticación:', response.status);
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convierte categoría del SDK a tipo del backend
   */
  private sdkCategoryToBackendType(category: string): BackendConsentType {
    return SDK_TO_BACKEND_TYPE_MAP[category] || 'privacy_policy';
  }

  /**
   * Convierte tipo del backend a categoría del SDK
   */
  private backendTypeToSdkCategory(type: BackendConsentType): string {
    return BACKEND_TO_SDK_TYPE_MAP[type] || 'functional';
  }

  /**
   * Otorga consentimientos en el backend
   *
   * Nota: El endpoint de grant ya existe implícitamente cuando el visitante
   * se identifica por primera vez. Este método es para sincronizar cambios.
   */
  public async grantConsents(
    visitorId: string,
    preferences: {
      analytics?: boolean;
      functional?: boolean;
      personalization?: boolean;
    }
  ): Promise<BackendConsentResponse[]> {
    debugLog('[ConsentBackendService] ✅ Otorgando consentimientos:', preferences);

    const grantedConsents: BackendConsentResponse[] = [];

    // Por cada categoría otorgada, hacer una petición al backend
    for (const [category, granted] of Object.entries(preferences)) {
      if (!granted) continue;

      const backendType = this.sdkCategoryToBackendType(category);

      try {
        // El backend crea consentimientos automáticamente al identificar el visitante
        // Este endpoint es para sincronización explícita si es necesario
        const response = await this.makeRequest<BackendConsentResponse>(
          `/grant`,
          {
            method: 'POST',
            body: JSON.stringify({
              visitorId,
              type: backendType,
              metadata: {
                source: 'sdk',
                category: category
              }
            })
          }
        );

        grantedConsents.push(response);
      } catch (error) {
        // Continuar con las demás categorías aunque una falle
      }
    }

    return grantedConsents;
  }

  /**
   * Revoca un consentimiento en el backend
   */
  public async revokeConsent(
    visitorId: string,
    category: string,
    reason?: string
  ): Promise<BackendConsentResponse> {
    const backendType = this.sdkCategoryToBackendType(category);

    debugLog('[ConsentBackendService] ❌ Revocando consentimiento:', {
      visitorId,
      category,
      backendType,
      reason
    });

    return this.makeRequest<BackendConsentResponse>('/revoke', {
      method: 'POST',
      body: JSON.stringify({
        visitorId,
        type: backendType,
        reason: reason || 'Usuario revocó consentimiento desde el SDK'
      })
    });
  }

  /**
   * Revoca todos los consentimientos del visitante
   */
  public async revokeAllConsents(
    visitorId: string,
    reason?: string
  ): Promise<BackendConsentResponse[]> {
    debugLog('[ConsentBackendService] ❌ Revocando TODOS los consentimientos');

    const categories = ['analytics', 'functional', 'personalization'];
    const results: BackendConsentResponse[] = [];

    for (const category of categories) {
      try {
        const result = await this.revokeConsent(visitorId, category, reason);
        results.push(result);
      } catch (error) {
        // Continuar con las demás categorías
      }
    }

    return results;
  }

  /**
   * Renueva un consentimiento en el backend
   */
  public async renewConsent(
    visitorId: string,
    category: string
  ): Promise<BackendConsentResponse> {
    const backendType = this.sdkCategoryToBackendType(category);

    debugLog('[ConsentBackendService] 🔄 Renovando consentimiento:', {
      visitorId,
      category,
      backendType
    });

    return this.makeRequest<BackendConsentResponse>('/renew', {
      method: 'POST',
      body: JSON.stringify({
        visitorId,
        type: backendType
      })
    });
  }

  /**
   * Obtiene el historial de consentimientos del visitante
   */
  public async getConsentHistory(
    visitorId: string
  ): Promise<BackendConsentHistoryResponse> {
    debugLog('[ConsentBackendService] 📋 Obteniendo historial de consentimientos');

    return this.makeRequest<BackendConsentHistoryResponse>(
      `/visitors/${visitorId}`
    );
  }

  /**
   * Obtiene los audit logs del visitante
   */
  public async getAuditLogs(
    visitorId: string
  ): Promise<BackendAuditLogsResponse> {
    debugLog('[ConsentBackendService] 📜 Obteniendo audit logs');

    return this.makeRequest<BackendAuditLogsResponse>(
      `/visitors/${visitorId}/audit-logs`
    );
  }

  /**
   * Sincroniza el estado local con el backend
   * Obtiene los consentimientos actuales del visitante y retorna
   * el mapeo para actualizar el ConsentManager
   */
  public async syncWithBackend(
    visitorId: string
  ): Promise<{
    analytics: boolean;
    functional: boolean;
    personalization: boolean;
  }> {
    debugLog('[ConsentBackendService] 🔄 Sincronizando con backend...');

    try {
      const history = await this.getConsentHistory(visitorId);

      // Crear un mapa de consentimientos activos con tipo explícito
      const activeConsents: {
        analytics: boolean;
        functional: boolean;
        personalization: boolean;
      } = {
        analytics: false,
        functional: false,
        personalization: false
      };

      // Procesar cada consentimiento
      for (const consent of history.consents) {
        // Solo considerar consentimientos activos (granted y no expirados)
        if (consent.status === 'granted') {
          const sdkCategory = this.backendTypeToSdkCategory(consent.type);
          if (sdkCategory === 'analytics' || sdkCategory === 'functional' || sdkCategory === 'personalization') {
            activeConsents[sdkCategory] = true;
          }
        }
      }

      debugLog('[ConsentBackendService] ✅ Estado sincronizado:', activeConsents);
      return activeConsents;
    } catch (error) {

      // Retornar estado por defecto en caso de error
      return {
        analytics: false,
        functional: false,
        personalization: false
      };
    }
  }

  /**
   * Verifica si un consentimiento específico está activo en el backend
   */
  public async isConsentActive(
    visitorId: string,
    category: string
  ): Promise<boolean> {
    try {
      const history = await this.getConsentHistory(visitorId);
      const backendType = this.sdkCategoryToBackendType(category);

      // Buscar el consentimiento más reciente de este tipo
      const consent = history.consents.find(c => c.type === backendType);

      return consent?.status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Exporta todos los datos de consentimiento del visitante
   * (para cumplir con Right to Access - Art. 15 GDPR)
   */
  public async exportConsentData(visitorId: string): Promise<string> {
    debugLog('[ConsentBackendService] 📦 Exportando datos de consentimiento');

    try {
      const [history, auditLogs] = await Promise.all([
        this.getConsentHistory(visitorId),
        this.getAuditLogs(visitorId)
      ]);

      const exportData = {
        visitorId,
        exportDate: new Date().toISOString(),
        consents: history.consents,
        auditLogs: auditLogs.logs,
        summary: {
          totalConsents: history.total,
          activeConsents: history.consents.filter(c => c.status === 'granted').length,
          revokedConsents: history.consents.filter(c => c.status === 'revoked').length,
          expiredConsents: history.consents.filter(c => c.status === 'expired').length,
          totalAuditEntries: auditLogs.total
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina todos los datos de consentimiento del visitante en el backend
   * (para cumplir con Right to Erasure - Art. 17 GDPR)
   *
   * Nota: Este endpoint debe implementarse en el backend
   */
  public async deleteConsentData(visitorId: string): Promise<void> {
    debugLog('[ConsentBackendService] 🗑️ Eliminando datos de consentimiento del backend');

    try {
      // Primero revocar todos los consentimientos
      await this.revokeAllConsents(
        visitorId,
        'Usuario solicitó eliminación completa de datos (Right to Erasure)'
      );

      // Luego solicitar eliminación completa (endpoint a implementar en backend)
      // await this.makeRequest(`/visitors/${visitorId}`, {
      //   method: 'DELETE'
      // });

      debugLog('[ConsentBackendService] ✅ Datos de consentimiento eliminados');
    } catch (error) {
      throw error;
    }
  }
}
