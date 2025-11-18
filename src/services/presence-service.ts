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
  ChatParticipant,
  ActivityType
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

  // Heartbeat para mantener estado activo
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs: number = 30000; // 30 segundos (según guía oficial de presencia)
  private heartbeatCount: number = 0; // Contador de heartbeats enviados
  private lastHeartbeatTime: number = 0; // Timestamp del último heartbeat enviado
  private minHeartbeatInterval: number = 5000; // Mínimo 5 segundos entre heartbeats (throttling)

  // Activity tracking para user-interaction (🆕 2025)
  private lastUserInteractionTime: number = 0; // Timestamp de última interacción real del usuario
  private userInteractionThrottleMs: number = 10000; // Throttle de 10 segundos para user-interaction (incrementado desde 5s)
  private isThrottlingActive: boolean = false; // Flag para evitar llamadas redundantes durante throttling

  // Event listeners para detectar actividad del usuario (🆕 2025 - según guía oficial)
  private boundUserInteractionHandler: EventListener | null = null;
  private boundHighFrequencyHandler: EventListener | null = null;
  private boundVisibilityChangeHandler: EventListener | null = null;

  // Throttling para eventos de alta frecuencia (mousemove, scroll)
  private highFrequencyThrottleMs: number = 30000; // 30 segundos para eventos de alta frecuencia
  private lastHighFrequencyTime: number = 0;

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
      heartbeatInterval: config.heartbeatInterval ?? 30000, // 30 segundos según guía oficial
      userInteractionThrottle: config.userInteractionThrottle ?? 10000, // Incrementado de 5s a 10s
      highFrequencyThrottle: config.highFrequencyThrottle ?? 30000 // 30s para eventos de alta frecuencia
    };

    // Aplicar configuración de heartbeat (🆕 2025)
    if (this.config.heartbeatInterval) {
      this.heartbeatIntervalMs = this.config.heartbeatInterval;
    }
    if (this.config.userInteractionThrottle) {
      this.userInteractionThrottleMs = this.config.userInteractionThrottle;
    }
    if (this.config.highFrequencyThrottle) {
      this.highFrequencyThrottleMs = this.config.highFrequencyThrottle;
    }

    debugLog('[PresenceService] 🟢 Inicializado', {
      visitorId: this.visitorId.substring(0, 8) + '...',
      config: this.config
    });

    // Registrar listeners de WebSocket
    this.setupWebSocketListeners();

    // 🆕 2025: Configurar listeners de actividad del usuario (según guía oficial de presencia)
    this.setupUserActivityListeners();
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
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔔 EVENTO DE PRESENCIA FILTRADO RECIBIDO');
        console.log(`👤 Usuario: ${event.userId.substring(0, 8)}... (${event.userType})`);
        console.log(`📊 Estado: ${event.previousStatus} → ${event.status}`);
        console.log('✅ Este evento fue filtrado por el backend (solo chats activos)');
        console.log('═══════════════════════════════════════════════════════');

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
          console.log('[PresenceService] 🎯 Auto-join automático detectado');
          console.log('[PresenceService] 📍 Sala personal:', event.roomName);
          console.log('[PresenceService] 🔔 Eventos de presencia filtrados activos (solo chats activos)');
        }

        this.notifyPresenceJoined(event);
      }
    });

    debugLog('[PresenceService] 📡 Listeners de WebSocket configurados');
  }

  /**
   * Configura listeners de eventos de usuario para detectar actividad
   * Según guía oficial de presencia 2025:
   * - Escucha: click, keydown, touchstart (throttle 10s)
   * - Escucha: scroll, mousemove (throttle 30s - eventos de alta frecuencia)
   * - Envía heartbeat tipo 'user-interaction' para reactivar desde AWAY
   *
   * 🆕 2025: Sistema automático de detección de actividad con throttling diferenciado
   */
  private setupUserActivityListeners(): void {
    if (!this.config.enabled) {
      debugLog('[PresenceService] ⚠️ Presencia deshabilitada, no se configuran listeners de actividad');
      return;
    }

    // Handler para eventos de baja frecuencia (click, keydown, touchstart) - throttle 10s
    this.boundUserInteractionHandler = (_event: Event) => {
      this.recordUserInteraction();
    };

    // Handler para eventos de alta frecuencia (mousemove, scroll) - throttle 30s
    this.boundHighFrequencyHandler = (_event: Event) => {
      this.recordHighFrequencyInteraction();
    };

    // Eventos de baja frecuencia (throttle 10s)
    const lowFrequencyEvents = ['click', 'keydown', 'touchstart'];

    // Eventos de alta frecuencia (throttle 30s)
    const highFrequencyEvents = ['mousemove', 'scroll'];

    // Registrar listeners de baja frecuencia con { passive: true } para mejor performance
    if (this.boundUserInteractionHandler) {
      lowFrequencyEvents.forEach(eventType => {
        document.addEventListener(eventType, this.boundUserInteractionHandler!, { passive: true });
      });
      debugLog('[PresenceService] 👂 Listeners de baja frecuencia configurados:', lowFrequencyEvents);
    }

    // Registrar listeners de alta frecuencia con { passive: true } para mejor performance
    if (this.boundHighFrequencyHandler) {
      highFrequencyEvents.forEach(eventType => {
        document.addEventListener(eventType, this.boundHighFrequencyHandler!, { passive: true });
      });
      debugLog('[PresenceService] 👂 Listeners de alta frecuencia configurados:', highFrequencyEvents);
    }

    // 🆕 2025: Listener de visibilitychange para detectar cuando el usuario vuelve a la pestaña
    this.boundVisibilityChangeHandler = (_event: Event) => {
      if (document.visibilityState === 'visible') {
        debugLog('[PresenceService] 👁️ Usuario volvió a la pestaña (visibilitychange)');
        // Enviar heartbeat inmediato al volver a la pestaña
        this.recordTabFocus();
      }
    };

    if (this.boundVisibilityChangeHandler) {
      document.addEventListener('visibilitychange', this.boundVisibilityChangeHandler);
      debugLog('[PresenceService] 👂 Listener de visibilitychange configurado');
    }
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
   *
   * 🆕 2025: Ahora diferencia entre dos tipos de actividad:
   * - 'heartbeat': Mantiene sesión viva (automático cada 30s según guía oficial)
   * - 'user-interaction': Usuario interactuó (reactiva a ONLINE)
   *
   * @param activityType Tipo de actividad: 'heartbeat' (automático) o 'user-interaction' (reactivación)
   * @param immediate Si es true, fuerza el envío inmediato omitiendo el throttling
   */
  public async sendHeartbeat(
    activityType: ActivityType = 'heartbeat',
    immediate: boolean = false
  ): Promise<void> {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - this.lastHeartbeatTime;

    // Throttling diferenciado según tipo de actividad
    if (!immediate) {
      if (activityType === 'heartbeat' && timeSinceLastHeartbeat < this.minHeartbeatInterval) {
        debugLog(
          `[PresenceService] ⏳ Heartbeat automático omitido por throttling (${timeSinceLastHeartbeat}ms < ${this.minHeartbeatInterval}ms)`
        );
        return;
      }

      if (activityType === 'user-interaction') {
        const timeSinceLastInteraction = now - this.lastUserInteractionTime;
        if (timeSinceLastInteraction < this.userInteractionThrottleMs) {
          debugLog(
            `[PresenceService] ⏳ User-interaction omitido por throttling (${Math.round(timeSinceLastInteraction / 1000)}s < 5s)`
          );
          return;
        }
      }
    }
    try {
      const endpoint = this.endpointManager.getEndpoint();
      const url = `${endpoint}/visitors/session/heartbeat`;

      // Incrementar contador
      this.heartbeatCount++;
      const timestamp = new Date().toISOString();

      console.log(`[PresenceService] 💓 Enviando heartbeat #${this.heartbeatCount} (${activityType}) a las ${timestamp}`);
      console.log(`[PresenceService] 📍 URL: ${url}`);
      console.log(`[PresenceService] 👤 Visitor ID: ${this.visitorId.substring(0, 8)}...`);
      console.log(`[PresenceService] 🎯 Activity Type: ${activityType}`);

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
        headers,
        body: JSON.stringify({
          activityType
        })
      });

      // Actualizar timestamps según tipo de actividad
      this.lastHeartbeatTime = now;
      if (activityType === 'user-interaction') {
        this.lastUserInteractionTime = now;
      }

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.error(`[PresenceService] ❌ Heartbeat #${this.heartbeatCount} (${activityType}) FALLÓ`);
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
        console.log(`[PresenceService] ✅ Heartbeat #${this.heartbeatCount} (${activityType}) enviado EXITOSAMENTE`);
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
      console.error(`[PresenceService] ❌ EXCEPCIÓN en heartbeat #${this.heartbeatCount} (${activityType}):`, error);
      if (error instanceof Error) {
        console.error(`[PresenceService] 📛 Error: ${error.message}`);
        console.error(`[PresenceService] 📚 Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Registra una interacción del usuario de baja frecuencia (click, keydown, touchstart)
   * y envía heartbeat de tipo 'user-interaction'
   *
   * El throttling de 10 segundos previene enviar demasiados heartbeats
   *
   * 🆕 2025: Mejorado con flag de throttling para evitar ejecuciones redundantes
   */
  public async recordUserInteraction(): Promise<void> {
    // Early return si el throttling está activo (sin verificar timestamps)
    if (this.isThrottlingActive) {
      return;
    }

    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastUserInteractionTime;

    // Throttling: máximo 1 interacción cada 10 segundos
    if (timeSinceLastInteraction < this.userInteractionThrottleMs) {
      debugLog(
        `[PresenceService] ⏳ User interaction omitida por throttling (${Math.round(timeSinceLastInteraction / 1000)}s < ${this.userInteractionThrottleMs / 1000}s)`
      );
      return;
    }

    // Activar flag de throttling para evitar múltiples llamadas simultáneas
    this.isThrottlingActive = true;

    debugLog('[PresenceService] 👆 Interacción de usuario detectada (baja frecuencia), enviando heartbeat...');

    try {
      await this.sendHeartbeat('user-interaction', false);
    } finally {
      // Desactivar flag después del throttle configurado
      setTimeout(() => {
        this.isThrottlingActive = false;
      }, this.userInteractionThrottleMs);
    }
  }

  /**
   * Registra una interacción del usuario de alta frecuencia (mousemove, scroll)
   * y envía heartbeat de tipo 'user-interaction' con throttling más agresivo
   *
   * El throttling de 30 segundos previene spam de eventos de alta frecuencia
   *
   * 🆕 2025: Nuevo método para eventos que se disparan múltiples veces por segundo
   */
  public async recordHighFrequencyInteraction(): Promise<void> {
    const now = Date.now();
    const timeSinceLastHighFrequency = now - this.lastHighFrequencyTime;

    // Throttling: máximo 1 interacción cada 30 segundos para eventos de alta frecuencia
    if (timeSinceLastHighFrequency < this.highFrequencyThrottleMs) {
      // No log para eventos de alta frecuencia (demasiado verbose)
      return;
    }

    this.lastHighFrequencyTime = now;

    debugLog('[PresenceService] 🔄 Interacción de usuario detectada (alta frecuencia), enviando heartbeat...');
    await this.sendHeartbeat('user-interaction', false);
  }

  /**
   * Registra que el usuario volvió a la pestaña y envía heartbeat inmediato
   * Este método se llama cuando visibilitychange detecta que la página volvió a estar visible
   *
   * 🆕 2025: Nuevo método para gestión de inactividad del visitante
   */
  public async recordTabFocus(): Promise<void> {
    debugLog('[PresenceService] 👁️ Usuario volvió a la pestaña, enviando heartbeat inmediato...');
    await this.sendHeartbeat('user-interaction', true); // immediate = true para bypass throttling
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
   * Notifica a todos los callbacks de confirmación de auto-join (🆕 2025)
   */
  private notifyPresenceJoined(event: PresenceJoinedEvent): void {
    debugLog('[PresenceService] 📢 Notificando presence:joined:', event);

    this.presenceJoinedCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[PresenceService] ❌ Error en callback de presence:joined:', error);
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

    // 🆕 2025: Remover listeners de actividad de usuario (según guía oficial)
    if (this.boundUserInteractionHandler) {
      const lowFrequencyEvents = ['click', 'keydown', 'touchstart'];
      lowFrequencyEvents.forEach(eventType => {
        document.removeEventListener(eventType, this.boundUserInteractionHandler!);
      });
      this.boundUserInteractionHandler = null;
      debugLog('[PresenceService] ✅ Listeners de baja frecuencia removidos');
    }

    // Remover listeners de alta frecuencia
    if (this.boundHighFrequencyHandler) {
      const highFrequencyEvents = ['mousemove', 'scroll'];
      highFrequencyEvents.forEach(eventType => {
        document.removeEventListener(eventType, this.boundHighFrequencyHandler!);
      });
      this.boundHighFrequencyHandler = null;
      debugLog('[PresenceService] ✅ Listeners de alta frecuencia removidos');
    }

    // 🆕 2025: Remover listener de visibilitychange
    if (this.boundVisibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityChangeHandler);
      this.boundVisibilityChangeHandler = null;
      debugLog('[PresenceService] ✅ Listener de visibilitychange removido');
    }

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
