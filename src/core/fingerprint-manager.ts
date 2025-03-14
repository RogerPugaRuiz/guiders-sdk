import { ClientJS } from "clientjs";
import { FingerprintPort } from "../interfaces/fingerprint.interface";

export class FingerprintAdapter implements FingerprintPort {
	getClientFingerprint(): string {
		const currentFingerPrint = localStorage.getItem("client") || new ClientJS().getFingerprint().toString();
		localStorage.setItem("client", currentFingerPrint);
		return currentFingerPrint;
	}
}