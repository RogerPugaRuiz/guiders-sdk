// src/types/index.ts
export { ConfidenceLevel } from './confidence';

// Signals
export type { SignalState, SignalSubscriber } from '../core/signal';
export { Signal, AsyncSignal } from '../core/signal';
export type { IdentityWithChatsData } from '../core/identity-signal';
export { IdentitySignal, useIdentitySignal } from '../core/identity-signal';

// Welcome Messages
export type { WelcomeMessageConfig } from '../core/welcome-message-manager';
export { WelcomeMessageManager, BUSINESS_WELCOME_TEMPLATES } from '../core/welcome-message-manager';

// Active Hours (utilities)
export { ActiveHoursValidator, createActiveHoursConfig, COMMON_ACTIVE_HOURS } from '../core/active-hours-validator';

// WebSocket y Tiempo Real
export * from './websocket-types';

export interface PixelEvent<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp: number;
	token?: string;
	metadata?: Record<string, unknown>;
}

export interface WebSocketSuccessResponse<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp: number;
	message: string;
}
export interface WebSocketErrorResponse {
	error: string;
	timestamp: number;
}

export type WebSocketResponse<T = Record<string, unknown>> = WebSocketSuccessResponse<T> | WebSocketErrorResponse;

export interface Message {
	id: string;
	chatId: string;
	senderId: string;
	content: string;
	createdAt: number;
}

// Tipos específicos para el sistema de mensajes con scroll infinito
export interface MessageV2 {
	id: string;
	chatId: string;
	senderId: string;
	content: string;
	type: string;
	isInternal: boolean;
	isFirstResponse: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface MessageListResponse {
	messages: MessageV2[];
	total: number;
	hasMore: boolean;
	cursor?: string;
	nextCursor?: string; // Compatibilidad con backend que devuelve nextCursor
}

export interface ChatMessageReceived {
	type: "chat_message";
	message: string;
	data: {
		message: string;
		sender: string;
		timestamp: number;
	};
	metadata?: Record<string, unknown>;
	token?: string;
	timestamp: number;
}

export interface ErrorReceived {
	error: string;
	timestamp: number;
}

export enum TrackingType {
	PAGE_VIEW = "page_view",
	CLICK = "click",
	HOVER = "hover",
}

// Tipos para la API V2 del chat
export interface VisitorInfoV2 {
	id: string;
	name: string;
	email: string;
	phone?: string;
	location?: string;
	additionalData?: Record<string, any>;
}

export interface ChatMetadataV2 {
	department: string;
	source: string;
	initialUrl?: string;
	userAgent?: string;
	referrer?: string;
	// tags ahora puede ser un array simple de strings (caso API v2) o un objeto (legacy/custom)
	tags?: string[] | Record<string, any>;
	notes?: string;
	customFields?: Record<string, any>;
}

export interface AssignedCommercial {
	id: string;
	name: string;
}

export interface ChatV2 {
	id: string;
	status: 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ABANDONED';
	priority: 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'URGENT';
	visitorInfo: VisitorInfoV2;
	assignedCommercialId?: string;
	assignedCommercial?: AssignedCommercial;
	availableCommercialIds?: string[];
	metadata: ChatMetadataV2;
	createdAt: Date;
	assignedAt?: Date;
	closedAt?: Date;
	lastMessageDate?: Date;
	totalMessages: number;
	unreadMessagesCount: number;
	isActive: boolean;
	visitorId: string;
	department: string;
	tags?: string[];
	updatedAt?: Date;
	averageResponseTimeMinutes?: number;
	chatDurationMinutes?: number;
	resolutionStatus?: 'resolved' | 'unresolved' | 'escalated';
	satisfactionRating?: number;
}

export interface ChatListV2 {
	chats: ChatV2[];
	total: number;
	hasMore: boolean;
	nextCursor?: string | null;
}

// --- WebSocket Protocolo v1 (envelope unificado) ---
export interface WSBaseEnvelope<T = any> {
	v: 1;               // versión de protocolo (fijo 1 por ahora)
	t: string;          // tipo (hello, ack, presence.update, nav.changed, track.batch, ping, pong, control.flow, error, ...)
	id?: string;        // id único del mensaje (uuid / secuencia simple). Requerido para mensajes que esperan ack.
	ts?: string | number; // timestamp cliente (ISO string o epoch ms). Servidor puede normalizar.
	sid?: string;       // session/tab id
	vid?: string;       // visitor id
	data?: T;           // payload específico por tipo
}

// Mensajes específicos (opcionales para ergonomía)
export interface WSHello extends WSBaseEnvelope<{ pubKey: string; resumeFromSeq?: number }> { t: 'hello'; }
export interface WSAck extends WSBaseEnvelope<undefined> { t: 'ack'; id: string; }
export interface WSPresenceUpdate extends WSBaseEnvelope<{ currentPage?: string; title?: string; typing?: boolean }> { t: 'presence.update'; }
export interface WSNavChanged extends WSBaseEnvelope<{ url: string; title?: string }> { t: 'nav.changed'; }
export interface WSTrackBatchEventItem { event_id: string; name: string; occurred_at: string; props?: Record<string, any>; }
export interface WSTrackBatch extends WSBaseEnvelope<{ events: WSTrackBatchEventItem[] }> { t: 'track.batch'; }
export interface WSPing extends WSBaseEnvelope<undefined> { t: 'ping'; }
export interface WSPong extends WSBaseEnvelope<undefined> { t: 'pong'; }
export interface WSControlFlow extends WSBaseEnvelope<{ mode: 'degrade' | 'normal'; useHttpFor?: string | string[]; retryInMs?: number }> { t: 'control.flow'; }
export interface WSError extends WSBaseEnvelope<{ code: string; ref?: string }> { t: 'error'; }

export type WSInboundMessage = WSAck | WSPong | WSControlFlow | WSError | (WSBaseEnvelope<any> & { t: string });
export type WSOutboundMessage = WSHello | WSPresenceUpdate | WSNavChanged | WSTrackBatch | WSPing | (WSBaseEnvelope<any> & { t: string });

// --- Configuración de horarios de activación del chat ---
export interface TimeRange {
	start: string;  // Formato "HH:MM" (ej: "08:00")
	end: string;    // Formato "HH:MM" (ej: "14:00")
}

export interface ActiveHoursConfig {
	enabled: boolean;           // Si está habilitada la validación de horarios
	timezone?: string | 'auto'; // Zona horaria (ej: "America/Mexico_City", "auto" para detección automática)
	ranges: TimeRange[];        // Rangos de horarios activos
	fallbackMessage?: string;   // Mensaje a mostrar cuando el chat no está activo
}

// --- Configuración de posicionamiento del chat ---
export type ChatPositionPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ChatPositionCoordinates {
	// Posición del botón toggle
	bottom?: string;  // Ej: "20px", "5%"
	right?: string;   // Ej: "20px", "5%"
	top?: string;     // Ej: "20px", "5%"
	left?: string;    // Ej: "20px", "5%"

	// Posición del widget (opcional, se auto-calcula si no se especifica)
	widgetBottom?: string;
	widgetRight?: string;
	widgetTop?: string;
	widgetLeft?: string;
}

export type ChatPositionConfig = ChatPositionPreset | ChatPositionCoordinates;
