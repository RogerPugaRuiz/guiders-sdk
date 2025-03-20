import { FingerprintAdapter } from "../core/fingerprint-manager";
import { WebSocketAdapter } from "../core/websocket-manager";
import { WebSocketPort } from "../interfaces/websocket.interface";
import { TokenFactory } from "./token.factory";

export class SocketFactory {
	private static readonly  instances: Map<string, WebSocketPort> = new Map();
	private static readonly aliasMap: Map<string, string> = new Map();
	public static getInstance(endpoint: string, options: {
		autoReconnect: boolean,
		inactivityThreshold: number,
		alias?: string
	}): WebSocketPort {
		if (!this.instances.has(endpoint)) {
			const tokenService = TokenFactory.getInstance('http://localhost:3000/pixel');
			const fingerprintService = FingerprintAdapter.getInstance();
			this.instances.set(endpoint, new WebSocketAdapter(endpoint, options, { tokenService, fingerprintService }));
			this.aliasMap.set(options.alias || endpoint, endpoint);
		}

		return this.instances.get(endpoint)!;
	}

	public static getInstanceByAlias(alias: string): WebSocketPort | undefined {
		const endpoint = this.aliasMap.get(alias);
		if (endpoint) {
			return this.instances.get(endpoint);
		}
	}

	public static removeInstanceByAlias(alias: string): void {
		const endpoint = this.aliasMap.get(alias);
		if (endpoint) {
			this.instances.delete(endpoint);
			this.aliasMap.delete(alias);
		}
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

	public static getFirstInstance(): WebSocketPort | undefined {
		return this.instances.values().next().value;
	}
}