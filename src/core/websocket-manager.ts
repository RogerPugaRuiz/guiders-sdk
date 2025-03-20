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

export class WebSocketAdapter implements WebSocketPort {
	socket: Socket | null = null;

	private readonly wsEndpoint: string;
	private readonly tokenService: TokenPort;
	private readonly fingerprintService: FingerprintPort;
	private readonly autoReconnect: boolean;
	private readonly inactivityThreshold: number;

	private lastActivity: number = Date.now();
	private isFocused: boolean = true;
	private inactivityTimeout: number | null = null;
	private wasInactive: boolean = false;

	private lastEmitTime: number = 0;
	private readonly throttleInterval: number = 1000; // 1 seg

	private tokenCheckTimeoutId: number | null = null;

	// Para evitar múltiples refrescos/conexiones simultáneas
	private _isRefreshing = false;

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

		// No conectamos en el constructor (así evitamos duplicaciones).
		// Solo almacenamos la información base y configuramos listeners de actividad.
		this.setupActivityListeners();
	}

	/**
	 * Conectar manualmente el socket.
	 */
	public async connectSocket(): Promise<void> {
		const accessToken = await this.tokenService.getValidAccessToken();
		if (!accessToken) {
			console.warn("No se obtuvo token de acceso. Conexión abortada.");
			return;
		}

		// Si ya hay un socket existente, limpiar listeners y desconectar
		if (this.socket) {
			this.socket.removeAllListeners();
			this.socket.disconnect();
			this.socket = null;
		}

		// Deshabilitamos la reconexión automática de Socket.IO.
		this.socket = io(this.wsEndpoint, {
			auth: { token: accessToken },
			reconnection: false,
			timeout: 10000,
			autoConnect: false,
		});

		// Conectamos (manual) y seteamos listeners
		this.socket.connect();
		this.setEventListeners();
		this.startTokenExpirationCheck();
	}

	public get isConnected(): boolean {
		return this.socket ? this.socket.connected : false;
	}

	public onReconnect(callback: () => void): void {
		if (!this.socket) return;
		this.socket.on("connect", () => {
			console.log("🔁 Reconectado al servidor");
			callback();
		});
	}

	public onDisconnect(callback: () => void): void {
		this.checkSocketExists();
		this.on("disconnect", callback);
	}

	public onError(callback: (error: any) => void): void {
		this.checkSocketExists();
		this.on("error", callback);
	}

	public on(event: string, callback: (...args: any[]) => void): void {
		if (!this.socket) throw new Error("Socket no conectado");
		this.socket.on(event, callback);
	}

	public off(event: string, callback: (...args: any[]) => void): void {
		this.socket?.off(event, callback);
	}

	public sendMsg(eventName: string, payload: any): void {
		this.emit(eventName, payload);
	}

	public waitForConnection(): Promise<void> {
		return new Promise((resolve) => {
			if (this.isConnected) {
				resolve();
			} else {
				this.onReconnect(resolve);
			}
		});
	}

	// --------------------------------------------------------------------
	//  Verificación recursiva del token
	// --------------------------------------------------------------------
	private startTokenExpirationCheck(intervalMs = 30000): void {
		// Cancelamos cualquier verificación previa
		if (this.tokenCheckTimeoutId) {
			clearTimeout(this.tokenCheckTimeoutId);
		}

		const checkToken = async () => {
			try {
				const nearExpiration =
					await this.tokenService.isAccessTokenNearExpiration();
				if (nearExpiration) {
					console.log("🔍 Token cerca de expirar. Renovando...");
					// Renovamos la conexión con un token nuevo
					// Evitamos llamados en paralelo
					if (!this._isRefreshing) {
						this._isRefreshing = true;
						try {
							await this.tokenService.getValidAccessToken();
							// Luego reconectamos manualmente si se desea
							if (this.autoReconnect) {
								await this.connectSocket();
							}
						} catch (err) {
							console.error("Error renovando token:", err);
						} finally {
							this._isRefreshing = false;
						}
					}
				}
			} catch (error) {
				console.error("Error revisando/renovando token:", error);
			} finally {
				// Programamos la siguiente ejecución recursiva
				this.tokenCheckTimeoutId = window.setTimeout(
					checkToken,
					intervalMs
				);
			}
		};

		// Lanzamos la primera ejecución
		this.tokenCheckTimeoutId = window.setTimeout(checkToken, intervalMs);
	}

	private stopTokenExpirationCheck(): void {
		if (this.tokenCheckTimeoutId) {
			clearTimeout(this.tokenCheckTimeoutId);
			this.tokenCheckTimeoutId = null;
			console.log("🚫 Verificación de token detenida.");
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
			// Unirse a una sala específica, si aplica
			this.socket?.emit("join_chat", {
				room: this.fingerprintService.getClientFingerprint(),
			});
		});

		this.socket.on("disconnect", (reason) => {
			console.warn("❌ Desconectado:", reason);
			this.stopTokenExpirationCheck();
		});

		this.socket.on("auth_error", async (error) => {
			console.error("🔴 Error de autenticación:", error);
			// Evitamos múltiples refrescos simultáneos
			if (!this._isRefreshing && !this.tokenService.isTokenRequestInProgress()) {
				this._isRefreshing = true;
				try {
					// Espera breve antes de reintentar
					await new Promise((resolve) => setTimeout(resolve, 2000));
					await this.tokenService.getValidAccessToken();
				} catch (err) {
					console.error("Error al refrescar token:", err);
				} finally {
					this._isRefreshing = false;
				}
			}
			// Desconectamos socket (para reiniciar todo con nuevo token)
			this.socket?.disconnect();

			if (this.autoReconnect) {
				// Reconexión manual
				await this.connectSocket();
			}
		});

		// Log de todos los eventos
		this.socket.onAny((event, ...args) => {
			console.log(`📡 Evento recibido: ${event}`, args);
		});
	}

	/**
	 * Listeners de actividad/inactividad del usuario y cambio de foco
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
				console.log("Página en foco. Verificando reconexión socket...");
				if (this.autoReconnect && (!this.socket || !this.socket.connected)) {
					this.connectSocket();
				}
			}
			this.emitUserStatus();
		});
	}

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

	private resetInactivityTimer(): void {
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		this.inactivityTimeout = window.setTimeout(
			() => this.checkInactivity(),
			this.inactivityThreshold
		);
	}

	private checkInactivity(): void {
		const now = Date.now();
		const isInactive = now - this.lastActivity >= this.inactivityThreshold;
		if (isInactive && !this.wasInactive) {
			this.wasInactive = true;
			console.log("🔴 Emitiendo estado del usuario: inactive");
			this.emit("user_inactive", { status: "inactive" });
		}
	}

	private emitUserStatus(): void {
		const status = this.isFocused ? "active" : "inactive";
		console.log(`🟡 Emitiendo estado del usuario: ${status}`);
		this.emitThrottled("user_status", { status });
	}

	private emit(event: string, data: any): void {
		this.socket?.emit(event, data);
	}

	private emitThrottled(event: string, data: any): void {
		const now = Date.now();
		if (now - this.lastEmitTime >= this.throttleInterval) {
			this.socket?.emit(event, data);
			this.lastEmitTime = now;
		}
	}

	private checkSocketExists(): void {
		if (!this.socket) {
			throw new Error("No se ha conectado el socket al servidor");
		}
	}
}
