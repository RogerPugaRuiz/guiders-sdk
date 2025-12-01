// src/types/index.ts
export { ConfidenceLevel } from './confidence';

// Signals
export type { SignalState, SignalSubscriber } from '../core/signal';
export { Signal, AsyncSignal } from '../core/signal';
export type { IdentityWithChatsData } from '../core/identity-signal';
export { IdentitySignal, useIdentitySignal } from '../core/identity-signal';

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
	avatarUrl?: string;
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

/**
 * Día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
 */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeRange {
	start: string;  // Formato "HH:MM" (ej: "08:00")
	end: string;    // Formato "HH:MM" (ej: "14:00")
}

export interface ActiveHoursConfig {
	enabled: boolean;           // Si está habilitada la validación de horarios
	timezone?: string | 'auto'; // Zona horaria (ej: "America/Mexico_City", "auto" para detección automática)
	ranges: TimeRange[];        // Rangos de horarios activos
	fallbackMessage?: string;   // Mensaje a mostrar cuando el chat no está activo

	// Configuración de días activos (opcional)
	activeDays?: WeekDay[];     // Días de la semana activos (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
	                            // Si no se especifica, todos los días están activos
	excludeWeekends?: boolean;  // Atajo para excluir sábado y domingo (equivalente a activeDays: [1,2,3,4,5])
	                            // Si activeDays está definido, excludeWeekends se ignora
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

// --- Configuración de detección de dispositivo móvil ---
export type MobileDetectionMode = 'auto' | 'size-only' | 'touch-only' | 'user-agent-only';

export interface MobileDetectionConfig {
	/** Modo de detección (default: 'auto') */
	mode?: MobileDetectionMode;
	/** Breakpoint en píxeles para detección por tamaño (default: 768) */
	breakpoint?: number;
	/** Habilitar logging de debug para diagnosticar detección (default: false) */
	debug?: boolean;
}

// --- Configuración de disponibilidad de comerciales ---
export interface CommercialAvailabilityConfig {
	/** Habilitar verificación de disponibilidad (default: false) */
	enabled?: boolean;
	/** Intervalo de polling en segundos (default: 30) */
	pollingInterval?: number;
	/** Mostrar contador de comerciales disponibles (default: false) */
	showBadge?: boolean;
	/** Mensaje cuando no hay comerciales disponibles */
	fallbackMessage?: string;
	/** Habilitar logging de debug (default: false) */
	debug?: boolean;
}

// --- Sistema de Tracking V2 ---

/**
 * Evento de tracking en el formato requerido por el backend /tracking-v2/events
 */
export interface TrackingEventDto {
	visitorId: string;     // UUID del visitante (generado por el SDK)
	sessionId: string;     // UUID de la sesión actual
	eventType: string;     // Tipo de evento (PAGE_VIEW, CLICK, etc.)
	metadata: Record<string, any>;  // Datos adicionales del evento
	occurredAt?: string;   // Timestamp ISO 8601 (opcional, usa fecha actual si se omite)
}

/**
 * Batch de eventos para enviar al backend
 */
export interface IngestTrackingEventsBatchDto {
	tenantId: string;      // UUID de tu empresa/tenant
	siteId: string;        // UUID del sitio web
	events: TrackingEventDto[];
}

/**
 * Respuesta del backend al ingestar eventos
 */
export interface IngestEventsResponseDto {
	success: boolean;         // true si la ingesta fue exitosa
	received: number;         // Cantidad de eventos recibidos
	processed: number;        // Cantidad de eventos procesados
	discarded: number;        // Cantidad descartada por throttling
	aggregated: number;       // Tamaño actual del buffer
	message: string;          // Mensaje descriptivo
	processingTimeMs: number; // Tiempo de procesamiento en ms
}

/**
 * Metadata del tenant (tenantId y siteId) obtenida desde el backend
 */
export interface TenantMetadataDto {
	tenantId: string;
	siteId: string;
}

/**
 * Configuración de throttling para tracking V2
 */
export interface TrackingV2ThrottlingConfig {
	/** Habilitar throttling (default: true) */
	enabled: boolean;
	/** Reglas de throttling: eventType → intervalo mínimo en ms */
	rules: Record<string, number>;
	/** Modo debug (default: false) */
	debug?: boolean;
}

/**
 * Configuración de agregación para tracking V2
 */
export interface TrackingV2AggregationConfig {
	/** Habilitar agregación (default: true) */
	enabled: boolean;
	/** Ventana de agregación en ms (default: 1000) */
	windowMs: number;
	/** Tamaño máximo del buffer antes de flush forzado (default: 1000) */
	maxBufferSize: number;
	/** Modo debug (default: false) */
	debug?: boolean;
}

/**
 * Configuración del sistema de tracking V2
 */
export interface TrackingV2Config {
	/** Habilitar tracking V2 (default: true) */
	enabled?: boolean;
	/** Tamaño máximo del batch (default: 500) */
	batchSize?: number;
	/** Intervalo de flush en ms (default: 5000) */
	flushInterval?: number;
	/** Tamaño máximo de la cola en memoria (default: 10000) */
	maxQueueSize?: number;
	/** Persistir cola en localStorage (default: true) */
	persistQueue?: boolean;
	/** Configuración de throttling (frontend) */
	throttling?: Partial<TrackingV2ThrottlingConfig>;
	/** Configuración de agregación (frontend) */
	aggregation?: Partial<TrackingV2AggregationConfig>;
}

// --- Configuración de IA para el chat ---

/**
 * Configuración del sistema de respuestas de IA
 *
 * Permite personalizar cómo se muestran los mensajes generados por IA
 * en el chat. El procesamiento de IA se realiza en el backend.
 */
export interface AIConfig {
	/** Habilitar soporte de IA (default: true) */
	enabled?: boolean;
	/** Mostrar badge "IA" en mensajes de IA (default: true) */
	showAIIndicator?: boolean;
	/** Emoji para avatar de IA (default: '🤖') */
	aiAvatarEmoji?: string;
	/** Nombre del remitente IA (default: 'Asistente IA') */
	aiSenderName?: string;
	/** Mostrar indicador "IA está escribiendo..." (default: true) */
	showTypingIndicator?: boolean;
	/** Mensaje de bienvenida de IA (opcional) */
	welcomeMessage?: string;
	/** IDs de remitentes que se consideran IA (adicionales a la detección automática) */
	aiSenderIds?: string[];
}
