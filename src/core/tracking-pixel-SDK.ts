import { ClientJS } from "clientjs";
import { PipelineProcessor, PipelineProcessorBuilder } from "../pipeline/pipeline-processor";
import { PipelineStage } from "../pipeline/pipeline-stage";
import { ChatMessageReceived, PixelEvent, TrackingType } from "../types";
import { TokenManager } from "./token-manager";
import { ensureTokens } from "../services/token-service";
import { checkServerConnection } from "../services/health-check-service";
import { WebSocketClient } from "../services/websocket-service";
import { TimeStampStage } from "../pipeline/stages/time-stamp-stage";
import { TokenInjectionStage } from "../pipeline/stages/token-stage";
import { ValidationStage } from "../pipeline/stages/validation-stage";
import { MetadataInjectionStage } from "../pipeline/stages/metadata-stage";
import { URLInjectionStage } from "../pipeline/stages/url-injection-stage";
import { SessionInjectionStage } from "../pipeline/stages/session-injection-stage";
import { ChatUI } from "../presentation/chat";
import { ChatInputUI } from "../presentation/chat-input";
import { ChatToggleButtonUI } from "../presentation/chat-toggle-button";
import { fetchChatDetail, fetchChatDetailV2, ChatDetail, ChatDetailV2, ChatParticipant } from "../services/chat-detail-service";
import { VisitorInfoV2, ChatMetadataV2 } from "../types";
import { v4 as uuidv4 } from "uuid";
import { DomTrackingManager, DefaultTrackDataExtractor } from "./dom-tracking-manager";
import { EnhancedDomTrackingManager } from "./enhanced-dom-tracking-manager";
import { HeuristicDetectionConfig } from "./heuristic-element-detector";
import { UnreadMessagesService } from "../services/unread-messages-service";
import { SessionTrackingManager, SessionTrackingConfig } from "./session-tracking-manager";


interface SDKOptions {
	endpoint?: string;
	webSocketEndpoint?: string;
	apiKey: string;
	autoFlush?: boolean;
	flushInterval?: number;
	maxRetries?: number;
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

