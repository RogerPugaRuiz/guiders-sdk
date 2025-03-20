// src/types/index.ts

export interface TrackingEvent {
	type: string;
	data: Record<string, any>;
	timestamp: number;
	token?: string;
}

