import { ClientJS } from "clientjs";
import { PipelineProcessor, PipelineProcessorBuilder } from "../pipeline/pipeline-processor";
import { PipelineStage } from "../pipeline/pipeline-stage";
import { ChatMessageReceived, PixelEvent, TrackingType } from "../types";
import { TokenManager } from "./token-manager";
import { TimeStampStage } from "../pipeline/stages/time-stamp-stage";
import { TokenInjectionStage } from "../pipeline/stages/token-stage";
import { ValidationStage } from "../pipeline/stages/validation-stage";
import { MetadataInjectionStage } from "../pipeline/stages/metadata-stage";
import { URLInjectionStage } from "../pipeline/stages/url-injection-stage";
import { SessionInjectionStage } from "../pipeline/stages/session-injection-stage";
import { TrackingEventV2Stage } from "../pipeline/stages/tracking-event-v2-stage";
import { ChatUI } from "../presentation/chat";
import { VisitorsV2Service } from "../services/visitors-v2-service";
import { ChatV2Service } from "../services/chat-v2-service";
import { resolveDefaultEndpoints } from "./endpoint-resolver";
import { ChatInputUI } from "../presentation/chat-input";
import { ChatToggleButtonUI } from "../presentation/chat-toggle-button";
import { fetchChatDetail, fetchChatDetailV2, ChatDetail, ChatDetailV2, ChatParticipant } from "../services/chat-detail-service";
import { VisitorInfoV2, ChatMetadataV2 } from "../types";
import { v4 as uuidv4 } from "uuid";
import { DomTrackingManager, DefaultTrackDataExtractor } from "./dom-tracking-manager";
import { EnhancedDomTrackingManager } from "./enhanced-dom-tracking-manager";
import { HeuristicDetectionConfig } from "./heuristic-element-detector";
import { SessionTrackingManager, SessionTrackingConfig } from "./session-tracking-manager";
import { ChatMemoryStore } from "./chat-memory-store";
import { IdentitySignal } from "./identity-signal";


interface SDKOptions {
	endpoint?: string;
	webSocketEndpoint?: string;
	apiKey: string;
	autoFlush?: boolean;
	flushInterval?: number;
	maxRetries?: number;
	// Authentication mode: 'jwt' (legacy) or 'session' (V2 cookie based)
	authMode?: 'jwt' | 'session';
	// Heuristic detection options
	heuristicDetection?: {
		enabled?: boolean;
		config?: Partial<HeuristicDetectionConfig>;
	};
	// Session tracking options
	sessionTracking?: {
		enabled?: boolean;
		config?: Partial<SessionTrackingConfig>;
		// Advanced options for Intercom-like behavior
		activityDetection?: {
			enabled?: boolean;
			inactivityThreshold?: number; // ms before considering user inactive
			debounceDelay?: number; // ms to debounce activity events
		};
		multiTabSupport?: {
			enabled?: boolean;
			crossTabSync?: boolean;
		};
	};
}


export class EndpointManager {
	private static instance: EndpointManager;
	private endpoint: string;
	private webSocketEndpoint: string;

	private constructor(endpoint: string, webSocketEndpoint: string) {
		this.endpoint = endpoint;
		this.webSocketEndpoint = webSocketEndpoint;
	}

	public static getInstance(endpoint?: string, webSocketEndpoint?: string): EndpointManager {
		if (!EndpointManager.instance) {
			const defaults = resolveDefaultEndpoints();
			EndpointManager.instance = new EndpointManager(
				endpoint || defaults.endpoint,
				webSocketEndpoint || defaults.webSocketEndpoint
			);
		} else if (endpoint || webSocketEndpoint) {
			// Permite actualizar endpoints explícitamente si se pasan ahora
			if (endpoint) EndpointManager.instance.endpoint = endpoint;
			if (webSocketEndpoint) EndpointManager.instance.webSocketEndpoint = webSocketEndpoint;
		}
		return EndpointManager.instance;
	}

	public static setInstance(endpoint: string, webSocketEndpoint: string): void {
		if (!EndpointManager.instance) {
			EndpointManager.instance = new EndpointManager(endpoint, webSocketEndpoint);
		} else {
			EndpointManager.instance.endpoint = endpoint;
			EndpointManager.instance.webSocketEndpoint = webSocketEndpoint;
		}
	}

	public getEndpoint(): string {
		return this.endpoint;
	}

	public getWebSocketEndpoint(): string {
		return this.webSocketEndpoint;
	}

	public setEndpoint(endpoint: string): void {
		this.endpoint = endpoint;
	}

	public setWebSocketEndpoint(webSocketEndpoint: string): void {
		this.webSocketEndpoint = webSocketEndpoint;
	}
}

export class TrackingPixelSDK {
	private readonly pipelineBuilder = new PipelineProcessorBuilder();
	private eventPipeline: PipelineProcessor<any, PixelEvent>;
	private sessionInjectionStage: SessionInjectionStage;

