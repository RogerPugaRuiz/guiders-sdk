/**
 * EndpointManager - Gestión centralizada de endpoints de API
 *
 * Singleton que gestiona los endpoints de API REST y WebSocket.
 * Extraído de tracking-pixel-SDK.ts para reducir acoplamiento.
 */

import { resolveDefaultEndpoints } from './endpoint-resolver';

export class EndpointManager {
	private static instance: EndpointManager;
	private endpoint: string;
	private webSocketEndpoint: string;

	private constructor(endpoint: string, webSocketEndpoint: string) {
		this.endpoint = endpoint;
		this.webSocketEndpoint = webSocketEndpoint;
	}

	public static getInstance(endpoint?: string, webSocketEndpoint?: string): EndpointManager {
		if (!EndpointManager.instance) {
			const defaults = resolveDefaultEndpoints();
			EndpointManager.instance = new EndpointManager(
				endpoint || defaults.endpoint,
				webSocketEndpoint || defaults.webSocketEndpoint
			);
		} else if (endpoint || webSocketEndpoint) {
			// Permite actualizar endpoints explícitamente si se pasan ahora
			if (endpoint) EndpointManager.instance.endpoint = endpoint;
			if (webSocketEndpoint) EndpointManager.instance.webSocketEndpoint = webSocketEndpoint;
		}
		return EndpointManager.instance;
	}

	public static setInstance(endpoint: string, webSocketEndpoint: string): void {
		if (!EndpointManager.instance) {
			EndpointManager.instance = new EndpointManager(endpoint, webSocketEndpoint);
		} else {
			EndpointManager.instance.endpoint = endpoint;
			EndpointManager.instance.webSocketEndpoint = webSocketEndpoint;
		}
	}

	public getEndpoint(): string {
		return this.endpoint;
	}

	public getWebSocketEndpoint(): string {
		return this.webSocketEndpoint;
	}

	public setEndpoint(endpoint: string): void {
		this.endpoint = endpoint;
	}

	public setWebSocketEndpoint(webSocketEndpoint: string): void {
		this.webSocketEndpoint = webSocketEndpoint;
	}
}
