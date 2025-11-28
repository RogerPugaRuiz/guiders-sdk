// src/core/token-manager.ts
import { PixelEvent } from "../types/index";
import { ClientJS } from "clientjs";
import { debugLog } from '../utils/debug-logger';

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
			debugLog("Access token expirando, solicitando nuevos tokens...");
			debugLog("❌ No hay servicio de tokens disponible.");
			return null;
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
			return false;
		}
	}

	/**
	 * Verifica si hay tokens válidos en la memoria.
	 * @returns true si existen access_token y refresh_token, false en caso contrario.
	 */
	public static hasValidTokens(): boolean {
		return !!this.accessToken && !!this.refreshToken;
	}


	/**
	 * Adjunta el token a un evento de seguimiento.
	 * @param event 
	 * @returns 
	 */
	public static attachTokenToEvent<T extends PixelEvent>(event: T): T {
		if (!this.accessToken) {
			return event;
		}
		debugLog("🔒 Adjuntando token al evento.");
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
			return;
		}

		this.tokenMonitorInterval = setInterval(async () => {
			debugLog("⏳ Verificando el estado del token...");
			if (this.isTokenExpiring()) {
				debugLog("⚠️ Token a punto de expirar, intentando refrescar...");
				const token = await this.getValidAccessToken();
				if (token) {
					this.notifyTokenChange(token);
					debugLog("✅ Token refrescado automáticamente.");
				} else {
				}
			}
		}, 10000); // Cada 10 segundos
		debugLog("🟢 Token monitor iniciado.");
	}

	/**
	 * Detiene el monitor de tokens.
	 */
	public static stopTokenMonitor(): void {
		if (this.tokenMonitorInterval) {
			clearInterval(this.tokenMonitorInterval);
			this.tokenMonitorInterval = null;
			debugLog("🛑 Token monitor detenido.");
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
			this.expirationTime = null;
		}
	}
}
