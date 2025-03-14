import { TokenAdapter } from "./core/token-manager";
import { FingerprintAdapter } from "./core/fingerprint-manager";
import { WebSocketAdapter } from "./core/websocket-manager";
import { GuidersPixel } from "./pixel/guiders-pixel";
import { TokenPort } from "./interfaces/token.interface";
import { WebSocketPort } from "./interfaces/websocket.interface";
import { SocketFactory } from "./factories/socket.factory";
import { TokenFactory } from "./factories/token.factory";

declare global {
	interface Window {
		guidersPixel: GuidersPixel;
	}
}

const fingerprintService = FingerprintAdapter.getInstance();
const tokenService = TokenFactory.getInstance('http://localhost:3000/pixel');
const socketService = SocketFactory.getInstance('ws://localhost:3000/tracking', {
	autoReconnect: true,
	inactivityThreshold: 60 * 1000 // 1 minuto
});

window.guidersPixel = new GuidersPixel({
	fingerprintService,
	tokenService,
	socketService
});