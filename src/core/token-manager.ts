// src/core/token-manager.ts
import { fetchTokens, refreshToken } from "../services/token-service";
import { TrackingEvent } from "../types/index";
import { ClientJS } from "clientjs";

type TokenChangeSubscriber = (token: string) => void;

export class TokenManager {
	private static accessToken: string | null = null;
	private static refreshToken: string | null = null;
	private static expirationTime: number | null = null;
	private static tokenMonitorInterval: NodeJS.Timeout | null = null;
	private static tokenChangeSubscribers: TokenChangeSubscriber[] = [];

	/**
	 * Agrega un suscriptor de cambios en el token.
	 * @param subscriber 
	 */
	public static subscribeToTokenChanges(subscriber: TokenChangeSubscriber) {
		this.tokenChangeSubscribers.push(subscriber);
	}

	/**
	 * Remueve un suscriptor de cambios en el token.
	 * @param subscriber 
	 */
	public static unsubscribeFromTokenChanges(subscriber: TokenChangeSubscriber) {
		const index = this.tokenChangeSubscribers.indexOf(subscriber);
		if (index >= 0) {
			this.tokenChangeSubscribers.splice(index, 1);
		}
	}

	/**
	 * Notifica a los suscriptores que el token ha cambiado.
	 * @param token 
	 */
	private static notifyTokenChange(token: string) {
		this.tokenChangeSubscribers.forEach(subscriber => subscriber(token));
	}

	/**
	 * Guarda los tokens y su expiración en memoria y localStorage.
	 * @param tokens Tokens de acceso y refresco.
	 * @returns void
	 */
	public static setTokens(tokens: { access_token: string; refresh_token: string }) {
		this.accessToken = tokens.access_token;
		this.refreshToken = tokens.refresh_token;
		localStorage.setItem("accessToken", tokens.access_token);
		localStorage.setItem("refreshToken", tokens.refresh_token);

		this.setExpirationTime(tokens.access_token);
	}

	/**
	 * Guardar access token en memoria y localStorage.
	 * @param token Access token.
	 * @returns void
	 */
	public static setAccessToken(token: string) {
		this.accessToken = token;
		localStorage.setItem("accessToken", token);

		this.setExpirationTime(token);
	}

	/**
	 * Verifica si el token está a punto de expirar (dentro de 60 segundos).
	 */
	public static isTokenExpiring(threshold: number = 60): boolean {
		if (!this.expirationTime) return true; // Si no hay expiración, asumir que expira pronto.
		const currentTime = Math.floor(Date.now() / 1000);
		return (this.expirationTime - currentTime) < threshold;
	}

	/**
	 * Obtiene un access token válido, refrescándolo si es necesario.
	 */
	public static async getValidAccessToken(): Promise<string | null> {
		if (this.isTokenExpiring()) {
			console.log("Access token está a punto de expirar, intentando refrescar...");
			if (!this.refreshToken) {
				console.error("No hay refresh token disponible.");
				return null;
			}
			try {
				const newToken = await refreshToken(this.refreshToken);
				this.setTokens({ access_token: newToken.access_token, refresh_token: this.refreshToken });
				console.log("Token refrescado exitosamente.");
			} catch (error) {
				console.error(error);
				const client = new ClientJS();
				const fingerprint = localStorage.getItem("fingerprint") || client.getFingerprint().toString();
				const tokens = await fetchTokens(fingerprint);
				this.setTokens(tokens);
				return tokens.access_token;
			}
		}
		return this.accessToken;
	}

	/**
	 * Carga los tokens desde localStorage
	 * @returns true si se cargaron los tokens, false en caso contrario.
	 */
	public static loadTokensFromStorage(): boolean {
		try {
			const accessToken = localStorage.getItem("accessToken");
			const refreshToken = localStorage.getItem("refreshToken");
			const expirationTimeStr = localStorage.getItem("tokenExpiration");

			// Validar que los tokens existen
			if (!accessToken || !refreshToken || !expirationTimeStr) {
				return false;
			}

			// Convertir la expiración a número y validar
			const expirationTime = parseInt(expirationTimeStr, 10);
			if (isNaN(expirationTime) || expirationTime <= 0) {
				return false;
			}

			// Asignar los valores validados
			this.accessToken = accessToken;
			this.refreshToken = refreshToken;
			this.expirationTime = expirationTime;

			return true;
		} catch (error) {
			console.error("Error al cargar tokens desde almacenamiento:", error);
			return false;
		}
	}


	/**
	 * Adjunta el token a un evento de seguimiento.
	 * @param event 
	 * @returns 
	 */
	public static attachTokenToEvent<T extends TrackingEvent>(event: T): T {
		if (!this.accessToken) {
			console.error("No hay access token disponible.");
			return event;
		}
		console.log("🔒 Adjuntando token al evento.");
		return {
			...event,
			token: this.accessToken
		};
	}

	/**
	 * Inicia un monitor que revisa el estado del token cada 10 segundos y lo refresca si es necesario.
	 */
	public static startTokenMonitor(): void {
		if (this.tokenMonitorInterval) {
			console.warn("Token monitor ya está corriendo.");
			return;
		}

		this.tokenMonitorInterval = setInterval(async () => {
			console.log("⏳ Verificando el estado del token...");
			if (this.isTokenExpiring()) {
				console.log("⚠️ Token a punto de expirar, intentando refrescar...");
				const token = await this.getValidAccessToken();
				if (token) {
					this.notifyTokenChange(token);
					console.log("✅ Token refrescado automáticamente.");
				} else {
					console.error("❌ No se pudo refrescar el token.");
				}
			}
		}, 10000); // Cada 10 segundos
		console.log("🟢 Token monitor iniciado.");
	}

	/**
	 * Detiene el monitor de tokens.
	 */
	public static stopTokenMonitor(): void {
		if (this.tokenMonitorInterval) {
			clearInterval(this.tokenMonitorInterval);
			this.tokenMonitorInterval = null;
			console.log("🛑 Token monitor detenido.");
		}
	}

	private static setExpirationTime(access_token: string) {
		// Decodificar la expiración del token
		try {
			const payloadBase64 = access_token.split(".")[1];
			const payloadJson = atob(payloadBase64);
			const payload = JSON.parse(payloadJson);
			this.expirationTime = payload.exp; // Tiempo UNIX en segundos
			localStorage.setItem("tokenExpiration", payload.exp.toString());
		} catch (error) {
			console.error("Error al decodificar el token:", error);
			this.expirationTime = null;
		}
	}
}
