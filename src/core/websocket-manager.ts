import { io, Socket } from "socket.io-client";
import { TokenPort } from "../interfaces/token.interface";
import { WebSocketPort } from "../interfaces/websocket.interface";

export class WebSocketAdapter implements WebSocketPort {
	private socket: Socket | null = null;
	private wsEndpoint: string;
	private tokenService: TokenPort;
	private autoReconnect: boolean;
	private inactivityThreshold: number;
	private lastActivity: number = Date.now();
	private isFocused: boolean = true;
	private inactivityTimeout: number | null = null;
	private wasInactive: boolean = false;

	constructor(wsEndpoint: string, options: {
		tokenService: TokenPort,
		autoReconnect: boolean,
		inactivityThreshold: number
	}) {
		this.wsEndpoint = wsEndpoint;
		const { tokenService, autoReconnect, inactivityThreshold } = options;
		this.tokenService = tokenService;
		this.autoReconnect = autoReconnect;
		this.inactivityThreshold = inactivityThreshold;
		this.setupActivityListeners();
	}

	public async connectSocket(): Promise<void> {
		const accessToken = await this.tokenService.getValidAccessToken();
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
		this.setEventListeners();
	}

	public get isConnected(): boolean {
		return this.socket ? this.socket.connected : false;
	}

	private on(event: string, callback: (...args: any[]) => void): void {
		this.socket?.on(event, callback);
	}

	private emit(event: string, data: any): void {
		this.socket?.emit(event, data);
	}

	private setEventListeners(): void {
		if (!this.socket) return;

		this.socket.on("connect", () => {
			console.log("✅ Conectado al servidor");
			this.emitUserStatus(); // Emitir estado al conectar
		});

		this.socket.on("disconnect", (reason) => console.warn("❌ Desconectado:", reason));

		this.socket.on("auth_error", async (error) => {
			console.error("🔴 Error de autenticación:", error);

			// if (error.message === "invalid token") {
			if (this.tokenService.isTokenRequestInProgress()) return;
			await new Promise(resolve => setTimeout(resolve, 2000));
			await this.tokenService.getValidAccessToken();
			// }

			if (this.autoReconnect) {
				this.socket?.disconnect();
				this.connectSocket();
				// setTimeout(() => this.connectSocket(), 5000);
			}
		});

		this.socket.onAny((event, ...args) => {
			console.log(`📡 Evento recibido: ${event}`, args);
		});
	}



	/** 📌 Configurar detección de actividad del usuario */
	private setupActivityListeners(): void {
		const events = ["mousemove", "keydown", "scroll", "touchstart"];
		events.forEach(event => {
			document.addEventListener(event, () => this.registerActivity());
		});

		document.addEventListener("visibilitychange", () => {
			this.isFocused = !document.hidden;
			this.emitUserStatus();
		});
	}

	private lastEmitTime: number = 0;
	private throttleInterval: number = 1000; // 1 segundo

	private emitThrottled(event: string, data: any): void {
		const now = Date.now();
		if (now - this.lastEmitTime >= this.throttleInterval) {
			this.socket?.emit(event, data);
			this.lastEmitTime = now;
		}
	}

	/** 📌 Registrar actividad del usuario */
	private registerActivity(): void {
		this.lastActivity = Date.now();

		// Si estaba inactivo y vuelve a interactuar, emite "user_active"
		if (this.wasInactive) {
			this.wasInactive = false;
			console.log("🟢 Emitiendo estado del usuario: active");
			this.emit("user_active", { status: "active" });
		}


		this.emitUserStatus();

		// Reiniciar el temporizador de inactividad
		if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
		this.inactivityTimeout = window.setTimeout(() => this.checkInactivity(), this.inactivityThreshold);
	}

	/** 📌 Verificar si el usuario está inactivo */
	private checkInactivity(): void {
		const now = Date.now();
		const isInactive = now - this.lastActivity >= this.inactivityThreshold;

		if (isInactive && !this.wasInactive) {
			this.wasInactive = true;

			console.log("🔴 Emitiendo estado del usuario: inactive");
			this.emit("user_inactive", { status: "inactive" });
		}
	}

	/** 📌 Emitir estado del usuario */
	private emitUserStatus(): void {
		const status = this.isFocused ? "active" : "inactive";
		console.log(`🟡 Emitiendo estado del usuario: ${status}`);
		this.emitThrottled("user_status", { status });
		// this.emit("user_status", { status });
	}
}