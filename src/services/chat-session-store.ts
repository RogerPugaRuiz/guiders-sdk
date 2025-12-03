/**
 * ChatSessionStore - Gestión unificada del estado del chat
 *
 * Consolida la funcionalidad de ChatMemoryStore (memoria) y ChatSessionStore (persistencia).
 * Gestiona IDs de chats abiertos con persistencia ligera en localStorage.
 *
 * Objetivo: evitar peticiones a /chats/undefined y disponer de una lista de chats reutilizables.
 */

import { debugLog } from '../utils/debug-logger';

export interface ChatSessionSnapshot {
  current?: string | null;
  open: string[];
  lastUpdated: number;
}

export class ChatSessionStore {
  private static instance: ChatSessionStore;
  private openChats: Set<string> = new Set();
  private currentChatId: string | null = null;
  private LS_KEY = 'guiders_open_chats';

  private constructor() {
    this.hydrate();
  }

  public static getInstance(): ChatSessionStore {
    if (!ChatSessionStore.instance) {
      ChatSessionStore.instance = new ChatSessionStore();
    }
    return ChatSessionStore.instance;
  }

  private hydrate(): void {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      if (!raw) return;
      const parsed: ChatSessionSnapshot = JSON.parse(raw);
      if (Array.isArray(parsed.open)) parsed.open.forEach(id => id && this.openChats.add(id));
      if (parsed.current) this.currentChatId = parsed.current;
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  private persist(): void {
    try {
      const snapshot: ChatSessionSnapshot = {
        current: this.currentChatId,
        open: Array.from(this.openChats),
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.LS_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  public setCurrent(chatId: string): void {
    if (!chatId) return;
    this.currentChatId = chatId;
    this.openChats.add(chatId);
    this.persist();
    debugLog('[ChatSessionStore] 💾 Chat ID guardado:', chatId);
  }

  public add(chatId: string): void {
    if (!chatId) return;
    this.openChats.add(chatId);
    this.persist();
  }

  public remove(chatId: string): void {
    if (!chatId) return;
    this.openChats.delete(chatId);
    if (this.currentChatId === chatId) this.currentChatId = null;
    this.persist();
  }

  public getCurrent(): string | null { return this.currentChatId; }
  public getAll(): string[] { return Array.from(this.openChats); }

  /**
   * Limpia el chat actual sin eliminarlo de la lista de chats abiertos
   * Útil cuando el usuario quiere crear un nuevo chat
   */
  public clearCurrent(): void {
    this.currentChatId = null;
    this.persist();
    debugLog('[ChatSessionStore] 🗑️ Chat ID limpiado');
  }

  // ===== Alias para compatibilidad con ChatMemoryStore (deprecated) =====

  /** @deprecated Use setCurrent() instead */
  public setChatId(chatId: string): void {
    this.setCurrent(chatId);
  }

  /** @deprecated Use getCurrent() instead */
  public getChatId(): string | null {
    return this.getCurrent();
  }

  /** @deprecated Use clearCurrent() instead */
  public clearChatId(): void {
    this.clearCurrent();
  }

  /** Verifica si hay un chat ID disponible */
  public hasChatId(): boolean {
    return this.currentChatId !== null;
  }
}
