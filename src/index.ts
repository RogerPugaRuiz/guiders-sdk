import { io, Socket } from "socket.io-client";
import { ClientJS } from "clientjs";

class TokenManager {
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private endpoint: string;
	private tokenRequestInProgress: boolean = false; // 🔒 Evita llamadas duplicadas

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
		try {
			const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
			const expirationTime = payload.exp * 1000;
			const currentTime = Date.now();

			console.log("⏳ Expiración del token:", new Date(expirationTime));
			console.log("🕒 Hora actual:", new Date(currentTime));

			return expirationTime - currentTime < 30000; // Reducimos margen a 30s
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

		this.socket.on("connect", () => console.log("✅ Conectado al servidor"));

		this.socket.on("disconnect", (reason) => console.warn("❌ Desconectado:", reason));

		this.socket.on("auth_error", async (error) => {
			console.error("🔴 Error de autenticación:", error);

			if (error.message === "invalid token") {
				if (this.tokenManager.isTokenRequestInProgress()) return;
				await new Promise(resolve => setTimeout(resolve, 2000));
				await this.tokenManager.getValidAccessToken();
			}

			if (this.autoReconnect) {
				this.socket?.disconnect();
				setTimeout(() => this.connectSocket(), 5000);
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

class PixelTracker {
	private tokenManager: TokenManager;
	private socketManager: WebSocketManager;
	private eventQueue: any[] = [];
	private lastActivity: number = Date.now();
	private isFocused: boolean = true;
	private lastSentStatus: boolean | null = null;
	private inactivityTimeout: number | null = null;
	private inactivityThreshold: number;

	constructor(tokenManager: TokenManager, socketManager: WebSocketManager, inactivityThreshold: number = 5 * 60 * 1000) {
		this.tokenManager = tokenManager;
		this.socketManager = socketManager;
		this.inactivityThreshold = inactivityThreshold;
		this.setupActivityListeners();
	}

	private setupActivityListeners(): void {
		const events = ["visibilitychange", "focus", "blur", "mousemove", "keydown"];
		events.forEach(event => {
			document.addEventListener(event, () => this.handleEvent());
			if (event !== "visibilitychange") {
				window.addEventListener(event, () => this.handleEvent());
			}
		});
	}

	private handleEvent(): void {
		this.updateFocusStatus();
		this.registerActivity();
		this.checkAvailability();
		if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
		this.inactivityTimeout = window.setTimeout(() => this.checkAvailability(), this.inactivityThreshold);
	}

	private updateFocusStatus(): void {
		this.isFocused = !document.hidden;
	}

	private registerActivity(): void {
		this.lastActivity = Date.now();
	}

	private async checkAvailability(): Promise<void> {
		const isActive = this.isFocused && (Date.now() - this.lastActivity < this.inactivityThreshold);
		if (this.lastSentStatus !== isActive) {
			this.lastSentStatus = isActive;
			await this.track("user_status", { available: isActive });
		}
	}

	public async track(eventName: string, eventData: Record<string, any> = {}): Promise<void> {
		const accessToken = await this.tokenManager.getValidAccessToken();
		if (!accessToken) return;
		const payload = { event: eventName, data: eventData, timestamp: Date.now() };

		if (this.socketManager.connected) {
			this.socketManager.emit("tracking", payload);
			this.flushQueue();
		} else {
			this.eventQueue.push(payload);
		}
	}

	private flushQueue(): void {
		while (this.eventQueue.length && this.socketManager.connected) {
			const payload = this.eventQueue.shift();
			this.socketManager.emit("tracking", payload);
		}
	}
}

class GuidersPixel {
	private tokenManager: TokenManager;
	private socketManager: WebSocketManager;
	private pixelTracker: PixelTracker | null = null;

	constructor() {
		this.tokenManager = new TokenManager('http://localhost:3000/pixel');
		this.socketManager = new WebSocketManager('ws://localhost:3000/tracking', this.tokenManager, true);
	}

	public async init(apiKey: string, options: Record<string, any> = {}): Promise<void> {
		await this.tokenManager.getValidAccessToken();
		await this.socketManager.connectSocket();
		this.pixelTracker = new PixelTracker(this.tokenManager, this.socketManager);
	}
}

(window as any).guidersPixel = new GuidersPixel();