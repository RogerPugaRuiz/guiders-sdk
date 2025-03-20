// src/services/websocket-manager.ts

import { io, Socket } from "socket.io-client";
import { TokenManager } from "../core/token-manager";

export class WebSocketClient {
	private socket: Socket | null = null;
	private endpoint: string;
	private token: string | null = null;

	constructor(endpoint: string) {
		this.endpoint = endpoint;

		TokenManager.subscribeToTokenChanges(this.updateToken.bind(this));
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
	 * Desconecta el WebSocket.
	 * @returns void
	 */
	public disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}

	/**
	 * Actualiza el token de autenticación del WebSocket.
	 * Si el socket está conectado, lo reconecta automáticamente.
	 */
	public updateToken(token: string): void {
		if (this.token === token) return; // No hacer nada si el token no ha cambiado

		this.token = token;

		if (this.socket) {
			console.log("🔄 Actualizando token en WebSocket...");
			this.socket.auth = { token };

			if (this.socket.connected) {
				console.log("⚡ WebSocket ya conectado, reconectando...");
				this.socket.disconnect(); // Cerrar conexión con el token anterior
				this.socket.connect();    // Conectar con el nuevo token
			}
		}
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

		this.socket.emit("event", event);
	}
}
