import { TrackingEventDto } from '../types';
import { debugLog } from '../utils/debug-logger';

/**
 * EventQueueManager
 *
 * Gestiona una cola híbrida de eventos de tracking:
 * - Cola en memoria para acceso rápido
 * - Persistencia en localStorage para recuperación tras recargas
 * - Operaciones atómicas thread-safe
 * - Límite de tamaño configurable
 *
 * @example
 * const queue = new EventQueueManager();
 * queue.enqueue(event);
 * const batch = queue.getBatch(500);
 * queue.dequeue(batch.length);
 */
export class EventQueueManager {
  private static readonly STORAGE_KEY = 'guiders_tracking_v2_queue';
  private static readonly DEFAULT_MAX_SIZE = 10000;

  private queue: TrackingEventDto[] = [];
  private maxSize: number;
  private persistEnabled: boolean;

  constructor(options: { maxSize?: number; persistEnabled?: boolean } = {}) {
    this.maxSize = options.maxSize ?? EventQueueManager.DEFAULT_MAX_SIZE;
    this.persistEnabled = options.persistEnabled ?? true;

    // Cargar cola desde localStorage al inicializar
    if (this.persistEnabled) {
      this.loadFromStorage();
    }

    debugLog(`[EventQueueManager] ✅ Inicializado (maxSize: ${this.maxSize}, persist: ${this.persistEnabled})`);
  }

  /**
   * Añade un evento a la cola
   * @param event Evento a encolar
   * @returns true si se añadió, false si se rechazó por límite de tamaño
   */
  public enqueue(event: TrackingEventDto): boolean {
    if (this.queue.length >= this.maxSize) {
      debugLog(`[EventQueueManager] ⚠️ Cola llena (${this.maxSize}), descartando evento más antiguo`);
      this.queue.shift(); // Descartar evento más antiguo (FIFO)
    }

    this.queue.push(event);

    // Persistir inmediatamente si está habilitado
    if (this.persistEnabled && this.queue.length % 10 === 0) {
      // Persistir cada 10 eventos para reducir I/O
      this.saveToStorage();
    }

    debugLog(`[EventQueueManager] ➕ Evento encolado (total: ${this.queue.length})`);
    return true;
  }

  /**
   * Obtiene un batch de eventos sin eliminarlos de la cola
   * @param size Tamaño del batch (default: 500)
   * @returns Array de eventos (máximo `size` elementos)
   */
  public getBatch(size: number = 500): TrackingEventDto[] {
    const batchSize = Math.min(size, this.queue.length);
    return this.queue.slice(0, batchSize);
  }

  /**
   * Elimina los primeros N eventos de la cola (después de envío exitoso)
   * @param count Cantidad de eventos a eliminar
   */
  public dequeue(count: number): void {
    const removed = this.queue.splice(0, count);
    debugLog(`[EventQueueManager] ➖ ${removed.length} eventos eliminados (quedan: ${this.queue.length})`);

    if (this.persistEnabled) {
      this.saveToStorage();
    }
  }

  /**
   * Limpia toda la cola
   */
  public clear(): void {
    this.queue = [];
    debugLog('[EventQueueManager] 🗑️ Cola limpiada');

    if (this.persistEnabled) {
      this.saveToStorage();
    }
  }

  /**
   * Retorna el tamaño actual de la cola
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Verifica si la cola está vacía
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Carga la cola desde localStorage
   */
  public loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      debugLog('[EventQueueManager] ⚠️ localStorage no disponible');
      return;
    }

    try {
      const stored = localStorage.getItem(EventQueueManager.STORAGE_KEY);
      if (!stored) {
        debugLog('[EventQueueManager] 📭 No hay cola persistida');
        return;
      }

      const parsed: TrackingEventDto[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        debugLog('[EventQueueManager] ⚠️ Formato de cola inválido, ignorando');
        return;
      }

      // Validar y filtrar eventos válidos
      this.queue = parsed.filter(this.isValidEvent);
      debugLog(`[EventQueueManager] 📂 ${this.queue.length} eventos cargados desde localStorage`);
    } catch (error) {
      console.error('[EventQueueManager] ❌ Error cargando cola desde localStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Guarda la cola en localStorage
   */
  public saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const serialized = JSON.stringify(this.queue);
      localStorage.setItem(EventQueueManager.STORAGE_KEY, serialized);
      debugLog(`[EventQueueManager] 💾 Cola guardada en localStorage (${this.queue.length} eventos)`);
    } catch (error) {
      console.error('[EventQueueManager] ❌ Error guardando cola en localStorage:', error);

      // Si el error es por QuotaExceeded, limpiar eventos antiguos
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        debugLog('[EventQueueManager] ⚠️ Quota excedida, limpiando 50% de eventos antiguos');
        const halfSize = Math.floor(this.queue.length / 2);
        this.queue = this.queue.slice(halfSize);

        // Reintentar guardar
        try {
          localStorage.setItem(EventQueueManager.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (retryError) {
          console.error('[EventQueueManager] ❌ Error en segundo intento:', retryError);
        }
      }
    }
  }

  /**
   * Valida que un evento tenga la estructura correcta
   */
  private isValidEvent(event: any): event is TrackingEventDto {
    return (
      event &&
      typeof event === 'object' &&
      typeof event.visitorId === 'string' &&
      typeof event.sessionId === 'string' &&
      typeof event.eventType === 'string' &&
      typeof event.metadata === 'object'
    );
  }

  /**
   * Retorna estadísticas de la cola
   */
  public getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    persistEnabled: boolean;
  } {
    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      utilizationPercent: (this.queue.length / this.maxSize) * 100,
      persistEnabled: this.persistEnabled
    };
  }
}
