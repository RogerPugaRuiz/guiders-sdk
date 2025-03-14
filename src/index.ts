import { TokenAdapter } from "./core/token-manager";
import { FingerprintAdapter } from "./core/fingerprint-manager";
import { WebSocketAdapter } from "./core/websocket-manager";
import { GuidersPixel } from "./pixel/guiders-pixel";

const fingerprintService = new FingerprintAdapter();
const tokenService = new TokenAdapter('http://localhost:3000/pixel', fingerprintService);
const socketService = new WebSocketAdapter('ws://localhost:3000/tracking', {
	autoReconnect: true,
	inactivityThreshold: 60 * 1000 // 1 minuto
}, { tokenService });

(window as any).guidersPixel = new GuidersPixel({
	fingerprintService,
	tokenService,
	socketService
});