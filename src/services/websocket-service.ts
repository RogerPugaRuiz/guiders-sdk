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
	ChatCreatedEvent
} from '../types/websocket-types';
import { EndpointManager } from '../core/tracking-pixel-SDK';
import { debugLog } from '../utils/debug-logger';

export class WebSocketService {
	private static instance: WebSocketService;
	private socket: Socket | null = null;
	private state: WebSocketState = WebSocketState.DISCONNECTED;
	private config: WebSocketConfig | null = null;
	private callbacks: WebSocketCallbacks = {};
	private currentRooms: Set<string> = new Set();
	private currentVisitorId: string | null = null;

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
			reconnectionAttempts: config.reconnectionAttempts || 5,
			reconnectionDelay: config.reconnectionDelay || 1000,
			authToken: config.authToken,
			sessionId: config.sessionId
		};

		this.callbacks = callbacks;

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

		// Añadir autenticación si está disponible
		if (this.config.authToken) {
			socketOptions.auth = {
				token: this.config.authToken
			};
		}

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
			console.error('📡 [WebSocketService] ❌❌❌ ERROR DE CONEXIÓN ❌❌❌');
			console.error('📡 [WebSocketService] 🌐 URL intentada:', this.config?.url);
			console.error('📡 [WebSocketService] 📍 Path:', this.config?.path);
			console.error('📡 [WebSocketService] 🚨 Mensaje de error:', error.message);
			console.error('📡 [WebSocketService] 📊 Error completo:', error);
			console.error('📡 [WebSocketService] 🔍 Stack trace:', error.stack);

			if (this.callbacks.onError) {
				this.callbacks.onError(error);
			}
		});

		this.socket.on('error', (error: any) => {
			console.error('📡 [WebSocketService] ❌ ERROR GENÉRICO del socket:', error);
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
			debugLog('📡 [WebSocketService] 🟢 presence:changed recibido:', {
				userId: event.userId,
				userType: event.userType,
				status: event.status,
				previousStatus: event.previousStatus
			});

			if (this.callbacks.onPresenceChanged) {
				this.callbacks.onPresenceChanged(event);
			}
		});

		// Confirmaciones de sala de visitante
		this.socket.on('visitor:joined', (data: any) => {
			debugLog('📡 [WebSocketService] ✅ Confirmación de unión a sala de visitante:', data);
		});

		this.socket.on('visitor:left', (data: any) => {
			debugLog('📡 [WebSocketService] ✅ Confirmación de salida de sala de visitante:', data);
		});
	}

	/**
	 * Une el cliente a una sala de chat específica
	 * @param chatId ID del chat al que unirse
	 */
	public joinChatRoom(chatId: string): void {
		if (!this.socket || !this.socket.connected) {
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede unir a sala:', chatId);
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
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede salir de sala:', chatId);
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
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing');
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
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing:start');
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
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede emitir typing:stop');
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
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede unir a sala de visitante:', visitorId);
			return;
		}

		debugLog('📡 [WebSocketService] 🚪 Uniéndose a sala de visitante:', visitorId);

		const payload: JoinVisitorRoomPayload = { visitorId };
		this.socket.emit('visitor:join', payload, (response: any) => {
			if (response?.success) {
				debugLog('📡 [WebSocketService] ✅ Unido a sala de visitante:', response.roomName);
				this.currentVisitorId = visitorId;
			} else {
				console.error('📡 [WebSocketService] ❌ Error al unirse a sala de visitante:', response?.message);
			}
		});
	}

	/**
	 * Sale de la sala de visitante
	 * @param visitorId ID del visitante
	 */
	public leaveVisitorRoom(visitorId: string): void {
		if (!this.socket || !this.socket.connected) {
			console.warn('📡 [WebSocketService] ⚠️ No conectado, no se puede salir de sala de visitante:', visitorId);
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
	 * Desconecta el WebSocket
	 */
	public disconnect(): void {
		if (this.socket) {
			debugLog('📡 [WebSocketService] 🔌 Desconectando...');

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

		this.callbacks = mergedCallbacks;
		debugLog('📡 [WebSocketService] 🔄 Callbacks actualizados y fusionados');
	}
}
