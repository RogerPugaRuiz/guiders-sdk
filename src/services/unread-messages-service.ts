// src/services/unread-messages-service.ts

/**
 * Servicio para gestionar el conteo de mensajes no leídos en el chat
 */
export class UnreadMessagesService {
  private static instance: UnreadMessagesService | null = null;
  private unreadCount: number = 0;
  private listeners: Array<(count: number) => void> = [];
  private isActive: boolean = false;

  private constructor() {
    // Constructor privado para Singleton
    const stored = localStorage.getItem("guiders-unread-count");
    this.unreadCount = stored ? parseInt(stored, 10) || 0 : 0;
    console.log("Servicio UnreadMessages inicializado");
  }

  /**
   * Obtiene la instancia única del servicio
   */
  public static getInstance(): UnreadMessagesService {
    if (!this.instance) {
      this.instance = new UnreadMessagesService();
    }
    return this.instance;
  }

  /**
   * Incrementa el contador de mensajes no leídos
   */
  public incrementUnreadCount(): void {
    if (!this.isActive) {
      this.unreadCount++;
      localStorage.setItem("guiders-unread-count", this.unreadCount.toString());
      this.notifyListeners();
      console.log("Unread count incremented:", this.unreadCount);
    }
  }

  /**
   * Resetea el contador de mensajes no leídos
   */
  public resetUnreadCount(): void {
    this.unreadCount = 0;
    localStorage.setItem("guiders-unread-count", "0");
    this.notifyListeners();
    console.log("Unread count reset");
  }

  /**
   * Obtiene el número de mensajes no leídos
   */
  public getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Marca el chat como activo (usuario viendo el chat)
   */
  public setActive(active: boolean): void {
    console.log("Chat estado activo cambiado:", active);
    this.isActive = active;
    if (active) {
      this.resetUnreadCount();
    } else {
      // Guardar el valor actual aunque no cambie
      localStorage.setItem("guiders-unread-count", this.unreadCount.toString());
    }
  }

  /**
   * Devuelve si el chat está activo
   */
  public isChatActive(): boolean {
    return this.isActive;
  }

  /**
   * Suscribe un callback al evento de cambio de conteo
   * @param callback Función a ejecutar cuando cambia el contador
   */
  public onCountChange(callback: (count: number) => void): void {
    console.log("Nuevo listener añadido para cambios de contador");
    this.listeners.push(callback);
    
    // Notificar inmediatamente el valor actual
    callback(this.unreadCount);
  }

  /**
   * Fuerza una notificación a todos los listeners con el valor actual del contador
   * Útil para sincronizar componentes UI cuando se inicia la aplicación
   */
  public forceUpdate(): void {
    console.log("Forzando actualización del contador:", this.unreadCount);
    this.notifyListeners();
  }

  /**
   * Notifica a los listeners sobre el cambio en el contador
   */
  private notifyListeners(): void {
    console.log("Notificando a", this.listeners.length, "listeners sobre cambio en contador:", this.unreadCount);
    this.listeners.forEach(listener => {
      try {
        listener(this.unreadCount);
      } catch (error) {
        console.error("Error al notificar listener:", error);
      }
    });
  }
}
