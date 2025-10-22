/**
 * PresenceService - Gestión del sistema de presencia y typing indicators
 *
 * Características:
 * - Obtener estado de presencia via REST API
 * - Unirse/salir de salas de chat para recibir actualizaciones en tiempo real
 * - Enviar typing indicators (start/stop) con debounce automático
 * - Suscribirse a cambios de presencia y typing
 * - Gestión de recursos y cleanup
 *
 * Arquitectura:
 * - REST API: GET /presence/chat/:chatId (estado inicial)
 * - WebSocket: Eventos en tiempo real (typing, presence changes)
 * - Integración con WebSocketService existente
 */

import { WebSocketService } from './websocket-service';
import { EndpointManager } from '../core/tracking-pixel-SDK';
import { debugLog } from '../utils/debug-logger';
import {
  ChatPresence,
  PresenceChangedEvent,
  TypingEvent,
  PresenceConfig,
  PresenceChangeCallback,
  TypingChangeCallback,
  ChatParticipant
} from '../types/presence-types';

export class PresenceService {
  private webSocketService: WebSocketService;
  private endpointManager: EndpointManager;
  private visitorId: string;
  private config: PresenceConfig;

  // Suscripciones a eventos
  private presenceCallbacks: Set<PresenceChangeCallback> = new Set();
  private typingCallbacks: Set<TypingChangeCallback> = new Set();

  // Estado interno
  private activeChats: Set<string> = new Set();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private currentlyTypingIn: Set<string> = new Set();

  // Heartbeat para mantener estado activo
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs: number = 30000; // 30 segundos (según guía oficial)
  private heartbeatCount: number = 0; // Contador de heartbeats enviados

  constructor(
    webSocketService: WebSocketService,
    visitorId: string,
    config: Partial<PresenceConfig> = {}
  ) {
    this.webSocketService = webSocketService;
    this.endpointManager = EndpointManager.getInstance();
    this.visitorId = visitorId;

    // Configuración por defecto
    this.config = {
      enabled: config.enabled ?? true,
      pollingInterval: config.pollingInterval ?? 30000,
      showTypingIndicator: config.showTypingIndicator ?? true,
      typingTimeout: config.typingTimeout ?? 2000,
      typingDebounce: config.typingDebounce ?? 300
    };

    debugLog('[PresenceService] 🟢 Inicializado', {
      visitorId: this.visitorId.substring(0, 8) + '...',
      config: this.config
    });

    // Registrar listeners de WebSocket
    this.setupWebSocketListeners();
  }

  /**
   * Configura los listeners de WebSocket para eventos de presencia
   */
  private setupWebSocketListeners(): void {
    // El WebSocketService ya maneja la reconexión y re-join a salas
    // Registrar callbacks para eventos de presencia

    this.webSocketService.updateCallbacks({
      onTypingStart: (event: TypingEvent) => {
        // Solo notificar si el evento NO es del visitante actual (evitar ver propio typing)
        if (event.userId !== this.visitorId) {
          debugLog('[PresenceService] ✍️ Comercial comenzó a escribir:', event);
          this.notifyTypingChange(event, true);
        }
      },

      onTypingStop: (event: TypingEvent) => {
        // Solo notificar si el evento NO es del visitante actual
        if (event.userId !== this.visitorId) {
          debugLog('[PresenceService] ✍️ Comercial dejó de escribir:', event);
          this.notifyTypingChange(event, false);
        }
      },

      onPresenceChanged: (event: PresenceChangedEvent) => {
        // Notificar sobre cambios de presencia (típicamente del comercial)
        debugLog('[PresenceService] 🟢 Presencia cambió:', {
          userId: event.userId,
          status: event.status,
          previousStatus: event.previousStatus
        });
        this.notifyPresenceChange(event);
      }
    });

    debugLog('[PresenceService] 📡 Listeners de WebSocket configurados');
  }

