import { ClientJS } from "clientjs";
import { FingerprintPort } from "../interfaces/fingerprint.interface";

export class FingerprintAdapter implements FingerprintPort {
	private static instance: FingerprintAdapter;
	private constructor() {}
	static getInstance(): FingerprintAdapter {
		if (!FingerprintAdapter.instance) {
			FingerprintAdapter.instance = new FingerprintAdapter();
		}
		return FingerprintAdapter.instance;
	}
	
	getClientFingerprint(): string {
		const currentFingerPrint = localStorage.getItem("client") || new ClientJS().getFingerprint().toString();
		localStorage.setItem("client", currentFingerPrint);
		return currentFingerPrint;
	}
}