import { io, Socket } from "socket.io-client";
import { TokenPort } from "../interfaces/token.interface";
import { WebSocketPort } from "../interfaces/websocket.interface";
import { FingerprintPort } from "../interfaces/fingerprint.interface";

interface WebSocketOptions {
	autoReconnect: boolean;
	inactivityThreshold: number;
}

interface WebSocketProviders {
	tokenService: TokenPort;
	fingerprintService: FingerprintPort;
}

/**
 * WebSocketAdapter
 * Maneja la conexión WebSocket con lógica de:
 *  - Auto-reconexión
 *  - Detección de actividad/inactividad
 *  - Desconexión si la pestaña no está en foco
 */
export class WebSocketAdapter implements WebSocketPort {
	/**
	 * Socket de Socket.IO
	 */
	private socket: Socket | null = null;

	/**
	 * Endpoint del servidor de WebSocket
	 */
	private readonly wsEndpoint: string;

	/**
	 * Servicios y opciones
	 */
	private readonly tokenService: TokenPort;
	private readonly fingerprintService: FingerprintPort;
	private readonly autoReconnect: boolean;
	private readonly inactivityThreshold: number;

	/**
	 * Estado de actividad
	 */
	private lastActivity: number = Date.now();
	private isFocused: boolean = true;         // Indica si la pestaña está en foco
	private inactivityTimeout: number | null = null;
	private wasInactive: boolean = false;

	/**
	 * Control de emisiones (throttling)
	 */
	private lastEmitTime: number = 0;
	private readonly throttleInterval: number = 1000; // 1 segundo

	constructor(
		wsEndpoint: string,
		options: WebSocketOptions,
		providers: WebSocketProviders
	) {
		this.wsEndpoint = wsEndpoint;
		this.autoReconnect = options.autoReconnect;
		this.inactivityThreshold = options.inactivityThreshold;
		this.tokenService = providers.tokenService;
		this.fingerprintService = providers.fingerprintService;

		this.setupActivityListeners();
	}

	/**
	 * Conecta el socket con el servidor
	 */
	public async connectSocket(): Promise<void> {
		try {
			const accessToken = await this.tokenService.getValidAccessToken();
			if (!accessToken) {
				console.warn("No se obtuvo token de acceso. Conexión abortada.");
				return;
			}

			this.socket = io(this.wsEndpoint, {
				auth: { token: accessToken },
				reconnection: true,
				reconnectionAttempts: 10,
				reconnectionDelay: 500,
				reconnectionDelayMax: 3000,
				timeout: 10000,
				autoConnect: false,
			}).connect();

			this.setEventListeners();
		} catch (error) {
			console.error("Error al obtener token de acceso:", error);
			// Manejo personalizado en caso de error de token
		}
	}

	/**
	 * Devuelve si el socket está conectado
	 */
	public get isConnected(): boolean {
		return this.socket ? this.socket.connected : false;
	}

	/**
	 * Callback al reconectar
	 */
	public onReconnect(callback: () => void): void {
		this.checkSocketExists();
		this.on("connect", callback);
	}

	/**
	 * Callback al desconectar
	 */
	public onDisconnect(callback: () => void): void {
		this.checkSocketExists();
		this.on("disconnect", callback);
	}

	/**
	 * Callback de error
	 */
	public onError(callback: (error: any) => void): void {
		this.checkSocketExists();
		this.on("error", callback);
	}

	/**
	 * Suscribirse a un evento custom
	 */
	public on(event: string, callback: (...args: any[]) => void): void {
		this.socket?.on(event, callback);
	}

	/**
	 * Desuscribirse de un evento custom
	 */
	public off(event: string, callback: (...args: any[]) => void): void {
		this.socket?.off(event, callback);
	}

	/**
	 * Emitir evento sin restricciones
	 */
	private emit(event: string, data: any): void {
		this.socket?.emit(event, data);
	}

