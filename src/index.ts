// src/index.ts

import { TokenManager } from "./core/token-manager";
import { TrackingPixelSDK } from "./core/tracking-pixel-SDK";

export * from "./core/tracking-pixel-SDK";
export * from "./core/token-manager";
export * from "./pipeline/pipeline-stage";
export * from "./pipeline/stages/token-stage";
export * from "./types";
// Se pueden exportar más etapas o servicios según se vayan implementando.


declare global {
	interface Window {
		TrackingPixelSDK: typeof TrackingPixelSDK;
		guiders: TrackingPixelSDK;
	}
}

// Si estamos en un entorno de navegador, asignamos los módulos al objeto global.
if (typeof window !== "undefined") {
	// Para evitar problemas de módulos, asegúrate de que estas importaciones
	// se correspondan con la salida compilada de tu proyecto.
	window.TrackingPixelSDK = TrackingPixelSDK;
	window.guiders = new window.TrackingPixelSDK({
		// endpoint: "https://guiders-backend-production.up.railway.app",
		apiKey: "49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763",
		autoFlush: true,
		flushInterval: 1000, // 1 second
		maxRetries: 2,
	});

	window.guiders.init();
	(async () => {
		await window.guiders.init();
		window.guiders.enableDOMTracking();
	})();
}