	private eventQueue: PixelEvent[] = [];
	private endpoint: string;
	private webSocketEndpoint: string;
	private apiKey: string;
	private fingerprint: string | null = null;
	private chatUI: ChatUI | null = null;

	private autoFlush = false;
	private flushInterval = 10000;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private maxRetries = 3;
	private listeners = new Map<string, Set<(msg: PixelEvent) => void>>();
	private domTrackingManager: DomTrackingManager | EnhancedDomTrackingManager;
	private sessionTrackingManager: SessionTrackingManager | null = null;
	private heuristicEnabled: boolean;
	private visitorHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
	private authMode: 'jwt' | 'session';
	private identitySignal: IdentitySignal;

	constructor(options: SDKOptions) {
		const defaults = resolveDefaultEndpoints();
		const endpoint = options.endpoint || defaults.endpoint;
		const webSocketEndpoint = options.webSocketEndpoint || defaults.webSocketEndpoint;
		EndpointManager.setInstance(endpoint, webSocketEndpoint);

		this.endpoint = endpoint;
		this.webSocketEndpoint = webSocketEndpoint;
		this.apiKey = options.apiKey;
		this.authMode = options.authMode || 'session';
		this.autoFlush = options.autoFlush ?? false;
		this.flushInterval = options.flushInterval ?? 10000;
		this.maxRetries = options.maxRetries ?? 3;

		localStorage.setItem("pixelEndpoint", this.endpoint);
		localStorage.setItem("guidersApiKey", this.apiKey);

		// Inicializar el signal de identity
		this.identitySignal = IdentitySignal.getInstance();

		// Crear la instancia de SessionInjectionStage
		this.sessionInjectionStage = new SessionInjectionStage();

		this.pipelineBuilder.addStage(new TimeStampStage());
		if (this.authMode === 'jwt') {
			this.pipelineBuilder.addStage(new TokenInjectionStage());
		} else {
			console.log('[TrackingPixelSDK] 🔐 authMode=session: omitiendo TokenInjectionStage');
		}
		this.eventPipeline = this.pipelineBuilder
			.addStage(new URLInjectionStage())
			.addStage(this.sessionInjectionStage)
			.addStage(new MetadataInjectionStage())
			.addStage(new TrackingEventV2Stage())
			.addStage(new ValidationStage(this.authMode))
			.build();

		// Initialize heuristic detection settings
		this.heuristicEnabled = options.heuristicDetection?.enabled ?? true;
		
		// Create enhanced DOM tracking manager if heuristic detection is enabled
		if (this.heuristicEnabled) {
			console.log('[TrackingPixelSDK] 🚀 Initializing with heuristic detection enabled');
			this.domTrackingManager = new EnhancedDomTrackingManager(
				(params) => this.track(params),
				new DefaultTrackDataExtractor(),
				options.heuristicDetection?.config || {}
			);
		} else {
			console.log('[TrackingPixelSDK] Initializing with legacy DOM tracking');
			this.domTrackingManager = new DomTrackingManager((params) => this.track(params));
		}

		// Initialize session tracking if enabled
		const sessionTrackingEnabled = options.sessionTracking?.enabled ?? true;
		if (sessionTrackingEnabled) {
			console.log('[TrackingPixelSDK] 📊 Initializing advanced session tracking with Intercom-like features');
			
			// Build enhanced session tracking config
			const baseConfig = options.sessionTracking?.config || {};
			const activityOptions = options.sessionTracking?.activityDetection || {};
			const multiTabOptions = options.sessionTracking?.multiTabSupport || {};
			
			const enhancedConfig: Partial<SessionTrackingConfig> = {
				...baseConfig,
				maxInactivityTime: activityOptions.inactivityThreshold ?? 60000, // 1 minute
				// Set reasonable defaults for Intercom-like behavior
				heartbeatInterval: baseConfig.heartbeatInterval ?? 10000, // 10 seconds
			};
			
			this.sessionTrackingManager = new SessionTrackingManager(
				(params) => {
					setTimeout(() => {
						this.track(params)
					}, 500); // Delay to ensure session data is ready
				},
				enhancedConfig
			);
			
			// Conectar el SessionTrackingManager con la pipeline stage
			this.sessionInjectionStage.setSessionManager(this.sessionTrackingManager);
			
			console.log('[TrackingPixelSDK] Session tracking configured with enhanced features:', {
				heartbeatInterval: enhancedConfig.heartbeatInterval,
				inactivityThreshold: enhancedConfig.maxInactivityTime,
			});
		}
	}

