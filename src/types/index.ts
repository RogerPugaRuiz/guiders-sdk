// src/types/index.ts

export interface TrackingEvent<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp: number;
}

export const WebSocketMessageTypes = {
	CONNECT: "CONNECT",
	DISCONNECT: "DISCONNECT",
	MESSAGE: "MESSAGE"
} as const;

export interface WebSocketMessage<T = Record<string, unknown>> {
	type: WebSocketMessage
	data: T;
	timestamp: number;
}

