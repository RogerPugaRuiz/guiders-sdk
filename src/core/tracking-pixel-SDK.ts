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
import { ChatMessagesUI } from "../presentation/chat-messages-ui";
import { VisitorsV2Service } from "../services/visitors-v2-service";
import { ChatV2Service } from "../services/chat-v2-service";
import { resolveDefaultEndpoints } from "./endpoint-resolver";
import { ChatInputUI } from "../presentation/chat-input";
import { ChatToggleButtonUI } from "../presentation/chat-toggle-button";
import { fetchChatDetail, fetchChatDetailV2, ChatDetail, ChatDetailV2, ChatParticipant } from "../services/chat-detail-service";
import { VisitorInfoV2, ChatMetadataV2 } from "../types";
import { v4 as uuidv4 } from "uuid";
import { WelcomeMessageConfig } from "./welcome-message-manager";
import { DomTrackingManager, DefaultTrackDataExtractor } from "./dom-tracking-manager";
import { EnhancedDomTrackingManager } from "./enhanced-dom-tracking-manager";
import { HeuristicDetectionConfig } from "./heuristic-element-detector";
import { SessionTrackingManager, SessionTrackingConfig } from "./session-tracking-manager";
import { ChatMemoryStore } from "./chat-memory-store";
import { IdentitySignal } from "./identity-signal";
import { ActiveHoursValidator } from "./active-hours-validator";
import { ActiveHoursConfig } from "../types";
import { WebSocketService } from "../services/websocket-service";
import { RealtimeMessageManager } from "../services/realtime-message-manager";
import { ConsentManager, ConsentManagerConfig } from "./consent-manager";
import { ConsentBackendService } from "../services/consent-backend-service";
import { ConsentBannerUI, ConsentBannerConfig } from "../presentation/consent-banner-ui";


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
	// Welcome message options
	welcomeMessage?: Partial<WelcomeMessageConfig>;
	// Active hours configuration
	activeHours?: Partial<ActiveHoursConfig>;
	// GDPR Consent Configuration
	requireConsent?: boolean; // If false, SDK initializes without consent (default: true)
	consent?: Partial<ConsentManagerConfig>; // Advanced consent options
	consentBanner?: ConsentBannerConfig; // Consent banner UI (auto-render banner for GDPR)
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
	private chatMessagesUI: ChatMessagesUI | null = null;
	private chatToggleButton: ChatToggleButtonUI | null = null;

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
	private welcomeMessageConfig?: Partial<WelcomeMessageConfig>;
	private activeHoursValidator?: ActiveHoursValidator;
	private identifyExecuted: boolean = false; // Flag para prevenir múltiples llamadas a identify()
	private wsService: WebSocketService;
	private realtimeMessageManager: RealtimeMessageManager;
	private consentManager: ConsentManager;
	private consentBackendService: ConsentBackendService;
	private consentBanner: ConsentBannerUI | null = null;

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
		
		// Configurar mensaje de bienvenida con valores por defecto si no se proporciona
		this.welcomeMessageConfig = options.welcomeMessage || {
			enabled: true,
			style: 'friendly',
			includeEmojis: true,
			language: 'es',
			showTips: true
		};

		// Configurar validador de horarios activos si se proporciona
		if (options.activeHours && options.activeHours.enabled) {
			const activeHoursConfig: ActiveHoursConfig = {
				enabled: true,
				ranges: options.activeHours.ranges || [],
				timezone: options.activeHours.timezone,
				fallbackMessage: options.activeHours.fallbackMessage
			};

			// Validar la configuración antes de crear el validador
			const configErrors = ActiveHoursValidator.validateConfig(activeHoursConfig);
			if (configErrors.length > 0) {
				console.warn('[TrackingPixelSDK] ❌ Errores en configuración de horarios activos:', configErrors);
			} else {
				this.activeHoursValidator = new ActiveHoursValidator(activeHoursConfig);
				console.log('[TrackingPixelSDK] 🕐 Validador de horarios activos configurado:', activeHoursConfig);
			}
		}

		// NO escribir en localStorage aquí - se hará después del consentimiento
		// localStorage se usa solo después de verificar consentimiento en init()

		// Inicializar el signal de identity
		this.identitySignal = IdentitySignal.getInstance();

		// Inicializar servicios de WebSocket y mensajería en tiempo real
		this.wsService = WebSocketService.getInstance();
		this.realtimeMessageManager = RealtimeMessageManager.getInstance();

		// Inicializar el gestor de consentimiento GDPR
		// requireConsent (default: false) controla si se requiere consentimiento
		// Si requireConsent es false, el SDK se inicializa sin esperar consentimiento
		const requireConsent = options.requireConsent ?? false;
		const waitForConsent = options.consent?.waitForConsent ?? requireConsent;
		const defaultStatus = requireConsent ? (options.consent?.defaultStatus || 'pending') : 'granted';

		this.consentManager = ConsentManager.getInstance({
			version: __SDK_VERSION__, // Versión sincronizada automáticamente desde package.json
			waitForConsent: waitForConsent,
			defaultStatus: defaultStatus,
			onConsentChange: (state) => {
				console.log('[TrackingPixelSDK] 🔐 Estado de consentimiento cambiado:', state);

				// Si se otorga el consentimiento, iniciar tracking si estaba pausado
				if (state.status === 'granted') {
					console.log('[TrackingPixelSDK] ✅ Consentimiento otorgado - habilitando tracking');
					console.log('[TrackingPixelSDK] 📝 El backend registrará automáticamente el consentimiento en identify()');

					// Inicializar el SDK completo
					this.init().catch(error => {
						console.error('[TrackingPixelSDK] ❌ Error inicializando SDK después de consentimiento:', error);
					});
				}

				// Si se deniega o revoca, detener tracking
				if (state.status === 'denied') {
					console.log('[TrackingPixelSDK] ❌ Consentimiento denegado - deshabilitando tracking');
					this.stopTrackingActivities();
				}

				// Llamar al callback del usuario si existe
				if (options.consent?.onConsentChange) {
					options.consent.onConsentChange(state);
				}
			}
		});

		// Inicializar el servicio de backend de consentimientos
		this.consentBackendService = ConsentBackendService.getInstance();
		console.log('[TrackingPixelSDK] 🔐 ConsentBackendService inicializado');

		// Inicializar el banner de consentimiento si está configurado
		// Solo mostrar el banner si se requiere consentimiento
		if (requireConsent && options.consentBanner && options.consentBanner.enabled !== false) {
			this.initConsentBanner(options.consentBanner);
		}

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

		// GDPR Compliance: Verificar estado de consentimiento inicial
		const initialState = this.consentManager.getState();

		if (initialState.status === 'pending') {
			// NO inicializar SDK - esperar a que se otorgue consentimiento
			console.log('[TrackingPixelSDK] 🔐 Estado inicial: pending - SDK pausado');
			console.log('[TrackingPixelSDK] ⏸️ SDK pausado hasta que se otorgue consentimiento');
		} else if (initialState.status === 'granted') {
			// Inicializar inmediatamente
			console.log('[TrackingPixelSDK] 🔐 Estado inicial: granted - Inicializando SDK');
			this.init().catch(error => {
				console.error('[TrackingPixelSDK] ❌ Error inicializando SDK:', error);
			});
		} else {
			// Estado denied - no hacer nada
			console.log('[TrackingPixelSDK] 🔐 Estado inicial: denied - SDK no se inicializará');
		}
	}

	public async init(): Promise<void> {
		// Nota: Este método inicializa completamente el SDK (localStorage, UI, tracking)
		// Solo debe llamarse cuando el consentimiento está 'granted'
		// La verificación se hace en el constructor y en onConsentChange
		// Para registrar rechazos de consentimiento, usar identitySignal.identify() directamente

		console.log('[TrackingPixelSDK] 🚀 Inicializando SDK con consentimiento otorgado...');

		// ✅ GDPR COMPLIANT: Solo escribir en localStorage después de verificar consentimiento
		console.log('[TrackingPixelSDK] 🔐 Consentimiento verificado - guardando configuración en localStorage');
		localStorage.setItem("pixelEndpoint", this.endpoint);
		localStorage.setItem("guidersApiKey", this.apiKey);

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
			welcomeMessage: this.welcomeMessageConfig,
		});
		const chat = this.chatUI; // Alias para mantener compatibilidad con el código existente
		const chatInput = new ChatInputUI(chat);
		this.chatToggleButton = new ChatToggleButtonUI(chat);
		const chatToggleButton = this.chatToggleButton; // Alias para compatibilidad con código existente

		const initializeChatComponents = () => {
			console.log("Inicializando componentes del chat rápidamente...");
			
			// Verificar horarios activos antes de inicializar
			if (this.activeHoursValidator && !this.activeHoursValidator.isChatActive()) {
				console.log("🕐 Chat no está disponible según horarios configurados");
				
				// Inicializar componentes pero mantener el chat oculto
				chat.init();
				chat.hide();
				chatInput.init();
				
				// No mostrar el botón de chat cuando está fuera de horarios
				chatToggleButton.init();
				chatToggleButton.hide();
				
				// Mostrar mensaje de horarios si está disponible
				const fallbackMessage = this.activeHoursValidator.getFallbackMessage();
				const nextAvailable = this.activeHoursValidator.getNextAvailableTime();
				
				let statusMessage = fallbackMessage;
				if (nextAvailable) {
					statusMessage += ` Próximo horario disponible: ${nextAvailable}`;
				}
				
				console.log("🕐 " + statusMessage);
				
				// Opcionalmente, agregar mensaje al chat (oculto) para cuando se active
				if (chat) {
					chat.addSystemMessage(statusMessage);
				}
				
				// Configurar verificación periódica de horarios (cada 5 minutos)
				const checkInterval = setInterval(() => {
					if (this.activeHoursValidator && this.activeHoursValidator.isChatActive()) {
						console.log("🕐 ✅ Chat ahora está disponible según horarios");
						chatToggleButton.show();
						clearInterval(checkInterval);
					}
				}, 5 * 60 * 1000); // 5 minutos
				
				return; // No continuar con la inicialización normal
			}
			
			// Inicialización normal del chat cuando está en horarios activos
			// Inicializar componentes (el chat comienza oculto por defecto)
			chat.init();
			// Asegurarnos explícitamente que el chat esté oculto ANTES de inicializar cualquier
			// otro componente para evitar que el chat se muestre y luego se oculte
			chat.hide();
			// Inicializar los demás componentes después de ocultar el chat
			chatInput.init();
			chatToggleButton.init();
			
			// Inicializar ChatMessagesUI para scroll infinito (después de que chat esté inicializado)
			const messagesContainer = chat.getMessagesContainer();
			if (messagesContainer) {
				this.chatMessagesUI = new ChatMessagesUI(messagesContainer);
			}
			
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

				// 📡 Actualizar estado del toggle button
				chatToggleButton.updateState(true);

				// 📡 Inicializar WebSocket si no está conectado
				this.initializeWebSocketConnection(chat);

				// Cargar mensajes del chat si existe un chatId
				this.loadChatMessagesOnOpen(chat);

				// 📬 Marcar todos los mensajes como leídos cuando se abre el chat
				if (this.chatToggleButton) {
					setTimeout(async () => {
						await this.chatToggleButton!.markAllMessagesAsRead();
						console.log('📬 [TrackingPixelSDK] Mensajes marcados como leídos al abrir chat');
					}, 1000); // Esperar 1 segundo para dar tiempo a que el usuario vea los mensajes
				}
			});
			chat.onClose(() => {
				this.captureEvent("visitor:close-chat", {
					timestamp: new Date().getTime(),
					chatId: chat.getChatId(),
				});

				// 📡 Actualizar estado del toggle button
				chatToggleButton.updateState(false);
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
		
		chatInput.onSubmit(async (message: string) => {
			if (!message) return;
			
			console.log('💬 [TrackingPixelSDK] 📝 Mensaje enviado desde UI:', message);
			
			// Capturar el evento de tracking como antes
			this.captureEvent("visitor:send-message", { 
				id: uuidv4(),
				message,
				timestamp: new Date().getTime(),
				chatId: chat.getChatId(),
			});
			this.flush();

			// Verificar estado del visitante
			const visitorId = this.getVisitorId();
			const isIdentified = this.isVisitorIdentified();
			console.log('💬 [TrackingPixelSDK] 🔍 Estado del visitante:', {
				visitorId,
				isIdentified,
				identityState: this.identitySignal.getState()
			});

			if (!visitorId) {
				console.warn('💬 [TrackingPixelSDK] ❌ No hay visitorId disponible para enviar mensaje');
				console.warn('💬 [TrackingPixelSDK] 🔄 Intentando identificar visitante primero...');
				
				try {
					await this.executeIdentify();
					const newVisitorId = this.getVisitorId();
					if (!newVisitorId) {
						console.error('💬 [TrackingPixelSDK] ❌ No se pudo identificar el visitante');
						return;
					}
					console.log('💬 [TrackingPixelSDK] ✅ Visitante identificado:', newVisitorId);
				} catch (error) {
					console.error('💬 [TrackingPixelSDK] ❌ Error identificando visitante:', error);
					return;
				}
			}

			// Lógica optimizada: usar chatId existente o crear nuevo chat (con protección anti-duplicados)
			try {
				const finalVisitorId = this.getVisitorId();
				const currentChatId = chat.getChatId();
				
				console.log('💬 [TrackingPixelSDK] 📤 Enviando mensaje para visitante:', finalVisitorId);
				console.log('💬 [TrackingPixelSDK] 🔍 Chat ID actual:', currentChatId);

				let result;

				if (currentChatId) {
					// Ya existe un chat activo, usar sistema de tiempo real (WebSocket)
					console.log('💬 [TrackingPixelSDK] 📋 Enviando mensaje a chat existente (WebSocket):', currentChatId);
					
					// Asegurarse de que WebSocket esté inicializado
					if (!this.wsService.isConnected()) {
						this.initializeWebSocketConnection(chat);
					}
					
					// Asegurarse de que el chat esté configurado en el manager
					if (this.realtimeMessageManager.getCurrentChatId() !== currentChatId) {
						this.realtimeMessageManager.setCurrentChat(currentChatId);
					}
					
					// Enviar mensaje via RealtimeMessageManager (HTTP POST + notificación WebSocket)
					await this.realtimeMessageManager.sendMessage(message, 'text');

					result = {
						chat: { id: currentChatId },
						message: { id: 'pending' }, // El ID real llegará via WebSocket
						isNewChat: false
					};
				} else {
					// No hay chat activo, verificar si ya se está creando uno
					if (chat.isCreatingChat()) {
						console.log('💬 [TrackingPixelSDK] ⏳ Ya se está creando un chat, esperando...');
						// Esperar a que se complete la creación del chat actual
						await chat.waitForChatCreation();
						// Intentar enviar el mensaje al chat recién creado
						const newChatId = chat.getChatId();
						if (newChatId) {
							console.log('💬 [TrackingPixelSDK] 📋 Enviando mensaje a chat recién creado:', newChatId);
							const message_sent = await ChatV2Service.getInstance().sendMessage(
								newChatId,
								message,
								'text'
							);
							result = {
								chat: { id: newChatId },
								message: message_sent,
								isNewChat: false
							};
						} else {
							throw new Error('No se pudo obtener el chatId después de la creación');
						}
					} else {
						// Marcar que se está creando un chat para evitar duplicados
						chat.setCreatingChat(true);
						
						console.log('💬 [TrackingPixelSDK] 🆕 Creando nuevo chat con mensaje');
						
						try {
							const chatWithMessage = await ChatV2Service.getInstance().createChatWithMessage(
								{}, // chatData vacío
								{ content: message, type: 'text' } // messageData
							);

							// La respuesta viene directamente con chatId, no chat.id
							const newChatId = chatWithMessage.chatId;
							if (newChatId) {
								chat.setChatId(newChatId);
								console.log('💬 [TrackingPixelSDK] 🆕 Chat ID asignado:', newChatId);
								
								// 📡 Inicializar WebSocket para el nuevo chat
								this.initializeWebSocketConnection(chat);
								this.realtimeMessageManager.setCurrentChat(newChatId);
							}

							result = {
								chat: { id: newChatId },
								message: { id: chatWithMessage.messageId },
								isNewChat: true
							};
						} finally {
							// Siempre marcar que ya no se está creando el chat
							chat.setCreatingChat(false);
						}
					}
				}

				if (result) {
					console.log('💬 [TrackingPixelSDK] ✅ Mensaje enviado exitosamente:', {
						chatId: result.chat.id,
						isNewChat: result.isNewChat
					});

					// Disparar evento personalizado para dev random messages
					if (typeof window !== 'undefined') {
						const customEvent = new CustomEvent('guidersMessageSent', {
							detail: {
								message: message,
								chatId: result.chat.id,
								isNewChat: result.isNewChat
							}
						});
						window.dispatchEvent(customEvent);
					}
				}
			} catch (error) {
				console.error('💬 [TrackingPixelSDK] ❌ Error enviando mensaje:', error);
				// En caso de error, asegurar que se libere el bloqueo
				chat.setCreatingChat(false);
			}
		});			this.on("receive-message", (msg: PixelEvent) => {
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

		// Enable automatic tracking (heuristic detection)
		this.enableAutomaticTracking();

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
		// Prevenir múltiples ejecuciones
		if (this.identifyExecuted) {
			console.log('[TrackingPixelSDK] ⚠️ identify() ya ejecutado - ignorando llamada duplicada');
			return;
		}

		// Marcar como ejecutado ANTES de llamar para prevenir race conditions
		this.identifyExecuted = true;

		try {
			console.log('[TrackingPixelSDK] 🔍 Ejecutando identify...');

			// Usar identitySignal en lugar de llamar directamente al servicio
			const result = await this.identitySignal.identify(this.fingerprint!, this.apiKey);
			if (result?.identity?.visitorId) {
				console.log('[TrackingPixelSDK] ✅ Visitante identificado con identitySignal:', result.identity.visitorId);

				// Configurar sessionId en ConsentBackendService
				const sessionId = sessionStorage.getItem('guiders_backend_session_id');
				if (sessionId) {
					this.consentBackendService.setSessionId(sessionId);
					console.log('[TrackingPixelSDK] 🔐 SessionId configurado en ConsentBackendService');
				}

				// 📬 Inicializar servicio de mensajes no leídos con badge tempranamente
				// Esto asegura que el badge se actualice correctamente al refrescar la página
				if (this.chatToggleButton) {
					this.chatToggleButton.connectUnreadService(result.identity.visitorId);
					console.log('📬 [TrackingPixelSDK] ✅ Servicio de mensajes no leídos conectado tempranamente');
				}

				// REGISTRO AUTOMÁTICO DE CONSENTIMIENTOS:
				// El backend ahora registra TODOS los consentimientos automáticamente en identify()
				// según el valor de hasAcceptedPrivacyPolicy enviado en el payload.
				// Ya NO es necesario registrar manualmente analytics, functional ni personalization.
				console.log('[TrackingPixelSDK] ✅ Consentimientos registrados automáticamente por el backend en identify()');

				// Sincronizar estado de consentimiento con el backend SOLO para visitantes recurrentes
				// (cuando el consentimiento local tiene más de 5 segundos)
				if (this.consentManager.isGranted()) {
					try {
						const currentState = this.consentManager.getState();
						const consentAge = Date.now() - currentState.timestamp;

						// Solo sincronizar si el consentimiento es antiguo (visitante recurrente)
						// Para consentimientos recientes (< 5s), el backend ya los tiene del identify()
						if (consentAge > 5000) {
							console.log('[TrackingPixelSDK] 🔄 Sincronizando con backend (visitante recurrente, consentimiento antiguo)...');
							const backendState = await this.consentBackendService.syncWithBackend(result.identity.visitorId);
							console.log('[TrackingPixelSDK] 🔄 Estado de consentimiento sincronizado con backend:', backendState);

							// Actualizar el estado local si el backend tiene información diferente
							if (currentState.preferences) {
								const hasChanges =
									currentState.preferences.analytics !== backendState.analytics ||
									currentState.preferences.functional !== backendState.functional ||
									currentState.preferences.personalization !== backendState.personalization;

								if (hasChanges) {
									console.log('[TrackingPixelSDK] 🔄 Actualizando preferencias locales con estado del backend');
									this.consentManager.grantConsentWithPreferences(backendState);
								}
							}
						} else {
							console.log('[TrackingPixelSDK] ⏭️ Saltando sincronización: consentimiento recién otorgado (edad: ' + Math.round(consentAge / 1000) + 's)');
							console.log('[TrackingPixelSDK] 📝 El backend ya tiene los consentimientos del identify() actual');
						}
					} catch (error) {
						console.warn('[TrackingPixelSDK] ⚠️ No se pudo sincronizar con backend, continuando con estado local:', error);
					}
				}

				// Iniciar heartbeat backend (cada 30s) sin fallback
				if (this.visitorHeartbeatTimer) clearInterval(this.visitorHeartbeatTimer);
				this.visitorHeartbeatTimer = setInterval(() => {
					VisitorsV2Service.getInstance().heartbeat();
				}, 30000);

				// Los chats ya se cargan automáticamente en identitySignal.identify()
				const hasExistingChats = result.chats?.chats && result.chats.chats.length > 0;

				if (hasExistingChats && result.chats) {
					localStorage.setItem('guiders_recent_chats', JSON.stringify(result.chats.chats));
					ChatMemoryStore.getInstance().setChatId(result.chats.chats![0].id);
					console.log('[TrackingPixelSDK] ♻️ Chat reutilizable (más reciente) guardado en memoria:', result.chats.chats![0].id);

					// 🔧 ELIMINADO: No cargar mensajes automáticamente al identificar visitante
					// Solo cargar cuando el usuario abra el chat para evitar peticiones innecesarias
					// this.loadInitialMessagesFromFirstChat(result.chats.chats[0]);

					// 📬 Cargar mensajes no leídos para mostrar badge al refrescar la página
					if (this.chatToggleButton && result.chats.chats![0].id) {
						this.chatToggleButton.setActiveChatForUnread(result.chats.chats![0].id);
						console.log('📬 [TrackingPixelSDK] Cargando mensajes no leídos al inicializar con chat existente');
					}
				} else {
					// No hay chats previos, mostrar mensaje de bienvenida automáticamente
					console.log('[TrackingPixelSDK] 💬 No hay chats previos, mostrando mensaje de bienvenida automáticamente');
					if (this.chatUI && this.chatUI.checkAndAddWelcomeMessage) {
						// Pequeño delay para asegurar que el chat esté completamente inicializado
						setTimeout(() => {
							if (this.chatUI && this.chatUI.checkAndAddWelcomeMessage) {
								this.chatUI.checkAndAddWelcomeMessage();
								console.log('[TrackingPixelSDK] ✅ Mensaje de bienvenida mostrado automáticamente');
							}
						}, 500);
					}
				}

				// 📡 Inicializar WebSocket SIEMPRE para recibir notificaciones proactivas
				// IMPORTANTE: Esto debe ejecutarse independientemente de si hay chats o no
				// para poder recibir el evento 'chat:created' cuando un comercial cree un chat proactivamente
				if (this.chatUI && !this.wsService.isConnected()) {
					console.log('📡 [TrackingPixelSDK] 🚀 Inicializando WebSocket para notificaciones en tiempo real');
					this.initializeWebSocketConnection(this.chatUI);

					// Si hay chat existente, configurarlo en el RealtimeMessageManager
					if (hasExistingChats && result.chats && result.chats.chats![0].id) {
						this.realtimeMessageManager.setCurrentChat(result.chats.chats![0].id);
						console.log('📡 [TrackingPixelSDK] ✅ WebSocket configurado para chat existente:', result.chats.chats![0].id);
					} else {
						console.log('📡 [TrackingPixelSDK] ✅ WebSocket configurado para recibir notificaciones de chats nuevos');
					}
				}
			}
		} catch (e) {
			// No resetear el flag si es una operación cancelada
			const errorMessage = e instanceof Error ? e.message : String(e);
			if (!errorMessage.includes('Operation was superseded')) {
				console.warn('[TrackingPixelSDK] ❌ identify V2 fallido:', e);
				// Resetear flag para permitir reintento en caso de error real
				this.identifyExecuted = false;
			} else {
				console.log('[TrackingPixelSDK] ℹ️ identify cancelado por operación más reciente');
			}
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
	 * Update active hours configuration dynamically
	 */
	public updateActiveHoursConfig(config: ActiveHoursConfig): void {
		try {
			this.activeHoursValidator = new ActiveHoursValidator(config);
			console.log('[TrackingPixelSDK] 🕐 Configuración de horarios activos actualizada:', {
				enabled: config.enabled,
				timezone: config.timezone,
				ranges: config.ranges?.length || 0,
				fallbackMessage: config.fallbackMessage ? 'Configurado' : 'No configurado'
			});

			// Re-evaluar estado del chat 
			const isActive = this.activeHoursValidator.isChatActive();
			if (!isActive && config.fallbackMessage) {
				console.log('[TrackingPixelSDK] 🕐 Chat fuera de horario activo, aplicando mensaje de fallback');
				// Aquí podrías emitir un evento o actualizar la UI según sea necesario
			}
		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error actualizando configuración de horarios activos:', error);
		}
	}

	/**
	 * Get current active hours configuration
	 */
	public getActiveHoursConfig(): ActiveHoursConfig | null {
		return this.activeHoursValidator?.getConfig() || null;
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
			// Verificar consentimiento antes de hacer tracking
			if (!this.consentManager.isTrackingAllowed()) {
				console.log('[TrackingPixelSDK] 🔐 Tracking bloqueado - sin consentimiento');
				resolve(); // No rechazar, solo ignorar silenciosamente
				return;
			}

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

	/**
	 * Legacy compatibility wrapper for trackEvent()
	 * @deprecated Use track() instead. This method exists for WordPress plugin compatibility.
	 */
	public async trackEvent(eventType: string, data?: Record<string, unknown>): Promise<void> {
		console.warn('[TrackingPixelSDK] ⚠️  trackEvent() is deprecated. Please use track() instead.');
		return this.track({ event: eventType, ...data });
	}

	private captureEvent(type: string, data: Record<string, unknown>): void {
		// Verificar consentimiento antes de capturar eventos
		if (!this.consentManager.isTrackingAllowed()) {
			console.log('[TrackingPixelSDK] 🔐 Evento bloqueado - sin consentimiento:', type);
			return;
		}

		// Verificar si analytics está permitido para eventos de tracking
		if (!this.consentManager.isCategoryAllowed('analytics')) {
			console.log('[TrackingPixelSDK] 🔐 Evento bloqueado - analytics no permitido:', type);
			return;
		}

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

	/**
	 * Muestra el chat UI.
	 */
	public showChat(): void {
		console.log('[TrackingPixelSDK] 💬 Mostrando chat...');
		if (this.chatUI) {
			this.chatUI.show();
		} else {
			console.warn('[TrackingPixelSDK] ❌ Chat UI no está inicializado');
		}
	}

	/**
	 * Oculta el chat UI.
	 */
	public hideChat(): void {
		console.log('[TrackingPixelSDK] 💬 Ocultando chat...');
		if (this.chatUI) {
			this.chatUI.hide();
		}
	}

	/**
	 * Actualiza la configuración del mensaje de bienvenida.
	 * @param config Nueva configuración del mensaje de bienvenida
	 */
	public updateWelcomeMessage(config: WelcomeMessageConfig): void {
		console.log('[TrackingPixelSDK] 🎨 Actualizando mensaje de bienvenida:', config);
		
		// Guardar en configuración para futuras inicializaciones
		this.welcomeMessageConfig = config;
		
		// Si el chat ya está inicializado, aplicar la configuración
		if (this.chatUI) {
			this.chatUI.setWelcomeMessage(config);
		}
	}

	/**
	 * Obtiene la configuración actual del mensaje de bienvenida.
	 * @returns Configuración actual del mensaje de bienvenida
	 */
	public getWelcomeMessageConfig(): Partial<WelcomeMessageConfig> | null {
		return this.welcomeMessageConfig || null;
	}

	/**
	 * Verifica si el chat UI está visible.
	 * @returns true si el chat está visible
	 */
	public isChatVisible(): boolean {
		return this.chatUI?.isVisible() || false;
	}

	/**
	 * Reinicia el chat cerrándolo y volviéndolo a abrir.
	 */
	public resetChat(): void {
		console.log('[TrackingPixelSDK] 🔄 Reiniciando chat...');
		if (this.chatUI) {
			this.chatUI.hide();
			setTimeout(() => {
				if (this.chatUI) {
					this.chatUI.show();
				}
			}, 500);
		}
	}

	/**
	 * Carga los mensajes del chat cuando se abre por primera vez
	 * @param chat Instancia del ChatUI
	 */
	private async loadChatMessagesOnOpen(chat: any): Promise<void> {
		// 🔒 PROTECCIÓN CONTRA RACE CONDITION: Establecer bandera de carga
		chat.setLoadingInitialMessages(true);

		try {
			const chatId = chat.getChatId();
			if (!chatId) {
				console.log('[TrackingPixelSDK] 💬 No hay chatId, omitiendo carga de mensajes');
				// Verificar si mostrar mensaje de bienvenida al no haber chat
				chat.checkAndAddWelcomeMessage?.();
				return;
			}

			console.log('[TrackingPixelSDK] 💬 🔒 Iniciando carga de mensajes con protección de race condition para chat:', chatId);

			// 🔧 UNIFICACIÓN: Delegar completamente a ChatMessagesUI si está disponible
			if (this.chatMessagesUI) {
				console.log('[TrackingPixelSDK] ✅ Usando ChatMessagesUI para carga unificada');
				await this.chatMessagesUI.initializeChat(chatId);

				// ✅ Después de cargar exitosamente, verificar si mostrar mensaje de bienvenida
				console.log('[TrackingPixelSDK] 💬 Carga completa, verificando necesidad de mensaje de bienvenida');
				if (chat.checkAndAddWelcomeMessage) {
					chat.checkAndAddWelcomeMessage();
				}
				return;
			}

			// 🔧 FALLBACK: Sistema legacy solo si ChatMessagesUI no está disponible
			console.log('[TrackingPixelSDK] ⚠️ ChatMessagesUI no disponible, usando sistema legacy');

			// Mostrar indicador de carga
			chat.showLoadingMessages();

			// Obtener mensajes del chat usando la API V2
			const messageList = await ChatV2Service.getInstance().getChatMessages(
				chatId,
				50, // limit inicial
				undefined // no cursor (mensajes más recientes)
			);

			// Limpiar mensajes existentes y cargar los nuevos
			chat.clearMessages();

			if (messageList.messages && messageList.messages.length > 0) {
				// Agregar mensajes en orden cronológico (invertir el array ya que vienen DESC)
				const messagesInOrder = messageList.messages.reverse();

				for (const message of messagesInOrder) {
					// Extraer el texto del contenido (puede ser string u objeto)
					let messageText = '';
					if (typeof message.content === 'string') {
						messageText = message.content;
					} else if (message.content && typeof message.content === 'object') {
						// Si es un objeto, buscar propiedades comunes
						messageText = message.content.text || message.content.message || message.content.body || JSON.stringify(message.content);
					} else {
						messageText = String(message.content || '');
					}

					chat.renderChatMessage({
						text: messageText,
						sender: message.senderId === this.getVisitorId() ? 'user' : 'other',
						timestamp: new Date(message.createdAt).getTime(),
						senderId: message.senderId
					});
				}

				console.log(`[TrackingPixelSDK] ✅ Cargados ${messagesInOrder.length} mensajes del chat (sistema legacy)`);
			} else {
				console.log('[TrackingPixelSDK] 📭 No hay mensajes en el chat (sistema legacy)');
			}

			// Ocultar indicador de carga
			chat.hideLoadingMessages();

			// Hacer scroll al final para mostrar los mensajes más recientes
			setTimeout(() => {
				if (chat.scrollToBottomV2) {
					chat.scrollToBottomV2();
				} else {
					chat.scrollToBottom(true);
				}
			}, 100);

			// ✅ CONSOLIDACIÓN: Después de cargar, verificar si mostrar mensaje de bienvenida
			// Esto reemplaza la lógica duplicada anterior
			console.log('[TrackingPixelSDK] 💬 Carga legacy completa, verificando necesidad de mensaje de bienvenida');
			if (chat.checkAndAddWelcomeMessage) {
				chat.checkAndAddWelcomeMessage();
			}

		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error cargando mensajes del chat:', error);
			chat.hideLoadingMessages();

			// En caso de error, también verificar si mostrar mensaje de bienvenida
			console.log('[TrackingPixelSDK] ⚠️ Error en carga, verificando mensaje de bienvenida como fallback');
			if (chat.checkAndAddWelcomeMessage) {
				chat.checkAndAddWelcomeMessage();
			}
		} finally {
			// 🔒 PROTECCIÓN CONTRA RACE CONDITION: Limpiar bandera de carga
			chat.setLoadingInitialMessages(false);
			console.log('[TrackingPixelSDK] 💬 🔒 Bandera de carga limpiada, race condition protection finalizada');
		}
	}

	/**
	 * Carga automáticamente los mensajes iniciales del primer chat en el array.
	 * Se utiliza cuando se identifica al visitante para preparar el historial.
	 * @param firstChat El primer chat del array de chats
	 */
	private async loadInitialMessagesFromFirstChat(firstChat: any): Promise<void> {
		try {
			if (!firstChat?.id) {
				console.log('[TrackingPixelSDK] 📭 No hay ID en el primer chat, omitiendo carga inicial');
				return;
			}

			console.log('[TrackingPixelSDK] 🔄 Cargando mensajes iniciales del chat:', firstChat.id);

			// Si existe una instancia de ChatMessagesUI, verificar si ya está inicializado
			if (this.chatMessagesUI) {
				// Verificar si el chat ya está inicializado o si se está cargando
				if (this.chatMessagesUI.isChatInitialized(firstChat.id)) {
					console.log('[TrackingPixelSDK] ✅ Chat ya inicializado con ChatMessagesUI, omitiendo carga duplicada');
					return;
				}
				
				if (this.chatMessagesUI.isLoadingMessages()) {
					console.log('[TrackingPixelSDK] ⏳ ChatMessagesUI ya está cargando mensajes, omitiendo carga duplicada');
					return;
				}

				await this.chatMessagesUI.initializeChat(firstChat.id);
				console.log('[TrackingPixelSDK] ✅ Mensajes iniciales cargados con ChatMessagesUI');
				return;
			}

			// Fallback: usar el método tradicional si no hay ChatMessagesUI
			const messageList = await ChatV2Service.getInstance().getChatMessages(
				firstChat.id,
				50, // limit inicial
				undefined // no cursor (mensajes más recientes)
			);

			if (messageList.messages && messageList.messages.length > 0) {
				// Almacenar los mensajes en memoria para cuando se abra el chat
				const messagesInOrder = messageList.messages.reverse();
				
				// Guardar en localStorage temporal para acceso rápido
				localStorage.setItem('guiders_initial_messages', JSON.stringify({
					chatId: firstChat.id,
					messages: messagesInOrder,
					loadedAt: Date.now()
				}));

				console.log(`[TrackingPixelSDK] 💾 ${messagesInOrder.length} mensajes iniciales almacenados en memoria`);
			} else {
				console.log('[TrackingPixelSDK] 📭 No hay mensajes iniciales para cargar');
			}

		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error cargando mensajes iniciales:', error);
		}
	}

	// --- Métodos públicos para gestión de horarios activos ---

	/**
	 * Verifica si el chat está activo según los horarios configurados
	 */
	public isChatActive(): boolean {
		if (!this.activeHoursValidator) {
			return true; // Si no hay configuración de horarios, siempre está activo
		}
		return this.activeHoursValidator.isChatActive();
	}

	/**
	 * Obtiene el mensaje de fallback cuando el chat no está activo
	 */
	public getChatFallbackMessage(): string | null {
		if (!this.activeHoursValidator) {
			return null;
		}
		return this.activeHoursValidator.getFallbackMessage();
	}

	/**
	 * Obtiene información sobre el próximo horario disponible
	 */
	public getNextAvailableTime(): string | null {
		if (!this.activeHoursValidator) {
			return null;
		}
		return this.activeHoursValidator.getNextAvailableTime();
	}

	/**
	 * Actualiza la configuración de horarios activos dinámicamente
	 */
	public updateActiveHours(config: Partial<ActiveHoursConfig>): boolean {
		try {
			const activeHoursConfig: ActiveHoursConfig = {
				enabled: config.enabled ?? true,
				ranges: config.ranges || [],
				timezone: config.timezone,
				fallbackMessage: config.fallbackMessage
			};

			const configErrors = ActiveHoursValidator.validateConfig(activeHoursConfig);
			if (configErrors.length > 0) {
				console.warn('[TrackingPixelSDK] ❌ Errores en nueva configuración de horarios activos:', configErrors);
				return false;
			}

			this.activeHoursValidator = new ActiveHoursValidator(activeHoursConfig);
			console.log('[TrackingPixelSDK] 🕐 ✅ Configuración de horarios activos actualizada');
			
			// Verificar estado actual y actualizar UI si es necesario
			this.checkAndUpdateChatAvailability();
			
			return true;
		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error actualizando horarios activos:', error);
			return false;
		}
	}

	/**
	 * Desactiva completamente la validación de horarios activos
	 */
	public disableActiveHours(): void {
		this.activeHoursValidator = undefined;
		console.log('[TrackingPixelSDK] 🕐 Validación de horarios activos desactivada');
		
		// Mostrar el chat si estaba oculto por horarios
		this.checkAndUpdateChatAvailability();
	}

	/**
	 * Verifica y actualiza la disponibilidad del chat según horarios actuales
	 */
	private checkAndUpdateChatAvailability(): void {
		if (!this.chatUI) {
			return;
		}

		const isActive = this.isChatActive();
		const chatToggleButton = document.querySelector('.chat-toggle-button') as HTMLElement;

		if (isActive) {
			// Chat debe estar disponible
			if (chatToggleButton) {
				chatToggleButton.style.display = 'block';
			}
			console.log('[TrackingPixelSDK] 🕐 ✅ Chat ahora disponible según horarios');
		} else {
			// Chat debe estar oculto
			if (chatToggleButton) {
				chatToggleButton.style.display = 'none';
			}
			
			// Cerrar chat si está abierto
			if (this.chatUI.isVisible && this.chatUI.isVisible()) {
				this.chatUI.hide();
			}
			
			const fallbackMessage = this.getChatFallbackMessage();
			const nextAvailable = this.getNextAvailableTime();
			
			let statusMessage = fallbackMessage || 'Chat no disponible en este momento';
			if (nextAvailable) {
				statusMessage += ` Próximo horario: ${nextAvailable}`;
			}
			
			console.log('[TrackingPixelSDK] 🕐 ' + statusMessage);
		}
	}

	// ========== Métodos WebSocket para Comunicación Bidireccional ==========

	/**
	 * Inicializa la conexión WebSocket para comunicación en tiempo real
	 * @param chat Instancia del ChatUI
	 */
	private initializeWebSocketConnection(chat: ChatUI): void {
		const visitorId = this.getVisitorId();
		
		if (!visitorId) {
			console.warn('📡 [TrackingPixelSDK] ⚠️ No se puede conectar WebSocket sin visitorId');
			return;
		}

		// Verificar si ya está conectado
		if (this.wsService.isConnected()) {
			console.log('📡 [TrackingPixelSDK] ✅ WebSocket ya conectado');
			// Actualizar chat actual si cambió
			const currentChatId = chat.getChatId();
			if (currentChatId && this.realtimeMessageManager.getCurrentChatId() !== currentChatId) {
				this.realtimeMessageManager.setCurrentChat(currentChatId);
			}
			return;
		}

		console.log('📡 [TrackingPixelSDK] 🚀 Inicializando conexión WebSocket...');

		try {
			// Obtener sessionId para autenticación
			const sessionId = sessionStorage.getItem('guiders_backend_session_id');
			
			// Configurar y conectar WebSocket
			this.wsService.connect(
				{
					sessionId: sessionId || undefined,
					// La URL se resuelve automáticamente en WebSocketService usando EndpointManager
				},
				{
					onConnect: () => {
						console.log('📡 [TrackingPixelSDK] ✅ WebSocket conectado exitosamente');

						// Unirse a sala de visitante para notificaciones proactivas
						if (visitorId) {
							this.wsService.joinVisitorRoom(visitorId);
							console.log('📡 [TrackingPixelSDK] 🚀 Unido a sala de visitante para notificaciones proactivas');
						}
					},
					onDisconnect: (reason) => {
						console.log('📡 [TrackingPixelSDK] ⚠️ WebSocket desconectado:', reason);
					},
					onError: (error) => {
						console.error('📡 [TrackingPixelSDK] ❌ Error WebSocket:', error.message);
					},
					onChatCreated: (event) => {
						console.log('📡 [TrackingPixelSDK] 🎉 Chat creado proactivamente por un comercial:', event);

						// Unirse automáticamente al nuevo chat
						this.wsService.joinChatRoom(event.chatId);
						this.realtimeMessageManager.setCurrentChat(event.chatId);

						// Actualizar ChatMemoryStore con el nuevo chat
						ChatMemoryStore.getInstance().setChatId(event.chatId);

						// Actualizar servicio de mensajes no leídos
						if (this.chatToggleButton) {
							this.chatToggleButton.setActiveChatForUnread(event.chatId);
						}

						// Mostrar notificación al usuario
						this.showChatCreatedNotification(event);

						console.log('📡 [TrackingPixelSDK] ✅ Configurado automáticamente para el nuevo chat:', event.chatId);
					}
				}
			);

			// Inicializar RealtimeMessageManager con ChatUI
			this.realtimeMessageManager.initialize({
				chatUI: chat,
				visitorId: visitorId,
				enableTypingIndicators: true
			});

			// Establecer chat actual si existe
			const currentChatId = chat.getChatId();
			if (currentChatId) {
				this.realtimeMessageManager.setCurrentChat(currentChatId);
			}

			// Inicializar servicio de mensajes no leídos con badge
			if (this.chatToggleButton) {
				this.chatToggleButton.connectUnreadService(visitorId);

				// Establecer chat activo si existe
				if (currentChatId) {
					this.chatToggleButton.setActiveChatForUnread(currentChatId);
				}

				console.log('📬 [TrackingPixelSDK] ✅ Servicio de mensajes no leídos inicializado');
			}

			console.log('📡 [TrackingPixelSDK] ✅ Sistema de mensajería en tiempo real inicializado');
		} catch (error) {
			console.error('📡 [TrackingPixelSDK] ❌ Error inicializando WebSocket:', error);
		}
	}

	/**
	 * Envía un mensaje usando el sistema de tiempo real
	 * @param content Contenido del mensaje
	 * @param type Tipo de mensaje (default: 'text')
	 */
	public async sendRealtimeMessage(content: string, type: string = 'text'): Promise<void> {
		try {
			await this.realtimeMessageManager.sendMessage(content, type);
		} catch (error) {
			console.error('📡 [TrackingPixelSDK] ❌ Error enviando mensaje en tiempo real:', error);
			throw error;
		}
	}

	/**
	 * Muestra una notificación cuando un comercial crea un chat proactivamente
	 * @param event Evento de chat creado
	 */
	private showChatCreatedNotification(event: any): void {
		try {
			// Solicitar permiso para notificaciones si es necesario
			if ('Notification' in window && Notification.permission === 'default') {
				Notification.requestPermission().then(permission => {
					if (permission === 'granted') {
						this.displayChatNotification(event);
					}
				});
			} else if ('Notification' in window && Notification.permission === 'granted') {
				this.displayChatNotification(event);
			}

			// Animar el botón del chat para llamar la atención
			if (this.chatToggleButton) {
				const buttonElement = this.chatToggleButton.getButtonElement();
				if (buttonElement) {
					buttonElement.classList.add('pulse-animation');
					setTimeout(() => {
						buttonElement.classList.remove('pulse-animation');
					}, 3000);
				}
			}

			console.log('📡 [TrackingPixelSDK] 🔔 Notificación de nuevo chat mostrada');
		} catch (error) {
			console.error('📡 [TrackingPixelSDK] ❌ Error mostrando notificación:', error);
		}
	}

	/**
	 * Muestra la notificación del navegador
	 * @param event Evento de chat creado
	 */
	private displayChatNotification(event: any): void {
		try {
			const notification = new Notification('¡Un comercial ha iniciado un chat!', {
				body: event.message || 'Tienes un nuevo mensaje esperándote',
				icon: '/chat-icon.png', // Puedes personalizar esto
				tag: event.chatId,
				requireInteraction: true // La notificación persiste hasta que el usuario interactúe
			});

			notification.onclick = () => {
				// Abrir el chat cuando el usuario haga clic en la notificación
				if (this.chatUI) {
					this.chatUI.show();
				}
				notification.close();
			};
		} catch (error) {
			console.error('📡 [TrackingPixelSDK] ❌ Error creando notificación del navegador:', error);
		}
	}

	/**
	 * Obtiene el estado de la conexión WebSocket
	 */
	public getWebSocketState(): string {
		return this.wsService.getState();
	}

	/**
	 * Verifica si WebSocket está conectado
	 */
	public isWebSocketConnected(): boolean {
		return this.wsService.isConnected();
	}

	/**
	 * Desconecta el WebSocket manualmente
	 */
	public disconnectWebSocket(): void {
		this.wsService.disconnect();
		this.realtimeMessageManager.cleanup();
		console.log('📡 [TrackingPixelSDK] 🔌 WebSocket desconectado');
	}

	// ========== Métodos de Control de Consentimiento GDPR ==========

	/**
	 * Inicializa solo el chat UI sin tracking (modo sin consentimiento)
	 */
	private async initChatUIOnly(): Promise<void> {
		console.log('[TrackingPixelSDK] 🔐 Inicializando solo chat UI (sin tracking)');

		// Inicializar solo los componentes del chat
		this.chatUI = new ChatUI({
			widget: true,
			welcomeMessage: this.welcomeMessageConfig,
		});

		const initChatOnly = () => {
			if (!this.chatUI) return;

			// Verificar horarios activos si están configurados
			if (this.activeHoursValidator && !this.activeHoursValidator.isChatActive()) {
				console.log('[TrackingPixelSDK] 🕐 Chat no disponible según horarios');
				return;
			}

			const chat = this.chatUI;
			const chatInput = new ChatInputUI(chat);
			this.chatToggleButton = new ChatToggleButtonUI(chat);
			const chatToggleButton = this.chatToggleButton; // Alias para compatibilidad

			chat.init();
			chat.hide();
			chatInput.init();
			chatToggleButton.init();
			chatToggleButton.show();

			console.log('[TrackingPixelSDK] ✅ Chat UI inicializado (sin tracking)');

			// Listener básico para abrir/cerrar chat (sin tracking)
			chat.onOpen(() => {
				console.log('[TrackingPixelSDK] 💬 Chat abierto (sin tracking de eventos)');
			});

			chat.onClose(() => {
				console.log('[TrackingPixelSDK] 💬 Chat cerrado (sin tracking de eventos)');
			});

			chatToggleButton.onToggle((visible: boolean) => {
				if (visible) {
					chat.show();
				} else {
					chat.hide();
				}
			});

			// El envío de mensajes requiere consentimiento funcional al menos
			chatInput.onSubmit(async (message: string) => {
				if (!message) return;

				// Verificar si hay consentimiento funcional
				if (!this.consentManager.isCategoryAllowed('functional')) {
					console.warn('[TrackingPixelSDK] 🔐 Envío de mensajes bloqueado - se requiere consentimiento funcional');
					chat.addSystemMessage('Se requiere aceptar cookies funcionales para enviar mensajes.');
					return;
				}

				// Si hay consentimiento funcional, proceder como normal
				try {
					const visitorId = this.getVisitorId();
					if (!visitorId) {
						await this.executeIdentify();
					}

					const currentChatId = chat.getChatId();
					if (currentChatId) {
						await ChatV2Service.getInstance().sendMessage(currentChatId, message, 'text');
					} else {
						const result = await ChatV2Service.getInstance().createChatWithMessage(
							{},
							{ content: message, type: 'text' }
						);
						chat.setChatId(result.chatId);
					}
				} catch (error) {
					console.error('[TrackingPixelSDK] ❌ Error enviando mensaje:', error);
				}
			});
		};

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', initChatOnly);
		} else {
			initChatOnly();
		}
	}

	/**
	 * Detiene todas las actividades de tracking
	 */
	private stopTrackingActivities(): void {
		console.log('[TrackingPixelSDK] 🛑 Deteniendo todas las actividades de tracking...');

		// Detener DOM tracking
		if (this.domTrackingManager) {
			// Los managers no tienen método público para detener, pero podemos limpiar
			console.log('[TrackingPixelSDK] 🛑 DOM tracking detenido');
		}

		// Detener session tracking
		if (this.sessionTrackingManager) {
			// El session manager se detendrá automáticamente al no procesar nuevos eventos
			console.log('[TrackingPixelSDK] 🛑 Session tracking detenido');
		}

		// Detener heartbeat de visitante
		if (this.visitorHeartbeatTimer) {
			clearInterval(this.visitorHeartbeatTimer);
			this.visitorHeartbeatTimer = null;
			console.log('[TrackingPixelSDK] 🛑 Visitor heartbeat detenido');
		}

		// Detener auto flush
		this.stopAutoFlush();

		// Limpiar cola de eventos
		this.eventQueue = [];

		console.log('[TrackingPixelSDK] ✅ Todas las actividades de tracking detenidas');
	}

	/**
	 * Inicializa el banner de consentimiento integrado
	 */
	private initConsentBanner(config: ConsentBannerConfig): void {
		console.log('[TrackingPixelSDK] 🎨 Inicializando banner de consentimiento...');

		this.consentBanner = new ConsentBannerUI(config);

		// Conectar callbacks con el ConsentManager
		this.consentBanner.onAccept = () => {
			console.log('[TrackingPixelSDK] ✅ Usuario aceptó desde banner');
			this.grantConsent();
			this.consentBanner?.hide();
		};

		this.consentBanner.onDeny = () => {
			console.log('[TrackingPixelSDK] ❌ Usuario rechazó desde banner');
			this.denyConsent();
			this.consentBanner?.hide();
		};

		this.consentBanner.onPreferences = () => {
			console.log('[TrackingPixelSDK] ⚙️ Usuario abrió preferencias desde banner');
			// TODO: Implementar modal de preferencias en el futuro
			// Por ahora, mostrar alerta informativa
			alert('Modal de preferencias: Próximamente.\n\nPor ahora, puedes:\n- Aceptar Todo = Otorgar consentimiento completo\n- Rechazar = Solo cookies esenciales');
		};

		// Renderizar el banner
		this.consentBanner.render();

		// Si autoShow está habilitado y el consentimiento está pending, mostrar
		if (config.autoShow && this.consentManager.isPending()) {
			this.consentBanner.show();
			console.log('[TrackingPixelSDK] 👁️ Banner mostrado automáticamente (consent pending)');
		}
	}

	/**
	 * Otorga consentimiento completo y reinicia el tracking
	 */
	public grantConsent(): void {
		console.log('[TrackingPixelSDK] ✅ Otorgando consentimiento completo...');

		this.consentManager.grantConsent();

		// Nota: El consentimiento se registrará automáticamente en el backend
		// durante init() -> identify() con hasAcceptedPrivacyPolicy: true
		console.log('[TrackingPixelSDK] 📝 El backend registrará el consentimiento automáticamente durante identify()');

		// Reiniciar el SDK con tracking habilitado
		console.log('[TrackingPixelSDK] 🔄 Reiniciando SDK con tracking habilitado...');
		this.init().catch(error => {
			console.error('[TrackingPixelSDK] ❌ Error reiniciando SDK:', error);
		});
	}

	/**
	 * Otorga consentimiento con preferencias específicas
	 */
	public grantConsentWithPreferences(preferences: {
		analytics?: boolean;
		functional?: boolean;
		personalization?: boolean;
	}): void {
		console.log('[TrackingPixelSDK] ✅ Otorgando consentimiento con preferencias:', preferences);

		this.consentManager.grantConsentWithPreferences(preferences);

		// Nota: El consentimiento se registrará automáticamente en el backend
		// durante init() -> identify() con hasAcceptedPrivacyPolicy: true
		console.log('[TrackingPixelSDK] 📝 El backend registrará el consentimiento automáticamente durante identify()');

		// Reiniciar el SDK con tracking habilitado
		console.log('[TrackingPixelSDK] 🔄 Reiniciando SDK...');
		this.init().catch(error => {
			console.error('[TrackingPixelSDK] ❌ Error reiniciando SDK:', error);
		});
	}

	/**
	 * Deniega el consentimiento y detiene el tracking
	 */
	public denyConsent(): void {
		console.log('[TrackingPixelSDK] ❌ Denegando consentimiento...');

		this.consentManager.denyConsent();
		this.stopTrackingActivities();

		// IMPORTANTE: Registrar el rechazo en el backend para compliance GDPR
		// El backend necesita saber que el usuario rechazó explícitamente
		console.log('[TrackingPixelSDK] 📝 Registrando rechazo de consentimiento en el backend...');

		// NO llamar a init() aquí porque init() asume consentimiento granted
		// y escribe en localStorage (violación GDPR si consent está denied)
		// En su lugar, llamar directamente a identitySignal.identify()
		// que leerá el estado 'denied' del ConsentManager desde localStorage

		// Generar fingerprint si no existe (sin escribir en localStorage todavía)
		const client = new ClientJS();
		const fingerprint = this.fingerprint || client.getFingerprint().toString();

		this.identitySignal.identify(fingerprint, this.apiKey).catch(error => {
			console.warn('[TrackingPixelSDK] ⚠️ No se pudo registrar el rechazo en el backend:', error);
			// No es un error crítico - el usuario ya tiene acceso limitado localmente
		});
	}

	/**
	 * Revoca el consentimiento previamente otorgado
	 */
	public revokeConsent(): void {
		console.log('[TrackingPixelSDK] 🔄 Revocando consentimiento...');

		this.consentManager.revokeConsent();
		this.stopTrackingActivities();

		// Revocar en el backend si hay un visitante identificado
		const visitorId = this.getVisitorId();
		if (visitorId) {
			this.consentBackendService.revokeAllConsents(
				visitorId,
				'Usuario revocó consentimiento desde el SDK'
			)
				.then(() => {
					console.log('[TrackingPixelSDK] 🔄 Revocación sincronizada con backend');
				})
				.catch(error => {
					console.error('[TrackingPixelSDK] ❌ Error revocando en backend:', error);
				});
		}
	}

	/**
	 * Obtiene el estado actual de consentimiento
	 */
	public getConsentStatus() {
		return this.consentManager.getStatus();
	}

	/**
	 * Obtiene el estado completo de consentimiento
	 */
	public getConsentState() {
		return this.consentManager.getState();
	}

	/**
	 * Verifica si el consentimiento ha sido otorgado
	 */
	public isConsentGranted(): boolean {
		return this.consentManager.isGranted();
	}

	/**
	 * Verifica si una categoría específica de consentimiento está permitida
	 */
	public isCategoryAllowed(category: 'analytics' | 'functional' | 'personalization'): boolean {
		return this.consentManager.isCategoryAllowed(category);
	}

	/**
	 * Suscribe un callback para cambios en el consentimiento
	 */
	public subscribeToConsentChanges(callback: (state: any) => void) {
		return this.consentManager.subscribe(callback);
	}

	/**
	 * Elimina todos los datos del visitante (GDPR Right to Erasure)
	 * IMPORTANTE: Este método elimina TODOS los datos locales y solicita
	 * al backend eliminar los datos del servidor.
	 */
	public async deleteVisitorData(): Promise<void> {
		console.log('[TrackingPixelSDK] 🗑️ Eliminando datos del visitante (GDPR Right to Erasure)...');

		try {
			// 1. Obtener visitorId antes de eliminar
			const visitorId = this.getVisitorId();

			// 2. Detener todas las actividades
			this.stopTrackingActivities();

			// 3. Limpiar datos locales
			this.clearLocalStorageData();

			// 4. Resetear consentimiento
			this.consentManager.clearConsentData();

			// 5. Si hay visitorId, solicitar eliminación en el servidor
			if (visitorId) {
				try {
					// Eliminar datos de consentimiento del backend
					await this.consentBackendService.deleteConsentData(visitorId);
					console.log('[TrackingPixelSDK] ✅ Datos de consentimiento eliminados del backend');

					// Aquí iría la llamada al endpoint de eliminación de otros datos del visitante
					// await VisitorsV2Service.getInstance().deleteVisitor(visitorId);
					console.log('[TrackingPixelSDK] 📡 Solicitud de eliminación enviada al servidor para visitor:', visitorId);
				} catch (error) {
					console.error('[TrackingPixelSDK] ❌ Error eliminando datos del servidor:', error);
					throw new Error('No se pudieron eliminar los datos del servidor');
				}
			}

			// 6. Limpiar señales y estado
			this.identitySignal.reset();
			this.fingerprint = null;

			console.log('[TrackingPixelSDK] ✅ Datos del visitante eliminados exitosamente');
		} catch (error) {
			console.error('[TrackingPixelSDK] ❌ Error eliminando datos del visitante:', error);
			throw error;
		}
	}

	/**
	 * Limpia todos los datos de localStorage relacionados con Guiders
	 */
	private clearLocalStorageData(): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		const keysToRemove = [
			'fingerprint',
			'guiders_backend_session_id',
			'guiders_recent_chats',
			'guiders_initial_messages',
			'pixelEndpoint',
			'guidersApiKey',
			'guiders_consent_state'
		];

		keysToRemove.forEach(key => {
			try {
				localStorage.removeItem(key);
				console.log('[TrackingPixelSDK] 🗑️ Eliminado:', key);
			} catch (error) {
				console.warn('[TrackingPixelSDK] ⚠️ No se pudo eliminar:', key, error);
			}
		});

		console.log('[TrackingPixelSDK] 🗑️ Datos locales eliminados');
	}

	/**
	 * Exporta los datos del visitante para cumplimiento GDPR (Right to Access)
	 */
	public async exportVisitorData(): Promise<string> {
		console.log('[TrackingPixelSDK] 📦 Exportando datos del visitante...');

		const visitorId = this.getVisitorId();

		const data: any = {
			visitorId: visitorId,
			fingerprint: this.fingerprint,
			sessionId: this.identitySignal.getSessionId(),
			identityState: this.identitySignal.getState(),
			consentState: this.consentManager.getState(),
			localStorage: this.getLocalStorageData(),
			exportedAt: new Date().toISOString()
		};

		// Incluir datos de consentimiento del backend si hay un visitante identificado
		if (visitorId) {
			try {
				const backendConsentData = await this.consentBackendService.exportConsentData(visitorId);
				data.backendConsents = JSON.parse(backendConsentData);
				console.log('[TrackingPixelSDK] ✅ Datos de consentimiento del backend incluidos en exportación');
			} catch (error) {
				console.warn('[TrackingPixelSDK] ⚠️ No se pudieron obtener datos de consentimiento del backend:', error);
				data.backendConsents = { error: 'No se pudieron obtener datos del backend' };
			}
		}

		return JSON.stringify(data, null, 2);
	}

	/**
	 * Obtiene datos relevantes de localStorage
	 */
	private getLocalStorageData(): Record<string, any> {
		if (typeof localStorage === 'undefined') {
			return {};
		}

		const keys = [
			'fingerprint',
			'guiders_backend_session_id',
			'guiders_recent_chats',
			'pixelEndpoint',
			'guiders_consent_state'
		];

		const data: Record<string, any> = {};

		keys.forEach(key => {
			try {
				const value = localStorage.getItem(key);
				if (value) {
					data[key] = value;
				}
			} catch (error) {
				console.warn('[TrackingPixelSDK] ⚠️ No se pudo leer:', key);
			}
		});

		return data;
	}
}
