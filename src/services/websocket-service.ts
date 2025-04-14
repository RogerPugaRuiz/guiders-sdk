// src/services/websocket-manager.ts

import { io, Socket } from "socket.io-client";
import { TokenManager } from "../core/token-manager";
import { PixelEvent, WebSocketResponse } from "../types";

export class WebSocketClient {
	private socket: Socket | null = null;
	private endpoint: string;
	private token: string | null = null;
	private static instance: WebSocketClient | null = null;

	constructor(endpoint: string) {
		this.endpoint = endpoint;

		TokenManager.subscribeToTokenChanges(this.updateToken.bind(this));
	}

	/**
	 * Crea una instancia única de WebSocketClient.
	 * @param endpoint URL del WebSocket.
	 * @returns WebSocketClient
	 */
	public static getInstance(endpoint: string): WebSocketClient {
		if (!this.instance) {
			this.instance = new WebSocketClient(endpoint);
		}
		return this.instance;
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

		this.socket.on("auth_error", (error) => {
			console.error("❌ Error de autenticación en WebSocket:", error);
			this.socket?.disconnect();
		});

		this.socket.onAny((event, ...args) => {
			if (event === "auth_error") return; // Ignorar errores de autenticación
			console.log(`📩 Mensaje recibido del servidor: ${event}`, args);
		});
		// this.socket.on("connect", () => console.log("✅ WebSocket conectado"));
		// this.socket.on("connect_error", (err) => console.error("❌ WebSocket error:", err));
		// this.socket.on("disconnect", () => {
		// 	console.warn("⚠️ WebSocket desconectado, intentando reconectar...");
		// });
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
	public sendMessage(event: Record<string, any>): Promise<WebSocketResponse> {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.socket.connected) {
				console.warn("⚠️ WebSocket no está conectado, mensaje no enviado");
				return reject("WebSocket no conectado");
			}
			const { type } = event;
			this.socket.emit(type || "event", event, (ack: WebSocketResponse) => {
				console.log("📩 Mensaje recibido por el servidor:", ack);
				resolve(ack);
			});
		});
	}

	/**
	 * Añade un listener cuando el WebSocket recibe un mensaje del chat
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onChatMessage(listener: (message: Record<string, any>) => void): void {
		this.addListener("receive-message", listener);
	}


	/**
	 * Añade un listener a un evento específico.
	 * @param event Nombre del evento.
	 * @param listener Función a ejecutar
	 */
	public addListener(event: string, listener: (...args: any[]) => void): void {
		if (!this.socket) {
			console.error("❌ WebSocket no conectado");
			return;
		}

		this.socket.on(event, listener);
	}

	/**
	 * Añede un listener cuando el WebSocket se conecta.
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onConnect(listener: () => void): void {
		this.addListener("connect", listener);
	}

	/**
	 * Añede un listener cuando el WebSocket se desconecta.
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onDisconnect(listener: () => void): void {
		this.addListener("disconnect", listener);
	}

	/**
	 * Verifica si el WebSocket está conectado.
	 * @returns boolean
	 * @returns void
	 */
	public isConnected(): boolean {
		return !!this.socket && this.socket.connected;
	}

	/**
	 * Espera a que el WebSocket se conecte.
	 * @returns Promise<void>
	 */
	public waitForConnection(): Promise<void> {
		return new Promise((resolve) => {
			if (this.isConnected()) {
				resolve();
			} else {
				this.onConnect(resolve);
			}
		});
	}
}
