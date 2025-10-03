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
	TypingPayload
} from '../types/websocket-types';
import { EndpointManager } from '../core/tracking-pixel-SDK';

export class WebSocketService {
	private static instance: WebSocketService;
	private socket: Socket | null = null;
	private state: WebSocketState = WebSocketState.DISCONNECTED;
	private config: WebSocketConfig | null = null;
	private callbacks: WebSocketCallbacks = {};
	private currentRooms: Set<string> = new Set();

	private constructor() {
		console.log('📡 [WebSocketService] Instancia creada');
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
			console.log('📡 [WebSocketService] ⚠️ Ya hay una conexión activa');
			return;
		}

		// Resolver endpoints usando EndpointManager
		const endpoints = EndpointManager.getInstance();
		const wsEndpoint = endpoints.getWebSocketEndpoint();

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

		console.log('📡 [WebSocketService] 🚀 Conectando a:', {
			url: this.config.url,
			path: this.config.path,
			hasToken: !!this.config.authToken,
			hasSessionId: !!this.config.sessionId
		});

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
			console.log('📡 [WebSocketService] ✅ Conectado con ID:', this.socket?.id);

			// Re-unirse a salas activas después de reconectar
			if (this.currentRooms.size > 0) {
				console.log('📡 [WebSocketService] 🔄 Re-uniéndose a salas activas:', Array.from(this.currentRooms));
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
			console.log('📡 [WebSocketService] ⚠️ Desconectado. Razón:', reason);

			if (this.callbacks.onDisconnect) {
				this.callbacks.onDisconnect(reason);
			}
		});

		this.socket.on('connect_error', (error: Error) => {
			this.state = WebSocketState.ERROR;
			console.error('📡 [WebSocketService] ❌ Error de conexión:', error.message);

			if (this.callbacks.onError) {
				this.callbacks.onError(error);
			}
		});

		this.socket.io.on('reconnect_attempt', () => {
			this.state = WebSocketState.RECONNECTING;
			console.log('📡 [WebSocketService] 🔄 Intentando reconectar...');
		});

		this.socket.io.on('reconnect', (attemptNumber: number) => {
			this.state = WebSocketState.CONNECTED;
			console.log('📡 [WebSocketService] ✅ Reconectado después de', attemptNumber, 'intentos');
		});

		// Eventos del chat
		this.socket.on('message:new', (message: RealtimeMessage) => {
			console.log('📡 [WebSocketService] 📨 Nuevo mensaje recibido:', {
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
			console.log('📡 [WebSocketService] 📊 Estado del chat actualizado:', statusUpdate);

			if (this.callbacks.onChatStatus) {
				this.callbacks.onChatStatus(statusUpdate);
			}
		});

		this.socket.on('user:typing', (typing: TypingIndicator) => {
			console.log('📡 [WebSocketService] ✍️ Typing indicator:', typing);

			if (this.callbacks.onTyping) {
				this.callbacks.onTyping(typing);
			}
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

		console.log('📡 [WebSocketService] 🚪 Uniéndose a sala de chat:', chatId);

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

		console.log('📡 [WebSocketService] 🚪 Saliendo de sala de chat:', chatId);

		const payload: LeaveChatRoomPayload = { chatId };
		this.socket.emit('chat:leave', payload);
		
		this.currentRooms.delete(chatId);
	}

	/**
	 * Emite un typing indicator
	 * @param chatId ID del chat
	 * @param isTyping True si está escribiendo, false si dejó de escribir
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
	 * Desconecta el WebSocket
	 */
	public disconnect(): void {
		if (this.socket) {
			console.log('📡 [WebSocketService] 🔌 Desconectando...');
			
			// Salir de todas las salas antes de desconectar
			this.currentRooms.forEach(chatId => {
				this.leaveChatRoom(chatId);
			});
			
			this.socket.disconnect();
			this.socket = null;
			this.state = WebSocketState.DISCONNECTED;
			this.currentRooms.clear();
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
		this.callbacks = {
			...this.callbacks,
			...callbacks
		};
		console.log('📡 [WebSocketService] 🔄 Callbacks actualizados');
	}
}
