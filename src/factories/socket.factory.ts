import { WebSocketAdapter } from "../core/websocket-manager";
import { WebSocketPort } from "../interfaces/websocket.interface";
import { TokenFactory } from "./token.factory";

export class SocketFactory {
	private static readonly  instances: Map<string, WebSocketPort> = new Map();

	public static getInstance(endpoint: string, options: {
		autoReconnect: boolean,
		inactivityThreshold: number
	}): WebSocketPort {
		if (!this.instances.has(endpoint)) {
			const tokenService = TokenFactory.getInstance('http://localhost:3000/pixel');
			this.instances.set(endpoint, new WebSocketAdapter(endpoint, options, { tokenService }));
		}

		return this.instances.get(endpoint)!;
	}

	public static removeInstance(endpoint: string): void {
		this.instances.delete(endpoint);
	}

	public static removeAllInstances(): void {
		this.instances.clear();
	}

	public static getInstances(): Map<string, WebSocketPort> {
		return this.instances;
	}
}