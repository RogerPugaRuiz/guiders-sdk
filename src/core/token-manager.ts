export class TokenManager {
	private static token: string | null = null;

	public static setToken(newToken: string): void {
		this.token = newToken;
	}

	public static getToken(): string | null {
		return this.token;
	}

	public static attachTokenToEvent<T extends { token?: string }>(event: T): T {
		if (this.token) {
			event.token = this.token;
		}
		return event;
	}
}
