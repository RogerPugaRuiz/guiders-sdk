// src/types/index.ts

export interface PixelEvent<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp: number;
	token?: string;
	metadata?: Record<string, unknown>;
}

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