	public static getInstance(endpoint: string = "http://localhost:3000", webSocketEndpoint: string = "ws://localhost:3000"): EndpointManager {
		if (!EndpointManager.instance) {
			EndpointManager.instance = new EndpointManager(endpoint, webSocketEndpoint);
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
	private webSocket: WebSocketClient | null = null;
	private chatUI: ChatUI | null = null;

	private autoFlush = false;
	private flushInterval = 10000;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private maxRetries = 3;
	private listeners = new Map<string, Set<(msg: PixelEvent) => void>>();
	private domTrackingManager: DomTrackingManager | EnhancedDomTrackingManager;
	private sessionTrackingManager: SessionTrackingManager | null = null;
	private heuristicEnabled: boolean;

	constructor(options: SDKOptions) {
		const endpoint = options.endpoint || "http://localhost:3000";
		const webSocketEndpoint = options.webSocketEndpoint || "ws://localhost:3000";
		EndpointManager.setInstance(endpoint, webSocketEndpoint);

		this.endpoint = endpoint;
		this.webSocketEndpoint = webSocketEndpoint;
		this.apiKey = options.apiKey;
		this.autoFlush = options.autoFlush ?? false;
		this.flushInterval = options.flushInterval ?? 10000;
		this.maxRetries = options.maxRetries ?? 3;

		localStorage.setItem("pixelEndpoint", this.endpoint);

		// Crear la instancia de SessionInjectionStage
		this.sessionInjectionStage = new SessionInjectionStage();

		this.eventPipeline = this.pipelineBuilder
			.addStage(new TimeStampStage())
			.addStage(new TokenInjectionStage())
			.addStage(new URLInjectionStage())
			.addStage(this.sessionInjectionStage)
			.addStage(new MetadataInjectionStage())
			.addStage(new ValidationStage())
			.build();

		this.webSocket = WebSocketClient.getInstance(this.webSocketEndpoint);
		
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
		// Iniciar la verificación de conexión y cargar datos simultáneamente
		const connectionCheck = checkServerConnection(this.endpoint);
		
		// Configurar el cliente mientras se verifica la conexión
		const client = new ClientJS();
		this.fingerprint = localStorage.getItem("fingerprint") || client.getFingerprint().toString();
		localStorage.setItem("fingerprint", this.fingerprint);

		// Primero intentamos cargar los tokens por si existen (inmediatamente)
		TokenManager.loadTokensFromStorage();
		
		// Inicializaremos los componentes del chat después de la conexión a WebSocket
		
		// Esperar a que se complete la verificación de conexión
		await connectionCheck;
		console.log("✅ Conexión con el servidor establecida.");
		
		// Siempre registramos el cliente para obtener tokens nuevos
		// Esto asegura que si la cuenta fue borrada en el backend, obtendremos nuevos tokens
		console.log("Registrando cliente para asegurar tokens válidos...");
		try {
			const tokens = await ensureTokens(this.fingerprint, this.apiKey);
			TokenManager.setTokens(tokens);
			console.log("Cliente registrado exitosamente.");
		} catch (error) {
			console.error("Error al registrar cliente:", error);
			// Si hay error y no tenemos tokens, no podremos continuar
			if (!TokenManager.hasValidTokens()) {
				throw new Error("No se pudo registrar el cliente y no hay tokens válidos.");
			}
			// Si hay tokens existentes, continuamos con ellos y esperamos que sean válidos
			console.warn("Continuando con tokens existentes...");
		}

		const token = await TokenManager.getValidAccessToken();
		if (token && this.webSocket) this.webSocket.connect(token);
		else console.warn("WebSocket no conectado por falta de token.");

		TokenManager.startTokenMonitor();

		if (this.autoFlush) {
			this.startAutoFlush();
		}

		if (this.webSocket) {
			console.log("Esperando conexión WebSocket...");
			await this.webSocket.waitForConnection();
			console.log("Conexión WebSocket establecida.");
			this.webSocket.onChatMessage((message) => {
				const processedMessage = this.eventPipeline.process(message);
				console.log("Mensaje recibido:", processedMessage);
				this.dispatchMessage(processedMessage);
			});
			this.webSocket.healthCheck();
		} else {
			console.error("WebSocket no disponible.");
		}
		console.log("Esperando mensajes del servidor...");
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
			// Ocultar el botón inicialmente hasta verificar comerciales
			chatToggleButton.hide();

			// Añadir listener para mensajes de sistema
			const chatEls = document.querySelectorAll('.chat-widget, .chat-widget-fixed');
			chatEls.forEach(el => {
				el.addEventListener('system-message', (event: Event) => {
					const customEvent = event as CustomEvent;
					chat.addSystemMessage(customEvent.detail.message);
				});
			});

			console.log("Componentes del chat inicializados. Chat oculto por defecto.");

			// Verificar disponibilidad de comerciales después de inicializar el chat
			this.checkCommercialAvailability(chat, chatToggleButton);

			// Escuchar eventos de cambio de estado online de participantes
			this.setupParticipantEventsListener(chat, chatToggleButton);
		
			chat.onOpen(() => {
				this.captureEvent("visitor:open-chat", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
				
				// Marcar chat como activo en el servicio de mensajes no leídos
				try {
					const unreadService = UnreadMessagesService.getInstance();
					console.log("Chat abierto: Marcando chat como activo");
					unreadService.setActive(true);
				} catch (error) {
					console.error("Error al marcar chat como activo:", error);
				}
			});
			chat.onClose(() => {
				this.captureEvent("visitor:close-chat", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});
				
				// Marcar chat como inactivo en el servicio de mensajes no leídos
				try {
					const unreadService = UnreadMessagesService.getInstance();
					console.log("Chat cerrado: Marcando chat como inactivo");
					unreadService.setActive(false);
				} catch (error) {
					console.error("Error al marcar chat como inactivo:", error);
				}
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
	}

	private configureTypingIndicators(chat: ChatUI): void {
		if (!this.webSocket) {
			console.warn("WebSocket no está configurado - No se pueden añadir listeners para indicadores de escritura");
			return;
		}

		// Cuando el asesor comienza a escribir
		this.webSocket.onTypingStarted(() => {
			if (chat.isVisible()) {
				chat.showTypingIndicator();
			}
		});
		
		// Cuando el asesor deja de escribir
		this.webSocket.onTypingStopped(() => {
			chat.hideTypingIndicator();
		});
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
			if (this.webSocket?.isConnected()) {
				const response = await this.webSocket.sendMessage(event);
				
				// Verificar si es un evento de mensaje y hay un error de "No receivers"
				if (event.type === "visitor:send-message" && response && response.noReceiversError) {
					// Usar directamente la propiedad chatUI para mostrar el mensaje del sistema
					if (this.chatUI) {
						this.chatUI.addSystemMessage(response.message || "En este momento no hay comerciales disponibles. Tu mensaje no será guardado.");
					}
					return; // No considerar esto como un error para reintentar
				}
			} else {
				throw new Error("WebSocket no conectado");
			}
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
			try {
				const unreadService = UnreadMessagesService.getInstance();
				if (!unreadService.isChatActive()) {
					console.log("TrackingPixelSDK: Incrementando contador de mensajes no leídos");
					unreadService.incrementUnreadCount();
					
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
					
					// Intentar notificar visualmente al usuario que hay un nuevo mensaje
					try {
						// Intenta hacer parpadear el badge si existe en el DOM
						const badgeElement = document.getElementById('chat-unread-badge');
						if (badgeElement) {
							badgeElement.style.animation = 'none';
							setTimeout(() => {
								badgeElement.style.animation = 'pulse 0.5s 2';
							}, 10);
						}
					} catch (animError) {
						console.error("Error al animar badge:", animError);
					}
				} else {
					console.log("TrackingPixelSDK: Chat activo, no se incrementa contador");
				}
			} catch (error) {
				console.error("Error al incrementar contador de mensajes no leídos:", error);
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

		// Stop auto flush
		this.stopAutoFlush();

		// Clear event queue
		this.eventQueue = [];

		// Clear listeners
		this.listeners.clear();

		// Close WebSocket connection
		if (this.webSocket) {
			this.webSocket.disconnect();
		}

		console.log('[TrackingPixelSDK] Cleanup completed');
	}

	/**
	 * Configura los listeners para eventos de participantes (estado online y nuevos participantes)
	 * @param chat Instancia del ChatUI
	 * @param chatToggleButton Instancia del ChatToggleButtonUI
	 */
	private setupParticipantEventsListener(chat: ChatUI, chatToggleButton: ChatToggleButtonUI): void {
		if (!this.webSocket) {
			console.warn("WebSocket no está disponible para escuchar eventos de participantes");
			return;
		}

		console.log("Configurando listeners para eventos de participantes");

		// LISTENER 1: Cambio de estado online de participantes
		this.webSocket.addListener("participant:online-status-updated", async (eventData: any) => {
			try {
				console.log("📡 Evento participant:online-status-updated recibido:", eventData);
				console.log("📡 Estructura del evento data:", Object.keys(eventData.data || {}));
				console.log("📡 Contenido completo de data:", eventData.data);
				
				// Extraer información del participante de la estructura del evento
				const isOnline = eventData.data?.isOnline || eventData.isOnline;
				const participantId = eventData.data?.participantId || eventData.participantId;
				const chatId = chat.getChatId();

				if (!chatId) {
					console.warn("⚠️ No hay chat ID disponible para verificar participantes");
					return;
				}

				console.log(`📡 Participante ${participantId} cambió estado online: ${isOnline}`);

				// Verificar comerciales online después del cambio de estado
				await this.checkAndUpdateChatVisibility(chatId, chat, chatToggleButton);

			} catch (error) {
				console.error("❌ Error al procesar evento participant:online-status-updated:", error);
			}
		});

		// LISTENER 2: Nuevo participante se une al chat
		this.webSocket.addListener("chat:participant-joined", async (eventData: any) => {
			try {
				console.log("🎉 Evento chat:participant-joined recibido:", eventData);
				console.log("🎉 Estructura del evento data:", Object.keys(eventData.data || {}));
				console.log("🎉 Contenido completo de data:", eventData.data);
				
				// Extraer chatId - puede estar en diferentes lugares según la estructura del evento
				let chatId = eventData.data?.chatId || eventData.chatId || eventData.data?.chat?.id;
				let newParticipant = eventData.data?.newParticipant || eventData.data?.participant || eventData.data;
				
				const currentChatId = chat.getChatId();

				console.log(`🔍 Comparando chat IDs - Actual: ${currentChatId}, Evento: ${chatId}`);
				console.log(`👤 Estructura del participante:`, newParticipant);

				if (!currentChatId) {
					console.warn("⚠️ No hay chat ID actual disponible");
					return;
				}

				if (!chatId) {
					console.warn("⚠️ No se pudo extraer chatId del evento, asumiendo que es para el chat actual");
					chatId = currentChatId; // Asumir que es para el chat actual
				}

				if (currentChatId !== chatId) {
					console.warn(`⚠️ Evento para chat diferente. Actual: ${currentChatId}, Evento: ${chatId}`);
					return;
				}

				console.log(`👤 Nuevo participante se unió:`, {
					name: newParticipant?.name,
					isCommercial: newParticipant?.isCommercial,
					isOnline: newParticipant?.isOnline,
					id: newParticipant?.id
				});

				// Si es comercial y está online, mostrar el botón inmediatamente
				if (newParticipant?.isCommercial && newParticipant?.isOnline) {
					console.log("✅ Nuevo comercial online se unió - Mostrando botón del chat");
					console.log("🔄 Estado actual del botón antes de mostrar:", chatToggleButton.isButtonVisible());
					
					chatToggleButton.show();
					
					console.log("🔄 Estado actual del botón después de mostrar:", chatToggleButton.isButtonVisible());
					
					// Si el chat está abierto, mostrar mensaje de que se unió un asesor
					if (chat.isVisible()) {
						console.log("💬 Añadiendo mensaje del sistema al chat visible");
						chat.addSystemMessage(`${newParticipant.name} se ha unido al chat y está disponible para ayudarte.`);
					} else {
						console.log("💬 Chat no está visible, no se añade mensaje del sistema");
					}
				} else if (newParticipant?.isCommercial && !newParticipant?.isOnline) {
					console.log("⚠️ Comercial se unió pero está offline");
					// Verificar el estado general de todos los comerciales
					await this.checkAndUpdateChatVisibility(chatId, chat, chatToggleButton);
				} else {
					console.log("👥 Se unió un visitante o estructura de participante no válida, verificando estado general");
					// Verificar el estado general de todos los comerciales
					await this.checkAndUpdateChatVisibility(chatId, chat, chatToggleButton);
				}

			} catch (error) {
				console.error("❌ Error al procesar evento chat:participant-joined:", error);
			}
		});
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

			if (hasOnlineCommercial) {
				console.log("✅ Hay comerciales online - Mostrando botón del chat");
				console.log(`🔄 Botón antes de mostrar: ${chatToggleButton.isButtonVisible()}`);
				chatToggleButton.show();
				console.log(`🔄 Botón después de mostrar: ${chatToggleButton.isButtonVisible()}`);
			} else {
				console.log("❌ No hay comerciales online - Ocultando botón del chat");
				console.log(`🔄 Botón antes de ocultar: ${chatToggleButton.isButtonVisible()}`);
				chatToggleButton.hide();
				console.log(`🔄 Botón después de ocultar: ${chatToggleButton.isButtonVisible()}`);
				
				// Si el chat está abierto cuando todos los comerciales se desconectan, cerrarlo
				if (chat.isVisible()) {
					console.log("💬 Chat abierto con todos los comerciales offline - Cerrando chat");
					chat.hide();
					// Mostrar mensaje del sistema en el chat
					chat.addSystemMessage("Todos los asesores se han desconectado temporalmente. El chat se cerrará automáticamente.");
				}
			}

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
				console.error("No se pudo obtener el ID del chat después de varios intentos");
				// Si no podemos obtener el ID, ocultamos el botón por seguridad
				chatToggleButton.hide();
				return;
			}

			console.log(`Verificando disponibilidad de comerciales para el chat ${chatId}...`);
			
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
			
			if (hasOnlineCommercial) {
				console.log("✅ Comercial online disponible - Mostrando botón del chat");
				chatToggleButton.show();
			} else {
				console.log("❌ No hay comerciales online disponibles - Ocultando botón del chat");
				chatToggleButton.hide();
			}
		} catch (error) {
			console.error("Error al verificar disponibilidad de comerciales:", error);
			// En caso de error, ocultamos el botón por seguridad
			chatToggleButton.hide();
		}
	}

	/**
	 * Método auxiliar para obtener los detalles del chat usando la API V2
	 * @param chatId ID del chat
	 * @returns Detalles del chat con participantes
	 */
	private async fetchChatDetail(chatId: string): Promise<ChatDetail> {
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
}
