import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { ClientJS } from 'clientjs';

type GuidersClientOptions = {
	url: string;
	apiKey: string;
	env: "development" | "production";
};

const defaultOptions: GuidersClientOptions = {
	url: "http://localhost:3000",
	apiKey: "pk_test_1234567890",
	env: "development",
};

export class GuidersClient {
	private static socket: Socket | null = null;
	private static options: GuidersClientOptions = defaultOptions;
	private static accessToken: string | null = null;
	private static refreshToken: string | null = null;

	/** Inicializa la conexión WebSocket */
	static async init(options: GuidersClientOptions): Promise<typeof GuidersClient> {
		this.options = options;
		console.log("GuidersClient inicializado");

		// Intentar recuperar los tokens almacenados en localStorage
		const storedAccessToken = localStorage.getItem("guiders_access_token");
		const storedRefreshToken = localStorage.getItem("guiders_refresh_token");

		if (storedAccessToken && storedRefreshToken) {
			this.accessToken = storedAccessToken;
			this.refreshToken = storedRefreshToken;
		} else {
			const tokens = await this.fetchTokens();
			if (!tokens) return this;
			this.accessToken = tokens.access_token;
			this.refreshToken = tokens.refresh_token;
			this.storeTokens(this.accessToken, this.refreshToken);
		}
		await this.connectWebSocket();
		return this;
	}

	/** Almacena los tokens en localStorage */
	private static storeTokens(accessToken: string, refreshToken: string): void {
		localStorage.setItem("guiders_access_token", accessToken);
		localStorage.setItem("guiders_refresh_token", refreshToken);
	}

	/** Obtiene un JWT y un Refresh Token del backend */
	private static async fetchTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
		try {
			const client = new ClientJS();
			const fingerprint = client.getFingerprint();
			const apiKey = this.options.apiKey;
			const response = await fetch(`${this.options.url}/apikey/auth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiKey,
					fingerprint,
				}),
			});
			const data = await response.json();
			if (!data.access_token || !data.refresh_token) throw new Error("No se recibieron tokens");
			return data;
		} catch (error) {
			console.error("Error al obtener los tokens:", error);
			return null;
		}
	}

	/** Renueva el access_token usando el refresh_token */
	private static async refreshAccessToken(): Promise<boolean> {
		try {
			const response = await fetch(`${this.options.url}/apikey/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ apiKey: this.options.apiKey, refresh_token: this.refreshToken }),
			});
			const data = await response.json();
			if (!data.access_token) throw new Error("No se recibió un nuevo access_token");
			this.accessToken = data.access_token as string;
			localStorage.setItem("guiders_access_token", this.accessToken);
			return true;
		} catch (error) {
			console.error("Error al renovar el access_token:", error);
			return false;
		}
	}

	/** Conecta al WebSocket con el token */
	private static async connectWebSocket(): Promise<void> {
		if (!this.accessToken) return;

		this.socket = io(`${this.options.url}/guiders-client`, {
			auth: { token: this.accessToken },
		});

		this.socket.on("connect", () => {
			console.log("Conectado al servidor WebSocket");
			this.registerBrowser();
		});

		this.socket.on("disconnect", async (reason) => {
			console.warn("Desconectado:", reason);
			switch (reason) {
				case "io server disconnect":
					const refreshed = await this.refreshAccessToken();
					if (refreshed) {
						await this.connectWebSocket();
					} else {
						console.error("No se pudo renovar el token. Se requiere autenticación nuevamente.");
					}
					break;
				case "io client disconnect":
				case "ping timeout":
				case "transport close":
				case "transport error":
				case "parse error":
					console.warn(`Desconexión por: ${reason}`);
					break;
				default:
					console.warn(`Razón desconocida para la desconexión: ${reason}`);
					break;
			}
		});
	}

	/** Registra el navegador al WebSocket */
	static async registerBrowser(): Promise<void> {
		if (!this.socket) return;
		const userAgent = navigator.userAgent;
		this.socket.emit("registerBrowser", { userAgent });
		console.log("Registrando navegador:", userAgent);
	}

	/** Envía un mensaje al servidor WebSocket */
	static sendMessage(data: any): typeof GuidersClient {
		if (!this.socket) {
			console.error("El socket no está inicializado. Llama a GuidersClient.init primero.");
			return this;
		}
		this.socket.emit("message", data);
		console.log("Mensaje enviado:", data);
		return this;
	}

	/** Cierra la conexión WebSocket */
	static disconnect(): typeof GuidersClient {
		if (this.socket) {
			this.socket.disconnect();
			console.log("Desconectado del WebSocket");
		}
		return this;
	}
}

if (typeof window !== "undefined") {
	(window as any).GuidersClient = GuidersClient;
}