	public async init(): Promise<void> {
		// Configurar el cliente
		const client = new ClientJS();
		this.fingerprint = localStorage.getItem("fingerprint") || client.getFingerprint().toString();
		localStorage.setItem("fingerprint", this.fingerprint);

		if (this.authMode === 'jwt') {
			TokenManager.loadTokensFromStorage();
		}
		
		console.log("✅ SDK inicializado sin servicios de WebSocket.");

		if (this.autoFlush) {
			this.startAutoFlush();
		}

		console.log("SDK listo para tracking...");

		// La identificación del visitante ahora se realiza solo cuando se abre la pestaña
		// mediante un listener de visibilitychange/focus
		this.setupTabOpenListener();
		// Guardar la referencia al chat para usarla más tarde (ej: mostrar mensajes del sistema)
		this.chatUI = new ChatUI({
			widget: true,
		});
		const chat = this.chatUI; // Alias para mantener compatibilidad con el código existente
		const chatInput = new ChatInputUI(chat);
		const chatToggleButton = new ChatToggleButtonUI(chat);

		const initializeChatComponents = () => {
			console.log("Inicializando componentes del chat rápidamente...");
			// Inicializar componentes (el chat comienza oculto por defecto)
			chat.init();
			// Asegurarnos explícitamente que el chat esté oculto ANTES de inicializar cualquier
			// otro componente para evitar que el chat se muestre y luego se oculte
			chat.hide();
			// Inicializar los demás componentes después de ocultar el chat
			chatInput.init();
			chatToggleButton.init();
			// Mostrar el botón inmediatamente para mejor experiencia de usuario
			chatToggleButton.show();
			console.log("🔘 Botón de chat mostrado inmediatamente");

			// Añadir listener para mensajes de sistema
			const chatEls = document.querySelectorAll('.chat-widget, .chat-widget-fixed');
			chatEls.forEach(el => {
				el.addEventListener('system-message', (event: Event) => {
					const customEvent = event as CustomEvent;
					chat.addSystemMessage(customEvent.detail.message);
				});
			});

			console.log("Componentes del chat inicializados. Chat oculto por defecto.");

			// Escuchar cuando el chat se inicialice para verificar disponibilidad de comerciales
			chat.onChatInitialized(() => {
				console.log("💬 Chat inicializado, verificando disponibilidad de comerciales...");
				this.checkCommercialAvailability(chat, chatToggleButton);
			});

			// Escuchar eventos de cambio de estado online de participantes
			this.setupParticipantEventsListener(chat, chatToggleButton);
		
			chat.onOpen(() => {
				this.captureEvent("visitor:open-chat", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
			});
			chat.onClose(() => {
				this.captureEvent("visitor:close-chat", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
			});
		
			chat.onActiveInterval(() => {
				console.log("Intervalo activo");
				this.captureEvent("visitor:chat-active", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
			}, 1000 * 10); // 10 segundos de intervalo
		
			chatToggleButton.onToggle((visible: boolean) => {
				console.log(`Toggle event: chat debe estar ${visible ? 'visible' : 'oculto'}`);
				if (visible) {
					// Mostrar el chat si debe estar visible
					chat.show();
				} else {
					// Ocultar el chat si debe estar oculto
					chat.hide();
				}
			});
		
			chatInput.onSubmit((message: string) => {
				if (!message) return;
				this.captureEvent("visitor:send-message", { 
					id: uuidv4(),
					message,
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
				this.flush();
			});
		
			this.on("receive-message", (msg: PixelEvent) => {
				// Imprimir el mensaje completo para depuración
				console.log("Mensaje recibido via WebSocket:", msg);
				
				// Verificar si el mensaje contiene senderId
				if (!msg.data.senderId) {
					console.warn("⚠️ Mensaje WebSocket sin senderId:", msg);
				}
				
				chat.renderChatMessage({
					text: msg.data.message as string,
					sender: "other",
					senderId: msg.data.senderId as string,
					timestamp: msg.data.timestamp as number
				});
			});
		};
		
		if (document.readyState === "loading") {
			console.log("El DOM aún no está completamente cargado. Esperando...");
			document.addEventListener("DOMContentLoaded", initializeChatComponents);
			console.log("Esperando a que el DOM esté completamente cargado...");
		} else {
			console.log("El DOM ya está completamente cargado.");
			initializeChatComponents();
		}

		// Start session tracking if enabled
		if (this.sessionTrackingManager) {
			console.log("🎯 Starting session tracking...");
			// Session tracking will auto-initialize if enabled in config
			// The manager is already set up to track events automatically
		}

		// Registrar múltiples eventos de cierre para asegurar endSession
		this.setupPageUnloadHandlers();
	}

	/**
	 * Configura un listener para detectar cuando se abre una pestaña
	 * y ejecutar /identify únicamente en ese momento.
	 */
	private setupTabOpenListener(): void {
		if (typeof window === 'undefined') return;

		console.log('[TrackingPixelSDK] 🔍 Configurando listener para apertura de pestaña (una sola vez)');

		// Ejecutar identificación inmediatamente solo al cargar la página
		// No en eventos posteriores de cambio de foco
		if (document.visibilityState === 'visible') {
			console.log('[TrackingPixelSDK] 🚀 Pestaña cargada - ejecutando identify una sola vez');
			this.executeIdentify();
		}

		// NO agregar listeners para visibilitychange o focus
		// La sesión debe mantenerse durante toda la vida de la pestaña
		// Solo se debe crear una nueva sesión cuando se abre una nueva pestaña/ventana
	}

	/**
	 * Ejecuta la identificación del visitante y carga sus chats.
	 */
	private async executeIdentify(): Promise<void> {
		try {
			console.log('[TrackingPixelSDK] 🔍 Ejecutando identify...');
			const identify = await VisitorsV2Service.getInstance().identify(this.fingerprint!, this.apiKey);
			if (identify?.visitorId) {
				// Iniciar heartbeat backend (cada 30s) sin fallback
				if (this.visitorHeartbeatTimer) clearInterval(this.visitorHeartbeatTimer);
				this.visitorHeartbeatTimer = setInterval(() => {
					VisitorsV2Service.getInstance().heartbeat();
				}, 30000);
				try {
					const list = await ChatV2Service.getInstance().getVisitorChats(identify.visitorId, undefined, 20);
					localStorage.setItem('guiders_recent_chats', JSON.stringify(list.chats));
					if (list.chats.length > 0) {
						ChatMemoryStore.getInstance().setChatId(list.chats[0].id);
						console.log('[TrackingPixelSDK] ♻️ Chat reutilizable (más reciente) guardado en memoria:', list.chats[0].id);
					}
				} catch (inner) {
					console.warn('[TrackingPixelSDK] ⚠️ No se pudo precargar lista de chats V2:', inner);
				}
			}
		} catch (e) {
			console.warn('[TrackingPixelSDK] ❌ identify V2 fallido:', e);
		}
	}

	/**
	 * Configura listeners simplificados para detectar cuando se cierra la ventana/pestaña.
	 * Ejecuta /endSession únicamente cuando se cierra la ventana.
	 */
	private setupPageUnloadHandlers(): void {
		if (typeof window === 'undefined') return;

		// Flag para evitar múltiples llamadas a endSession
		let sessionEndCalled = false;

		const endSessionOnce = (reason: string) => {
			if (sessionEndCalled) return;
			sessionEndCalled = true;
			
			try {
				console.log(`[TrackingPixelSDK] 🚪 Finalizando sesión por: ${reason}`);
				
				// 1. Flush eventos pendientes si los hay
				if (this.eventQueue.length > 0) {
					const eventsToSend = [...this.eventQueue];
					this.eventQueue = [];
					
					if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
						try {
							const endpoint = EndpointManager.getInstance().getEndpoint();
							const apiRoot = endpoint.endsWith('/api') ? endpoint : `${endpoint}/api`;
							const url = `${apiRoot}/tracking/events/batch`;
							const blob = new Blob([JSON.stringify(eventsToSend)], { type: 'application/json' });
							(navigator as any).sendBeacon(url, blob);
							console.log(`[TrackingPixelSDK] 📤 ${eventsToSend.length} eventos enviados via beacon`);
						} catch (e) {
							console.warn('[TrackingPixelSDK] ❌ Error enviando eventos via beacon:', e);
						}
					}
				}
				
				// 2. Finalizar sesión backend usando beacon
				VisitorsV2Service.getInstance().endSession({ useBeacon: true });
				
			} catch (e) {
				console.warn(`[TrackingPixelSDK] ❌ Error en endSession (${reason}):`, e);
			}
		};

		// Solo usar beforeunload y pagehide que son los más confiables para cierre de ventana
		console.log('[TrackingPixelSDK] 🚪 Configurando listeners simplificados para cierre de ventana');
		
		// Evento principal: beforeunload - cuando la página está a punto de descargarse
		window.addEventListener('beforeunload', () => {
			console.log('[TrackingPixelSDK] 🚪 beforeunload detectado');
			endSessionOnce('window_close');
		});
		
		// Evento secundario: pagehide - más confiable que beforeunload en móviles
		window.addEventListener('pagehide', () => {
			console.log('[TrackingPixelSDK] 🚪 pagehide detectado');
			endSessionOnce('window_close');
		});
	}

	private configureTypingIndicators(chat: ChatUI): void {
		console.log("💬 Indicadores de escritura desactivados (sin WebSocket)");
	}

	public on(type: string, listener: (msg: PixelEvent) => void): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)?.add(listener);
	}

	public off(type: string, listener: (msg: PixelEvent) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	public once(type: string, listener: (msg: PixelEvent) => void): void {
		const wrappedListener = (msg: PixelEvent) => {
			listener(msg);
			this.off(type, wrappedListener);
		};
		this.on(type, wrappedListener);
	}

	public addPipelineStage(stage: PipelineStage): void {
		this.eventPipeline = this.pipelineBuilder
			.addStage(stage)
			.build();
	}

	/**
	 * Habilita el tracking de eventos del DOM.
	 * Usa detección heurística automática si está habilitada, sino el sistema legacy.
	 */
	public enableDOMTracking(): void {
		if (this.domTrackingManager instanceof EnhancedDomTrackingManager) {
			console.log('[TrackingPixelSDK] 🎯 Enabling automatic heuristic tracking');
			this.domTrackingManager.enableAutomaticTracking();
		} else {
			console.log('[TrackingPixelSDK] Enabling legacy DOM tracking');
			this.domTrackingManager.enableDOMTracking();
		}
	}

	/**
	 * Enable automatic heuristic tracking (new preferred method)
	 */
	public enableAutomaticTracking(): void {
		if (this.domTrackingManager instanceof EnhancedDomTrackingManager) {
			this.domTrackingManager.enableAutomaticTracking();
		} else {
			console.warn('[TrackingPixelSDK] Heuristic detection not available. Use enableDOMTracking() instead.');
			this.domTrackingManager.enableDOMTracking();
		}
	}

	/**
	 * Get heuristic detection configuration (if available)
	 */
	public getHeuristicConfig(): HeuristicDetectionConfig | null {
		if (this.domTrackingManager instanceof EnhancedDomTrackingManager) {
			return this.domTrackingManager.getHeuristicConfig();
		}
		return null;
	}

	/**
	 * Update heuristic detection configuration (if available)
	 */
	public updateHeuristicConfig(config: Partial<HeuristicDetectionConfig>): void {
		if (this.domTrackingManager instanceof EnhancedDomTrackingManager) {
			this.domTrackingManager.updateHeuristicConfig(config);
		} else {
			console.warn('[TrackingPixelSDK] Heuristic detection not available.');
		}
	}

	/**
	 * Enable or disable heuristic detection (if available)
	 */
	public setHeuristicEnabled(enabled: boolean): void {
		if (this.domTrackingManager instanceof EnhancedDomTrackingManager) {
			this.domTrackingManager.setHeuristicEnabled(enabled);
		} else {
			console.warn('[TrackingPixelSDK] Heuristic detection not available.');
		}
	}

	/**
	 * Enable session tracking
	 */
	public enableSessionTracking(): void {
		if (this.sessionTrackingManager) {
			console.log('[TrackingPixelSDK] 🎯 Session tracking already enabled and initialized');
		} else {
			console.warn('[TrackingPixelSDK] Session tracking not initialized.');
		}
	}

	public setMetadata(event: string, metadata: Record<string, unknown>): void {
		const eventIndex = this.eventQueue.findIndex((e) => e.type === event);
		if (eventIndex === -1) {
			console.warn(`Evento '${event}' no encontrado en la cola.`);
			return;
		}

		this.eventQueue[eventIndex].metadata = metadata;
	}

	public async flush(): Promise<void> {
		if (this.eventQueue.length === 0) return;

		const eventsToSend = [...this.eventQueue];
		this.eventQueue = [];

		await Promise.all(
			eventsToSend.map((event) => this.trySendEventWithRetry(event, this.maxRetries))
		);
	}

	public stopAutoFlush(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}

	public async track(params: Record<string, unknown>): Promise<void> {
		return new Promise((resolve, reject) => {
			const { event, ...data } = params;
			if (typeof event !== "string") {
				console.error("El evento debe tener un tipo.");
				reject(new Error("El evento debe tener un tipo."));
				return;
			}
			try {
				this.captureEvent('tracking:tracking-event', {
					trackingEventId: uuidv4(),
					metadata: {
						...data,
					},
					eventType: event,
				});
				resolve();
			} catch (error) {
				console.error("Error al capturar el evento:", error);
				reject(error);
			}
		});
	}

	private captureEvent(type: string, data: Record<string, unknown>): void {
		const rawEvent = {
			type,
			data,
			timestamp: Date.now(),
		};
		const processedEvent = this.eventPipeline.process(rawEvent);
		this.eventQueue.push(processedEvent);
	}

	private async trySendEventWithRetry(event: PixelEvent, retriesLeft: number): Promise<void> {
		try {
			// Sin WebSocket, usar HTTP como fallback
			console.log("📡 Enviando evento via HTTP (sin WebSocket):", event.type);
		} catch (error) {
			console.error("❌ Error al enviar evento:", error);
			if (retriesLeft > 0) {
				console.warn(`Retrying (${this.maxRetries - retriesLeft + 1})...`);
				setTimeout(() => {
					this.trySendEventWithRetry(event, retriesLeft - 1);
				}, 1000); // 1 segundo entre intentos
			} else {
				console.error("❌ No se pudo enviar el evento después de varios intentos:", event);
			}
		}
	}

	private startAutoFlush(): void {
		if (this.flushTimer) clearInterval(this.flushTimer);
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	private dispatchMessage(message: PixelEvent): void {
		const listeners = this.listeners.get(message.type);
		
		// Incrementar contador de mensajes no leídos si es un mensaje de chat
		// Esta es la ubicación centralizada para incrementar el contador
		if (message.type === "receive-message") {
			console.log("💬 Mensaje recibido (sin servicio de mensajes no leídos)");
			// Notificación del navegador si está permitido
			if (typeof window !== "undefined" && "Notification" in window) {
				const notifBody = (message.data && typeof message.data.message === 'string' && message.data.message)
					? message.data.message
					: "Tienes un nuevo mensaje en el chat";
				if (Notification.permission === "granted") {
					new Notification("Nuevo mensaje", {
						body: notifBody,
						icon: "/favicon.ico"
					});
				} else if (Notification.permission !== "denied") {
					Notification.requestPermission().then(permission => {
						if (permission === "granted") {
							new Notification("Nuevo mensaje", {
								body: notifBody,
								icon: "/favicon.ico"
							});
						}
					});
				}
			}
		}

		// Si no hay listeners, no continuamos
		if (!listeners || listeners.size === 0) return;

		listeners.forEach((listener) => {
			try {
				listener(message);
			} catch (error) {
				console.error("Error al ejecutar listener:", error);
			}
		});
	}

	/**
	 * Cleanup all resources and event listeners
	 */
	public cleanup(): void {
		// Cleanup session tracking
		if (this.visitorHeartbeatTimer) {
			clearInterval(this.visitorHeartbeatTimer);
			this.visitorHeartbeatTimer = null;
		}
		// Intentar cerrar sesión backend explícitamente (sin beacon, llamada normal)
		VisitorsV2Service.getInstance().endSession().catch(() => {
			/* silencio: ya logueado en servicio */
		});

		// Stop auto flush
		this.stopAutoFlush();

		// Clear event queue
		this.eventQueue = [];

		// Clear listeners
		this.listeners.clear();

		console.log('[TrackingPixelSDK] Cleanup completed');
	}

	/**
	 * Configura los listeners para eventos de participantes (estado online y nuevos participantes)
	 * @param chat Instancia del ChatUI
	 * @param chatToggleButton Instancia del ChatToggleButtonUI
	 */
	private setupParticipantEventsListener(chat: ChatUI, chatToggleButton: ChatToggleButtonUI): void {
		console.log("💬 Eventos de participantes desactivados (sin WebSocket)");
	}

	/**
	 * Verifica el estado de los comerciales y actualiza la visibilidad del chat
	 * @param chatId ID del chat
	 * @param chat Instancia del ChatUI
	 * @param chatToggleButton Instancia del ChatToggleButtonUI
	 */
	private async checkAndUpdateChatVisibility(chatId: string, chat: ChatUI, chatToggleButton: ChatToggleButtonUI): Promise<void> {
		try {
			console.log(`🔍 checkAndUpdateChatVisibility - Verificando chat ${chatId}`);
			
			// Obtener los detalles actualizados del chat
			const chatDetail = await this.fetchChatDetail(chatId);
			
			console.log(`📋 Detalles del chat obtenidos:`, {
				totalParticipants: chatDetail.participants.length,
				participants: chatDetail.participants.map((p: ChatParticipant) => ({
					name: p.name,
					isCommercial: p.isCommercial,
					isOnline: p.isOnline,
					id: p.id
				}))
			});
			
			// Filtrar solo los comerciales
			const commercials = chatDetail.participants.filter((p: ChatParticipant) => p.isCommercial);
			
			console.log(`🏪 Comerciales encontrados: ${commercials.length}`, 
				commercials.map((c: ChatParticipant) => ({
					name: c.name,
					isOnline: c.isOnline,
					id: c.id
				}))
			);
			
			// Verificar si hay al menos un comercial online
			const hasOnlineCommercial = commercials.some((commercial: ChatParticipant) => commercial.isOnline);
			const onlineCommercials = commercials.filter((c: ChatParticipant) => c.isOnline);
			
			console.log("📊 Resumen de comerciales:");
			console.log(`  - Total comerciales: ${commercials.length}`);
			console.log(`  - Comerciales online: ${onlineCommercials.length}`);
			console.log(`  - ¿Hay al menos un comercial online? ${hasOnlineCommercial}`);
			console.log(`  - Estado actual del botón: ${chatToggleButton.isButtonVisible()}`);

			// Mostrar siempre el botón del chat, sin importar la disponibilidad de comerciales
			chatToggleButton.show();

		} catch (error) {
			console.error("❌ Error al verificar y actualizar visibilidad del chat:", error);
			if (error instanceof Error) {
				console.error("❌ Stack trace:", error.stack);
			}
		}
	}

	/**
	 * Verifica la disponibilidad de comerciales y muestra/oculta el botón del chat según corresponda
	 * @param chat Instancia del ChatUI
	 * @param chatToggleButton Instancia del ChatToggleButtonUI
	 */
	private async checkCommercialAvailability(chat: ChatUI, chatToggleButton: ChatToggleButtonUI): Promise<void> {
		try {
			// Esperar a que el chat tenga un ID asignado
			let chatId = chat.getChatId();
			let attempts = 0;
			const maxAttempts = 10;

			// Esperar hasta que el chat tenga un ID o se agoten los intentos
			while (!chatId && attempts < maxAttempts) {
				await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms
				chatId = chat.getChatId();
				attempts++;
				console.log(`Esperando chat ID... intento ${attempts}/${maxAttempts}`);
			}

		if (!chatId) {
			console.error("❌ [checkCommercialAvailability] No se pudo obtener el ID del chat después de varios intentos. Abortando para evitar /v2/chats/undefined", { attempts });
			// Mostrar el botón de todas formas para permitir al usuario intentar abrir el chat
			console.log("🔘 Mostrando botón de chat sin verificación de comerciales");
			chatToggleButton.show();
			return;
		}			console.log(`Verificando disponibilidad de comerciales para el chat ${chatId}...`);
			
			// Obtener los detalles del chat
			const chatDetail = await this.fetchChatDetail(chatId);
			
			// Filtrar solo los comerciales
			const commercials = chatDetail.participants.filter((participant: ChatParticipant) => participant.isCommercial);
			
			// Verificar si hay al menos un comercial online (no solo presente, sino también online)
			const hasOnlineCommercial = commercials.some((commercial: ChatParticipant) => commercial.isOnline);
			
			console.log("Participantes del chat:", chatDetail.participants);
			console.log("Comerciales en el chat:", commercials.length);
			console.log("Comerciales online:", commercials.filter((c: ChatParticipant) => c.isOnline).length);
			console.log("¿Hay comerciales online?", hasOnlineCommercial);
			
			// Mostrar siempre el botón del chat, sin importar la disponibilidad de comerciales
			chatToggleButton.show();
		} catch (error) {
			console.error("Error al verificar disponibilidad de comerciales:", error);
			// Mostrar el botón de todas formas para permitir al usuario acceder al chat
			console.log("🔘 Mostrando botón de chat a pesar del error en verificación");
			chatToggleButton.show();
		}
	}

	/**
	 * Método auxiliar para obtener los detalles del chat usando la API V2
	 * @param chatId ID del chat
	 * @returns Detalles del chat con participantes
	 */
	private async fetchChatDetail(chatId: string): Promise<ChatDetail> {
		if (!chatId) {
			console.warn('❌ fetchChatDetail llamado sin chatId. Abortando.');
			throw new Error('chatId requerido');
		}
		console.log(`🌐 fetchChatDetail - Obteniendo detalles para chat ${chatId} (usando API V2)`);
		
		try {
			// Intentar primero con la API V2 (optimizada)
			const chatDetailV2 = await fetchChatDetailV2(chatId);
			console.log(`🌐 fetchChatDetail - Detalles V2 obtenidos:`, {
				id: chatDetailV2.id,
				status: chatDetailV2.status,
				visitorId: chatDetailV2.visitorId,
				assignedCommercialId: chatDetailV2.assignedCommercialId,
				availableCommercialIds: chatDetailV2.availableCommercialIds,
				isActive: chatDetailV2.isActive
			});
			
			// Convertir al formato legacy para compatibilidad
			const legacyDetail = this.convertV2ToLegacyDetail(chatDetailV2);
			
			console.log(`🌐 fetchChatDetail - Convertido a formato legacy:`, {
				id: legacyDetail.id,
				participantsCount: legacyDetail.participants.length,
				participants: legacyDetail.participants.map(p => ({
					id: p.id,
					name: p.name,
					isCommercial: p.isCommercial,
					isOnline: p.isOnline
				}))
			});
			
			return legacyDetail;
		} catch (error) {
			console.warn('🌐 fetchChatDetail - Error con API V2, intentando API legacy:', error);
			
			// Fallback a la función legacy
			return await fetchChatDetail(chatId);
		}
	}

	/**
	 * Convierte los detalles del chat V2 al formato legacy
	 * @param chatDetailV2 Detalles del chat en formato V2
	 * @returns Detalles del chat en formato legacy
	 */
	private convertV2ToLegacyDetail(chatDetailV2: ChatDetailV2): ChatDetail {
		const participants: ChatParticipant[] = [];
		
		// Añadir el visitante como participante
		participants.push({
			id: chatDetailV2.visitorInfo.id,
			name: chatDetailV2.visitorInfo.name,
			isCommercial: false,
			isVisitor: true,
			isOnline: true, // Asumimos que el visitante está online si el chat está activo
			assignedAt: chatDetailV2.createdAt.toISOString(),
			lastSeenAt: chatDetailV2.lastMessageDate?.toISOString() || null,
			isViewing: chatDetailV2.isActive,
			isTyping: false,
			isAnonymous: false
		});

		// Añadir comerciales asignados como participantes online
		if (chatDetailV2.assignedCommercialId) {
			participants.push({
				id: chatDetailV2.assignedCommercialId,
				name: `Comercial ${chatDetailV2.assignedCommercialId}`, // Nombre genérico
				isCommercial: true,
				isVisitor: false,
				isOnline: chatDetailV2.isActive, // Si el chat está activo, asumimos que está online
				assignedAt: chatDetailV2.assignedAt?.toISOString() || chatDetailV2.createdAt.toISOString(),
				lastSeenAt: chatDetailV2.lastMessageDate?.toISOString() || null,
				isViewing: chatDetailV2.isActive,
				isTyping: false,
				isAnonymous: false
			});
		}

		// Añadir comerciales disponibles como participantes potencialmente online
		if (chatDetailV2.availableCommercialIds && chatDetailV2.availableCommercialIds.length > 0) {
			chatDetailV2.availableCommercialIds.forEach(commercialId => {
				// Solo añadir si no está ya asignado
				if (commercialId !== chatDetailV2.assignedCommercialId) {
					participants.push({
						id: commercialId,
						name: `Comercial ${commercialId}`,
						isCommercial: true,
						isVisitor: false,
						isOnline: true, // Los comerciales disponibles están considerados online
						assignedAt: chatDetailV2.createdAt.toISOString(),
						lastSeenAt: null,
						isViewing: false,
						isTyping: false,
						isAnonymous: false
					});
				}
			});
		}

		return {
			id: chatDetailV2.id,
			participants,
			status: chatDetailV2.status,
			lastMessage: null, // V2 no incluye el último mensaje directamente
			lastMessageAt: chatDetailV2.lastMessageDate?.toISOString() || null,
			createdAt: chatDetailV2.createdAt.toISOString()
		};
	}

	/**
	 * Getter para acceder al servicio de visitantes V2.
	 * Útil para testing y acceso directo a funcionalidades de sesión.
	 */
	public get visitorsService() {
		return VisitorsV2Service.getInstance();
	}

	/**
	 * Getter para acceder al signal de identity.
	 * Permite suscribirse a cambios en el estado de identificación y chats.
	 */
	public getIdentitySignal() {
		return this.identitySignal;
	}

	/**
	 * Ejecuta la identificación del visitante usando fingerprint y automáticamente carga sus chats.
	 * @param fingerprint Huella digital del visitante
	 * @param apiKey API Key opcional (si no se usa el del constructor)
	 * @returns Promise con los datos de identity y chats
	 */
	public async identifyVisitor(fingerprint?: string, apiKey?: string) {
		const fp = fingerprint || this.fingerprint || this.generateFingerprint();
		const key = apiKey || this.apiKey;
		
		console.log('[TrackingPixelSDK] 🔍 Identificando visitante con fingerprint:', fp);
		
		try {
			const result = await this.identitySignal.identify(fp, key);
			console.log('[TrackingPixelSDK] ✅ Visitante identificado exitosamente:', result.identity.visitorId);
			return result;
		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error identificando visitante:', error);
			throw error;
		}
	}

	/**
	 * Genera un nuevo fingerprint usando ClientJS.
	 * @returns string con el fingerprint generado
	 */
	private generateFingerprint(): string {
		const client = new ClientJS();
		const fingerprint = client.getFingerprint().toString();
		localStorage.setItem("fingerprint", fingerprint);
		this.fingerprint = fingerprint;
		return fingerprint;
	}

	/**
	 * Recarga los chats del visitante actual.
	 * @returns Promise con la lista de chats o null si no hay visitante identificado
	 */
	public async reloadVisitorChats() {
		console.log('[TrackingPixelSDK] 🔄 Recargando chats del visitante...');
		return this.identitySignal.reloadChats();
	}

	/**
	 * Obtiene el estado actual del signal de identity.
	 * @returns Estado actual con loading, data y error
	 */
	public getIdentityState() {
		return this.identitySignal.getState();
	}

	/**
	 * Obtiene el visitorId actual del visitante identificado.
	 * @returns visitorId o null si no está identificado
	 */
	public getVisitorId() {
		return this.identitySignal.getVisitorId();
	}

	/**
	 * Verifica si hay un visitante identificado.
	 * @returns true si hay un visitante identificado
	 */
	public isVisitorIdentified() {
		return this.identitySignal.isIdentified();
	}

	/**
	 * Suscribe un callback para escuchar cambios en el estado de identity.
	 * @param callback Función que se ejecuta cuando cambia el estado
	 * @returns Función para cancelar la suscripción
	 */
	public subscribeToIdentityChanges(callback: (state: any) => void) {
		return this.identitySignal.subscribe(callback);
	}

	/**
	 * Suscribe un callback para escuchar cambios específicamente en los chats.
	 * @param callback Función que se ejecuta cuando cambian los chats
	 * @returns Función para cancelar la suscripción
	 */
	public subscribeToChatChanges(callback: (state: any) => void) {
		return this.identitySignal.getChatsSignal().subscribe(callback);
	}
}
