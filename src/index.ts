// src/index.ts

import { TokenManager } from "./core/token-manager";
import { TrackingPixelSDK } from "./core/tracking-pixel-SDK";
import { UnreadMessagesService } from "./services/unread-messages-service";
import { BotDetector } from "./core/bot-detector";

export * from "./core/tracking-pixel-SDK";
export * from "./core/token-manager";
export * from "./core/bot-detector";
export * from "./core/dom-tracking-manager";
export * from "./core/enhanced-dom-tracking-manager";
export * from "./core/heuristic-element-detector";
export * from "./core/url-page-detector";
export * from "./pipeline/pipeline-stage";
export * from "./pipeline/stages/token-stage";
export * from "./services/unread-messages-service";
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
	try {
		const { apiKey } = getParams();
		window.GUIDERS_API_KEY = apiKey;
		window.TrackingPixelSDK = TrackingPixelSDK;

		// Detectar entorno por variable de entorno NODE_ENV
		console.log("Entorno de desarrollo:", process.env.NODE_ENV);
		const isDev = process.env.NODE_ENV === 'development';
		console.log("Entorno de desarrollo:", isDev);
		const endpoint = isDev ? "http://localhost:3000" : "https://guiders.ancoradual.com/api";
		const webSocketEndpoint = isDev ? "ws://localhost:3000" : "wss://guiders.ancoradual.com";

		const sdkOptions: any = {
			apiKey,
			autoFlush: true,
			flushInterval: 1000, // 1 second
			maxRetries: 2,
			// Enable heuristic detection by default
			heuristicDetection: {
				enabled: true,
				config: {
					enabled: true,
					confidenceThreshold: 0.7,
					fallbackToManual: true
				}
			}
		};
		if (!isDev) {
			sdkOptions.endpoint = endpoint;
			sdkOptions.webSocketEndpoint = webSocketEndpoint;
		}

		// Detectar bots antes de inicializar el SDK
		const detector = new BotDetector();
		detector.detect().then(result => {
			if (result.isBot) {
				console.log("Bot detectado. Probabilidad:", result.probability);
				console.log("Detalles:", result.details);
				return; // No inicializar el SDK
			}

			// Solo inicializar el SDK para usuarios legítimos
			window.guiders = new window.TrackingPixelSDK(sdkOptions);
			
			(async () => {
				// Inicializar el servicio de mensajes no leídos
				const unreadService = UnreadMessagesService.getInstance();
				console.log("Servicio de mensajes no leídos inicializado");
				
				// Forzar una actualización inicial del contador para que se muestre correctamente
				unreadService.forceUpdate();
				
				await window.guiders.init();
				// Use new automatic tracking method
				window.guiders.enableAutomaticTracking();
			})();
		});
	} catch (error) {
		console.error(error);
	}
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
