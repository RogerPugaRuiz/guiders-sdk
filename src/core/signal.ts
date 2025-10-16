/**
 * Estado base para todos los signals
 */
export interface SignalState<T = any> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

/**
 * Callback que se ejecuta cuando cambia el estado del signal
 */
export type SignalSubscriber<T = any> = (state: SignalState<T>) => void;

/**
 * Clase base para implementar un patrón reactivo de signals
 * Inspirado en el patrón de observadores del TokenManager pero especializado para estados async
 */
export class Signal<T = any> {
  protected state: SignalState<T>;
  protected subscribers: SignalSubscriber<T>[] = [];

  constructor(initialData: T | null = null) {
    this.state = {
      loading: false,
      data: initialData,
      error: null
    };
  }

  /**
   * Suscribe un callback para escuchar cambios en el estado del signal
   */
  public subscribe(subscriber: SignalSubscriber<T>): () => void {
    this.subscribers.push(subscriber);
    
    // Retorna función para cancelar la suscripción
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index >= 0) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Desuscribe un callback específico
   */
  public unsubscribe(subscriber: SignalSubscriber<T>): void {
    const index = this.subscribers.indexOf(subscriber);
    if (index >= 0) {
      this.subscribers.splice(index, 1);
    }
  }

  /**
   * Obtiene el estado actual del signal
   */
  public getState(): SignalState<T> {
    return { ...this.state };
  }

  /**
   * Obtiene solo los datos actuales (shorthand)
   */
  public getValue(): T | null {
    return this.state.data;
  }

  /**
   * Verifica si el signal está en estado de carga
   */
  public isLoading(): boolean {
    return this.state.loading;
  }

  /**
   * Verifica si el signal tiene error
   */
  public hasError(): boolean {
    return this.state.error !== null;
  }

  /**
   * Actualiza el estado del signal y notifica a los suscriptores
   */
  protected setState(partialState: Partial<SignalState<T>>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    // Solo notificar si hubo cambios
    if (this.hasStateChanged(previousState, this.state)) {
      this.notifySubscribers();
    }
  }

  /**
   * Notifica a todos los suscriptores del cambio de estado
   */
  protected notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.getState());
      } catch (error) {
        console.warn('[Signal] Error en subscriber:', error);
      }
    });
  }

  /**
   * Compara si el estado ha cambiado
   */
  private hasStateChanged(prev: SignalState<T>, current: SignalState<T>): boolean {
    return (
      prev.loading !== current.loading ||
      prev.data !== current.data ||
      prev.error !== current.error
    );
  }

  /**
   * Marca el signal como en estado de carga
   */
  protected setLoading(): void {
    this.setState({ loading: true, error: null });
  }

  /**
   * Marca el signal como exitoso con datos
   */
  protected setSuccess(data: T): void {
    this.setState({ loading: false, data, error: null });
  }

  /**
   * Marca el signal como fallido con error
   */
  protected setError(error: Error): void {
    this.setState({ loading: false, error });
  }

  /**
   * Resetea el signal a su estado inicial
   */
  public reset(): void {
    this.setState({ loading: false, data: null, error: null });
  }

  /**
   * Limpia todas las suscripciones
   */
  public dispose(): void {
    this.subscribers.length = 0;
  }
}

/**
 * Signal especializado para operaciones asíncronas
 */
export class AsyncSignal<T = any> extends Signal<T> {
  private currentPromise: Promise<T> | null = null;
  private promiseId: number = 0;

  /**
   * Ejecuta una operación asíncrona y actualiza el estado del signal
   */
  public async execute(operation: () => Promise<T>): Promise<T> {
    // Incrementar ID de promesa para rastrear operaciones
    const thisPromiseId = ++this.promiseId;

    this.setLoading();

    try {
      const promise = operation();
      this.currentPromise = promise;

      const result = await promise;

      // Solo procesar el resultado si es la promesa más reciente
      if (this.promiseId === thisPromiseId) {
        this.setSuccess(result);
        this.currentPromise = null;
        return result;
      }

      // Si no es la promesa más reciente, la ignoramos silenciosamente
      console.warn('[AsyncSignal] ⚠️ Operación cancelada - reemplazada por una más reciente (ID:', thisPromiseId, '→', this.promiseId, ')');
      // Retornar el resultado parcial sin lanzar error
      return result;
    } catch (error) {
      // Solo procesar el error si es la promesa más reciente
      if (this.promiseId === thisPromiseId) {
        this.setError(error instanceof Error ? error : new Error(String(error)));
        this.currentPromise = null;
      } else {
        // Operación cancelada, no procesar el error
        console.warn('[AsyncSignal] ⚠️ Error en operación cancelada (ID:', thisPromiseId, ') - ignorando');
      }
      throw error;
    }
  }

  /**
   * Cancela la operación actual si está en progreso
   */
  public cancel(): void {
    if (this.currentPromise) {
      this.promiseId++; // Invalidar la promesa actual
      this.currentPromise = null;
      this.setState({ loading: false });
    }
  }

  /**
   * Verifica si hay una operación en progreso
   */
  public isPending(): boolean {
    return this.currentPromise !== null;
  }
}