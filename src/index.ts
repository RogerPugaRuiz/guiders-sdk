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
		GUIDERS_API_KEY: string;
	}
}

// Si estamos en un entorno de navegador, asignamos los módulos al objeto global.
if (typeof window !== "undefined") {
	document.addEventListener("DOMContentLoaded", () => {
		try {
			const { apiKey } = getParams();
			window.GUIDERS_API_KEY = apiKey;
			window.TrackingPixelSDK = TrackingPixelSDK;
			window.guiders = new window.TrackingPixelSDK({
				// endpoint: "https://guiders-backend-production.up.railway.app",
				endpoint: "https://guiders.ancoradual.com/api",
				apiKey,
				autoFlush: true,
				flushInterval: 1000, // 1 second
				maxRetries: 2,
			});
			(async () => {
				await window.guiders.init();
				window.guiders.enableDOMTracking();
			})();
		} catch (error) {
			console.error(error);
		}
	});
}

function getParams(): {
	apiKey: string;
} {
	const script = document.currentScript;
	if (!script) {
		throw new Error("No se encontró el script actual.");
	}

	// Primero intenta obtener la clave desde el atributo data-api-key o data-apikey
	let apiKey = script.getAttribute("data-api-key") || script.getAttribute("data-apikey");

	// Si no está en los atributos, intenta obtenerla desde la URL del src
	if (!apiKey && script instanceof HTMLScriptElement && script.src) {
		const query = script.src.split('?')[1];
		if (query) {
			const params = new URLSearchParams(query);
			apiKey = params.get('apiKey') || params.get('apikey');
		}
	}

	if (!apiKey) {
		throw new Error("No se encontró la clave API en el script ni en la URL.");
	}
	return {
		apiKey,
	};
}
