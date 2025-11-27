/**
 * Consent Manager - GDPR Compliant Consent Management
 *
 * Maneja el estado de consentimiento para cumplir con GDPR/LOPDGDD.
 * El propietario del sitio web es responsable de obtener el consentimiento,
 * pero nosotros proporcionamos las herramientas para controlarlo.
 */

import { debugLog, debugWarn, debugError } from '../utils/debug-logger';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export interface ConsentState {
  status: ConsentStatus;
  timestamp: number;
  version: string; // Versión del SDK cuando se dio el consentimiento
  preferences?: {
    analytics?: boolean; // Tracking de eventos
    functional?: boolean; // Chat y funcionalidad básica
    personalization?: boolean; // Personalización del chat
  };
}

export interface ConsentManagerConfig {
  defaultStatus?: ConsentStatus;
  storageKey?: string;
  version?: string;
  waitForConsent?: boolean; // Si true, no hace tracking hasta obtener consentimiento
  onConsentChange?: (state: ConsentState) => void;
}

/**
 * Gestor de consentimiento para cumplimiento GDPR
 */
export class ConsentManager {
  private static instance: ConsentManager;
  private state: ConsentState;
  private config: Required<ConsentManagerConfig>;
  private listeners: Set<(state: ConsentState) => void> = new Set();
  private readonly STORAGE_KEY = 'guiders_consent_state';

  private constructor(config: ConsentManagerConfig = {}) {
    this.config = {
      defaultStatus: config.defaultStatus || 'pending',
      storageKey: config.storageKey || this.STORAGE_KEY,
      version: config.version || '1.0.0',
      waitForConsent: config.waitForConsent ?? true,
      onConsentChange: config.onConsentChange || (() => {})
    };

    // Cargar estado guardado o crear uno nuevo
    const loadedState = this.loadState();
    if (loadedState) {
      this.state = loadedState;
    } else {
      this.state = this.createInitialState();
      // Si defaultStatus es 'granted', guardar inmediatamente en localStorage
      if (this.config.defaultStatus === 'granted') {
        this.state.preferences = {
          analytics: true,
          functional: true,
          personalization: true
        };
        this.saveState();
        debugLog('[ConsentManager] ✅ Estado inicial con consentimiento otorgado guardado');
      }
    }

    debugLog('[ConsentManager] 🔐 Inicializado con estado:', this.state);
  }

