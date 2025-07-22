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
import { ChatDetail, ChatParticipant } from "../services/chat-detail-service";
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
			
			// Verificar si hay al menos un comercial disponible
			const hasCommercial = chatDetail.participants.some((participant: ChatParticipant) => participant.isCommercial);
			
			console.log("Participantes del chat:", chatDetail.participants);
			console.log("¿Hay comerciales disponibles?", hasCommercial);
			
			if (hasCommercial) {
				console.log("✅ Comercial disponible - Mostrando botón del chat");
				chatToggleButton.show();
			} else {
				console.log("❌ No hay comerciales disponibles - Ocultando botón del chat");
				chatToggleButton.hide();
			}

			// Configurar listener para cambios en tiempo real de participantes
			this.setupCommercialAvailabilityListener(chat, chatToggleButton);
		} catch (error) {
			console.error("Error al verificar disponibilidad de comerciales:", error);
			// En caso de error, ocultamos el botón por seguridad
			chatToggleButton.hide();
		}
	}

	/**
	 * Configura un listener para cambios en tiempo real de comerciales
	 * @param chat Instancia del ChatUI
	 * @param chatToggleButton Instancia del ChatToggleButtonUI
	 */
	private setupCommercialAvailabilityListener(chat: ChatUI, chatToggleButton: ChatToggleButtonUI): void {
		// Obtener el cliente WebSocket
		const webSocketEndpoint = localStorage.getItem('pixelWebSocketEndpoint') || 'wss://guiders.ancoradual.com';
		const webSocketClient = WebSocketClient.getInstance(webSocketEndpoint);

		if (!webSocketClient) {
			console.warn("No se pudo obtener cliente WebSocket para listener de comerciales");
			return;
		}

		// Escuchar eventos de actualización de participantes
		webSocketClient.addListener("chat:participant-updated", async (payload) => {
			console.log("Evento de actualización de participante recibido:", payload);
			
			try {
				const data = payload.data as { chatId: string; participant: ChatParticipant };
				const chatId = chat.getChatId();
				
				// Solo actualizar si es nuestro chat
				if (chatId && data.chatId === chatId) {
					console.log("Actualizando disponibilidad de comerciales por evento WebSocket");
					await this.checkCommercialAvailability(chat, chatToggleButton);
				}
			} catch (error) {
				console.error("Error procesando evento de actualización de participante:", error);
			}
		});

		// También escuchar eventos de estado del chat que puedan afectar comerciales
		webSocketClient.addListener("chat:status-updated", async (payload) => {
			const data = payload.data as { chatId: string; status: string };
			const chatId = chat.getChatId();
			
			if (chatId && data.chatId === chatId) {
				console.log("Estado del chat actualizado, verificando comerciales nuevamente");
				await this.checkCommercialAvailability(chat, chatToggleButton);
			}
		});
	}

	/**
	 * Método auxiliar para obtener los detalles del chat
	 * @param chatId ID del chat
	 * @returns Detalles del chat con participantes
	 */
	private async fetchChatDetail(chatId: string): Promise<ChatDetail> {
		const accessToken = localStorage.getItem('accessToken');
		const endpoints = EndpointManager.getInstance();
		const baseEndpoint = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
		
		const response = await fetch(`${baseEndpoint}/chats/${chatId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken || ''}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error al obtener detalles del chat (${response.status})`);
		}

		return response.json();
	}
}
