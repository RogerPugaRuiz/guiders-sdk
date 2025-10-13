/**
 * Tipos para el sistema de WebSocket bidireccional en tiempo real
 * Basado en la documentación del backend: websocket-real-time-chat.md
 */

/**
 * Tipos de mensajes soportados
 */
export type MessageType = 'text' | 'image' | 'file' | 'system';

/**
 * Estados posibles del chat
 */
export type ChatStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Estructura de un mensaje recibido via WebSocket (evento message:new)
 */
export interface RealtimeMessage {
	messageId: string;        // UUID del mensaje
	chatId: string;           // UUID del chat
	content: string;          // Contenido del mensaje
	type: MessageType;        // Tipo de mensaje
	senderId: string;         // UUID del emisor
	senderName: string;       // Nombre del emisor
	sentAt: string;           // ISO 8601 timestamp
	isInternal?: boolean;     // Solo para comerciales
	attachment?: {
		url: string;
		fileName: string;
		fileSize: number;
		mimeType: string;
	};
}

/**
 * Estructura de cambio de estado del chat (evento chat:status)
 */
export interface ChatStatusUpdate {
	chatId: string;
	status: ChatStatus;
	timestamp: string;        // ISO 8601
}

/**
 * Evento de typing indicator (cuando alguien está escribiendo)
 */
export interface TypingIndicator {
	chatId: string;
	userId: string;
	userName: string;
	isTyping: boolean;
}

/**
 * Configuración del servicio WebSocket
 */
export interface WebSocketConfig {
	/** URL del servidor WebSocket */
	url: string;
	/** Path del socket (default: /socket.io/) */
	path?: string;
	/** Token JWT para autenticación (comerciales) */
	authToken?: string;
	/** Cookie de sesión (visitantes) */
	sessionId?: string;
	/** Transports a usar */
	transports?: ('websocket' | 'polling')[];
	/** Enviar credenciales (cookies) */
	withCredentials?: boolean;
	/** Reconexión automática */
	reconnection?: boolean;
	/** Intentos de reconexión */
	reconnectionAttempts?: number;
	/** Delay entre reintentos (ms) */
	reconnectionDelay?: number;
}

/**
 * Estados de conexión del WebSocket
 */
export enum WebSocketState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	RECONNECTING = 'reconnecting',
	ERROR = 'error'
}

/**
 * Callbacks para eventos de WebSocket
 */
export interface WebSocketCallbacks {
	/** Callback cuando se conecta */
	onConnect?: () => void;
	/** Callback cuando se desconecta */
	onDisconnect?: (reason: string) => void;
	/** Callback cuando hay error */
	onError?: (error: Error) => void;
	/** Callback cuando llega un mensaje nuevo */
	onMessage?: (message: RealtimeMessage) => void;
	/** Callback cuando cambia el estado del chat */
	onChatStatus?: (status: ChatStatusUpdate) => void;
	/** Callback cuando alguien está escribiendo */
	onTyping?: (typing: TypingIndicator) => void;
	/** Callback cuando un comercial crea un chat proactivamente */
	onChatCreated?: (event: ChatCreatedEvent) => void;
}

/**
 * Payload para unirse a una sala de chat
 */
export interface JoinChatRoomPayload {
	chatId: string;
}

/**
 * Payload para salir de una sala de chat
 */
export interface LeaveChatRoomPayload {
	chatId: string;
}

/**
 * Payload para emitir typing indicator
 */
export interface TypingPayload {
	chatId: string;
	isTyping: boolean;
}

/**
 * Payload para unirse a sala de visitante
 */
export interface JoinVisitorRoomPayload {
	visitorId: string;
}

/**
 * Payload para salir de sala de visitante
 */
export interface LeaveVisitorRoomPayload {
	visitorId: string;
}

/**
 * Respuesta del servidor al unirse a sala de visitante
 */
export interface VisitorRoomJoinedResponse {
	visitorId: string;
	roomName: string;
	timestamp: string;
}

/**
 * Prioridades del chat
 */
export type ChatPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Evento cuando un comercial crea un chat proactivamente
 */
export interface ChatCreatedEvent {
	chatId: string;
	visitorId: string;
	status: ChatStatus;
	priority: ChatPriority;
	visitorInfo?: {
		name?: string;
		email?: string;
		phone?: string;
	};
	metadata?: Record<string, any>;
	createdAt: string;
	message: string;
}