  /**
   * Obtiene la instancia singleton del ConsentManager
   */
  public static getInstance(config?: ConsentManagerConfig): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager(config);
    }
    return ConsentManager.instance;
  }

  /**
   * Resetea la instancia (útil para testing)
   */
  public static resetInstance(): void {
    ConsentManager.instance = null as any;
  }

  /**
   * Crea el estado inicial de consentimiento
   */
  private createInitialState(): ConsentState {
    return {
      status: this.config.defaultStatus,
      timestamp: Date.now(),
      version: this.config.version,
      preferences: {
        analytics: false,
        functional: false,
        personalization: false
      }
    };
  }

  /**
   * Carga el estado de consentimiento desde localStorage
   */
  private loadState(): ConsentState | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }

      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) {
        return null;
      }

      const state = JSON.parse(stored) as ConsentState;
      debugLog('[ConsentManager] 💾 Estado cargado desde localStorage:', state);
      return state;
    } catch (error) {
      debugError('[ConsentManager] ❌ Error cargando estado:', error);
      return null;
    }
  }

  /**
   * Guarda el estado de consentimiento en localStorage
   */
  private saveState(): void {
    try {
      if (typeof localStorage === 'undefined') {
        debugWarn('[ConsentManager] ⚠️ localStorage no disponible');
        return;
      }

      localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
      debugLog('[ConsentManager] 💾 Estado guardado:', this.state);
    } catch (error) {
      debugError('[ConsentManager] ❌ Error guardando estado:', error);
    }
  }

  /**
   * Notifica a todos los listeners del cambio de estado
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        debugError('[ConsentManager] ❌ Error en listener:', error);
      }
    });

    // Llamar al callback de configuración
    if (this.config.onConsentChange) {
      try {
        this.config.onConsentChange(this.state);
      } catch (error) {
        debugError('[ConsentManager] ❌ Error en onConsentChange callback:', error);
      }
    }
  }

  /**
   * Obtiene el estado actual de consentimiento
   */
  public getState(): ConsentState {
    return { ...this.state };
  }

  /**
   * Obtiene el estado de consentimiento actual
   */
  public getStatus(): ConsentStatus {
    return this.state.status;
  }

  /**
   * Verifica si el consentimiento ha sido otorgado
   */
  public isGranted(): boolean {
    return this.state.status === 'granted';
  }

  /**
   * Verifica si el consentimiento ha sido denegado
   */
  public isDenied(): boolean {
    return this.state.status === 'denied';
  }

  /**
   * Verifica si el consentimiento está pendiente
   */
  public isPending(): boolean {
    return this.state.status === 'pending';
  }

  /**
   * Verifica si se debe esperar el consentimiento antes de hacer tracking
   */
  public shouldWaitForConsent(): boolean {
    return this.config.waitForConsent && this.isPending();
  }

  /**
   * Verifica si el tracking está permitido
   */
  public isTrackingAllowed(): boolean {
    // Si no se espera consentimiento, siempre está permitido
    if (!this.config.waitForConsent) {
      return true;
    }

    // Si se espera consentimiento, solo permitir si está granted
    return this.isGranted();
  }

  /**
   * Verifica si una categoría específica de tracking está permitida
   */
  public isCategoryAllowed(category: 'analytics' | 'functional' | 'personalization'): boolean {
    if (!this.isGranted()) {
      return false;
    }

    return this.state.preferences?.[category] ?? false;
  }

  /**
   * Otorga consentimiento completo
   */
  public grantConsent(): void {
    debugLog('[ConsentManager] ✅ Consentimiento otorgado');

    this.state = {
      status: 'granted',
      timestamp: Date.now(),
      version: this.config.version,
      preferences: {
        analytics: true,
        functional: true,
        personalization: true
      }
    };

    this.saveState();
    this.notifyListeners();
  }

  /**
   * Otorga consentimiento con preferencias específicas
   */
  public grantConsentWithPreferences(preferences: {
    analytics?: boolean;
    functional?: boolean;
    personalization?: boolean;
  }): void {
    debugLog('[ConsentManager] ✅ Consentimiento otorgado con preferencias:', preferences);

    this.state = {
      status: 'granted',
      timestamp: Date.now(),
      version: this.config.version,
      preferences: {
        analytics: preferences.analytics ?? true,
        functional: preferences.functional ?? true,
        personalization: preferences.personalization ?? true
      }
    };

    this.saveState();
    this.notifyListeners();
  }

  /**
   * Deniega el consentimiento
   */
  public denyConsent(): void {
    debugLog('[ConsentManager] ❌ Consentimiento denegado');

    this.state = {
      status: 'denied',
      timestamp: Date.now(),
      version: this.config.version,
      preferences: {
        analytics: false,
        functional: false,
        personalization: false
      }
    };

    this.saveState();
    this.notifyListeners();
  }

  /**
   * Revoca el consentimiento previamente otorgado
   */
  public revokeConsent(): void {
    debugLog('[ConsentManager] 🔄 Consentimiento revocado');
    this.denyConsent();
  }

  /**
   * Resetea el estado de consentimiento a pending
   */
  public resetConsent(): void {
    debugLog('[ConsentManager] 🔄 Consentimiento reseteado a pending');

    this.state = this.createInitialState();
    this.saveState();
    this.notifyListeners();
  }

  /**
   * Suscribe un listener para cambios en el estado de consentimiento
   * @returns Función para cancelar la suscripción
   */
  public subscribe(listener: (state: ConsentState) => void): () => void {
    this.listeners.add(listener);

    // Llamar inmediatamente con el estado actual
    listener(this.state);

    // Retornar función de cancelación
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Elimina todos los datos de consentimiento almacenados
   */
  public clearConsentData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.config.storageKey);
        debugLog('[ConsentManager] 🗑️ Datos de consentimiento eliminados');
      }
    } catch (error) {
      debugError('[ConsentManager] ❌ Error eliminando datos de consentimiento:', error);
    }
  }

  /**
   * Actualiza la versión del SDK en el estado de consentimiento
   */
  public updateVersion(version: string): void {
    this.state.version = version;
    this.saveState();
    debugLog('[ConsentManager] 📦 Versión actualizada a:', version);
  }

  /**
   * Verifica si el consentimiento necesita ser renovado (por cambio de versión)
   */
  public needsRenewal(currentVersion: string): boolean {
    return this.state.version !== currentVersion && this.isGranted();
  }

  /**
   * Exporta el estado de consentimiento para auditoría
   */
  public exportState(): string {
    return JSON.stringify({
      ...this.state,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}
