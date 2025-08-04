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
export * from "./core/session-tracking-manager";
export * from "./pipeline/pipeline-stage";
export * from "./pipeline/stages/token-stage";
export * from "./services/unread-messages-service";
export * from "./services/chat-detail-service";
export * from "./services/chat-v2-service";
export * from "./types";
// Se pueden exportar más etapas o servicios según se vayan implementando.

declare global {
	interface Window {
		TrackingPixelSDK: typeof TrackingPixelSDK;
		guiders: TrackingPixelSDK;
		GUIDERS_API_KEY: string;
		GUIDERS_CONFIG?: {
			apiKey: string;
			[key: string]: any;
		};
		RocketLazyLoadScripts?: any;
	}
}

// Función de inicialización del SDK
function initializeGuidersSDK() {
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
			},
			// Enable session tracking by default
			sessionTracking: {
				enabled: true,
				config: {
					enabled: true,
					heartbeatInterval: 30000, // 30 seconds
					trackBackgroundTime: false
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
		console.error("Error inicializando Guiders SDK:", error);
	}
}

// Si estamos en un entorno de navegador, asignamos los módulos al objeto global.
if (typeof window !== "undefined") {
	// Añadir delay inicial para WP Rocket - esto permite que WP Rocket procese el script correctamente
	setTimeout(() => {
		if (!window.guiders) {
			// Configurar listeners para WP Rocket ANTES de que el DOM esté listo
			// Esto es crucial porque WP Rocket puede activar scripts en cualquier momento
			const setupWPRocketListeners = () => {
				// Listener para cuando WP Rocket activa un script
				document.addEventListener('rocket-script-loaded', (event) => {
					// Verificar si el script activado es el nuestro
					const target = event.target as HTMLScriptElement;
					if (!window.guiders && target && target.src && 
						(target.src.includes('guiders') || target.src.includes('apiKey='))) {
						setTimeout(initializeGuidersSDK, 10);
					}
				});

				// Listener para cuando todos los scripts lazy de WP Rocket se han cargado
				document.addEventListener('rocket-loaded', () => {
					if (!window.guiders) {
						setTimeout(initializeGuidersSDK, 10);
					}
				});
			};

			// Configurar listeners inmediatamente
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', setupWPRocketListeners);
			} else {
				setupWPRocketListeners();
			}

			// Verificar si el SDK ya fue inicializado para evitar múltiples inicializaciones
			// Caso 1: Inicialización inmediata (script normal)
			if (document.readyState === 'loading') {
				// Si el documento está cargando, esperar a que esté listo
				document.addEventListener('DOMContentLoaded', initializeGuidersSDK);
			} else {
				// Si el documento ya está listo, inicializar inmediatamente
				initializeGuidersSDK();
			}

			// Caso 2: Fallback adicional para WP Rocket
			// Algunos plugins pueden usar un evento diferente o tener delays
			if (typeof window.RocketLazyLoadScripts !== 'undefined' || 
				document.querySelector('script[type="rocketlazyloadscript"]')) {
				// WP Rocket está presente, intentar inicializar después de un breve delay
				setTimeout(() => {
					if (!window.guiders) {
						initializeGuidersSDK();
					}
				}, 100);
				
				// Fallback adicional para casos extremos
				setTimeout(() => {
					if (!window.guiders) {
						initializeGuidersSDK();
					}
				}, 500);
			}
		}
	}, 500); // Delay inicial para WP Rocket - mismo que funcionó manual
}

function findGuidersScript(): HTMLScriptElement | null {
	const scripts = Array.from(document.getElementsByTagName('script'));

	// Método 1: Buscar por atributo específico del SDK (más confiable para WP Rocket)
	for (const script of scripts) {
		if (script.getAttribute("data-guiders-sdk")) {
			return script;
		}
	}

	// Método 2: document.currentScript (funciona en carga normal)
	if (document.currentScript && document.currentScript instanceof HTMLScriptElement) {
		// Verificar que realmente sea nuestro script
		const current = document.currentScript;
		if (current.getAttribute("data-api-key") || 
			current.getAttribute("data-apikey") ||
			(current.src && (current.src.includes('apiKey=') || current.src.includes('apikey=') || current.src.includes('guiders')))) {
			return current;
		}
	}

	// Método 3: Buscar por atributos de API key
	for (const script of scripts) {
		if (script.getAttribute("data-api-key") || script.getAttribute("data-apikey")) {
			return script;
		}
	}

	// Método 4: Buscar por parámetros apiKey en la URL del script
	for (const script of scripts) {
		if (script.src && (script.src.includes('apiKey=') || script.src.includes('apikey='))) {
			return script;
		}
	}

	// Método 5: Buscar scripts que contengan 'guiders' en el src
	for (const script of scripts) {
		if (script.src && script.src.includes('guiders')) {
			return script;
		}
	}

	// Método 6: Buscar por nombres comunes del SDK con parámetros
	for (const script of scripts) {
		if (script.src && (script.src.includes('tracking') || script.src.includes('index.js'))) {
			// Verificar si tiene parámetros que parezcan una API key
			if (script.src.includes('apiKey=') || script.src.includes('apikey=')) {
				return script;
			}
		}
	}

	// Método 7: Fallback - buscar el último script con src que pueda ser nuestro SDK
	const scriptsWithSrc = scripts.filter(s => s.src && 
		(s.src.includes('.js') || s.src.includes('index')));
	
	for (let i = scriptsWithSrc.length - 1; i >= 0; i--) {
		const script = scriptsWithSrc[i];
		// Si tiene algún indicio de ser nuestro SDK
		if (script.src.includes('guiders') || 
			script.src.includes('tracking') ||
			script.src.includes('apiKey=') ||
			script.src.includes('apikey=')) {
			return script;
		}
	}

	return null;
}

function getParams(): {
	apiKey: string;
} {
	const script = findGuidersScript();
	if (!script) {
		throw new Error("No se encontró el script del SDK Guiders. Asegúrate de incluir el atributo data-api-key.");
	}

	// Primero intenta obtener la clave desde el atributo data-api-key o data-apikey
	let apiKey = script.getAttribute("data-api-key") || script.getAttribute("data-apikey");

	// Si no está en los atributos, intenta obtenerla desde la URL del src
	if (!apiKey && script.src) {
		const query = script.src.split('?')[1];
		if (query) {
			const params = new URLSearchParams(query);
			apiKey = params.get('apiKey') || params.get('apikey');
		}
	}

	// Método adicional: buscar en window.GUIDERS_CONFIG si existe
	if (!apiKey && typeof window !== 'undefined' && (window as any).GUIDERS_CONFIG) {
		apiKey = (window as any).GUIDERS_CONFIG.apiKey;
	}

	if (!apiKey) {
		throw new Error("No se encontró la clave API. Usa data-api-key=\"tu-clave\" en el script o configura window.GUIDERS_CONFIG = {apiKey: 'tu-clave'}.");
	}
	
	return {
		apiKey,
	};
}