	/**
	 * Emitir evento con throttling
	 * para no spamear el servidor
	 */
	private emitThrottled(event: string, data: any): void {
		const now = Date.now();
		if (now - this.lastEmitTime >= this.throttleInterval) {
			this.socket?.emit(event, data);
			this.lastEmitTime = now;
		}
	}

	/**
	 * Configura los listeners principales de Socket.IO
	 */
	private setEventListeners(): void {
		if (!this.socket) return;

		this.socket.on("connect", () => {
			console.log("✅ Conectado al servidor");
			this.emitUserStatus();

			// Unir a una sala/room específica si se desea
			this.socket?.emit("join_chat", {
				room: this.fingerprintService.getClientFingerprint(),
			});
		});

		this.socket.on("disconnect", (reason) => {
			console.warn("❌ Desconectado:", reason);
		});

		this.socket.on("auth_error", async (error) => {
			console.error("🔴 Error de autenticación:", error);

			// Si no se está renovando token, intentalo
			if (!this.tokenService.isTokenRequestInProgress()) {
				// Esperar un poco antes de reintentar
				await new Promise((resolve) => setTimeout(resolve, 2000));
				await this.tokenService.getValidAccessToken();
			}

			if (this.autoReconnect) {
				this.socket?.disconnect();
				this.connectSocket();
			}
		});

		// Loggea todos los eventos recibidos
		this.socket.onAny((event, ...args) => {
			console.log(`📡 Evento recibido: ${event}`, args);
		});
	}

	/**
	 * Suscribir eventos de actividad del usuario (ratón, teclado, scroll...)
	 * y control de foco (visibilitychange)
	 */
	private setupActivityListeners(): void {
		const userEvents = ["mousemove", "keydown", "scroll", "touchstart"];
		userEvents.forEach((evt) => {
			document.addEventListener(evt, () => this.registerActivity());
		});

		document.addEventListener("visibilitychange", () => {
			this.isFocused = !document.hidden;
			if (!this.isFocused) {
				console.log("Página no en foco. Desconectando socket...");
				if (this.socket?.connected) {
					this.socket.disconnect();
				}
			} else {
				console.log("Página en foco. Reconectando socket...");
				if (this.autoReconnect && (!this.socket || !this.socket.connected)) {
					this.connectSocket();
				}
			}
			this.emitUserStatus();
		});
	}

	/**
	 * Registrar la actividad del usuario
	 * - Si estaba inactivo, emite "user_active"
	 * - Reinicia el temporizador de inactividad
	 */
	private registerActivity(): void {
		this.lastActivity = Date.now();

		if (this.wasInactive) {
			this.wasInactive = false;
			console.log("🟢 Emitiendo estado del usuario: active");
			this.emit("user_active", { status: "active" });
		}

		this.emitUserStatus();
		this.resetInactivityTimer();
	}

	/**
	 * Reinicia el temporizador para chequear inactividad
	 */
	private resetInactivityTimer(): void {
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		// Programar check de inactividad
		this.inactivityTimeout = window.setTimeout(
			() => this.checkInactivity(),
			this.inactivityThreshold
		);
	}

	/**
	 * Verifica si el usuario está inactivo
	 */
	private checkInactivity(): void {
		const now = Date.now();
		const isInactive = now - this.lastActivity >= this.inactivityThreshold;

		if (isInactive && !this.wasInactive) {
			this.wasInactive = true;
			console.log("🔴 Emitiendo estado del usuario: inactive");
			this.emit("user_inactive", { status: "inactive" });
		}
	}

	/**
	 * Emite el estado del usuario (active/inactive) con throttling
	 */
	private emitUserStatus(): void {
		const status = this.isFocused ? "active" : "inactive";
		console.log(`🟡 Emitiendo estado del usuario: ${status}`);
		this.emitThrottled("user_status", { status });
	}

	/**
	 * Verifica si el socket existe antes de usarlo
	 */
	private checkSocketExists(): void {
		if (!this.socket) {
			throw new Error("No se ha conectado el socket al servidor");
		}
	}
}
