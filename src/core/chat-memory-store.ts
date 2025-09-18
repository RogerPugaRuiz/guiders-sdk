/**
 * ChatMemoryStore - Gestor en memoria para el ID del chat actual
 * Reemplaza el uso de localStorage para chatV2Id
 */
export class ChatMemoryStore {
  private static instance: ChatMemoryStore;
  private currentChatId: string | null = null;

  private constructor() {}

  public static getInstance(): ChatMemoryStore {
    if (!ChatMemoryStore.instance) {
      ChatMemoryStore.instance = new ChatMemoryStore();
    }
    return ChatMemoryStore.instance;
  }

  /**
   * Establece el ID del chat actual
   */
  public setChatId(chatId: string): void {
    this.currentChatId = chatId;
    console.log('[ChatMemoryStore] 💾 Chat ID guardado en memoria:', chatId);
  }

  /**
   * Obtiene el ID del chat actual
   */
  public getChatId(): string | null {
    return this.currentChatId;
  }

  /**
   * Limpia el ID del chat actual
   */
  public clearChatId(): void {
    this.currentChatId = null;
    console.log('[ChatMemoryStore] 🗑️ Chat ID limpiado de memoria');
  }

  /**
   * Verifica si hay un chat ID disponible
   */
  public hasChatId(): boolean {
    return this.currentChatId !== null;
  }
}