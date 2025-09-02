// src/services/websocket-manager.ts

import { io, Socket } from "socket.io-client";
import { TokenManager } from "../core/token-manager";
import { PixelEvent, WebSocketResponse, WSOutboundMessage } from "../types";

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
	 * @returns Promise<Response<any>>
	 */
	public sendMessage(event: Record<string, any>): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.socket.connected) {
				console.warn("⚠️ WebSocket no está conectado, mensaje no enviado");
				return reject("WebSocket no conectado");
			}
			const { type } = event;
			this.socket.emit(type || "event", event, (ack: any) => {
				console.log("📩 Mensaje recibido por el servidor:", ack);
				
				// Verificar si es el error específico de "No receivers"
				if (ack && typeof ack === 'object' && 'error' in ack && ack.error === 'No receivers') {
					console.warn("⚠️ No hay comerciales disponibles en este momento");
					
					// Devolver un objeto especial para que el código que lo llama pueda identificar este error
					// y mostrar un mensaje apropiado al usuario
					return resolve({
						error: 'No receivers',
						noReceiversError: true,
						timestamp: ack.timestamp,
						message: "En este momento no hay comerciales disponibles. Tu mensaje no será guardado."
					});
				}
				
				resolve(ack);
			});
		});
	}

	// --- Nuevo protocolo envelope (v1) ---
	private buildEnvelope(partial: Omit<WSOutboundMessage, 'v' | 'ts' | 'id'> & { id?: string }): WSOutboundMessage {
		return {
			v: 1,
			id: partial.id || `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			ts: new Date().toISOString(),
			...partial,
		} as WSOutboundMessage;
	}

	public sendEnvelope(msg: Omit<WSOutboundMessage, 'v' | 'ts' | 'id'> & { id?: string }): Promise<any> {
		const envelope = this.buildEnvelope(msg);
		// Reutilizamos sendMessage para compat (espera campo type); mapeamos t -> type
		const legacy = { ...envelope, type: envelope.t };
		return this.sendMessage(legacy);
	}

	public sendPresenceUpdate(data: any, context: { sid?: string; vid?: string } = {}): Promise<any> {
		return this.sendEnvelope({ t: 'presence.update', data, sid: context.sid, vid: context.vid });
	}

	public sendNavChanged(data: { url: string; title?: string }, context: { sid?: string; vid?: string } = {}): Promise<any> {
		return this.sendEnvelope({ t: 'nav.changed', data, sid: context.sid, vid: context.vid });
	}

	public sendTrackBatch(events: { event_id: string; name: string; occurred_at: string; props?: Record<string, any>; }[], context: { sid?: string; vid?: string } = {}): Promise<any> {
		return this.sendEnvelope({ t: 'track.batch', data: { events }, sid: context.sid, vid: context.vid });
	}

	public sendPing(): Promise<any> {
		return this.sendEnvelope({ t: 'ping' });
	}

	public healthCheck(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket || !this.socket.connected) {
				console.warn("⚠️ WebSocket no está conectado, mensaje no enviado");
				return reject("WebSocket no conectado");
			}
			this.socket.emit("health-check", (response: WebSocketResponse) => {
				if ('error' in response) {
					console.error("❌ Error en el health check:", response.error);
					return reject(response.error);
				}
				console.log("✅ Health check exitoso:", response);
				resolve();
			});
		});
	}

	/**
	 * Añade un listener cuando el WebSocket recibe un mensaje del chat
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onChatMessage(listener: (message: Record<string, any>) => void): void {
		console.log("Agregando listener para mensajes del chat");
		this.addListener("receive-message", (message) => {
			console.log("WebSocket: Mensaje del chat recibido", message);
			
			// Ejecutar el listener original
			listener(message);
		});
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
	 * Añade un listener para cuando el asesor comienza a escribir
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onTypingStarted(listener: () => void): void {
		this.addListener("typing-started", listener);
	}

	/**
	 * Añade un listener para cuando el asesor termina de escribir
	 * @param listener Función a ejecutar
	 * @returns void
	 */
	public onTypingStopped(listener: () => void): void {
		this.addListener("typing-stopped", listener);
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
	 * Espera a que el WebSocket se conecte con un timeout para evitar bloquear la aplicación.
	 * @param timeoutMs Tiempo máximo de espera en milisegundos (por defecto 3000ms)
	 * @returns Promise<void>
	 */
	public waitForConnection(timeoutMs: number = 3000): Promise<void> {
		return new Promise((resolve) => {
			if (this.isConnected()) {
				console.log("✅ WebSocket ya conectado");
				resolve();
			} else {
				console.log("⏳ Esperando a que el WebSocket se conecte...");
				console.log("url", this.endpoint);
				
				// Listener para cuando se conecte
				const connectHandler = () => {
					clearTimeout(timeoutId);
					resolve();
				};
				this.onConnect(connectHandler);
				
				// Establecer un timeout para no bloquear demasiado tiempo
				const timeoutId = setTimeout(() => {
					console.warn("⚠️ Timeout esperando conexión WebSocket, continuando de todos modos");
					resolve();
				}, timeoutMs);
			}
		});
	}
}
