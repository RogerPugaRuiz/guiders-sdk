import { FingerprintPort } from "../interfaces/fingerprint.interface";
import { TokenPort } from "../interfaces/token.interface";

export class TokenAdapter implements TokenPort {
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private endpoint: string;
	private tokenRequestInProgress: boolean = false;

	constructor(endpoint: string, private readonly fingerPrint: FingerprintPort) {
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
			const client = this.fingerPrint.getClientFingerprint();
			const response = await fetch(`${this.endpoint}/token`, {
				method: "POST",
				headers: this.getHeaders(),
				body: JSON.stringify({ client }),
			});

			if (!response.ok) throw new Error("Error obteniendo tokens");

			const { access_token, refresh_token } = await response.json();
			this.storeTokens(access_token, refresh_token);
		} catch (error: any) {
			console.error(`Error solicitando tokens (Intento ${retryCount}):`, error);

			if (error.message === "Account not found") {
				console.error("🚨 La cuenta no fue encontrada.");
			}

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
