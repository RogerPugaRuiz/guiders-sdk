export interface WebSocketPort {
    connectSocket(): Promise<void>;
    isConnected: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    onReconnect(callback: () => void): void;
    onDisconnect(callback: () => void): void;
    onError(callback: (error: any) => void): void;
    sendMsg(eventName: string, payload: any): void;
}