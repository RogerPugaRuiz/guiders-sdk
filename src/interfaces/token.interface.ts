export interface TokenPort {
	isTokenRequestInProgress(): boolean;
	getValidAccessToken(): Promise<string | null>;
}