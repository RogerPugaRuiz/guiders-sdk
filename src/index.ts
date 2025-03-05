import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { ClientJS } from "clientjs";

type GuidersClientOptions = {
	url: string;
	apiKey: string; // se utiliza como clave pública (pk_xxx)
	env: "development" | "production";
};

const defaultOptions: GuidersClientOptions = {
	url: "http://localhost:3000",
	apiKey: "pk_test_1234567890",
	env: "development",
};

function getCookie(name:string) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()!.split(';').shift();
	return null;
}


export class GuidersClient {
	private static socket: Socket | null = null;
	private static options: GuidersClientOptions = defaultOptions;
	private static clientId: string | null = null;
	private static accessToken: string | null = null;
	private static refreshToken: string | null = null;

	/** Inicializa la conexión WebSocket y el proceso de autenticación */
	static async init(options: GuidersClientOptions): Promise<typeof GuidersClient> {
		this.options = options;
		console.log("GuidersClient inicializado");

		// Intentar recuperar datos almacenados en localStorage
		const storedAccessToken = localStorage.getItem("guiders_access_token");
		const storedRefreshToken = localStorage.getItem("guiders_refresh_token");
		const storedClientId = localStorage.getItem("guiders_client_id");

		// buscar el fingerprint del navegador en localStorage o en las cookies
		// si no existe, solicitar uno nuevo al servidor

		if (storedAccessToken && storedRefreshToken && storedClientId) {
			this.accessToken = storedAccessToken;
			this.refreshToken = storedRefreshToken;
			this.clientId = storedClientId;
		} else {
			// 1. Autenticación: usa la clave pública para obtener el clientId
			const loginData = await this.authenticate();
			if (!loginData) return this;
			this.clientId = loginData.clientId;
			localStorage.setItem("guiders_client_id", this.clientId);

			// 2. Solicitar tokens: usando el clientId y fingerprint
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

	/** Realiza la autenticación usando la clave pública (pk_xxx) para obtener el clientId */
	private static async authenticate(): Promise<{ clientId: string } | null> {
		try {
			const response = await fetch(`${this.options.url}/apikey/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ publicKey: this.options.apiKey }),
			});
			const data = await response.json();
			if (!data.clientId) throw new Error("No se recibió clientId");
			return data;
		} catch (error) {
			console.error("Error al autenticar con la clave pública:", error);
			return null;
		}
	}

	/** Solicita tokens usando el clientId obtenido y el fingerprint del navegador */
	private static async fetchTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
		try {
			const client = new ClientJS();

			// buscar el fingerprint del navegador en localStorage o en las cookies
			// si no existe, solicitar uno nuevo al servidor
			const fingerprint = localStorage.getItem("guiders_fingerprint") || getCookie("guiders_fingerprint") || client.getFingerprint().toString();
			const maxAge = 20 * 365 * 24 * 60 * 60; // 20 años
			document.cookie = `guiders_fingerprint=${fingerprint}; max-age=${maxAge}`;
			localStorage.setItem("guiders_fingerprint", fingerprint);
			if (!this.clientId) throw new Error("clientId no definido");
			const response = await fetch(`${this.options.url}/apikey/auth/tokens`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					clientId: this.clientId,
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

	/** Renueva el access token usando el refresh token */
	private static async refreshAccessToken(): Promise<boolean> {
		try {
			if (!this.clientId || !this.refreshToken) {
				throw new Error("clientId o refreshToken no definido");
			}
			const response = await fetch(`${this.options.url}/apikey/auth/refresh`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					clientId: this.clientId,
					refreshToken: this.refreshToken,
				}),
			});
			const data = await response.json();
			if (!data.access_token) throw new Error("No se recibió un nuevo access_token");
			this.accessToken = data.access_token as string;
			localStorage.setItem("guiders_access_token", this.accessToken);
			return true;
		} catch (error) {
			console.error("Error al renovar el access_token:", error);
			// Limpiar tokens y clientId para forzar reautenticación
			localStorage.removeItem("guiders_access_token");
			localStorage.removeItem("guiders_refresh_token");
			localStorage.removeItem("guiders_client_id");
			this.accessToken = null;
			this.refreshToken = null;
			this.clientId = null;
			return false;
		}
	}

	/** Conecta al WebSocket usando el access token obtenido */
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
			if (reason === "io server disconnect") {
				const refreshed = await this.refreshAccessToken();
				if (refreshed) {
					await this.connectWebSocket();
				} else {
					console.error("No se pudo renovar el access token. Desconectando...");
					this.init(this.options);
				}
			} else {
				console.warn(`Razón de desconexión: ${reason}`);
			}
		});
	}

	/** Registra el navegador al WebSocket */
	static async registerBrowser(): Promise<void> {
		if (!this.socket) return;
		const userAgent = navigator.userAgent;
		const fingerprint = localStorage.getItem("guiders_fingerprint") || getCookie("guiders_fingerprint");
		if (!fingerprint) {
			console.error("No se encontró el fingerprint del navegador");
			return;
		}
		this.socket.emit("registerBrowser", { userAgent, fingerprint });
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
