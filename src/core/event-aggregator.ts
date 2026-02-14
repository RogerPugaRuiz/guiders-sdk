import { TrackingEventDto } from '../types';
import { debugLog } from '../utils/debug-logger';

/**
 * EventAggregator
 *
 * Consolida eventos duplicados o similares en una ventana de tiempo.
 * Reduce el número de eventos enviados al backend manteniendo información agregada.
 *
 * Estrategia: Time-window aggregation con event fingerprinting
 * - Eventos similares se identifican por "fingerprint" (eventType + contexto)
 * - Se mantiene un buffer temporal de eventos
 * - Flush automático cada windowMs (default: 1000ms)
 * - Añade campo `aggregatedCount` a eventos consolidados
 *
 * @example
 * const aggregator = new EventAggregator({
 *   enabled: true,
 *   windowMs: 1000,      // Ventana de 1 segundo
 *   maxBufferSize: 1000
 * });
 *
 * aggregator.add(event1);
 * aggregator.add(event2);
 * // ... más eventos
 *
 * const aggregated = aggregator.flush(); // Retorna eventos consolidados
 */

export interface EventAggregatorConfig {
  enabled: boolean;
  windowMs: number;         // Ventana de agregación en ms
  maxBufferSize: number;    // Máximo de eventos en buffer antes de flush forzado
  onFlush?: (events: TrackingEventDto[]) => void; // Callback para eventos flushed
  debug?: boolean;
}

export interface EventAggregatorStats {
  totalEventsReceived: number;
  totalEventsAggregated: number;  // Eventos después de consolidación
  aggregationRatio: number;        // % de reducción
  aggregatedByType: Record<string, number>;
}

interface AggregatedEvent {
  event: TrackingEventDto;
  count: number;
  firstOccurredAt: string;
  lastOccurredAt: string;
  metadata: Record<string, any>; // Metadata acumulada
}

export class EventAggregator {
  private config: EventAggregatorConfig;
  private buffer: Map<string, AggregatedEvent>;
  private flushTimer: NodeJS.Timeout | null;
  private stats: EventAggregatorStats;

  /**
   * Tipos de eventos que se pueden agregar
   * Otros eventos se envían sin consolidar
   */
  private static readonly AGGREGABLE_EVENTS = new Set([
    'SCROLL',
    'MOUSE_MOVE',
    'HOVER',
    'MOUSE_ENTER',
    'MOUSE_LEAVE',
    'RESIZE',
    'FOCUS',
    'BLUR'
  ]);

  constructor(config: Partial<EventAggregatorConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      windowMs: config.windowMs ?? 1000,
      maxBufferSize: config.maxBufferSize ?? 1000,
      debug: config.debug ?? false,
      onFlush: config.onFlush  // ✅ Preservar callback de flush
    };

    this.buffer = new Map();
    this.flushTimer = null;
    this.stats = {
      totalEventsReceived: 0,
      totalEventsAggregated: 0,
      aggregationRatio: 0,
      aggregatedByType: {}
    };

    // Iniciar flush automático
    if (this.config.enabled) {
      this.startAutoFlush();
    }

