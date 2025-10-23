import { debugLog } from '../utils/debug-logger';

/**
 * EventThrottler
 *
 * Limita la frecuencia de eventos basándose en intervalos de tiempo configurables.
 * Previene el envío excesivo de eventos de alta frecuencia como SCROLL, MOUSE_MOVE, etc.
 *
 * Estrategia: Time-based throttling (sliding window)
 * - Cada tipo de evento tiene un intervalo mínimo en ms
 * - Solo permite 1 evento por intervalo
 * - El resto son descartados silenciosamente
 *
 * @example
 * const throttler = new EventThrottler({
 *   enabled: true,
 *   rules: {
 *     'SCROLL': 100,      // Max 1 cada 100ms
 *     'MOUSE_MOVE': 50,   // Max 1 cada 50ms
 *   }
 * });
 *
 * if (throttler.shouldAllow('SCROLL')) {
 *   // Enviar evento
 * }
 */

export interface EventThrottlerConfig {
  enabled: boolean;
  rules: Record<string, number>; // eventType → minimum interval in ms
  debug?: boolean;
}

export interface EventThrottlerStats {
  allowed: number;
  throttled: number;
  throttledByType: Record<string, number>;
}

export class EventThrottler {
  private config: EventThrottlerConfig;
  private lastEventTimestamps: Map<string, number>;
  private stats: EventThrottlerStats;

  /**
   * Reglas de throttling por defecto (ms entre eventos)
   */
  private static readonly DEFAULT_RULES: Record<string, number> = {
    SCROLL: 100,           // Max 10 eventos/segundo
    MOUSE_MOVE: 50,        // Max 20 eventos/segundo
    HOVER: 200,            // Max 5 eventos/segundo
    MOUSE_ENTER: 200,
    MOUSE_LEAVE: 200,
    RESIZE: 300,           // Max ~3 eventos/segundo
    // Eventos críticos: sin throttle (no aparecen en la lista)
    // FORM_SUBMIT, ADD_TO_CART, PRODUCT_VIEW, SEARCH, etc.
  };

  constructor(config: Partial<EventThrottlerConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      rules: { ...EventThrottler.DEFAULT_RULES, ...(config.rules || {}) },
      debug: config.debug ?? false
    };

    this.lastEventTimestamps = new Map();
    this.stats = {
      allowed: 0,
      throttled: 0,
      throttledByType: {}
    };

    if (this.config.debug) {
      debugLog('[EventThrottler] ✅ Initialized with rules:', this.config.rules);
    }
  }

  /**
   * Verifica si un evento debe ser permitido según las reglas de throttling
   * @param eventType Tipo de evento (PAGE_VIEW, SCROLL, etc.)
   * @returns true si el evento debe ser enviado, false si debe ser descartado
   */
  public shouldAllow(eventType: string): boolean {
    // Si throttling está deshabilitado, permitir todo
    if (!this.config.enabled) {
      this.stats.allowed++;
      return true;
    }

    // Si el tipo de evento no tiene regla de throttle, permitir
    const intervalMs = this.config.rules[eventType];
    if (intervalMs === undefined) {
      this.stats.allowed++;
      return true;
    }

    const now = Date.now();
    const lastTimestamp = this.lastEventTimestamps.get(eventType);

    // Si es el primer evento de este tipo, permitir
    if (lastTimestamp === undefined) {
      this.lastEventTimestamps.set(eventType, now);
      this.stats.allowed++;
      return true;
    }

    // Calcular tiempo transcurrido desde el último evento
    const elapsedMs = now - lastTimestamp;

    // Si ha pasado suficiente tiempo, permitir
    if (elapsedMs >= intervalMs) {
      this.lastEventTimestamps.set(eventType, now);
      this.stats.allowed++;

      if (this.config.debug) {
        debugLog(
          `[EventThrottler] ✅ ${eventType} allowed (elapsed: ${elapsedMs}ms >= ${intervalMs}ms)`
        );
      }

      return true;
    }

    // Throttle: descartar evento
    this.stats.throttled++;
    this.stats.throttledByType[eventType] =
      (this.stats.throttledByType[eventType] || 0) + 1;

    if (this.config.debug) {
      debugLog(
        `[EventThrottler] ⏱️ ${eventType} throttled (elapsed: ${elapsedMs}ms < ${intervalMs}ms)`
      );
    }

    return false;
  }

  /**
   * Resetea el timestamp de un tipo de evento específico
   * Útil para forzar el envío del siguiente evento de ese tipo
   */
  public reset(eventType: string): void {
    this.lastEventTimestamps.delete(eventType);
  }

  /**
   * Resetea todos los timestamps
   * Útil para reiniciar el throttler desde cero
   */
  public resetAll(): void {
    this.lastEventTimestamps.clear();
    this.stats = {
      allowed: 0,
      throttled: 0,
      throttledByType: {}
    };
    debugLog('[EventThrottler] 🔄 Reset completo');
  }

  /**
   * Obtiene las estadísticas de throttling
   */
  public getStats(): EventThrottlerStats {
    return { ...this.stats };
  }

  /**
   * Actualiza la configuración de throttling en tiempo real
   */
  public updateConfig(config: Partial<EventThrottlerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      rules: { ...this.config.rules, ...(config.rules || {}) }
    };

    if (this.config.debug) {
      debugLog('[EventThrottler] ⚙️ Configuración actualizada:', this.config);
    }
  }

  /**
   * Añade o actualiza una regla de throttling para un tipo de evento
   */
  public setRule(eventType: string, intervalMs: number): void {
    this.config.rules[eventType] = intervalMs;

    if (this.config.debug) {
      debugLog(`[EventThrottler] 📝 Regla actualizada: ${eventType} → ${intervalMs}ms`);
    }
  }

  /**
   * Elimina la regla de throttling para un tipo de evento
   * (el evento quedará sin throttle)
   */
  public removeRule(eventType: string): void {
    delete this.config.rules[eventType];

    if (this.config.debug) {
      debugLog(`[EventThrottler] 🗑️ Regla eliminada: ${eventType}`);
    }
  }

  /**
   * Obtiene el tiempo restante (ms) antes de que un evento pueda ser enviado
   * Útil para mostrar feedback visual al usuario
   */
  public getTimeUntilNext(eventType: string): number {
    const intervalMs = this.config.rules[eventType];
    if (intervalMs === undefined) {
      return 0; // Sin throttle
    }

    const lastTimestamp = this.lastEventTimestamps.get(eventType);
    if (lastTimestamp === undefined) {
      return 0; // Primer evento, puede enviarse inmediatamente
    }

    const now = Date.now();
    const elapsedMs = now - lastTimestamp;
    const remainingMs = intervalMs - elapsedMs;

    return Math.max(0, remainingMs);
  }

  /**
   * Verifica si el throttler está habilitado
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Habilita o deshabilita el throttling
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    debugLog(`[EventThrottler] ${enabled ? '✅ Habilitado' : '❌ Deshabilitado'}`);
  }
}
