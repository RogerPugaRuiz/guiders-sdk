/**
 * 📡 WebSocketService - Gestión centralizada de conexiones WebSocket para comunicación bidireccional
 * 
 * Características:
 * - Conexión y reconexión automática
 * - Gestión de salas de chat (join/leave)
 * - Autenticación dual: JWT Bearer tokens y cookies de sesión
 * - Eventos en tiempo real: mensajes nuevos, estado del chat, typing indicators
 * - Patrón Singleton para instancia única global
 * 
 * Arquitectura según guía:
 * - ENVÍO de mensajes: HTTP POST /v2/messages (ChatV2Service)
 * - RECEPCIÓN de mensajes: WebSocket event 'message:new'
 * - Separación clara entre envío y recepción
 */

import { io, Socket } from 'socket.io-client';
import {
	WebSocketConfig,
	WebSocketState,
	WebSocketCallbacks,
	RealtimeMessage,
	ChatStatusUpdate,
	TypingIndicator,
	JoinChatRoomPayload,
	LeaveChatRoomPayload,
	TypingPayload,
	JoinVisitorRoomPayload,
	LeaveVisitorRoomPayload,
	ChatCreatedEvent,
	CommercialAssignedEvent,
	CommercialAvailabilityChangedEvent
} from '../types/websocket-types';
import { EndpointManager } from '../core/endpoint-manager';
import { debugLog, debugWarn, debugError } from '../utils/debug-logger';

export class WebSocketService {
	private static instance: WebSocketService;
	private socket: Socket | null = null;
	private state: WebSocketState = WebSocketState.DISCONNECTED;
	private config: WebSocketConfig | null = null;
	private callbacks: WebSocketCallbacks = {};
	private currentRooms: Set<string> = new Set();
	private currentVisitorId: string | null = null;

	// User activity tracking
	private lastActivityEmit: number = 0;
	private readonly ACTIVITY_THROTTLE_MS = 30000; // 30 segundos
	private activityHandler: (() => void) | null = null;
	private visibilityHandler: (() => void) | null = null;

	// Manual reconnection tracking
	private manualReconnectAttempt: number = 0;
	private manualReconnectTimeout: ReturnType<typeof setTimeout> | null = null;

	// Tenant room tracking for commercial availability
	private currentTenantId: string | null = null;

	private constructor() {
		debugLog('📡 [WebSocketService] Instancia creada');
	}

	public static getInstance(): WebSocketService {
		if (!WebSocketService.instance) {
			WebSocketService.instance = new WebSocketService();
		}
		return WebSocketService.instance;
	}

	/**
	 * Emite 'user:activity' al backend (con throttle opcional)
	 * Centraliza toda la lógica de emisión de actividad
	 * @param force - Si true, ignora el throttle
	 */
	public emitUserActivity(force: boolean = false): void {
		if (!this.socket?.connected) return;

		const now = Date.now();
		if (!force && now - this.lastActivityEmit < this.ACTIVITY_THROTTLE_MS) {
			return; // Throttled
		}

		this.lastActivityEmit = now;
		this.socket.emit('user:activity');
		debugLog('📡 [WebSocketService] 🎯 user:activity emitido' + (force ? ' (forzado)' : ''));
	}

	/**
	 * Configura los listeners de actividad del usuario
	 * Emite 'user:activity' al backend via WebSocket (throttled a 30s)
	 */
	private setupActivityListeners(): void {
		if (typeof document === 'undefined') return;

		// Crear handler que usa el método centralizado
		this.activityHandler = () => this.emitUserActivity();

		// Añadir listeners para interacciones del usuario
		const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
		events.forEach(event => {
			document.addEventListener(event, this.activityHandler!, { passive: true });
		});

		debugLog('📡 [WebSocketService] 👂 Activity listeners configurados');
	}

	/**
	 * Limpia los listeners de actividad del usuario
	 */
	private cleanupActivityListeners(): void {
		if (typeof document === 'undefined' || !this.activityHandler) return;

		const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
		events.forEach(event => {
			document.removeEventListener(event, this.activityHandler!);
		});

		this.activityHandler = null;
		debugLog('📡 [WebSocketService] 🧹 Activity listeners eliminados');
	}

