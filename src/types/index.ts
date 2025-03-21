// src/types/index.ts

export interface TrackingEvent<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp?: number;
	token?: string;
}


export interface WebSocketMessage<T = Record<string, unknown>> {
	type: string;
	data: T;
	timestamp: number;
}

