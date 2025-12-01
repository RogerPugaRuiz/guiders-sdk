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
 * 🆕 NOVEDADES 2025:
 * - Auto-join automático: Al autenticarse, el backend une automáticamente al visitante
 *   a su sala personal (visitor:{id}). Ya no requiere código adicional.
 * - Eventos filtrados: Los eventos presence:changed SOLO se envían a usuarios con chats activos.
 *   Reducción del 99%+ en tráfico WebSocket.
 * - Nuevo evento presence:joined: Confirma el auto-join automático a sala personal.
 * - Heartbeat recomendado: Enviar cada 30 segundos para mantener estado online.
 *
 * Arquitectura:
 * - REST API: GET /presence/chat/:chatId (estado inicial)
 * - REST API: POST /presence/chat/:chatId/typing/start|stop (typing indicators)
 * - REST API: POST /visitors/session/heartbeat (mantener presencia activa)
 * - WebSocket: Eventos en tiempo real (typing, presence changes, auto-join confirmación)
 * - Integración con WebSocketService existente
 */

import { WebSocketService } from './websocket-service';
import { ChatV2Service } from './chat-v2-service';
import { EndpointManager } from '../core/tracking-pixel-SDK';
import { debugLog } from '../utils/debug-logger';
import {
  ChatPresence,
  PresenceChangedEvent,
  TypingEvent,
  PresenceJoinedEvent,
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
  private presenceJoinedCallbacks: Set<(event: PresenceJoinedEvent) => void> = new Set();

  // Estado interno
  private activeChats: Set<string> = new Set();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private currentlyTypingIn: Set<string> = new Set();

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
      typingDebounce: config.typingDebounce ?? 300,
      heartbeatInterval: config.heartbeatInterval ?? 30000
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
        // 🆕 2025: Eventos ahora están FILTRADOS - solo recibes cambios de usuarios con chats activos
        debugLog('═══════════════════════════════════════════════════════');
        debugLog('🔔 EVENTO DE PRESENCIA FILTRADO RECIBIDO');
        debugLog(`👤 Usuario: ${event.userId.substring(0, 8)}... (${event.userType})`);
        debugLog(`📊 Estado: ${event.previousStatus} → ${event.status}`);
        debugLog('✅ Este evento fue filtrado por el backend (solo chats activos)');
        debugLog('═══════════════════════════════════════════════════════');

        debugLog('[PresenceService] 🟢 Presencia cambió:', {
          userId: event.userId,
          userType: event.userType,
          status: event.status,
          previousStatus: event.previousStatus,
          filtered: true // Indicar que es un evento filtrado
        });

        this.notifyPresenceChange(event);
      },

      onPresenceJoined: (event: PresenceJoinedEvent) => {
        // 🆕 2025: Confirmación de auto-join a sala personal
        debugLog('[PresenceService] ✅ Auto-join confirmado:', {
          userId: event.userId,
          roomName: event.roomName,
          automatic: event.automatic
        });

        // Log adicional para debugging
        if (event.automatic) {
          debugLog('[PresenceService] 🎯 Auto-join automático detectado');
          debugLog('[PresenceService] 📍 Sala personal:', event.roomName);
          debugLog('[PresenceService] 🔔 Eventos de presencia filtrados activos (solo chats activos)');
        }

        this.notifyPresenceJoined(event);
      }
    });

    debugLog('[PresenceService] 📡 Listeners de WebSocket configurados');
  }

  /**
   * Obtiene el estado de presencia actual de un chat via REST API
   * Incluye manejo automático de re-autenticación en caso de error 401
   */
  public async getChatPresence(chatId: string, isRetry: boolean = false): Promise<ChatPresence | null> {
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
        headers
      });

      // Manejar 401 con retry usando ChatV2Service para re-autenticar
      if (response.status === 401 && !isRetry) {
        debugLog('[PresenceService] ⚠️ Error 401 - Intentando re-autenticación...');
        const chatService = ChatV2Service.getInstance();
        const reauthed = await chatService.reAuthenticate();
        if (reauthed) {
          debugLog('[PresenceService] ✅ Re-autenticación exitosa, reintentando...');
          return this.getChatPresence(chatId, true);
        } else {
          debugLog('[PresenceService] ❌ Re-autenticación fallida');
          return null;
        }
      }

      if (!response.ok) {
        return null;
      }

      const data: ChatPresence = await response.json();
      debugLog('[PresenceService] ✅ Presencia obtenida:', {
        chatId: data.chatId,
        participants: data.participants.length
      });

      return data;
    } catch (error) {
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
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
      }
    } catch (error) {
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
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
      }
    } catch (error) {
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
   * Suscribe a eventos de confirmación de auto-join (🆕 2025)
   * Se emite cuando el backend confirma la unión automática a la sala personal
   */
  public onPresenceJoined(callback: (event: PresenceJoinedEvent) => void): () => void {
    this.presenceJoinedCallbacks.add(callback);
    debugLog('[PresenceService] 📞 Callback de presence:joined registrado');

    // Retornar función para desuscribirse
    return () => {
      this.presenceJoinedCallbacks.delete(callback);
      debugLog('[PresenceService] 📞 Callback de presence:joined removido');
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
      }
    });
  }

  /**
   * Notifica a todos los callbacks de confirmación de auto-join (🆕 2025)
   */
  private notifyPresenceJoined(event: PresenceJoinedEvent): void {
    debugLog('[PresenceService] 📢 Notificando presence:joined:', event);

    this.presenceJoinedCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
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
    this.presenceJoinedCallbacks.clear();

    // Limpiar sets
    this.activeChats.clear();
    this.currentlyTypingIn.clear();

    debugLog('[PresenceService] ✅ Cleanup completado');
  }
}
