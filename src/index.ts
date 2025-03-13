import { io, Socket } from "socket.io-client";
import { ClientJS } from "clientjs";

class TokenManager {
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private endpoint: string;
	private tokenRequestInProgress: boolean = false;

	constructor(endpoint: string) {
		this.endpoint = endpoint;
	}

	public isTokenRequestInProgress(): boolean {
		return this.tokenRequestInProgress;
	}

	public async getValidAccessToken(): Promise<string | null> {
		this.loadTokensFromStorage();

		if (!this.accessToken || this.isTokenExpired()) {
			if (this.tokenRequestInProgress) {
				while (this.tokenRequestInProgress) {
					await new Promise(resolve => setTimeout(resolve, 100)); // Espera 100ms
				}
			} else {
				this.tokenRequestInProgress = true;
				await this.requestTokens();
				this.tokenRequestInProgress = false;
			}
		}

		return this.accessToken;
	}

	private async requestTokens(retryCount = 0): Promise<void> {
		try {
			const client = FingerprintManager.getClientFingerprint();
			const response = await fetch(`${this.endpoint}/token`, {
				method: "POST",
				headers: this.getHeaders(),
				body: JSON.stringify({ client }),
			});

			if (!response.ok) throw new Error("Error obteniendo tokens");

			const { access_token, refresh_token } = await response.json();
			this.storeTokens(access_token, refresh_token);
		} catch (error) {
			console.error(`Error solicitando tokens (Intento ${retryCount}):`, error);

			if (retryCount >= 5) {  // ❌ Después de 5 intentos, se detiene el reintento
				console.error("🚨 No se pudo obtener el token después de múltiples intentos.");
				return;
			}

			await new Promise(resolve => setTimeout(resolve, 5000));
			await this.requestTokens(retryCount + 1);
		}
	}

	private storeTokens(accessToken: string, refreshToken: string): void {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		localStorage.setItem("access_token", accessToken);
		localStorage.setItem("refresh_token", refreshToken);
	}

	private loadTokensFromStorage(): void {
		this.accessToken = localStorage.getItem("access_token");
		this.refreshToken = localStorage.getItem("refresh_token");
	}

	private isTokenExpired(): boolean {
		if (!this.accessToken) return true;
		try {
			const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
			const expirationTime = payload.exp * 1000;
			const currentTime = Date.now();
			return expirationTime - currentTime < 30000;
		} catch (error) {
			console.error("Error al verificar expiración del token:", error);
			return true;
		}
	}

	private getHeaders(): Record<string, string> {
		return { "Content-Type": "application/json" };
	}
}

class FingerprintManager {
	static getClientFingerprint(): string {
		const currentFingerPrint = localStorage.getItem("client") || new ClientJS().getFingerprint().toString();
		localStorage.setItem("client", currentFingerPrint);
		return currentFingerPrint;
	}
}

class WebSocketManager {
	private socket: Socket | null = null;
	private wsEndpoint: string;
	private tokenManager: TokenManager;
	private autoReconnect: boolean;

	constructor(wsEndpoint: string, tokenManager: TokenManager, autoReconnect = true) {
		this.wsEndpoint = wsEndpoint;
		this.tokenManager = tokenManager;
		this.autoReconnect = autoReconnect;
	}

	public async connectSocket(): Promise<void> {
		const accessToken = await this.tokenManager.getValidAccessToken();
		if (!accessToken) return;

		this.socket = io(this.wsEndpoint, {
			auth: { token: accessToken },
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 500,
			reconnectionDelayMax: 3000,
			timeout: 10000,
			autoConnect: false,
		});

		this.socket.connect();

		this.socket.on("connect", () => console.log("✅ Conectado al servidor"));

		this.socket.on("disconnect", (reason) => console.warn("❌ Desconectado:", reason));

		this.socket.on("auth_error", async (error) => {
			console.error("🔴 Error de autenticación:", error);

			if (error.message === "invalid token") {
				if (this.tokenManager.isTokenRequestInProgress()) return;
				await new Promise(resolve => setTimeout(resolve, 2000));
				await this.tokenManager.getValidAccessToken();
			}

			if (!this.autoReconnect) {
				this.socket?.disconnect();
				setTimeout(() => this.connectSocket(), 5000); // Intentar reconectar en 5 segundos
			}
		});
	}

	public get connected(): boolean {
		return this.socket ? this.socket.connected : false;
	}

	public on(event: string, callback: (...args: any[]) => void): void {
		this.socket?.on(event, callback);
	}

	public emit(event: string, data: any): void {
		this.socket?.emit(event, data);
	}
}

class GuidersPixel {
	private apiKey: string | null = null;
	private domain: string;
	private tokenManager: TokenManager;
	private socketManager: WebSocketManager;

	constructor() {
		this.domain = window.location.hostname;
		this.tokenManager = new TokenManager('http://localhost:3000/pixel');
		this.socketManager = new WebSocketManager('ws://localhost:3000/tracking', this.tokenManager, true);
	}

	public async init(apiKey: string, options: Record<string, any> = {}): Promise<void> {
		this.apiKey = apiKey;

		// Primero, registrar el visitante antes de obtener el token
		await this.registerVisitor();

		// Luego, obtener el token y conectar el socket
		await this.tokenManager.getValidAccessToken();
		await this.socketManager.connectSocket();
	}

	private async registerVisitor(): Promise<void> {
		const clientFingerprint = FingerprintManager.getClientFingerprint();
		const userAgent = navigator.userAgent;

		console.log("Registrando visitante...");
		try {
			const response = await fetch('http://localhost:3000/pixel/register', {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					apiKey: this.apiKey,
					client: clientFingerprint,
					userAgent: userAgent
				})
			});

			if (!response.ok) throw new Error('Error al registrar visitante');
			console.log('✅ Visitante registrado exitosamente');
		} catch (error) {
			console.error("❌ Error en el registro del visitante:", error);
		}
	}
}

(window as any).guidersPixel = new GuidersPixel();