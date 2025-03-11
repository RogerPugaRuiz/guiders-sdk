import { io, Socket } from "socket.io-client";
import { ClientJS } from "clientjs";

class TokenManager {
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private endpoint: string;

	constructor(endpoint: string) {
		this.endpoint = endpoint;
	}

	public async getValidAccessToken(): Promise<string | null> {
		this.loadTokensFromStorage();
		if (!this.accessToken || this.isTokenExpired()) {
			await this.requestTokens();
		}
		return this.accessToken;
	}

	private async requestTokens(): Promise<void> {
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
			console.error("Error solicitando tokens:", error);
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
		const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
		return (payload.exp * 1000) - Date.now() < 60000;
	}

	private getHeaders(): Record<string, string> {
		return { "Content-Type": "application/json" };
	}
}

class FingerprintManager {
	static getClientFingerprint(): string {
		return localStorage.getItem("client") || new ClientJS().getFingerprint().toString();
	}
}

class WebSocketManager {
	private socket: Socket | null = null;
	private wsEndpoint: string;
	private tokenManager: TokenManager;

	constructor(wsEndpoint: string, tokenManager: TokenManager, private autoReconnect: boolean = true) {
		this.wsEndpoint = wsEndpoint;
		this.tokenManager = tokenManager;
	}

	public async connectSocket(): Promise<void> {
		const accessToken = await this.tokenManager.getValidAccessToken();
		if (!accessToken) return;

		this.socket = io(this.wsEndpoint, { auth: { token: accessToken }, reconnection: false });

		this.socket.on("connect", () => console.log("Conectado al servidor de notificaciones"));
		this.socket.on("disconnect", () => this.scheduleReconnect());
		this.socket.on("connect_error", async (error) => {
			console.error("Error de conexión:", error);
			if (error.message === "invalid token") {
				await this.tokenManager.getValidAccessToken();
				this.connectSocket();
			} else {
				this.scheduleReconnect();
			}
		});
	}

	public on(event: string, callback: (...args: any[]) => void): void {
		if (this.socket) {
			this.socket.on(event, callback);
		}
	}

	private scheduleReconnect(): void {
		if (!this.autoReconnect) return;
		setTimeout(() => this.connectSocket(), 60000);
	}
}

class PixelTracker {
	private endpoint: string;
	private tokenManager: TokenManager;
	private lastActivity: number = Date.now();
	private isFocused: boolean = true;

	constructor(endpoint: string, tokenManager: TokenManager) {
		this.endpoint = endpoint;
		this.tokenManager = tokenManager;
		this.setupActivityListeners();
	}

	/**
	 * Registra eventos de actividad y foco del usuario
	 */
	private setupActivityListeners(): void {
		document.addEventListener("visibilitychange", () => this.updateFocusStatus());
		window.addEventListener("focus", () => this.updateFocusStatus());
		window.addEventListener("blur", () => this.updateFocusStatus());
		window.addEventListener("mousemove", () => this.registerActivity());
		window.addEventListener("keydown", () => this.registerActivity());

		setInterval(() => this.sendAvailabilityStatus(), 15000); // Enviar estado cada 15s
	}

	/**
	 * Actualiza si la ventana está en foco
	 */
	private updateFocusStatus(): void {
		this.isFocused = !document.hidden;
		this.registerActivity();
	}

	/**
	 * Registra actividad del usuario y actualiza el tiempo de última acción
	 */
	private registerActivity(): void {
		this.lastActivity = Date.now();
	}

	/**
	 * Enviar estado de disponibilidad al servidor
	 */
	private async sendAvailabilityStatus(): Promise<void> {
		const isActive = this.isFocused && (Date.now() - this.lastActivity < 30000); // Activo si interactuó en los últimos 30s
		await this.track("user_status", { available: isActive });
	}

	/**
	 * Enviar eventos de tracking al servidor
	 */
	public async track(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
		const accessToken = await this.tokenManager.getValidAccessToken();
		if (!accessToken) return;

		try {
			await fetch(`${this.endpoint}/events`, {
				method: "POST",
				headers: this.getHeaders(accessToken),
				body: JSON.stringify({ event: eventName, data: eventData, timestamp: new Date().toISOString() }),
			});
		} catch (err) {
			console.error("Error enviando evento:", err);
		}
	}

	private getHeaders(accessToken: string): Record<string, string> {
		return { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` };
	}
}
class GuidersPixel {
	private apiKey: string | null = null;
	private domain: string;
	private tokenManager: TokenManager;
	private socketManager: WebSocketManager;
	private pixelTracker: PixelTracker;

	constructor() {
		this.domain = window.location.hostname;
		this.tokenManager = new TokenManager('http://localhost:3000/pixel');
		this.socketManager = new WebSocketManager('ws://localhost:3000/chat', this.tokenManager);
		this.pixelTracker = new PixelTracker('http://localhost:3000/pixel', this.tokenManager);
	}

	public async init(apiKey: string): Promise<void> {
		this.apiKey = apiKey;
		await this.tokenManager.getValidAccessToken();
		await this.socketManager.connectSocket();
	}

	public async track(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
		await this.pixelTracker.track(eventName, eventData);
	}
}

(window as any).guidersPixel = new GuidersPixel();