    if (this.config.debug) {
      debugLog('[EventAggregator] ✅ Initialized:', {
        windowMs: this.config.windowMs,
        maxBufferSize: this.config.maxBufferSize
      });
    }
  }

  /**
   * Añade un evento al agregador
   * Si es agregable, se consolida con eventos similares
   * Si no, se envía directamente en el próximo flush
   */
  public add(event: TrackingEventDto): void {
    if (!this.config.enabled) {
      return;
    }

    this.stats.totalEventsReceived++;

    const fingerprint = this.getEventFingerprint(event);
    const existing = this.buffer.get(fingerprint);

    if (existing) {
      // Consolidar con evento existente
      existing.count++;
      existing.lastOccurredAt = event.occurredAt || new Date().toISOString();

      // Actualizar metadata acumulada
      this.mergeMetadata(existing.metadata, event.metadata);

      if (this.config.debug) {
        debugLog(
          `[EventAggregator] 🔗 Consolidado ${event.eventType} (count: ${existing.count})`
        );
      }
    } else {
      // Nuevo evento en el buffer
      this.buffer.set(fingerprint, {
        event: { ...event },
        count: 1,
        firstOccurredAt: event.occurredAt || new Date().toISOString(),
        lastOccurredAt: event.occurredAt || new Date().toISOString(),
        metadata: { ...event.metadata }
      });

      if (this.config.debug) {
        debugLog(`[EventAggregator] ➕ Nuevo evento en buffer: ${event.eventType}`);
      }
    }

    // Flush forzado si el buffer está lleno
    if (this.buffer.size >= this.config.maxBufferSize) {
      debugLog('[EventAggregator] ⚠️ Buffer lleno, flush forzado');
      this.flush();
    }
  }

  /**
   * Flush: retorna todos los eventos consolidados y limpia el buffer
   * @returns Array de eventos consolidados listos para enviar
   */
  public flush(): TrackingEventDto[] {
    if (this.buffer.size === 0) {
      return [];
    }

    const aggregatedEvents: TrackingEventDto[] = [];

    for (const [fingerprint, aggregated] of this.buffer.entries()) {
      // 🔧 Crear evento limpio sin campos V1 deprecados
      const event: TrackingEventDto = {
        visitorId: aggregated.event.visitorId,
        sessionId: aggregated.event.sessionId,
        eventType: aggregated.event.eventType,
        occurredAt: aggregated.lastOccurredAt, // Usar timestamp del último evento
        metadata: {
          ...aggregated.metadata,
          // Campos de agregación
          aggregatedCount: aggregated.count,
          firstOccurredAt: aggregated.firstOccurredAt,
          lastOccurredAt: aggregated.lastOccurredAt
        }
      };

      // Preservar __queuedAt si existe (para TTL)
      if (aggregated.event.__queuedAt) {
        event.__queuedAt = aggregated.event.__queuedAt;
      }

      aggregatedEvents.push(event);

      // Actualizar stats
      this.stats.aggregatedByType[event.eventType] =
        (this.stats.aggregatedByType[event.eventType] || 0) + 1;
    }

    this.stats.totalEventsAggregated += aggregatedEvents.length;
    this.stats.aggregationRatio =
      this.stats.totalEventsReceived > 0
        ? (1 - this.stats.totalEventsAggregated / this.stats.totalEventsReceived) * 100
        : 0;

    if (this.config.debug) {
      debugLog('[EventAggregator] 🚀 Flush:', {
        original: this.stats.totalEventsReceived,
        aggregated: aggregatedEvents.length,
        reduction: `${this.stats.aggregationRatio.toFixed(1)}%`
      });
    }

    // Limpiar buffer
    this.buffer.clear();

    return aggregatedEvents;
  }

  /**
   * Genera un fingerprint único para identificar eventos similares
   * Eventos con el mismo fingerprint se consideran consolidables
   */
  private getEventFingerprint(event: TrackingEventDto): string {
    const eventType = event.eventType;

    // Si el evento no es agregable, usar fingerprint único (no consolida)
    if (!EventAggregator.AGGREGABLE_EVENTS.has(eventType)) {
      return `${eventType}:${event.occurredAt}:${Math.random()}`;
    }

    // Generar fingerprint basado en tipo de evento + contexto
    const parts: string[] = [
      eventType,
      event.visitorId,
      event.sessionId
    ];

    // Añadir contexto adicional según el tipo de evento
    const metadata = event.metadata || {};

    switch (eventType) {
      case 'SCROLL':
        // Consolidar todos los scroll del mismo URL
        parts.push(metadata.url || '');
        break;

      case 'MOUSE_MOVE':
      case 'HOVER':
      case 'MOUSE_ENTER':
      case 'MOUSE_LEAVE':
        // Consolidar por elemento target (si existe)
        parts.push(metadata.elementId || metadata.elementClass || '');
        break;

      case 'RESIZE':
        // Consolidar todos los resize
        break;

      case 'FOCUS':
      case 'BLUR':
        // Consolidar por campo de formulario
        parts.push(metadata.fieldName || '');
        break;

      default:
        // Para otros eventos, usar timestamp para no consolidar
        parts.push(event.occurredAt || '');
    }

    return parts.join(':');
  }

  /**
   * Fusiona metadata de eventos consolidados
   * Estrategias:
   * - Valores numéricos: guardar min, max, avg
   * - Valores string: último valor
   * - Arrays: concatenar (sin duplicados)
   */
  private mergeMetadata(
    existing: Record<string, any>,
    incoming: Record<string, any>
  ): void {
    for (const key in incoming) {
      if (!incoming.hasOwnProperty(key)) continue;

      const incomingValue = incoming[key];
      const existingValue = existing[key];

      // Si no existe, copiar directamente
      if (existingValue === undefined) {
        existing[key] = incomingValue;
        continue;
      }

      // Estrategia según tipo de dato
      if (typeof incomingValue === 'number' && typeof existingValue === 'number') {
        // Valores numéricos: guardar min, max, último
        existing[`${key}Min`] = Math.min(existingValue, incomingValue);
        existing[`${key}Max`] = Math.max(existingValue, incomingValue);
        existing[key] = incomingValue; // Último valor
      } else if (Array.isArray(incomingValue) && Array.isArray(existingValue)) {
        // Arrays: concatenar sin duplicados
        const merged = new Set([...existingValue, ...incomingValue]);
        existing[key] = Array.from(merged);
      } else {
        // Otros tipos: sobrescribir con último valor
        existing[key] = incomingValue;
      }
    }
  }

  /**
   * Inicia el flush automático periódico
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      const events = this.flush();
      if (events.length > 0) {
        if (this.config.debug) {
          debugLog(
            `[EventAggregator] ⏰ Auto-flush: ${events.length} eventos consolidados`
          );
        }
        // Llamar callback si existe
        if (this.config.onFlush) {
          this.config.onFlush(events);
        }
      }
    }, this.config.windowMs);

    if (this.config.debug) {
      debugLog(
        `[EventAggregator] ⏰ Auto-flush iniciado cada ${this.config.windowMs}ms`
      );
    }
  }

  /**
   * Detiene el flush automático
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Obtiene las estadísticas de agregación
   */
  public getStats(): EventAggregatorStats {
    return { ...this.stats };
  }

  /**
   * Resetea las estadísticas
   */
  public resetStats(): void {
    this.stats = {
      totalEventsReceived: 0,
      totalEventsAggregated: 0,
      aggregationRatio: 0,
      aggregatedByType: {}
    };
  }

  /**
   * Actualiza la configuración del agregador
   */
  public updateConfig(config: Partial<EventAggregatorConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // Reiniciar auto-flush si cambió windowMs o enabled
    if (config.windowMs !== undefined || config.enabled !== undefined) {
      this.stopAutoFlush();
      if (this.config.enabled) {
        this.startAutoFlush();
      }
    }

    if (this.config.debug) {
      debugLog('[EventAggregator] ⚙️ Configuración actualizada:', this.config);
    }
  }

  /**
   * Verifica si el agregador está habilitado
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Habilita o deshabilita la agregación
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled) {
      this.startAutoFlush();
    } else {
      this.stopAutoFlush();
    }

    debugLog(`[EventAggregator] ${enabled ? '✅ Habilitado' : '❌ Deshabilitado'}`);
  }

  /**
   * Limpia el buffer sin retornar eventos (descarta todos)
   */
  public clear(): void {
    this.buffer.clear();
    debugLog('[EventAggregator] 🗑️ Buffer limpiado');
  }

  /**
   * Destructor: limpia recursos
   */
  public destroy(): void {
    this.stopAutoFlush();
    this.buffer.clear();
    debugLog('[EventAggregator] 💀 Destruido');
  }
}
