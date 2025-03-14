export interface WebSocketPort {
	connectSocket(): Promise<void>;
	readonly isConnected: boolean;
}