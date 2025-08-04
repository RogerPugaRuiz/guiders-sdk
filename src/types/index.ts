// src/types/index.ts
export { ConfidenceLevel } from './confidence';

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
	tags?: Record<string, any>;
	customFields?: Record<string, any>;
}

export interface ChatV2 {
	id: string;
	status: 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ABANDONED';
	priority: 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'URGENT';
	visitorInfo: VisitorInfoV2;
	assignedCommercialId?: string;
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
