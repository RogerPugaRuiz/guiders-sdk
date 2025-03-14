export interface WebSocketPort {
	connectSocket(): Promise<void>;
	readonly isConnected: boolean;
	onConnect(callback: () => void): void;
	onDisconnect(callback: () => void): void;
}