// src/services/websocket-manager.ts

import { io, Socket } from "socket.io-client";

export class WebSocketManager {
	private socket: Socket | null = null;
	private endpoint: string;
	private token: string | null = null;
	private useTokenInEvents: boolean;

	constructor(endpoint: string, useTokenInEvents: boolean = false) {
		this.endpoint = endpoint;
		this.useTokenInEvents = useTokenInEvents;
	}

	/**
	 * Conecta el WebSocket con autenticación en la conexión o en los eventos.
	 * @param token Token de autenticación.
	 */
	public connect(token?: string): void {
		this.token = token || null;

		this.socket = io(this.endpoint, {
			transports: ["websocket"], // Usamos WebSocket directamente
			auth: this.token ? { token: this.token } : undefined, // Enviar token en la conexión
			reconnectionAttempts: 5, // Número de intentos de reconexión
			reconnectionDelay: 3000, // Espera 3s antes de intentar reconectar
		});

		this.socket.on("connect", () => console.log("✅ WebSocket conectado"));
		this.socket.on("connect_error", (err) => console.error("❌ WebSocket error:", err));
		this.socket.on("disconnect", () => {
			console.warn("⚠️ WebSocket desconectado, intentando reconectar...");
		});
	}

	/**
	 * Envía un mensaje por WebSocket.
	 * @param event Evento a enviar.
	 */
	public sendMessage(event: Record<string, any>): void {
		if (!this.socket || !this.socket.connected) {
			console.warn("⚠️ WebSocket no está conectado, mensaje no enviado");
			return;
		}

		if (this.useTokenInEvents && this.token) {
			event.token = this.token;
		}

		this.socket.emit("event", event);
	}
}
