import { TokenAdapter } from "../core/token-manager";
import { TokenPort } from "../interfaces/token.interface";
import { FingerprintAdapter } from "../core/fingerprint-manager";

export class TokenFactory {
	private static readonly instances: Map<string, TokenPort> = new Map();

	public static getInstance(endpoint: string): TokenPort {
		if (!this.instances.has(endpoint)) {
			const fingerprintService = FingerprintAdapter.getInstance();
			this.instances.set(endpoint, new TokenAdapter(endpoint, fingerprintService));
		}

		return this.instances.get(endpoint)!;
	}

	public static removeInstance(endpoint: string): void {
		this.instances.delete(endpoint);
	}

	public static removeAllInstances(): void {
		this.instances.clear();
	}

	public static getInstances(): Map<string, TokenPort> {
		return this.instances;
	}

	public static clearInstances(): void {
		this.instances.clear();
	}
}