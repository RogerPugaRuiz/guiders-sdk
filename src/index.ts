import { TokenManager } from "./core/token-manager";
import { TrackingPixelSDK } from "./core/tracking-pixel-SDK";
import { BotDetector } from "./core/bot-detector";
import { resolveDefaultEndpoints } from "./core/endpoint-resolver";
import { ActiveHoursConfig } from './types';
import { debugLog, debugWarn, debugError } from "./utils/debug-logger";

// NOTA: dev-random-messages se carga dinámicamente solo en modo dev (ver línea ~126)
// NO importar estáticamente para evitar incluirlo en el bundle de producción

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
export * from "./services/chat-detail-service";
export * from "./services/chat-v2-service";
export * from "./services/consent-backend-service";
export * from "./core/consent-manager";
export * from "./types";
// Debug utilities
export { debugLog, debugInit, debugWarn, debugError, enableDebug, disableDebug } from "./utils/debug-logger";
// Se pueden exportar más etapas o servicios según se vayan implementando.

declare global {
	interface Window {
		TrackingPixelSDK: typeof TrackingPixelSDK;
		guiders: TrackingPixelSDK;
		GUIDERS_API_KEY: string;
		GUIDERS_CONFIG?: {
			apiKey: string;
			activeHours?: Partial<ActiveHoursConfig>;
			[key: string]: any;
		};
		RocketLazyLoadScripts?: any;
		__GUIDERS_INITIALIZING__?: boolean; // Guard interno
		// Funcionalidad dev para mensajes aleatorios
		guidersDevRandomMessages?: {
			trigger: (chatId: string, count?: number) => Promise<void>;
			setConfig: (config: any) => void;
			getConfig: () => any;
			isEnabled: () => boolean;
			isGenerating: () => boolean;
		};
	}
}

// Función de inicialización del SDK
function normalizeEndpoint(url: string): string {
	// Eliminar espacios y slashes duplicados al final
	return url.replace(/\s+/g, '').replace(/\/+$/, '');
}

const resolveEndpoints = resolveDefaultEndpoints;

function initializeGuidersSDK() {
	// Guard contra inicializaciones múltiples (race de timeouts / eventos)
	if (window.guiders || window.__GUIDERS_INITIALIZING__) {
		debugWarn('[Guiders SDK] ❌ Inicialización ignorada: instancia existente o en progreso');
		return;
	}
	window.__GUIDERS_INITIALIZING__ = true;
	try {
		const { apiKey } = getParams();
		window.GUIDERS_API_KEY = apiKey;
		window.TrackingPixelSDK = TrackingPixelSDK;

		const { endpoint, webSocketEndpoint, isProd } = resolveEndpoints();
		debugLog('[Guiders SDK] 🌐 Endpoints resueltos:', { endpoint, webSocketEndpoint, isProd });

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
			},
			endpoint,
			webSocketEndpoint
		};

		// Merge with GUIDERS_CONFIG if it exists (WordPress or custom configuration)
		if (window.GUIDERS_CONFIG) {
			// Merge config properties
			Object.keys(window.GUIDERS_CONFIG).forEach(key => {
				sdkOptions[key] = window.GUIDERS_CONFIG![key];
			});
		}

		// Detectar bots antes de inicializar el SDK
		const detector = new BotDetector();
		detector.detect().then(result => {
			if (result.isBot) {
				debugLog("Bot detectado. Probabilidad:", result.probability);
				debugLog("Detalles:", result.details);
				window.__GUIDERS_INITIALIZING__ = false;
				return; // No inicializar el SDK
			}

			// Solo inicializar el SDK para usuarios legítimos
			window.guiders = new window.TrackingPixelSDK(sdkOptions);

			// Configurar acceso global para dev random messages (solo en modo dev)
			// IMPORTANTE: Usar __PRODUCTION__ (constante de build) para permitir tree-shaking
			// webpack elimina este bloque completo en producción
			if (!__PRODUCTION__ && typeof window !== 'undefined') {
				import('./core/dev-random-messages').then(({ DevRandomMessages }) => {
					const devRandomMessages = DevRandomMessages.getInstance();
					window.guidersDevRandomMessages = {
						trigger: (chatId: string, count?: number) => devRandomMessages.triggerRandomMessages(chatId, count),
						setConfig: (config: any) => devRandomMessages.setConfig(config),
						getConfig: () => devRandomMessages.getConfig(),
						isEnabled: () => devRandomMessages.isEnabled(),
						isGenerating: () => devRandomMessages.isGenerating()
					};
					debugLog('🎲 [DevRandomMessages] 🌐 Interfaz global configurada en window.guidersDevRandomMessages');
				});
			}

			// GDPR Compliance: NO llamar a init() automáticamente
			// El constructor del SDK ya maneja la inicialización basándose en el estado de consentimiento:
			// - pending: Muestra placeholder, NO inicializa
			// - granted: Inicializa automáticamente
			// - denied: No hace nada
			//
			// init() se llamará automáticamente cuando el usuario acepte las cookies
			// desde el callback onConsentChange en el constructor del SDK
			debugLog('[Guiders SDK] ✅ SDK instanciado - esperando consentimiento del usuario');
			window.__GUIDERS_INITIALIZING__ = false;
		});
	} catch (error) {
		debugError("Error inicializando Guiders SDK:", error);
		window.__GUIDERS_INITIALIZING__ = false;
	}
}

// Si estamos en un entorno de navegador, asignamos los módulos al objeto global.
if (typeof window !== "undefined") {
	// Permitir que integraciones (ej. plugin WP) desactiven el auto-init estableciendo GUIDERS_CONFIG.preventAutoInit = true
	const preventAutoInit = (window as any).GUIDERS_CONFIG && (window as any).GUIDERS_CONFIG.preventAutoInit;
	if (preventAutoInit) {
		debugLog('[Guiders SDK] ⏸️ Auto-init desactivado por configuración (preventAutoInit)');
	} else {
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