	/**
	 * Configura el listener de visibilidad y foco para reconectar al volver a la página
	 */
	private setupVisibilityHandler(): void {
		if (typeof document === 'undefined' || typeof window === 'undefined') return;

		this.visibilityHandler = () => {
			debugLog('📡 [WebSocketService] 👁️ Visibilidad/foco detectado');

			if (!this.socket || !this.config) {
				return;
			}

			// Si está conectado, emitir actividad (forzado para reactivar de AWAY)
			if (this.socket.connected) {
				this.emitUserActivity(true);
				return;
			}

			// Si no está conectado, reconectar
			debugLog('📡 [WebSocketService] 🔄 Reconectando...');
			this.socket.connect();
		};

		// Listener para visibilidad (cambio de pestaña)
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				this.visibilityHandler!();
			}
		});

		// Listener para foco (click en ventana, alt-tab)
		window.addEventListener('focus', this.visibilityHandler);

		debugLog('📡 [WebSocketService] 👁️ Visibility handlers configurados');
	}

	/**
	 * Limpia los listeners de visibilidad y foco
	 */
	private cleanupVisibilityHandler(): void {
		if (!this.visibilityHandler) return;

		if (typeof window !== 'undefined') {
			window.removeEventListener('focus', this.visibilityHandler);
		}

		this.visibilityHandler = null;
		debugLog('📡 [WebSocketService] 🧹 Visibility + focus handlers eliminados');
	}

	/**
	 * Inicializa y conecta el WebSocket
	 * @param config Configuración del WebSocket
	 * @param callbacks Callbacks para eventos
	 */
	public connect(config: Partial<WebSocketConfig>, callbacks: WebSocketCallbacks = {}): void {
		if (this.socket && this.socket.connected) {
			debugLog('📡 [WebSocketService] ⚠️ Ya hay una conexión activa');
			return;
		}

		// Resolver endpoints usando EndpointManager
		const endpoints = EndpointManager.getInstance();
		const wsEndpoint = endpoints.getWebSocketEndpoint();

		debugLog('📡 [WebSocketService] 🔍 INICIO DE CONEXIÓN WebSocket');
		debugLog('📡 [WebSocketService] 📋 Endpoint resuelto:', wsEndpoint);
		debugLog('📡 [WebSocketService] 📋 Config recibida:', {
			url: config.url,
			path: config.path,
			hasAuthToken: !!config.authToken,
			hasSessionId: !!config.sessionId
		});

		// Configuración completa con defaults
		this.config = {
			url: config.url || wsEndpoint,
			path: config.path || '/socket.io/',
			transports: config.transports || ['websocket', 'polling'],
			withCredentials: config.withCredentials !== undefined ? config.withCredentials : true,
			reconnection: config.reconnection !== undefined ? config.reconnection : true,
			reconnectionAttempts: config.reconnectionAttempts || Infinity, // Reconexión infinita
			reconnectionDelay: config.reconnectionDelay || 1000,
			authToken: config.authToken,
			sessionId: config.sessionId
		};

		// 🔧 FIX: Usar updateCallbacks() para fusionar con callbacks existentes
		// En lugar de sobrescribir, esto preserva callbacks registrados por PresenceService
		this.updateCallbacks(callbacks);

		debugLog('📡 [WebSocketService] 🚀 INTENTANDO CONECTAR a:', {
			url: this.config.url,
			fullUrl: this.config.url + this.config.path,
			path: this.config.path,
			transports: this.config.transports,
			withCredentials: this.config.withCredentials,
			reconnection: this.config.reconnection,
			reconnectionAttempts: this.config.reconnectionAttempts,
			hasToken: !!this.config.authToken,
			hasSessionId: !!this.config.sessionId
		});
		debugLog('📡 [WebSocketService] 🌐 URL COMPLETA WebSocket:', `${this.config.url}${this.config.path}`);

		// Crear socket con configuración
		const socketOptions: any = {
			path: this.config.path,
			transports: this.config.transports,
			withCredentials: this.config.withCredentials,
			reconnection: this.config.reconnection,
			reconnectionAttempts: this.config.reconnectionAttempts,
			reconnectionDelay: this.config.reconnectionDelay
		};

		// Añadir autenticación - visitorId y tenantId son requeridos
		const visitorId = localStorage.getItem('visitorId');
		const tenantId = localStorage.getItem('tenantId') || config.tenantId;

		socketOptions.auth = {
			visitorId: visitorId || '',
			tenantId: tenantId || ''
		};

		// Añadir token si está disponible (legacy)
		if (this.config.authToken) {
			socketOptions.auth.token = this.config.authToken;
		}

		debugLog('📡 [WebSocketService] 🔐 Auth configurado:', {
			visitorId: visitorId ? `${visitorId.substring(0, 8)}...` : 'null',
			tenantId: tenantId ? `${tenantId.substring(0, 8)}...` : 'null',
			hasToken: !!this.config.authToken
		});

		this.socket = io(this.config.url, socketOptions);

		debugLog('📡 [WebSocketService] ✅ Socket.IO cliente creado');
		debugLog('📡 [WebSocketService] 🔌 Esperando conexión...');

		// Registrar event listeners
		this.registerEventListeners();
	}

	/**
	 * Registra todos los event listeners del WebSocket
	 */
	private registerEventListeners(): void {
		if (!this.socket) return;

		// Eventos de conexión
		this.socket.on('connect', () => {
			this.state = WebSocketState.CONNECTED;
			debugLog('📡 [WebSocketService] ✅✅✅ CONEXIÓN EXITOSA! ✅✅✅');
			debugLog('📡 [WebSocketService] 🆔 Socket ID:', this.socket?.id);
			debugLog('📡 [WebSocketService] 🌐 URL conectada:', this.config?.url);
			debugLog('📡 [WebSocketService] 📍 Path:', this.config?.path);
			debugLog('📡 [WebSocketService] 🚀 Transporte usado:', this.socket?.io?.engine?.transport?.name);

			// Cancelar reconexión manual si estaba en progreso
			this.cancelManualReconnection();

			// Re-unirse a sala de visitante si estaba conectado
			if (this.currentVisitorId) {
				debugLog('📡 [WebSocketService] 🔄 Re-uniéndose a sala de visitante:', this.currentVisitorId);
				this.joinVisitorRoom(this.currentVisitorId);
			}

			// Re-unirse a salas de chat activas después de reconectar
			if (this.currentRooms.size > 0) {
				debugLog('📡 [WebSocketService] 🔄 Re-uniéndose a salas activas:', Array.from(this.currentRooms));
				this.currentRooms.forEach(chatId => {
					this.joinChatRoom(chatId);
				});
			}

			// Re-unirse al tenant room para availability de comerciales
			if (this.currentTenantId) {
				debugLog('📡 [WebSocketService] 🔄 Re-uniéndose a tenant room:', this.currentTenantId);
				this.joinTenantRoom(this.currentTenantId);
			}

			// Limpiar handlers anteriores antes de configurar nuevos (evita duplicados)
			this.cleanupActivityListeners();
			this.cleanupVisibilityHandler();

			// Configurar tracking de actividad del usuario
			this.setupActivityListeners();
			this.setupVisibilityHandler();

			// Emitir actividad inmediatamente para marcar ONLINE
			this.emitUserActivity(true);

			if (this.callbacks.onConnect) {
				this.callbacks.onConnect();
			}
		});

		this.socket.on('disconnect', (reason: string) => {
			this.state = WebSocketState.DISCONNECTED;
			debugLog('📡 [WebSocketService] ⚠️⚠️ DESCONECTADO ⚠️⚠️');
			debugLog('📡 [WebSocketService] 📋 Razón:', reason);
			debugLog('📡 [WebSocketService] 🌐 URL que estaba conectada:', this.config?.url);

			if (this.callbacks.onDisconnect) {
				this.callbacks.onDisconnect(reason);
			}
		});

		this.socket.on('connect_error', (error: Error) => {
			this.state = WebSocketState.ERROR;
			debugError('📡 [WebSocketService] ❌❌❌ ERROR DE CONEXIÓN ❌❌❌');
			debugError('📡 [WebSocketService] 🌐 URL intentada:', this.config?.url);
			debugError('📡 [WebSocketService] 📍 Path:', this.config?.path);
			debugError('📡 [WebSocketService] 🚨 Mensaje de error:', error.message);
			debugError('📡 [WebSocketService] 📊 Error completo:', error);
			debugError('📡 [WebSocketService] 🔍 Stack trace:', error.stack);

			if (this.callbacks.onError) {
				this.callbacks.onError(error);
			}
		});

		this.socket.on('error', (error: any) => {
			debugError('📡 [WebSocketService] ❌ ERROR GENÉRICO del socket:', error);
		});

		this.socket.io.on('reconnect_attempt', (attemptNumber: number) => {
			this.state = WebSocketState.RECONNECTING;
			debugLog('📡 [WebSocketService] 🔄 INTENTO DE RECONEXIÓN #' + attemptNumber);
			debugLog('📡 [WebSocketService] 🌐 URL:', this.config?.url);
		});

		this.socket.io.on('reconnect', (attemptNumber: number) => {
			this.state = WebSocketState.CONNECTED;
			debugLog('📡 [WebSocketService] ✅ Reconectado después de', attemptNumber, 'intentos');
		});

		this.socket.io.on('reconnect_failed', () => {
			this.state = WebSocketState.ERROR;
			debugError('📡 [WebSocketService] ❌❌❌ RECONEXIÓN FALLIDA - todos los intentos agotados');
			debugError('📡 [WebSocketService] 🔄 Iniciando reconexión manual con backoff exponencial...');

			// Reiniciar reconexión manual con backoff exponencial
			this.startManualReconnection();
		});

		this.socket.io.on('reconnect_error', (error: Error) => {
			debugError('📡 [WebSocketService] ⚠️ Error en intento de reconexión:', error.message);
		});

		// Eventos del chat
		this.socket.on('message:new', (message: RealtimeMessage) => {
			debugLog('📡 [WebSocketService] 📨 Nuevo mensaje recibido:', {
				messageId: message.messageId,
				chatId: message.chatId,
				senderId: message.senderId,
				content: message.content.substring(0, 50) + '...'
			});

			if (this.callbacks.onMessage) {
				this.callbacks.onMessage(message);
			}
		});

		this.socket.on('chat:status', (statusUpdate: ChatStatusUpdate) => {
			debugLog('📡 [WebSocketService] 📊 Estado del chat actualizado:', statusUpdate);

			if (this.callbacks.onChatStatus) {
				this.callbacks.onChatStatus(statusUpdate);
			}
		});

		this.socket.on('user:typing', (typing: TypingIndicator) => {
			debugLog('📡 [WebSocketService] ✍️ Typing indicator:', typing);

			if (this.callbacks.onTyping) {
				this.callbacks.onTyping(typing);
			}
		});

		// Evento de chat creado proactivamente
		this.socket.on('chat:created', (event: ChatCreatedEvent) => {
			debugLog('📡 [WebSocketService] 🎉 Chat creado proactivamente:', {
				chatId: event.chatId,
				visitorId: event.visitorId,
				status: event.status,
				message: event.message
			});

			if (this.callbacks.onChatCreated) {
				this.callbacks.onChatCreated(event);
			}
		});

		// Evento de comercial asignado al chat
		this.socket.on('chat:commercial-assigned', (event: CommercialAssignedEvent) => {
			console.log('📡 [WebSocketService] 👤 chat:commercial-assigned recibido:', event);
			console.log('📡 [WebSocketService] 👤 callback existe?', !!this.callbacks.onCommercialAssigned);

			if (this.callbacks.onCommercialAssigned) {
				console.log('📡 [WebSocketService] 👤 Llamando callback onCommercialAssigned...');
				this.callbacks.onCommercialAssigned(event);
			} else {
				console.log('📡 [WebSocketService] ⚠️ No hay callback onCommercialAssigned registrado');
			}
		});

		// Eventos de Presencia y Typing Indicators (nuevos)
		this.socket.on('typing:start', (event: any) => {
			debugLog('📡 [WebSocketService] ✍️ typing:start recibido:', {
				chatId: event.chatId,
				userId: event.userId,
				userType: event.userType
			});

			if (this.callbacks.onTypingStart) {
				this.callbacks.onTypingStart(event);
			}
		});

		this.socket.on('typing:stop', (event: any) => {
			debugLog('📡 [WebSocketService] ✍️ typing:stop recibido:', {
				chatId: event.chatId,
				userId: event.userId,
				userType: event.userType
			});

			if (this.callbacks.onTypingStop) {
				this.callbacks.onTypingStop(event);
			}
		});

		this.socket.on('presence:changed', (event: any) => {
			// 🆕 2025: Detectar formato del evento (granular vs global)
			const isGranular = !!event.chatId;
			const isGlobal = !!event.affectedChatIds;

			debugLog('📡 [WebSocketService] 🟢 presence:changed recibido:', {
				userId: event.userId,
				userType: event.userType,
				status: event.status,
				previousStatus: event.previousStatus,
				// Nuevos campos 2025
				format: isGranular ? 'granular' : isGlobal ? 'global' : 'legacy',
				chatId: event.chatId,
				affectedChatIds: event.affectedChatIds
			});

			if (this.callbacks.onPresenceChanged) {
				this.callbacks.onPresenceChanged(event);
			}
		});

		// 🆕 2025: Auto-join automático a sala personal (visitor:{id} o commercial:{id})
		this.socket.on('presence:joined', (event: any) => {
			debugLog('📡 [WebSocketService] ✅ presence:joined recibido (auto-join):', {
				userId: event.userId,
				userType: event.userType,
				roomName: event.roomName,
				automatic: event.automatic,
				timestamp: event.timestamp
			});

			// Log especial para auto-join automático
			if (event.automatic) {
				debugLog('═══════════════════════════════════════════════════════');
				debugLog('✅ AUTO-JOIN AUTOMÁTICO CONFIRMADO');
				debugLog(`📍 Sala personal: ${event.roomName}`);
				debugLog(`👤 Usuario: ${event.userId.substring(0, 8)}...`);
				debugLog(`🎯 Tipo: ${event.userType}`);
				debugLog('🔔 Ahora recibirás eventos de presencia filtrados (solo chats activos)');
				debugLog('═══════════════════════════════════════════════════════');
			}

			if (this.callbacks.onPresenceJoined) {
				this.callbacks.onPresenceJoined(event);
			}
		});

		// Confirmaciones de sala de visitante (legacy - mantener por compatibilidad)
		this.socket.on('visitor:joined', (data: any) => {
			debugLog('📡 [WebSocketService] ✅ Confirmación de unión a sala de visitante (legacy):', data);
		});

		this.socket.on('visitor:left', (data: any) => {
			debugLog('📡 [WebSocketService] ✅ Confirmación de salida de sala de visitante:', data);
		});

		// 🤖 Eventos de IA - Typing indicator cuando la IA está generando respuesta
		this.socket.on('ai:typing:start', (data: { chatId: string }) => {
			debugLog('📡 [WebSocketService] 🤖 ai:typing:start recibido - IA generando respuesta:', {
				chatId: data.chatId
			});

			if (this.callbacks.onAITypingStart) {
				this.callbacks.onAITypingStart(data);
			}
		});

		this.socket.on('ai:typing:stop', (data: { chatId: string }) => {
			debugLog('📡 [WebSocketService] 🤖 ai:typing:stop recibido - IA terminó de generar:', {
				chatId: data.chatId
			});

			if (this.callbacks.onAITypingStop) {
				this.callbacks.onAITypingStop(data);
			}
		});

		// 📡 Evento de disponibilidad de comerciales en tiempo real
		this.socket.on('commercial:availability-changed', (event: CommercialAvailabilityChangedEvent) => {
			debugLog('📡 [WebSocketService] 📡 commercial:availability-changed recibido:', {
				available: event.available,
				onlineCount: event.onlineCount,
				tenantId: event.tenantId
			});

			if (this.callbacks.onCommercialAvailabilityChanged) {
				this.callbacks.onCommercialAvailabilityChanged(event);
			}
		});

		// Confirmación de unión al tenant room
		this.socket.on('tenant:joined', (data: any) => {
			debugLog('📡 [WebSocketService] ✅ tenant:joined confirmado:', {
				companyId: data.companyId,
				roomName: data.roomName
			});
		});
	}

	/**
	 * Une el cliente a una sala de chat específica
	 * @param chatId ID del chat al que unirse
	 */
	public joinChatRoom(chatId: string): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede unir a sala:', chatId);
			return;
		}

		debugLog('📡 [WebSocketService] 🚪 Uniéndose a sala de chat:', chatId);

		const payload: JoinChatRoomPayload = { chatId };
		this.socket.emit('chat:join', payload);
		
		this.currentRooms.add(chatId);
	}

	/**
	 * Sale de una sala de chat específica
	 * @param chatId ID del chat del que salir
	 */
	public leaveChatRoom(chatId: string): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede salir de sala:', chatId);
			return;
		}

		debugLog('📡 [WebSocketService] 🚪 Saliendo de sala de chat:', chatId);

		const payload: LeaveChatRoomPayload = { chatId };
		this.socket.emit('chat:leave', payload);
		
		this.currentRooms.delete(chatId);
	}

	/**
	 * Emite un typing indicator
	 * @param chatId ID del chat
	 * @param isTyping True si está escribiendo, false si dejó de escribir
	 * @deprecated Usar emitTypingStart() y emitTypingStop() en su lugar
	 */
	public emitTyping(chatId: string, isTyping: boolean): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing');
			return;
		}

		const payload: TypingPayload = { chatId, isTyping };
		this.socket.emit('user:typing', payload);
	}

	/**
	 * Emite evento typing:start (visitante comenzó a escribir)
	 * @param chatId ID del chat
	 * @param userId ID del usuario (visitante)
	 * @param userType Tipo de usuario (siempre 'visitor' en el SDK)
	 */
	public emitTypingStart(chatId: string, userId: string, userType: 'visitor' | 'commercial' = 'visitor'): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing:start');
			return;
		}

		const payload = { chatId, userId, userType };
		debugLog('📡 [WebSocketService] ✍️ Emitiendo typing:start:', payload);
		this.socket.emit('typing:start', payload);
	}

	/**
	 * Emite evento typing:stop (visitante dejó de escribir)
	 * @param chatId ID del chat
	 * @param userId ID del usuario (visitante)
	 * @param userType Tipo de usuario (siempre 'visitor' en el SDK)
	 */
	public emitTypingStop(chatId: string, userId: string, userType: 'visitor' | 'commercial' = 'visitor'): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing:stop');
			return;
		}

		const payload = { chatId, userId, userType };
		debugLog('📡 [WebSocketService] ✍️ Emitiendo typing:stop:', payload);
		this.socket.emit('typing:stop', payload);
	}

	/**
	 * Une el cliente a su sala de visitante para recibir notificaciones proactivas
	 * @param visitorId ID del visitante
	 */
	public joinVisitorRoom(visitorId: string): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede unir a sala de visitante:', visitorId);
			return;
		}

		debugLog('📡 [WebSocketService] 🚪 Uniéndose a sala de visitante:', visitorId);

		const payload: JoinVisitorRoomPayload = { visitorId };
		this.socket.emit('visitor:join', payload, (response: any) => {
			if (response?.success) {
				debugLog('📡 [WebSocketService] ✅ Unido a sala de visitante:', response.roomName);
				this.currentVisitorId = visitorId;
			} else {
				debugError('📡 [WebSocketService] ❌ Error al unirse a sala de visitante:', response?.message);
			}
		});
	}

	/**
	 * Sale de la sala de visitante
	 * @param visitorId ID del visitante
	 */
	public leaveVisitorRoom(visitorId: string): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede salir de sala de visitante:', visitorId);
			return;
		}

		debugLog('📡 [WebSocketService] 🚪 Saliendo de sala de visitante:', visitorId);

		const payload: LeaveVisitorRoomPayload = { visitorId };
		this.socket.emit('visitor:leave', payload, (response: any) => {
			if (response?.success) {
				debugLog('📡 [WebSocketService] ✅ Saliste de sala de visitante');
				this.currentVisitorId = null;
			}
		});
	}

	/**
	 * Une el cliente al tenant room para recibir eventos de disponibilidad de comerciales
	 * @param tenantId UUID del tenant (companyId de la empresa)
	 */
	public joinTenantRoom(tenantId: string): void {
		if (!this.socket || !this.socket.connected) {
			debugWarn('📡 [WebSocketService] ⚠️ No conectado, no se puede unir al tenant room:', tenantId);
			// Guardar el tenantId para re-unirse tras reconexión
			this.currentTenantId = tenantId;
			return;
		}

		debugLog('📡 [WebSocketService] 🏢 Uniéndose al tenant room:', tenantId);
		this.currentTenantId = tenantId;
		this.socket.emit('tenant:join', { tenantId });
	}

	/**
	 * Inicia reconexión manual con backoff exponencial
	 * Se usa cuando Socket.IO agota sus intentos de reconexión automática
	 */
	private startManualReconnection(): void {
		if (!this.socket || !this.config) {
			debugError('📡 [WebSocketService] ⚠️ No hay socket o config para reconexión manual');
			return;
		}

		this.manualReconnectAttempt++;

		// Backoff exponencial: 1s, 2s, 4s, 8s, 16s, max 30s
		const baseDelay = 1000;
		const maxDelay = 30000;
		const delay = Math.min(baseDelay * Math.pow(2, this.manualReconnectAttempt - 1), maxDelay);

		// Añadir jitter (±20%) para evitar thundering herd
		const jitter = delay * 0.2 * (Math.random() * 2 - 1);
		const finalDelay = Math.round(delay + jitter);

		debugLog(`📡 [WebSocketService] 🔄 Reconexión manual #${this.manualReconnectAttempt} en ${finalDelay}ms`);

		this.manualReconnectTimeout = setTimeout(() => {
			if (this.socket && !this.socket.connected) {
				debugLog('📡 [WebSocketService] 🔄 Intentando reconexión manual...');
				this.socket.connect();

				// Si después de 10s no se conectó, reintentar
				setTimeout(() => {
					if (this.socket && !this.socket.connected) {
						this.startManualReconnection();
					} else {
						// Éxito - resetear contador
						this.manualReconnectAttempt = 0;
					}
				}, 10000);
			}
		}, finalDelay);
	}

	/**
	 * Cancela la reconexión manual pendiente
	 */
	private cancelManualReconnection(): void {
		if (this.manualReconnectTimeout) {
			clearTimeout(this.manualReconnectTimeout);
			this.manualReconnectTimeout = null;
		}
		this.manualReconnectAttempt = 0;
	}

	/**
	 * Desconecta el WebSocket
	 */
	public disconnect(): void {
		if (this.socket) {
			debugLog('📡 [WebSocketService] 🔌 Desconectando...');

			// Cancelar reconexión manual pendiente
			this.cancelManualReconnection();

			// Limpiar listeners de actividad
			this.cleanupActivityListeners();

			// Salir de sala de visitante si estaba conectado
			if (this.currentVisitorId) {
				this.leaveVisitorRoom(this.currentVisitorId);
			}

			// Salir de todas las salas de chat antes de desconectar
			this.currentRooms.forEach(chatId => {
				this.leaveChatRoom(chatId);
			});

			this.socket.disconnect();
			this.socket = null;
			this.state = WebSocketState.DISCONNECTED;
			this.currentRooms.clear();
			this.currentVisitorId = null;
		}
	}

	/**
	 * Obtiene el estado actual de la conexión
	 */
	public getState(): WebSocketState {
		return this.state;
	}

	/**
	 * Verifica si el WebSocket está conectado
	 */
	public isConnected(): boolean {
		return this.socket?.connected || false;
	}

	/**
	 * Obtiene el ID del socket actual
	 */
	public getSocketId(): string | undefined {
		return this.socket?.id;
	}

	/**
	 * Obtiene las salas activas actuales
	 */
	public getCurrentRooms(): string[] {
		return Array.from(this.currentRooms);
	}

	/**
	 * Actualiza los callbacks
	 * @param callbacks Nuevos callbacks a registrar
	 */
	public updateCallbacks(callbacks: Partial<WebSocketCallbacks>): void {
		debugLog('📡 [WebSocketService] 🔧 updateCallbacks() llamado con:', {
			hasOnConnect: !!callbacks.onConnect,
			hasOnPresenceChanged: !!callbacks.onPresenceChanged,
			hasOnPresenceJoined: !!callbacks.onPresenceJoined,
			existingOnPresenceChanged: !!this.callbacks.onPresenceChanged,
			existingOnPresenceJoined: !!this.callbacks.onPresenceJoined
		});

		// Store old callbacks in closures to avoid recursion
		const oldOnConnect = this.callbacks.onConnect;
		const oldOnDisconnect = this.callbacks.onDisconnect;
		const oldOnError = this.callbacks.onError;
		const oldOnMessage = this.callbacks.onMessage;
		const oldOnChatStatus = this.callbacks.onChatStatus;
		const oldOnTyping = this.callbacks.onTyping;
		const oldOnChatCreated = this.callbacks.onChatCreated;
		const oldOnTypingStart = this.callbacks.onTypingStart;
		const oldOnTypingStop = this.callbacks.onTypingStop;
		const oldOnPresenceChanged = this.callbacks.onPresenceChanged;
		const oldOnPresenceJoined = this.callbacks.onPresenceJoined;

		// Merge callbacks properly - if both old and new have the same callback, chain them
		const mergedCallbacks: WebSocketCallbacks = {};

		// Merge onConnect callbacks
		if (oldOnConnect || callbacks.onConnect) {
			mergedCallbacks.onConnect = () => {
				if (oldOnConnect) oldOnConnect();
				if (callbacks.onConnect) callbacks.onConnect();
			};
		}

		// Merge onDisconnect callbacks
		if (oldOnDisconnect || callbacks.onDisconnect) {
			mergedCallbacks.onDisconnect = (reason: string) => {
				if (oldOnDisconnect) oldOnDisconnect(reason);
				if (callbacks.onDisconnect) callbacks.onDisconnect(reason);
			};
		}

		// Merge onError callbacks
		if (oldOnError || callbacks.onError) {
			mergedCallbacks.onError = (error: Error) => {
				if (oldOnError) oldOnError(error);
				if (callbacks.onError) callbacks.onError(error);
			};
		}

		// Merge onMessage callbacks
		if (oldOnMessage || callbacks.onMessage) {
			mergedCallbacks.onMessage = (message) => {
				if (oldOnMessage) oldOnMessage(message);
				if (callbacks.onMessage) callbacks.onMessage(message);
			};
		}

		// Merge onChatStatus callbacks
		if (oldOnChatStatus || callbacks.onChatStatus) {
			mergedCallbacks.onChatStatus = (status) => {
				if (oldOnChatStatus) oldOnChatStatus(status);
				if (callbacks.onChatStatus) callbacks.onChatStatus(status);
			};
		}

		// Merge onTyping callbacks
		if (oldOnTyping || callbacks.onTyping) {
			mergedCallbacks.onTyping = (typing) => {
				if (oldOnTyping) oldOnTyping(typing);
				if (callbacks.onTyping) callbacks.onTyping(typing);
			};
		}

		// Merge onChatCreated callbacks
		if (oldOnChatCreated || callbacks.onChatCreated) {
			mergedCallbacks.onChatCreated = (event) => {
				if (oldOnChatCreated) oldOnChatCreated(event);
				if (callbacks.onChatCreated) callbacks.onChatCreated(event);
			};
		}

		// Merge onCommercialAssigned callbacks
		const oldOnCommercialAssigned = this.callbacks.onCommercialAssigned;
		if (oldOnCommercialAssigned || callbacks.onCommercialAssigned) {
			mergedCallbacks.onCommercialAssigned = (event) => {
				if (oldOnCommercialAssigned) oldOnCommercialAssigned(event);
				if (callbacks.onCommercialAssigned) callbacks.onCommercialAssigned(event);
			};
		}

		// Merge onTypingStart callbacks (presencia V2)
		if (oldOnTypingStart || callbacks.onTypingStart) {
			mergedCallbacks.onTypingStart = (event) => {
				if (oldOnTypingStart) oldOnTypingStart(event);
				if (callbacks.onTypingStart) callbacks.onTypingStart(event);
			};
		}

		// Merge onTypingStop callbacks (presencia V2)
		if (oldOnTypingStop || callbacks.onTypingStop) {
			mergedCallbacks.onTypingStop = (event) => {
				if (oldOnTypingStop) oldOnTypingStop(event);
				if (callbacks.onTypingStop) callbacks.onTypingStop(event);
			};
		}

		// Merge onPresenceChanged callbacks (presencia V2)
		if (oldOnPresenceChanged || callbacks.onPresenceChanged) {
			mergedCallbacks.onPresenceChanged = (event) => {
				if (oldOnPresenceChanged) oldOnPresenceChanged(event);
				if (callbacks.onPresenceChanged) callbacks.onPresenceChanged(event);
			};
		}

		// Merge onPresenceJoined callbacks (auto-join a sala personal)
		if (oldOnPresenceJoined || callbacks.onPresenceJoined) {
			mergedCallbacks.onPresenceJoined = (event) => {
				if (oldOnPresenceJoined) oldOnPresenceJoined(event);
				if (callbacks.onPresenceJoined) callbacks.onPresenceJoined(event);
			};
		}

		// 🤖 Merge onAITypingStart callbacks
		const oldOnAITypingStart = this.callbacks.onAITypingStart;
		if (oldOnAITypingStart || callbacks.onAITypingStart) {
			mergedCallbacks.onAITypingStart = (data) => {
				if (oldOnAITypingStart) oldOnAITypingStart(data);
				if (callbacks.onAITypingStart) callbacks.onAITypingStart(data);
			};
		}

		// 🤖 Merge onAITypingStop callbacks
		const oldOnAITypingStop = this.callbacks.onAITypingStop;
		if (oldOnAITypingStop || callbacks.onAITypingStop) {
			mergedCallbacks.onAITypingStop = (data) => {
				if (oldOnAITypingStop) oldOnAITypingStop(data);
				if (callbacks.onAITypingStop) callbacks.onAITypingStop(data);
			};
		}

		// 📡 Merge onCommercialAvailabilityChanged callbacks
		const oldOnCommercialAvailabilityChanged = this.callbacks.onCommercialAvailabilityChanged;
		if (oldOnCommercialAvailabilityChanged || callbacks.onCommercialAvailabilityChanged) {
			mergedCallbacks.onCommercialAvailabilityChanged = (event) => {
				if (oldOnCommercialAvailabilityChanged) oldOnCommercialAvailabilityChanged(event);
				if (callbacks.onCommercialAvailabilityChanged) callbacks.onCommercialAvailabilityChanged(event);
			};
		}

		this.callbacks = mergedCallbacks;
		debugLog('📡 [WebSocketService] 🔄 Callbacks actualizados y fusionados');
	}
}