  /**
   * Obtiene el estado de presencia actual de un chat via REST API
   */
  public async getChatPresence(chatId: string): Promise<ChatPresence | null> {
    try {
      const endpoint = this.endpointManager.getEndpoint();
      const url = `${endpoint}/presence/chat/${chatId}`;

      debugLog('[PresenceService] 🔍 Obteniendo presencia de chat:', chatId);

      // Obtener sessionId para el header x-guiders-sid
      const sessionId = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('guiders_backend_session_id')
        : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Añadir header x-guiders-sid si existe sessionId
      if (sessionId) {
        headers['x-guiders-sid'] = sessionId;
        debugLog('[PresenceService] 🔐 Enviando x-guiders-sid:', sessionId.substring(0, 8) + '...');
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // ✅ Enviar cookies de sesión automáticamente
        headers
      });

      if (!response.ok) {
        console.error('[PresenceService] ❌ Error al obtener presencia:', response.status);
        return null;
      }

      const data: ChatPresence = await response.json();
      debugLog('[PresenceService] ✅ Presencia obtenida:', {
        chatId: data.chatId,
        participants: data.participants.length
      });

      return data;
    } catch (error) {
      console.error('[PresenceService] ❌ Error en getChatPresence:', error);
      return null;
    }
  }

  /**
   * Une el visitante a una sala de chat para recibir actualizaciones en tiempo real
   */
  public joinChatRoom(chatId: string): void {
    if (!this.config.enabled) {
      debugLog('[PresenceService] ⚠️ Presencia deshabilitada, no se une a sala');
      return;
    }

    if (this.activeChats.has(chatId)) {
      debugLog('[PresenceService] ⚠️ Ya estás en la sala del chat:', chatId);
      return;
    }

    debugLog('[PresenceService] 🚪 Uniéndose a sala de chat:', chatId);

    // Usar el método existente del WebSocketService
    this.webSocketService.joinChatRoom(chatId);
    this.activeChats.add(chatId);

    debugLog('[PresenceService] ✅ Unido a sala de chat:', chatId);
  }

  /**
   * Sale de una sala de chat
   */
  public leaveChatRoom(chatId: string): void {
    if (!this.activeChats.has(chatId)) {
      return;
    }

    debugLog('[PresenceService] 🚪 Saliendo de sala de chat:', chatId);

    // Detener typing si estaba escribiendo en este chat
    if (this.currentlyTypingIn.has(chatId)) {
      this.stopTyping(chatId);
    }

    // Salir de la sala
    this.webSocketService.leaveChatRoom(chatId);
    this.activeChats.delete(chatId);

    debugLog('[PresenceService] ✅ Saliste de sala de chat:', chatId);
  }

  /**
   * Inicia el indicador de "estoy escribiendo" con debounce automático
   */
  public startTyping(chatId: string): void {
    if (!this.config.enabled || !this.config.showTypingIndicator) {
      return;
    }

    if (!this.activeChats.has(chatId)) {
      console.warn('[PresenceService] ⚠️ No estás en la sala del chat:', chatId);
      return;
    }

    // Limpiar timeout previo si existe
    const existingTimeout = this.typingTimeouts.get(chatId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Enviar evento solo si no estamos ya escribiendo
    if (!this.currentlyTypingIn.has(chatId)) {
      debugLog('[PresenceService] ✍️ Enviando typing:start para chat:', chatId);

      // Usar el método emit directo del WebSocket para enviar el evento
      // Nota: Necesitamos extender WebSocketService para soportar typing:start/stop
      this.emitTypingStart(chatId);

      this.currentlyTypingIn.add(chatId);
    }

    // Programar auto-stop después del timeout configurado
    const timeout = setTimeout(() => {
      this.stopTyping(chatId);
    }, this.config.typingTimeout);

    this.typingTimeouts.set(chatId, timeout);
  }

  /**
   * Detiene el indicador de "estoy escribiendo"
   */
  public stopTyping(chatId: string): void {
    if (!this.currentlyTypingIn.has(chatId)) {
      return;
    }

    debugLog('[PresenceService] ✍️ Enviando typing:stop para chat:', chatId);

    // Limpiar timeout
    const timeout = this.typingTimeouts.get(chatId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(chatId);
    }

    // Enviar evento de stop
    this.emitTypingStop(chatId);

    this.currentlyTypingIn.delete(chatId);
  }

  /**
   * Emite evento typing:start via REST API (según guía oficial de presencia)
   * Usa POST /api/presence/chat/:chatId/typing/start con auto-expiración en Redis (3s TTL)
   */
  private async emitTypingStart(chatId: string): Promise<void> {
    try {
      const endpoint = this.endpointManager.getEndpoint();
      const url = `${endpoint}/presence/chat/${chatId}/typing/start`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies de sesión
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('[PresenceService] ⚠️ Error al enviar typing:start:', response.status);
      }
    } catch (error) {
      console.error('[PresenceService] ❌ Error en emitTypingStart:', error);
    }
  }

  /**
   * Emite evento typing:stop via REST API (según guía oficial de presencia)
   * Usa POST /api/presence/chat/:chatId/typing/stop
   */
  private async emitTypingStop(chatId: string): Promise<void> {
    try {
      const endpoint = this.endpointManager.getEndpoint();
      const url = `${endpoint}/presence/chat/${chatId}/typing/stop`;

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies de sesión
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('[PresenceService] ⚠️ Error al enviar typing:stop:', response.status);
      }
    } catch (error) {
      console.error('[PresenceService] ❌ Error en emitTypingStop:', error);
    }
  }

  /**
   * Inicia el sistema de heartbeats para mantener la presencia activa
   * Envía POST /visitors/session/heartbeat cada 30 segundos (según guía oficial)
   * Esto previene que el visitante sea marcado como away/offline falsamente
   */
  public startHeartbeat(): void {
    if (!this.config.enabled) {
      console.warn('[PresenceService] ⚠️ Presencia deshabilitada, no se inicia heartbeat');
      return;
    }

    if (this.heartbeatInterval) {
      console.warn('[PresenceService] ⚠️ Heartbeat ya está activo');
      return;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('[PresenceService] 💓 INICIANDO SISTEMA DE HEARTBEAT');
    console.log(`[PresenceService] ⏰ Intervalo: ${this.heartbeatIntervalMs / 1000} segundos`);
    console.log(`[PresenceService] 👤 Visitor ID: ${this.visitorId.substring(0, 8)}...`);
    console.log(`[PresenceService] 🎯 Objetivo: Mantener estado "online" activo`);
    console.log('═══════════════════════════════════════════════════════');

    // Resetear contador
    this.heartbeatCount = 0;

    // Enviar heartbeat inmediatamente
    this.sendHeartbeat();

    // Programar envíos periódicos
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  /**
   * Detiene el sistema de heartbeats
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;

      console.log('═══════════════════════════════════════════════════════');
      console.log('[PresenceService] 💓 DETENIENDO SISTEMA DE HEARTBEAT');
      console.log(`[PresenceService] 📊 Total heartbeats enviados: ${this.heartbeatCount}`);
      console.log('═══════════════════════════════════════════════════════');
    }
  }

  /**
   * Envía un heartbeat al backend para actualizar lastActivity
   * Endpoint: POST /visitors/session/heartbeat (según guía oficial de presencia)
   * Esto mantiene al visitante como "online" y previene detección de inactividad
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const endpoint = this.endpointManager.getEndpoint();
      const url = `${endpoint}/visitors/session/heartbeat`;

      // Incrementar contador
      this.heartbeatCount++;
      const timestamp = new Date().toISOString();

      console.log(`[PresenceService] 💓 Enviando heartbeat #${this.heartbeatCount} a las ${timestamp}`);
      console.log(`[PresenceService] 📍 URL: ${url}`);
      console.log(`[PresenceService] 👤 Visitor ID: ${this.visitorId.substring(0, 8)}...`);

      // Obtener sessionId para el header x-guiders-sid
      const sessionId = typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('guiders_backend_session_id')
        : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Añadir header x-guiders-sid si existe sessionId (REQUERIDO por backend)
      if (sessionId) {
        headers['x-guiders-sid'] = sessionId;
        console.log(`[PresenceService] 🔐 Enviando x-guiders-sid: ${sessionId.substring(0, 8)}...`);
      } else {
        console.warn('[PresenceService] ⚠️ No se encontró sessionId en sessionStorage');
      }

      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // ✅ Enviar cookies de sesión para autenticación
        headers
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.error(`[PresenceService] ❌ Heartbeat #${this.heartbeatCount} FALLÓ`);
        console.error(`[PresenceService] 📊 Status: ${response.status} ${response.statusText}`);
        console.error(`[PresenceService] ⏱️ Duración: ${duration}ms`);

        // Intentar leer el cuerpo de la respuesta de error
        try {
          const errorBody = await response.text();
          if (errorBody) {
            console.error(`[PresenceService] 📄 Respuesta del servidor: ${errorBody}`);
          }
        } catch (e) {
          // Ignorar si no se puede leer el body
        }
      } else {
        console.log(`[PresenceService] ✅ Heartbeat #${this.heartbeatCount} enviado EXITOSAMENTE`);
        console.log(`[PresenceService] 📊 Status: ${response.status} ${response.statusText}`);
        console.log(`[PresenceService] ⏱️ Duración: ${duration}ms`);

        // Intentar leer la respuesta del servidor si existe
        try {
          const responseBody = await response.text();
          if (responseBody) {
            console.log(`[PresenceService] 📄 Respuesta del servidor: ${responseBody}`);
          }
        } catch (e) {
          // Ignorar si no se puede leer el body
        }

        // Log resumen cada 10 heartbeats
        if (this.heartbeatCount % 10 === 0) {
          console.log(`[PresenceService] 📈 RESUMEN: ${this.heartbeatCount} heartbeats enviados exitosamente`);
        }
      }
    } catch (error) {
      console.error(`[PresenceService] ❌ EXCEPCIÓN en heartbeat #${this.heartbeatCount}:`, error);
      if (error instanceof Error) {
        console.error(`[PresenceService] 📛 Error: ${error.message}`);
        console.error(`[PresenceService] 📚 Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Suscribe a cambios de presencia
   */
  public onPresenceChanged(callback: PresenceChangeCallback): () => void {
    this.presenceCallbacks.add(callback);
    debugLog('[PresenceService] 📞 Callback de presencia registrado');

    // Retornar función para desuscribirse
    return () => {
      this.presenceCallbacks.delete(callback);
      debugLog('[PresenceService] 📞 Callback de presencia removido');
    };
  }

  /**
   * Suscribe a cambios de typing
   */
  public onTypingChanged(callback: TypingChangeCallback): () => void {
    this.typingCallbacks.add(callback);
    debugLog('[PresenceService] 📞 Callback de typing registrado');

    // Retornar función para desuscribirse
    return () => {
      this.typingCallbacks.delete(callback);
      debugLog('[PresenceService] 📞 Callback de typing removido');
    };
  }

  /**
   * Notifica a todos los callbacks de cambio de presencia
   */
  private notifyPresenceChange(event: PresenceChangedEvent): void {
    debugLog('[PresenceService] 📢 Notificando cambio de presencia:', event);

    this.presenceCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[PresenceService] ❌ Error en callback de presencia:', error);
      }
    });
  }

  /**
   * Notifica a todos los callbacks de cambio de typing
   */
  private notifyTypingChange(event: TypingEvent, isTyping: boolean): void {
    debugLog('[PresenceService] 📢 Notificando cambio de typing:', { ...event, isTyping });

    this.typingCallbacks.forEach(callback => {
      try {
        callback(event, isTyping);
      } catch (error) {
        console.error('[PresenceService] ❌ Error en callback de typing:', error);
      }
    });
  }

  /**
   * Busca el comercial en la lista de participantes
   */
  public getCommercialFromParticipants(participants: ChatParticipant[]): ChatParticipant | null {
    return participants.find(p => p.userType === 'commercial') || null;
  }

  /**
   * Busca el visitante en la lista de participantes
   */
  public getVisitorFromParticipants(participants: ChatParticipant[]): ChatParticipant | null {
    return participants.find(p => p.userType === 'visitor') || null;
  }

  /**
   * Verifica si el servicio está activo
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): PresenceConfig {
    return { ...this.config };
  }

  /**
   * Obtiene los chats activos
   */
  public getActiveChats(): string[] {
    return Array.from(this.activeChats);
  }

  /**
   * Verifica si está escribiendo en un chat
   */
  public isTypingIn(chatId: string): boolean {
    return this.currentlyTypingIn.has(chatId);
  }

  /**
   * Cleanup: Libera recursos y desconecta
   */
  public cleanup(): void {
    debugLog('[PresenceService] 🧹 Limpiando recursos...');

    // Detener heartbeat
    this.stopHeartbeat();

    // Detener todos los typing activos
    this.currentlyTypingIn.forEach(chatId => {
      this.stopTyping(chatId);
    });

    // Salir de todas las salas activas
    this.activeChats.forEach(chatId => {
      this.leaveChatRoom(chatId);
    });

    // Limpiar todos los timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Limpiar callbacks
    this.presenceCallbacks.clear();
    this.typingCallbacks.clear();

    // Limpiar sets
    this.activeChats.clear();
    this.currentlyTypingIn.clear();

    debugLog('[PresenceService] ✅ Cleanup completado');
  }
}
