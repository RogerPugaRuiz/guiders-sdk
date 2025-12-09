// chat-ui.ts - Componente principal del chat UI (versión simplificada)

import { Message } from "../../types";
import { debugLog } from "../../utils/debug-logger";
import { ChatSessionStore } from "../../services/chat-session-store";
import { fetchChatDetail, ChatDetail, ChatParticipant } from "../../services/chat-detail-service";

// Importar tipos y utilidades
import { ChatUIOptions, Sender, ChatMessageParams, ActiveInterval, QuickActionsConfig, QuickAction, ChatSelectorConfig, ChatSelectorItem } from '../types/chat-types';
import { formatTime, formatDate, isBot, generateInitials, createDateSeparator } from '../utils/chat-utils';
import { MessageRenderer, MessageRenderData } from '../utils/message-renderer';
import { resolvePosition, ResolvedPosition } from '../../utils/position-resolver';

// Importar componentes de presencia
import { PresenceService } from '../../services/presence-service';
import { PresenceChangedEvent, TypingEvent, PresenceStatus } from '../../types/presence-types';

// Importar tipos de WebSocket
import { AssignedCommercialInfo } from '../../types/websocket-types';

// Importar componente de Quick Actions
import { QuickActionsUI } from './quick-actions-ui';

// Importar componente de Chat Selector
import { ChatSelectorUI } from './chat-selector-ui';

// Importar componente de Chat List View (estilo Intercom)
import { ChatListView } from './chat-list-view';

// Clave para persistir estado de presencia en sessionStorage
const PRESENCE_STATE_KEY = 'guiders_presence_state';

/**
 * Clase ChatUI para renderizar mensajes en el chat.
 * Se incluye lógica para:
 *  - scroll infinito (cargar mensajes antiguos en onScroll)
 *  - métodos para cargar mensajes iniciales y "prepend" mensajes antiguos
 */
export class ChatUI {
	private container: HTMLElement | null = null;
	private containerMessages: HTMLElement | null = null;
	private options: ChatUIOptions;

	private currentIndex: string | null = null;
	private chatId: string | null = null;
	private visitorId: string | null = null;
	private chatDetail: ChatDetail | null = null;
	private lastKnownChatStatus: string | null = null;
	private lastNotificationType: 'online' | 'offline' | null = null;
	private messagesLoaded: boolean = false;
	private isLoadingInitialMessages: boolean = false;

	// Callbacks para eventos
	private openCallbacks: Array<() => void> = [];
	private closeCallbacks: Array<() => void> = [];
	private initializationCallbacks: Array<() => void> = [];
	private activeIntervals: Array<ActiveInterval> = [];

	// Elementos del UI
	private titleElement: HTMLElement | null = null;
	private subtitleElement: HTMLElement | null = null;
	private typingIndicator: HTMLElement | null = null;
	private lastMessageDate: string | null = null;
	private avatarElement: HTMLElement | null = null;
	private avatarStatusDot: HTMLElement | null = null;
	private avatarContainer: HTMLElement | null = null;

	// Componentes de presencia
	private offlineBanner: HTMLElement | null = null;
	private presenceService: PresenceService | null = null;
	private presenceUnsubscribe: (() => void) | null = null;
	private typingUnsubscribe: (() => void) | null = null;
	private showOfflineBannerEnabled: boolean = true; // Configuración para mostrar/ocultar banner
	private hasReceivedPresenceEvent: boolean = false; // Indica si ya recibimos un evento de presencia del WebSocket

	// Configuración y estado del mensaje de consentimiento del chat
	private chatConsentMessageConfig: import('../types/chat-types').ChatConsentMessageConfig;
	private chatConsentMessageShown: boolean = false;

	// Quick Actions
	private quickActionsUI: QuickActionsUI | null = null;
	private quickActionsConfig: QuickActionsConfig;

	// Chat Selector (múltiples conversaciones)
	private chatSelectorUI: ChatSelectorUI | null = null;
	private chatSelectorConfig: ChatSelectorConfig;

	// Chat List View (vista de lista estilo Intercom)
	private chatListView: ChatListView | null = null;
	private chatListViewContainer: HTMLElement | null = null;
	private isShowingChatList: boolean = false;
	private chatViewContainer: HTMLElement | null = null; // Contenedor del chat normal
	private backButton: HTMLElement | null = null; // Botón de flecha atrás

	// Callbacks públicos para Chat Selector (configurados desde TrackingPixelSDK)
	public onChatSwitch: ((chatId: string) => Promise<void>) | null = null;
	public onNewChatRequest: (() => Promise<void>) | null = null;

	// Callbacks públicos para Quick Actions (configurados desde TrackingPixelSDK)
	public onQuickActionSendMessage: ((message: string, metadata?: Record<string, any>) => Promise<void>) | null = null;
	public onQuickActionRequestAgent: (() => Promise<void>) | null = null;
	public onTrackQuickAction: ((data: Record<string, any>) => void) | null = null;

	// Control de estado para evitar creación de múltiples chats
	private isCreatingChatFlag: boolean = false;
	private chatCreationPromise: Promise<void> | null = null;
	private chatCreationResolve: (() => void) | null = null;

	// Posición resuelta del widget
	private resolvedPosition: ResolvedPosition;

	constructor(options: ChatUIOptions = {}) {
		this.options = {
			widget: false,
			widgetWidth: '300px',
			widgetHeight: '400px',
			userBgColor: '#007bff',
			otherBgColor: '#6c757d',
			textColor: '#fff',
			maxWidthMessage: '80%',
			...options
		};

		// Inicializar configuración del mensaje de consentimiento del chat
		this.chatConsentMessageConfig = {
			enabled: false,
			message: 'Al unirte al chat, confirmas que has leído y entiendes nuestra',
			privacyPolicyUrl: '/privacy',
			privacyPolicyText: 'Política de Privacidad',
			cookiesPolicyUrl: '/cookies',
			cookiesPolicyText: 'Política de Cookies',
			showOnce: true,
			...options.chatConsentMessage
		};

		// Inicializar configuración de Quick Actions
		this.quickActionsConfig = {
			enabled: false,
			welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
			showOnFirstOpen: true,
			showOnChatStart: true,
			buttons: [],
			...options.quickActions
		};
		debugLog('💬 [ChatUI] Quick Actions config:', this.quickActionsConfig);

		// Inicializar configuración de Chat Selector
		this.chatSelectorConfig = {
			enabled: false,
			newChatLabel: 'Nueva conversación',
			newChatEmoji: '+',
			maxChatsToShow: 10,
			showUnreadBadge: true,
			emptyStateMessage: 'No hay conversaciones anteriores',
			...options.chatSelector
		};
		debugLog('💬 [ChatUI] Chat Selector config:', this.chatSelectorConfig);

		// 🤖 Configurar IA para el MessageRenderer
		if (options.ai) {
			MessageRenderer.setAIConfig(options.ai);
			debugLog('💬 [ChatUI] 🤖 AI config aplicada:', options.ai);
		}

		// Resolver posición del widget
		this.resolvedPosition = resolvePosition(options.position, options.mobileDetection);
		debugLog('💬 [ChatUI] Posición resuelta:', this.resolvedPosition);

		// Si se pasa un containerId, se obtiene ese contenedor
		if (this.options.containerId) {
			const container = document.getElementById(this.options.containerId);
			if (!container) {
				throw new Error(`No se encontró el contenedor con ID "${this.options.containerId}"`);
			}
			this.container = container;
		}
	}

	/**
	 * Inicializa el chat.
	 */
	public init(): void {
		if (!this.container || this.options.widget) {
			// Crear un host para el Shadow DOM
			const shadowHost = document.createElement('div');
			shadowHost.classList.add('chat-widget-host');
			document.body.appendChild(shadowHost);
			
			// Crear el shadow root
			const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
			
			// Crear el contenedor principal dentro del shadow root
			this.container = document.createElement('div');
			this.container.classList.add('chat-widget');
			
			if (this.options.widget) {
				this.container.classList.add('chat-widget-fixed');
			}
			
			// Ocultar el chat por defecto
			this.container.style.display = 'none';
			this.container.style.opacity = '0';
			this.container.style.transform = 'translateY(20px)';
			this.container.setAttribute('data-initial-state', 'hidden');

			debugLog("Chat inicializado con estado: oculto");
			shadowRoot.appendChild(this.container);

			// Añadir encabezado del chat
			this.createChatHeader();

			// Inyectar los estilos CSS
			this.injectStyles(shadowRoot);
		} else {
			if (!this.container || this.options.widget) {
				this.container = document.createElement('div');
				this.container.classList.add('chat-widget');
				document.body.appendChild(this.container);

				if (this.options.widget) {
					this.container.classList.add('chat-widget-fixed');
				}
			}
		}

		this.createChatBody();
		this.initializeChatContent();
	}

	/**
	 * Crea el encabezado del chat
	 */
	private createChatHeader(): void {
		if (!this.container) return;

		const headerEl = document.createElement('div');
		headerEl.className = 'chat-header';

		// Contenedor principal con avatar + información
		const mainContainer = document.createElement('div');
		mainContainer.className = 'chat-header-main';
		mainContainer.style.display = 'flex';
		mainContainer.style.alignItems = 'center';
		mainContainer.style.gap = '12px';
		mainContainer.style.flex = '1';

		// Botón de flecha atrás (solo si Chat Selector está habilitado)
		if (this.chatSelectorConfig.enabled) {
			const backButton = document.createElement('button');
			backButton.className = 'chat-back-btn';
			backButton.setAttribute('aria-label', 'Ver conversaciones');
			backButton.innerHTML = `
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			`;
			backButton.addEventListener('click', () => {
				this.showChatListView();
			});
			this.backButton = backButton;
			mainContainer.appendChild(backButton);
		}

		// Avatar del comercial (oculto por defecto hasta que haya comercial asignado)
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'chat-header-avatar-container';
		avatarContainer.style.position = 'relative';
		avatarContainer.style.display = 'none';

		const avatar = document.createElement('div');
		avatar.className = 'chat-header-avatar';
		avatar.innerHTML = `
			<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
			</svg>
		`;

		// Punto de estado en el avatar (estilo WhatsApp/Messenger)
		const statusDot = document.createElement('span');
		statusDot.className = 'avatar-status-dot status-offline'; // Por defecto offline

		avatarContainer.appendChild(avatar);
		avatarContainer.appendChild(statusDot);

		// Guardar referencias para actualizarlas después
		this.avatarElement = avatar;
		this.avatarStatusDot = statusDot;
		this.avatarContainer = avatarContainer;

		// Contenedor de título (simplificado - solo nombre)
		const titleContainer = document.createElement('div');
		titleContainer.className = 'chat-header-title-container';
		titleContainer.style.display = 'flex';
		titleContainer.style.flexDirection = 'column';
		titleContainer.style.flex = '1';
		titleContainer.style.minWidth = '0'; // Para permitir truncamiento de texto

		// Contenedor de título (sin selector dropdown)
		const titleRow = document.createElement('div');
		titleRow.className = 'chat-header-title-row';
		titleRow.style.display = 'flex';
		titleRow.style.alignItems = 'center';
		titleRow.style.gap = '4px';

		const titleEl = document.createElement('div');
		titleEl.className = 'chat-header-title';
		titleEl.textContent = 'Chat';
		this.titleElement = titleEl;

		titleRow.appendChild(titleEl);

		// Ensamblar header main
		titleContainer.appendChild(titleRow);

		mainContainer.appendChild(avatarContainer);
		mainContainer.appendChild(titleContainer);

		headerEl.appendChild(mainContainer);

		const actionsEl = document.createElement('div');
		actionsEl.className = 'chat-header-actions';

		const closeBtn = document.createElement('button');
		closeBtn.className = 'chat-close-btn';
		closeBtn.setAttribute('aria-label', 'Cerrar chat');
		closeBtn.innerHTML = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
		closeBtn.addEventListener('click', () => {
			this.hide();
		});

		actionsEl.appendChild(closeBtn);
		headerEl.appendChild(actionsEl);
		this.container.appendChild(headerEl);
	}

	/**
	 * Crea el banner de aviso offline
	 */
	private createOfflineBanner(): void {
		if (!this.container) return;

		this.offlineBanner = document.createElement('div');
		this.offlineBanner.className = 'guiders-offline-banner';
		this.offlineBanner.style.cssText = `
			display: none;
			background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
			color: #856404;
			padding: 12px 16px;
			text-align: center;
			font-size: 13px;
			border-bottom: 1px solid #ffeaa7;
			box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		`;
		this.offlineBanner.innerHTML = `
			<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#856404"/>
				</svg>
				<span>El agente está temporalmente desconectado. Te responderá cuando vuelva a estar disponible.</span>
			</div>
		`;

		this.container.appendChild(this.offlineBanner);
	}

	/**
	 * Crea el cuerpo del chat (mensajes y footer)
	 */
	private createChatBody(): void {
		if (!this.container) return;

		// Crear banner offline primero
		this.createOfflineBanner();

		// Contenedor para mensajes
		const containerMessages = document.createElement('div');
		containerMessages.className = 'chat-messages';
		this.container.appendChild(containerMessages);
		this.containerMessages = containerMessages;

		// Crear Quick Actions (si están habilitados)
		this.createQuickActions();

		// Bloque inferior para "empujar" mensajes hacia arriba
		const div = document.createElement('div');
		div.className = 'chat-messages-bottom';
		this.containerMessages.appendChild(div);

		// Configurar estilos
		this.container.style.display = 'none';
		this.container.style.flexDirection = 'column';
		this.container.style.gap = '0';
		this.container.setAttribute('data-content-ready', 'true');

		// Event listener para scroll
		this.containerMessages.addEventListener('scroll', () => {
			// Scroll infinito desactivado
		});
	}

	/**
	 * Crea el componente de Quick Actions
	 */
	private createQuickActions(): void {
		if (!this.containerMessages) return;
		if (!this.quickActionsConfig.enabled || this.quickActionsConfig.buttons.length === 0) {
			debugLog('💬 [ChatUI] Quick Actions deshabilitado o sin botones');
			return;
		}

		this.quickActionsUI = new QuickActionsUI(this.quickActionsConfig);

		// Configurar callbacks
		this.quickActionsUI.onSendMessage = (message, metadata) => {
			console.log('[GUIDERS DEBUG] quickActionsUI.onSendMessage callback EJECUTADO');
			this.handleQuickActionSendMessage(message, metadata);
		};

		this.quickActionsUI.onRequestAgent = () => {
			this.handleQuickActionRequestAgent();
		};

		this.quickActionsUI.onOpenUrl = (url) => {
			this.handleQuickActionOpenUrl(url);
		};

		this.quickActionsUI.onActionClicked = (buttonId, action) => {
			this.trackQuickActionClick(buttonId, action);
		};

		// Renderizar y agregar al final del contenedor (oculto inicialmente)
		const element = this.quickActionsUI.render();
		element.style.display = 'none';

		// Insertar antes de .chat-messages-bottom para que quede al final del área de mensajes
		const bottomDiv = this.containerMessages.querySelector('.chat-messages-bottom');
		if (bottomDiv) {
			this.containerMessages.insertBefore(element, bottomDiv);
		} else {
			this.containerMessages.appendChild(element);
		}

		debugLog('💬 [ChatUI] Quick Actions creado');
	}

	/**
	 * Crea el componente de Chat Selector (dropdown - DEPRECATED)
	 * @deprecated Usar createChatListView() en su lugar
	 */
	private createChatSelector(container: HTMLElement): void {
		if (!this.chatSelectorConfig.enabled) {
			debugLog('💬 [ChatUI] Chat Selector deshabilitado');
			return;
		}

		this.chatSelectorUI = new ChatSelectorUI(this.chatSelectorConfig, {
			onChatSelected: (chatId) => {
				this.handleChatSwitch(chatId);
			},
			onNewChatRequested: () => {
				this.handleNewChatRequest();
			},
			onDropdownOpen: () => {
				this.loadVisitorChats();
			}
		});

		const element = this.chatSelectorUI.render();
		container.appendChild(element);

		debugLog('💬 [ChatUI] Chat Selector creado');
	}

	/**
	 * Crea la vista de lista de chats (estilo Intercom)
	 */
	private createChatListView(): void {
		if (!this.chatSelectorConfig.enabled || !this.container) {
			return;
		}

		this.chatListView = new ChatListView(this.chatSelectorConfig, {
			onChatSelected: (chatId) => {
				debugLog('💬 [ChatUI] Chat seleccionado desde lista:', chatId);
				this.handleChatSwitch(chatId);
				this.hideChatListView();
			},
			onNewChatRequested: () => {
				debugLog('💬 [ChatUI] Nueva conversación solicitada desde lista');
				this.handleNewChatRequest();
				this.hideChatListView();
			},
			onBackToChat: () => {
				debugLog('💬 [ChatUI] Volver al chat desde lista');
				this.hideChatListView();
			},
			onClose: () => {
				debugLog('💬 [ChatUI] Cerrar widget desde lista');
				this.hide();
			}
		});

		// Crear contenedor para la vista de lista
		this.chatListViewContainer = document.createElement('div');
		this.chatListViewContainer.className = 'guiders-chat-list-view-wrapper';
		this.chatListViewContainer.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: #fff;
			z-index: 10;
			display: none;
		`;

		// Renderizar la vista y añadirla al contenedor
		const listViewElement = this.chatListView.render();
		this.chatListViewContainer.appendChild(listViewElement);

		// Insertar en el contenedor principal del chat
		this.container.appendChild(this.chatListViewContainer);

		debugLog('💬 [ChatUI] ChatListView creado');
	}

	/**
	 * Muestra la vista de lista de chats
	 */
	public showChatListView(): void {
		if (!this.chatSelectorConfig.enabled) {
			debugLog('💬 [ChatUI] Chat Selector no habilitado');
			return;
		}

		// Crear la vista de lista si no existe
		if (!this.chatListViewContainer) {
			this.createChatListView();
		}

		if (this.chatListViewContainer) {
			this.chatListViewContainer.style.display = 'flex';
			this.isShowingChatList = true;

			// Cargar chats cuando se muestra la vista
			this.loadVisitorChatsForListView();

			debugLog('💬 [ChatUI] Mostrando vista de lista de chats');
		}
	}

	/**
	 * Oculta la vista de lista de chats
	 */
	public hideChatListView(): void {
		if (this.chatListViewContainer) {
			this.chatListViewContainer.style.display = 'none';
			this.isShowingChatList = false;
			debugLog('💬 [ChatUI] Ocultando vista de lista de chats');
		}
	}

	/**
	 * Carga la lista de chats del visitante para la vista de lista (ChatListView)
	 */
	private async loadVisitorChatsForListView(): Promise<void> {
		if (!this.chatListView || !this.visitorId) {
			debugLog('💬 [ChatUI] ⚠️ No se puede cargar chats: lista o visitorId faltante');
			return;
		}

		this.chatListView.setLoading(true);

		try {
			const { ChatV2Service } = await import('../../services/chat-v2-service');
			const chatService = ChatV2Service.getInstance();
			const chatList = await chatService.getVisitorChats(this.visitorId, undefined, this.chatSelectorConfig.maxChatsToShow || 10);

			const listItems = ChatListView.fromChatV2List(chatList.chats, this.chatId);
			this.chatListView.setChats(listItems);
			this.chatListView.setSelectedChat(this.chatId);

			debugLog('💬 [ChatUI] ✅ Chats cargados para lista:', listItems.length);
		} catch (error) {
			debugLog('💬 [ChatUI] ❌ Error al cargar chats:', error);
			this.chatListView.setError('Error al cargar conversaciones');
		}
	}

	/**
	 * Carga la lista de chats del visitante para el selector (dropdown - DEPRECATED)
	 * @deprecated Usar loadVisitorChatsForListView() en su lugar
	 */
	private async loadVisitorChats(): Promise<void> {
		if (!this.chatSelectorUI || !this.visitorId) {
			debugLog('💬 [ChatUI] ⚠️ No se puede cargar chats: selector o visitorId faltante');
			return;
		}

		this.chatSelectorUI.setLoading(true);

		try {
			const { ChatV2Service } = await import('../../services/chat-v2-service');
			const chatService = ChatV2Service.getInstance();
			const chatList = await chatService.getVisitorChats(this.visitorId, undefined, this.chatSelectorConfig.maxChatsToShow || 10);

			const selectorItems = ChatSelectorUI.fromChatV2List(chatList.chats, this.chatId);
			this.chatSelectorUI.setChats(selectorItems);
			this.chatSelectorUI.setSelectedChat(this.chatId);

			debugLog('💬 [ChatUI] ✅ Chats cargados para selector:', selectorItems.length);
		} catch (error) {
			debugLog('💬 [ChatUI] ❌ Error al cargar chats:', error);
			this.chatSelectorUI.setError('Error al cargar conversaciones');
		}
	}

	/**
	 * Maneja el cambio de chat desde el selector
	 */
	private async handleChatSwitch(chatId: string): Promise<void> {
		if (chatId === this.chatId) {
			debugLog('💬 [ChatUI] Chat ya seleccionado, omitiendo switch');
			return;
		}

		debugLog('💬 [ChatUI] 🔄 Cambiando a chat:', chatId);

		// 1. Desactivar presencia del chat anterior
		this.deactivatePresence();

		// 2. Resetear bandera de presencia al cambiar de chat
		this.hasReceivedPresenceEvent = false;

		// 3. Emitir evento custom para que TrackingPixelSDK lo maneje
		const event = new CustomEvent('guidersChatSwitch', {
			detail: { chatId },
			bubbles: true
		});
		this.container?.dispatchEvent(event);

		// 4. Callback directo si está configurado (actualiza chatId y carga detalles)
		if (this.onChatSwitch) {
			await this.onChatSwitch(chatId);
		}

		// 5. Reactivar presencia para el nuevo chat
		// El chatId ya debería estar actualizado por el callback
		this.activatePresence();
	}

	/**
	 * Maneja la solicitud de crear un nuevo chat
	 */
	private async handleNewChatRequest(): Promise<void> {
		debugLog('💬 [ChatUI] 🆕 Solicitando crear nuevo chat');

		// 1. Desactivar presencia del chat anterior (si había uno)
		this.deactivatePresence();

		// 2. Resetear bandera de presencia al crear nuevo chat
		this.hasReceivedPresenceEvent = false;

		// IMPORTANTE: Primero ejecutar el callback para resetear el chatId
		// ANTES de mostrar los Quick Actions. Esto evita que el usuario
		// haga clic en un Quick Action y el mensaje se envíe al chat anterior.

		// 3. Emitir evento custom para que TrackingPixelSDK lo maneje
		const event = new CustomEvent('guidersNewChatRequested', {
			bubbles: true
		});
		this.container?.dispatchEvent(event);

		// 4. Callback directo si está configurado (resetea chatId)
		if (this.onNewChatRequest) {
			await this.onNewChatRequest();
		}

		// 5. DESPUÉS de resetear el chatId, mostrar la UI de nuevo chat
		// Esto incluye limpiar mensajes y mostrar Quick Actions
		// No reactivamos presencia aquí porque no hay chat nuevo aún
		this.resetHeaderToDefault();
	}

	/**
	 * Resetea el header a un estado genérico (sin comercial asignado)
	 */
	public resetHeaderToDefault(): void {
		debugLog('💬 [ChatUI] Reseteando header a estado por defecto');

		// Limpiar chatDetail para que no muestre info del chat anterior
		this.chatDetail = null;

		// Resetear título a genérico
		if (this.titleElement) {
			this.titleElement.textContent = 'Chat';
		}

		// Ocultar avatar container (no hay comercial asignado aún)
		if (this.avatarContainer) {
			this.avatarContainer.style.display = 'none';
		}

		// Resetear avatar a icono por defecto
		if (this.avatarElement) {
			this.avatarElement.innerHTML = `
				<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
				</svg>
			`;
			this.avatarElement.style.background = '#a0a0a0';
			this.avatarElement.style.padding = '10px';
		}

		// Ocultar punto de estado
		if (this.avatarStatusDot) {
			this.avatarStatusDot.style.display = 'none';
		}

		// Ocultar banner offline (no hay comercial asignado aún, no tiene sentido mostrar que está desconectado)
		this.hideOfflineBanner();

		// Limpiar mensajes del chat anterior
		this.clearMessages();

		// Mostrar Quick Actions si están habilitados y configurados para mostrar al iniciar chat
		debugLog('💬 [ChatUI] Quick Actions config:', {
			quickActionsUI: !!this.quickActionsUI,
			enabled: this.quickActionsConfig.enabled,
			showOnChatStart: this.quickActionsConfig.showOnChatStart,
			buttons: this.quickActionsConfig.buttons?.length || 0
		});
		if (this.quickActionsUI && this.quickActionsConfig.enabled && this.quickActionsConfig.showOnChatStart) {
			debugLog('💬 [ChatUI] Mostrando Quick Actions al iniciar nuevo chat');

			// Verificar si el elemento Quick Actions está en el DOM, si no, re-añadirlo
			const quickActionsElement = this.quickActionsUI.getElement();
			if (quickActionsElement && this.containerMessages) {
				const isInDOM = this.containerMessages.contains(quickActionsElement);
				if (!isInDOM) {
					debugLog('💬 [ChatUI] Quick Actions element no está en el DOM, re-añadiendo...');
					// Insertar antes de .chat-messages-bottom o al final
					const bottomDiv = this.containerMessages.querySelector('.chat-messages-bottom');
					if (bottomDiv) {
						this.containerMessages.insertBefore(quickActionsElement, bottomDiv);
					} else {
						this.containerMessages.appendChild(quickActionsElement);
					}
				}
			}

			this.quickActionsUI.show();
		}

		// Añadir mensaje de consentimiento si está configurado
		this.addChatConsentMessage();
	}

	/**
	 * Método público para cambiar a un chat específico
	 */
	public async switchToChat(chatId: string): Promise<void> {
		await this.handleChatSwitch(chatId);
	}

	/**
	 * Método público para crear un nuevo chat
	 */
	public async createNewChat(): Promise<void> {
		await this.handleNewChatRequest();
	}

	/**
	 * Actualiza el chat seleccionado en el selector
	 */
	public updateSelectedChat(chatId: string | null): void {
		// Actualizar selector dropdown (deprecated)
		if (this.chatSelectorUI) {
			this.chatSelectorUI.setSelectedChat(chatId);
		}
		// Actualizar vista de lista (estilo Intercom)
		if (this.chatListView) {
			this.chatListView.setSelectedChat(chatId);
		}
	}

	/**
	 * Handler para enviar mensaje desde Quick Actions
	 */
	private async handleQuickActionSendMessage(message: string, metadata?: Record<string, any>): Promise<void> {
		console.log('[GUIDERS DEBUG] handleQuickActionSendMessage LLAMADO con:', message);
		debugLog('💬 [ChatUI] Quick Action: enviar mensaje', message);
		console.log('[GUIDERS DEBUG] onQuickActionSendMessage callback existe?', !!this.onQuickActionSendMessage);
		if (this.onQuickActionSendMessage) {
			await this.onQuickActionSendMessage(message, metadata);
		}
	}

	/**
	 * Handler para solicitar agente humano desde Quick Actions
	 */
	private async handleQuickActionRequestAgent(): Promise<void> {
		debugLog('💬 [ChatUI] Quick Action: solicitar agente humano');
		if (this.onQuickActionRequestAgent) {
			await this.onQuickActionRequestAgent();
		}
	}

	/**
	 * Handler para abrir URL desde Quick Actions
	 */
	private handleQuickActionOpenUrl(url: string): void {
		debugLog('💬 [ChatUI] Quick Action: abrir URL', url);
		// La URL ya se abre en quick-actions-ui.ts, aquí solo para logging
	}

	/**
	 * Trackea el clic en un Quick Action
	 */
	private trackQuickActionClick(buttonId: string, action: QuickAction): void {
		debugLog('💬 [ChatUI] Quick Action clicked:', buttonId, action.type);
		if (this.onTrackQuickAction) {
			this.onTrackQuickAction({
				eventType: 'quick_action_clicked',
				buttonId,
				actionType: action.type,
				timestamp: Date.now()
			});
		}
	}

	/**
	 * Inyecta los estilos CSS en el shadow root
	 */
	private injectStyles(shadowRoot: ShadowRoot): void {
		const style = document.createElement('style');
		style.textContent = this.getChatStyles();
		shadowRoot.appendChild(style);
	}

	/**
	 * Retorna los estilos CSS básicos del chat
	 */
	private getChatStyles(): string {
		// Generar CSS dinámico para posicionamiento
		const widgetPos = this.resolvedPosition.widget;
		const positionCSS = `
			${widgetPos.top ? `top: ${widgetPos.top};` : ''}
			${widgetPos.bottom ? `bottom: ${widgetPos.bottom};` : ''}
			${widgetPos.left ? `left: ${widgetPos.left};` : ''}
			${widgetPos.right ? `right: ${widgetPos.right};` : ''}
		`.trim();

		return `
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
			:host { all: initial; font-family: 'Inter', sans-serif; }

			.chat-widget {
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
				border-radius: 12px;
				overflow: hidden;
				background: #ffffff;
				font-family: 'Inter', sans-serif;
				display: flex;
				flex-direction: column;
				transition: box-shadow 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
			}

			.chat-widget-fixed {
				width: 340px;
				height: 520px;
				position: fixed;
				${positionCSS}
				transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
				z-index: 2147483647;
				display: flex;
				flex-direction: column;
			}
			
			/* 📱 ESTILOS MÓVIL - Chat pantalla completa */
			@media (max-width: 768px) {
				.chat-widget-fixed {
					width: 100% !important;
					height: 100% !important;
					top: 0 !important;
					left: 0 !important;
					right: 0 !important;
					bottom: 0 !important;
					border-radius: 0 !important;
					max-width: 100vw;
					max-height: 100vh;
				}
			}
			
			.chat-header {
				background: #ffffff;
				color: #111827;
				padding: 16px 20px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-top-left-radius: 12px;
				border-top-right-radius: 12px;
				border-bottom: 1px solid #e5e7eb;
			}

			/* 📱 Header móvil sin border-radius superior */
			@media (max-width: 768px) {
				.chat-header {
					border-top-left-radius: 0 !important;
					border-top-right-radius: 0 !important;
					padding: 18px 20px;
				}
			}

			.chat-header-main {
				display: flex;
				align-items: center;
				gap: 12px;
				flex: 1;
				min-width: 0;
			}

			.chat-header-avatar-container {
				position: relative;
				flex-shrink: 0;
			}

			.chat-header-avatar {
				width: 44px;
				height: 44px;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.2);
				backdrop-filter: blur(10px);
				display: flex;
				align-items: center;
				justify-content: center;
				border: 2px solid rgba(255, 255, 255, 0.3);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}

			.chat-header-avatar svg {
				width: 24px;
				height: 24px;
			}

			/* Punto de estado en el avatar (estilo WhatsApp/Messenger) */
			.avatar-status-dot {
				position: absolute;
				bottom: 0;
				right: 0;
				width: 10px;
				height: 10px;
				border-radius: 50%;
				border: 1.5px solid #ffffffff; /* Mismo color del gradiente para consistencia */
				transition: all 0.3s ease;
			}

			.avatar-status-dot.status-online {
				background-color: #10b981;
				box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
			}

			.avatar-status-dot.status-offline {
				background-color: #6b7280;
			}

			.avatar-status-dot.status-away {
				background-color: #f59e0b;
				box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
			}

			.avatar-status-dot.status-busy {
				background-color: #ef4444;
				box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
			}

			.avatar-status-dot.status-chatting {
				background-color: #60a5fa;
				box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
			}

			.chat-header-title-container {
				display: flex;
				flex-direction: column;
				gap: 4px;
				flex: 1;
				min-width: 0;
			}

			.chat-header-title {
				font-weight: 600;
				font-size: 16px;
				letter-spacing: -0.01em;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.chat-header-actions {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-shrink: 0;
			}
			
			.chat-close-btn {
				background: transparent;
				border: none;
				color: #6b7280;
				cursor: pointer;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0;
				opacity: 0.9;
				transition: all 0.2s ease;
				border-radius: 50%;
			}

			.chat-close-btn:hover {
				opacity: 1;
				background: rgba(0, 0, 0, 0.05);
				color: #111827;
			}

			.chat-close-btn:active {
				transform: scale(0.95);
				background: rgba(0, 0, 0, 0.1);
			}
			
			.chat-close-btn svg {
				width: 20px;
				height: 20px;
			}
			
			/* 📱 Botón de cierre más visible en móvil */
			@media (max-width: 768px) {
				.chat-close-btn {
					width: 36px;
					height: 36px;
					background: rgba(255, 255, 255, 0.15);
				}

				.chat-close-btn:hover {
					background: rgba(255, 255, 255, 0.25);
				}

				.chat-close-btn svg {
					width: 22px;
					height: 22px;
				}
			}

			/* Botón de flecha atrás (estilo Intercom) */
			.chat-back-btn {
				background: transparent;
				border: none;
				color: #111827;
				cursor: pointer;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0;
				opacity: 0.9;
				transition: all 0.2s ease;
				border-radius: 50%;
				flex-shrink: 0;
			}

			.chat-back-btn:hover {
				opacity: 1;
				background: rgba(0, 0, 0, 0.05);
			}

			.chat-back-btn:active {
				transform: scale(0.95);
				background: rgba(0, 0, 0, 0.1);
			}

			.chat-back-btn svg {
				width: 20px;
				height: 20px;
			}

			/* 📱 Botón de atrás más visible en móvil */
			@media (max-width: 768px) {
				.chat-back-btn {
					width: 36px;
					height: 36px;
				}

				.chat-back-btn svg {
					width: 22px;
					height: 22px;
				}
			}

			/* Wrapper de la vista de lista */
			.guiders-chat-list-view-wrapper {
				display: flex;
				flex-direction: column;
				height: 100%;
				width: 100%;
			}

			.chat-messages {
				display: flex;
				flex-direction: column;
				flex: 1;
				overflow-y: auto;
				padding: 18px 16px 80px 16px;
				margin-bottom: 25px;
				background: #ffffff;
				scroll-behavior: smooth;
			}
			
			.chat-message-wrapper {
				position: relative;
				margin-bottom: 16px;
				max-width: 75%;
				display: flex;
				flex-direction: column;
			}
			
			.chat-message {
				padding: 10px 14px;
				border-radius: 18px;
				white-space: normal;
				overflow-wrap: break-word;
				word-wrap: break-word;
				line-height: 1.4;
				font-size: 14px;
				position: relative;
			}

			.chat-message-user-wrapper {
				display: flex;
				align-self: flex-end;
			}

			.chat-message-user {
				background: #18181b;
				color: #ffffff;
				border-bottom-right-radius: 4px;
			}

			.chat-message-other-wrapper {
				align-self: flex-start;
				display: flex;
				gap: 8px;
			}

			.chat-message-other {
				background: #e4e4e7 !important;
				color: #18181b;
				border-bottom-left-radius: 4px;
			}
			
			.chat-avatar {
				width: 28px;
				height: 28px;
				border-radius: 50%;
				background-color: #e1e9f1;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}
			
			.chat-message-time {
				font-size: 11px;
				color: #6b7280;
				margin-top: 4px;
				opacity: 0.85;
			}

			.chat-input-container {
				position: absolute;
				background: #ffffff;
				bottom: 12px;
				left: 12px;
				right: 12px;
				display: -webkit-flex;
				display: flex;
				-webkit-align-items: flex-end;
				align-items: flex-end;
				gap: 8px;
				border-radius: 28px;
				box-shadow: none;
				border: 1px solid #e5e7eb;
				padding: 6px 6px 6px 16px;
				/* Fix Safari: Asegurar que el contenedor mantenga su altura */
				box-sizing: border-box;
			}
			
			/* 📱 Input móvil */
			@media (max-width: 768px) {
				.chat-input-container {
					bottom: 8px;
					left: 8px;
					right: 8px;
				}
			}
			
			.chat-input-field {
				-webkit-flex: 1;
				flex: 1;
				border: none;
				padding: 8px 0;
				font-size: 14px;
				font-family: 'Inter', sans-serif;
				outline: none;
				background: transparent;
				color: #111827;
				/* Fix Safari: Asegurar que el input no cause overflow */
				min-width: 0;
				box-sizing: border-box;
				/* Textarea specific */
				resize: none;
				overflow: hidden;
				line-height: 1.4;
				max-height: 120px;
				min-height: 20px;
			}

			.chat-input-field:focus {
				background: transparent;
			}
			
			.chat-input-field::placeholder {
				color: #8a9aa9;
			}
			
			.chat-send-btn {
				background: #18181b;
				color: #ffffff;
				border: none;
				border-radius: 50%;
				width: 36px;
				height: 36px;
				cursor: pointer;
				display: -webkit-flex;
				display: flex;
				-webkit-align-items: center;
				align-items: center;
				-webkit-justify-content: center;
				justify-content: center;
				transition: all 0.15s ease;
				-webkit-flex-shrink: 0;
				flex-shrink: 0;
				/* Fix Safari: Asegurar dimensiones exactas y prevenir compresión */
				min-width: 36px;
				min-height: 36px;
				max-width: 36px;
				max-height: 36px;
				box-sizing: border-box;
			}

			.chat-send-btn:hover {
				background: #27272a;
				transform: scale(1.05);
			}

			.chat-send-btn:active {
				-webkit-transform: scale(0.95);
				transform: scale(0.95);
			}

			.chat-send-btn::before {
				content: '';
				width: 16px;
				height: 16px;
				background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='%23ffffff'/%3E%3C/svg%3E");
				background-repeat: no-repeat;
				background-position: center;
				transition: all 0.2s ease;
			}

			.chat-send-btn:hover::before {
				background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='%23111827'/%3E%3C/svg%3E");
			}

			/* 🟢 Estilos para Presence Indicator */
			.guiders-presence-indicator {
				display: inline-flex;
				align-items: center;
				gap: 6px;
				padding: 4px 10px;
				background: rgba(255, 255, 255, 0.15);
				backdrop-filter: blur(10px);
				border-radius: 12px;
				border: 1px solid rgba(255, 255, 255, 0.2);
			}

			.guiders-status-dot {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				flex-shrink: 0;
				transition: all 0.3s ease;
				border: 2px solid white;
			}

			.guiders-status-online {
				background-color: #10b981;
				box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
			}

			.guiders-status-offline {
				background-color: #6b7280;
				box-shadow: none;
			}

			.guiders-status-busy {
				background-color: #ef4444;
				box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
			}

			.guiders-status-away {
				background-color: #f59e0b;
				box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
			}

			.guiders-status-chatting {
				background-color: #60a5fa;
				box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
			}

			.guiders-status-text {
				font-size: 11px;
				font-weight: 500;
				color: rgba(255, 255, 255, 0.95);
				letter-spacing: 0.02em;
				text-transform: capitalize;
			}

			.guiders-status-changing {
				animation: statusPulse 0.3s ease;
			}

			@keyframes statusPulse {
				0%, 100% { opacity: 1; }
				50% { opacity: 0.7; }
			}

			/* 🔴 Estilos para Offline Banner */
			.guiders-offline-banner {
				background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
				color: #856404;
				padding: 12px 16px;
				text-align: center;
				font-size: 13px;
				border-bottom: 1px solid #ffeaa7;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
				animation: bannerSlideIn 0.3s ease-out;
			}

			@keyframes bannerSlideIn {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			/* ✍️ Estilos para Typing Indicator */
			.guiders-typing-indicator {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 12px 16px;
				margin-bottom: 12px;
				opacity: 0;
				transition: opacity 0.2s ease;
			}

			.guiders-typing-bubble {
				background: #fff;
				border: 1px solid #e1e9f1;
				border-radius: 18px;
				padding: 12px 16px;
				display: flex;
				align-items: center;
				gap: 4px;
				box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
			}

			.guiders-typing-dot {
				width: 8px;
				height: 8px;
				background-color: #8a9aa9;
				border-radius: 50%;
				animation: typingBounce 1.4s infinite ease-in-out;
			}

			.guiders-typing-dot:nth-child(1) {
				animation-delay: 0s;
			}

			.guiders-typing-dot:nth-child(2) {
				animation-delay: 0.15s;
			}

			.guiders-typing-dot:nth-child(3) {
				animation-delay: 0.3s;
			}

			@keyframes typingBounce {
				0%, 60%, 100% {
					transform: translateY(0);
					opacity: 0.4;
				}
				30% {
					transform: translateY(-8px);
					opacity: 1;
				}
			}

			.guiders-typing-text {
				font-size: 13px;
				color: #8a9aa9;
				font-style: italic;
				margin-left: 4px;
			}

			/* 📋 Estilos para Mensaje de Consentimiento del Chat */
			.chat-consent-message-wrapper {
				align-self: center;
				max-width: 90%;
				margin: 16px auto 20px auto;
			}

			.chat-consent-message {
				background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
				border: 1px solid #dee2e6;
				border-radius: 12px;
				padding: 14px 18px;
				text-align: center;
				box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
			}

			.chat-consent-message-content {
				font-size: 12px;
				line-height: 1.5;
				color: #495057;
			}

			.chat-consent-link {
				color: #0084ff;
				text-decoration: none;
				font-weight: 500;
				transition: color 0.2s ease, text-decoration 0.2s ease;
			}

			.chat-consent-link:hover {
				color: #0066cc;
				text-decoration: underline;
			}

			.chat-consent-link:active {
				color: #004999;
			}

			/* 📱 Estilos móvil para mensaje de consentimiento */
			@media (max-width: 768px) {
				.chat-consent-message-wrapper {
					max-width: 95%;
					margin: 12px auto 16px auto;
				}

				.chat-consent-message {
					padding: 12px 14px;
				}

				.chat-consent-message-content {
					font-size: 11px;
				}
			}

			/* 🚀 Quick Actions - Botones de acción rápida */
			.guiders-quick-actions {
				display: flex;
				flex-direction: column;
				padding: 12px 16px;
				margin: 0;
				background: transparent;
				position: sticky;
				bottom: 0;
				transition: opacity 0.3s ease, transform 0.3s ease;
			}

			.guiders-quick-actions-welcome {
				padding: 12px 16px;
				background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
				border-radius: 12px;
				margin-bottom: 12px;
				color: #1d1d1f;
				font-size: 14px;
				line-height: 1.5;
				text-align: center;
			}

			.guiders-quick-actions-buttons {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
				justify-content: center;
			}

			.guiders-quick-action-btn {
				padding: 10px 16px;
				border-radius: 20px;
				font-size: 13px;
				font-weight: 500;
				cursor: pointer;
				transition: all 0.2s ease;
				white-space: nowrap;
				font-family: inherit;
				background: white;
				color: #1d1d1f;
				border: 1.5px solid #e5e7eb;
			}

			.guiders-quick-action-btn:hover {
				background: #f8f9fa;
				border-color: #d1d5db;
				transform: translateY(-1px);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
			}

			.guiders-quick-action-btn:active {
				transform: translateY(0);
				background: #f1f3f5;
			}

			.guiders-quick-action-btn:focus {
				outline: none;
				border-color: #3b82f6;
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
			}

			/* 📱 Responsive: scroll horizontal en móvil */
			@media (max-width: 768px) {
				.guiders-quick-actions {
					margin: 0;
					padding: 8px 12px;
				}

				.guiders-quick-actions-buttons {
					flex-wrap: nowrap;
					overflow-x: auto;
					justify-content: flex-start;
					padding-bottom: 8px;
					-webkit-overflow-scrolling: touch;
					scrollbar-width: none;
					-ms-overflow-style: none;
				}

				.guiders-quick-actions-buttons::-webkit-scrollbar {
					display: none;
				}

				.guiders-quick-action-btn {
					flex-shrink: 0;
				}
			}

			/* 📋 Chat Selector - Dropdown de múltiples conversaciones */
			${ChatSelectorUI.getStyles()}

			/* 📋 Chat List View - Vista de lista estilo Intercom */
			.guiders-chat-list-view {
				display: flex;
				flex-direction: column;
				height: 100%;
				width: 100%;
				background: #fff;
				font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
				box-sizing: border-box;
			}

			.guiders-chat-list-header {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 12px 12px;
				border-bottom: 1px solid #e5e7eb;
				min-height: 56px;
				background: #ffffff;
				gap: 8px;
			}

			.guiders-chat-list-back-btn {
				background: none;
				border: none;
				padding: 8px;
				cursor: pointer;
				color: #111827;
				transition: all 0.2s;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				flex-shrink: 0;
			}

			.guiders-chat-list-back-btn:hover {
				background: rgba(0, 0, 0, 0.05);
			}

			.guiders-chat-list-title {
				margin: 0;
				font-size: 17px;
				font-weight: 600;
				color: #111827;
				flex: 1;
				text-align: left;
			}

			.guiders-chat-list-close-btn {
				background: none;
				border: none;
				padding: 8px;
				cursor: pointer;
				color: #6b7280;
				transition: all 0.2s;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				flex-shrink: 0;
			}

			.guiders-chat-list-close-btn:hover {
				background: rgba(0, 0, 0, 0.05);
				color: #111827;
			}

			.guiders-chat-list-container {
				flex: 1;
				overflow-y: auto;
				display: flex;
				flex-direction: column;
				width: 100%;
			}

			.guiders-chat-list-container > button {
				display: flex !important;
				flex-direction: row !important;
				width: 100% !important;
				box-sizing: border-box;
			}

			.guiders-chat-list-loading,
			.guiders-chat-list-error,
			.guiders-chat-list-empty {
				padding: 24px;
				text-align: center;
				color: #6b7280;
				font-size: 14px;
			}

			.guiders-chat-list-error {
				color: #dc2626;
			}

			.guiders-chat-list-new-chat {
				display: flex !important;
				align-items: center;
				gap: 12px;
				width: 100% !important;
				min-width: 100% !important;
				padding: 16px 20px;
				border: none !important;
				border-bottom: 1px solid #e5e7eb !important;
				border-radius: 0 !important;
				background: #f9fafb;
				cursor: pointer;
				text-align: left;
				transition: background 0.2s;
				box-sizing: border-box;
				flex-shrink: 0;
			}

			.guiders-chat-list-new-chat:hover {
				background: #f3f4f6;
			}

			.guiders-chat-list-new-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 44px;
				height: 44px;
				border-radius: 50%;
				background: #18181b;
				color: #fff;
				flex-shrink: 0;
			}

			.guiders-chat-list-new-text {
				font-size: 15px;
				font-weight: 500;
				color: #111827;
			}

			.guiders-chat-list-item {
				display: flex !important;
				align-items: center;
				gap: 12px;
				width: 100% !important;
				min-width: 100% !important;
				padding: 14px 20px;
				border: none !important;
				border-bottom: 1px solid #f3f4f6 !important;
				border-radius: 0 !important;
				background: #fff;
				cursor: pointer;
				text-align: left;
				transition: background 0.2s;
				box-sizing: border-box;
				flex-shrink: 0;
			}

			.guiders-chat-list-item:hover {
				background: #f9fafb;
			}

			.guiders-chat-list-item.selected {
				background: #eff6ff;
			}

			.guiders-chat-list-avatar {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 44px;
				height: 44px;
				border-radius: 50%;
				background: #e5e7eb;
				color: #6b7280;
				flex-shrink: 0;
				overflow: hidden;
			}

			.guiders-chat-list-avatar-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				border-radius: 50%;
			}

			.guiders-chat-list-content {
				flex: 1;
				min-width: 0;
			}

			.guiders-chat-list-title-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
				margin-bottom: 4px;
			}

			.guiders-chat-list-item-title {
				font-size: 15px;
				font-weight: 500;
				color: #111827;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.guiders-chat-list-item-time {
				font-size: 12px;
				color: #9ca3af;
				flex-shrink: 0;
			}

			.guiders-chat-list-preview-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}

			.guiders-chat-list-preview {
				font-size: 13px;
				color: #6b7280;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.guiders-chat-list-badge {
				background: #ef4444;
				color: #fff;
				font-size: 11px;
				font-weight: 600;
				padding: 2px 6px;
				border-radius: 10px;
				min-width: 18px;
				text-align: center;
				flex-shrink: 0;
			}

			.guiders-spinner {
				display: inline-block;
				width: 16px;
				height: 16px;
				border: 2px solid #e5e7eb;
				border-top-color: #18181b;
				border-radius: 50%;
				animation: guiders-spin 1s linear infinite;
				margin-right: 8px;
				vertical-align: middle;
			}

			@keyframes guiders-spin {
				to { transform: rotate(360deg); }
			}
		`;
	}

	// Métodos principales de la API pública
	public setChatId(chatId: string): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		if (this.chatId !== chatId) {
			this.messagesLoaded = false;
			this.lastKnownChatStatus = null;
			this.lastNotificationType = null;
		}

		this.chatId = chatId;
		this.container.setAttribute('data-chat-id', chatId);

		// Si chatId está vacío, limpiar el store en lugar de establecer valor vacío
		if (!chatId) {
			ChatSessionStore.getInstance().clearCurrent();
			debugLog('💬 [ChatUI] Chat ID limpiado del store');
		} else {
			ChatSessionStore.getInstance().setCurrent(chatId);
		}
	}

	public getChatId(): string | null {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		// IMPORTANTE: Solo restaurar desde ChatSessionStore si chatId es exactamente vacío/null
		// No restaurar si es un string vacío intencionalmente establecido
		if (this.chatId === null || this.chatId === undefined) {
			const storedChatId = ChatSessionStore.getInstance().getCurrent();
			debugLog('💬 [ChatUI] getChatId() restaurando desde ChatSessionStore:', storedChatId);
			this.chatId = storedChatId;
		}

		debugLog('💬 [ChatUI] getChatId() devolviendo:', this.chatId);
		return this.chatId;
	}

	public setVisitorId(visitorId: string): void {
		this.visitorId = visitorId;
		debugLog('👤 [ChatUI] Visitor ID establecido:', visitorId);
	}

	public getVisitorId(): string | null {
		return this.visitorId;
	}

	/**
	 * Obtiene el último estado conocido del chat
	 * @returns Estado del chat o null si no se ha cargado
	 */
	public getLastKnownChatStatus(): string | null {
		return this.lastKnownChatStatus;
	}

	/**
	 * Verifica si el chat tiene un comercial asignado
	 * @returns true si hay comercial asignado, false en caso contrario
	 */
	public hasAssignedCommercial(): boolean {
		return !!(this.chatDetail?.assignedCommercial?.id);
	}

	/**
	 * Actualiza el header del chat directamente con la información del comercial
	 * Usado cuando se recibe el evento chat:commercial-assigned via WebSocket
	 * @param commercial Información del comercial asignado
	 * @param newStatus Nuevo estado del chat (opcional)
	 */
	public updateHeaderWithCommercial(commercial: AssignedCommercialInfo, newStatus?: string): void {
		console.log('👤 [ChatUI] updateHeaderWithCommercial LLAMADO:', {
			commercial,
			newStatus,
			hasChatDetail: !!this.chatDetail,
			hasTitleElement: !!this.titleElement,
			hasAvatarElement: !!this.avatarElement
		});

		// Actualizar estado del chat si se proporciona
		if (newStatus) {
			this.lastKnownChatStatus = newStatus;
		}

		// Si hay chatDetail, actualizarlo
		if (this.chatDetail) {
			this.chatDetail.assignedCommercial = {
				id: commercial.id,
				name: commercial.name,
				avatarUrl: commercial.avatarUrl
			};

			if (newStatus) {
				this.chatDetail.status = newStatus;
			}

			// Añadir o actualizar el comercial en participants
			const existingParticipant = this.chatDetail.participants.find(p => p.id === commercial.id);
			if (!existingParticipant) {
				this.chatDetail.participants.push({
					id: commercial.id,
					name: commercial.name,
					isCommercial: true,
					isVisitor: false,
					isOnline: true,
					assignedAt: new Date().toISOString(),
					lastSeenAt: new Date().toISOString(),
					isViewing: false,
					isTyping: false,
					isAnonymous: false
				});
			} else {
				existingParticipant.name = commercial.name;
				existingParticipant.isOnline = true;
				existingParticipant.lastSeenAt = new Date().toISOString();
			}

			// Usar updateChatHeader si tenemos chatDetail
			this.updateChatHeader();
			console.log('✅ [ChatUI] Header actualizado via updateChatHeader:', commercial.name);
		} else {
			// Si no hay chatDetail, actualizar el header directamente en el DOM
			console.log('👤 [ChatUI] No hay chatDetail, actualizando DOM directamente');
			this.updateHeaderDirectly(commercial);
		}

		// 🆕 Activar sistema de presencia para obtener estado real del comercial
		// Esto es importante porque acabamos de asumir isOnline: true arriba,
		// pero necesitamos el estado real del WebSocket
		if (this.chatId && !this.presenceUnsubscribe) {
			debugLog('💬 [ChatUI] Activando presencia tras asignación de comercial');
			this.hasReceivedPresenceEvent = false; // Resetear para obtener estado fresco
			this.activatePresence();
		}
	}

	/**
	 * Actualiza el header directamente en el DOM sin depender de chatDetail
	 * Usado cuando chatDetail aún no está cargado
	 */
	private updateHeaderDirectly(commercial: AssignedCommercialInfo): void {
		// Actualizar título
		if (this.titleElement) {
			this.titleElement.textContent = commercial.name || 'Asesor';
			console.log('✅ [ChatUI] Título actualizado directamente:', commercial.name);
		}

		// Mostrar avatar container
		if (this.avatarContainer) {
			this.avatarContainer.style.display = 'block';
		}

		// Actualizar avatar si hay URL
		if (commercial.avatarUrl && this.avatarElement) {
			const img = document.createElement('img');
			img.src = commercial.avatarUrl;
			img.alt = commercial.name || 'Asesor';
			img.style.cssText = `
				width: 44px;
				height: 44px;
				object-fit: cover;
				border-radius: 50%;
				display: block;
			`;

			img.onerror = () => {
				// Si falla, restaurar el SVG por defecto
				this.avatarElement!.innerHTML = `
					<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
					</svg>
				`;
			};

			this.avatarElement.innerHTML = '';
			this.avatarElement.style.background = 'transparent';
			this.avatarElement.style.padding = '0';
			this.avatarElement.appendChild(img);
			console.log('✅ [ChatUI] Avatar actualizado directamente:', commercial.avatarUrl);
		}

		// Actualizar indicador de estado online
		// El comercial que acaba de aceptar la conversación está online
		this.updateAvatarStatus('online');
		console.log('✅ [ChatUI] Estado online actualizado directamente');
	}

	public getMessagesContainer(): HTMLElement | null {
		return this.containerMessages;
	}

	public renderChatMessage(params: ChatMessageParams): void {
		const { text, sender, timestamp, senderId, isAI, aiMetadata } = params;
		this.addMessage(text, sender, timestamp, senderId, isAI, aiMetadata);
		this.rebuildDateSeparators();
	}

	public scrollToBottom(scrollToBottom: boolean): void {
		if (!this.containerMessages) return;
		if (scrollToBottom) {
			this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
		} else {
			this.containerMessages.scrollTop = 0;
		}
	}

	public hide(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		if (this.container.style.display === 'none') {
			return;
		}

		// 🔴 Desactivar sistema de presencia cuando se cierra el chat
		this.deactivatePresence();

		this.container.style.transform = 'translateY(20px)';
		this.container.style.opacity = '0';

		setTimeout(() => {
			if (this.container) {
				this.container.style.display = 'none';
			}

			this.activeIntervals.forEach(intervalObj => {
				if (intervalObj.id !== null) {
					clearInterval(intervalObj.id);
					intervalObj.id = null;
				}
			});
			this.closeCallbacks.forEach(cb => cb());
		}, 300);
	}

	public show(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		this.container.style.display = 'flex';
		this.container.offsetHeight;

		this.container.style.opacity = '1';
		this.container.style.transform = 'translateY(0)';

		this.loadChatContent();

		// Si tenemos visitorId, usar el método más robusto de obtener detalles desde lista de chats
		if (this.visitorId) {
			debugLog('👤 [ChatUI] Usando refreshChatDetailsFromVisitorList con visitorId:', this.visitorId);
			this.refreshChatDetailsFromVisitorList(this.visitorId).catch(err => {
				this.refreshChatDetails();
			});
		} else {
			debugLog('⚠️ [ChatUI] No hay visitorId, usando refreshChatDetails tradicional');
			this.refreshChatDetails();
		}

		this.scrollToBottom(true);

		// 🔧 RACE CONDITION FIX: Ya no usar timeout arbitrario
		// La verificación del mensaje de bienvenida ahora se maneja en loadChatMessagesOnOpen()
		// después de que termine la carga asíncrona de mensajes, eliminando la condición de carrera

		// 🟢 Activar sistema de presencia cuando se abre el chat
		this.activatePresence();

		this.activeIntervals.forEach(intervalObj => {
			if (intervalObj.id === null) {
				intervalObj.id = window.setInterval(intervalObj.callback, intervalObj.intervalMs);
			}
		});
		this.openCallbacks.forEach(cb => cb());
	}

	public toggle(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		if (this.container.style.display === 'none') {
			this.show();
		} else {
			this.hide();
		}
	}

	public isVisible(): boolean {
		if (!this.container) return false;
		return this.container.style.display !== 'none';
	}

	public getOptions(): ChatUIOptions {
		return this.options;
	}

	// Métodos privados
	private addMessage(text: string, sender: Sender, timestamp?: number, senderId?: string, isAI?: boolean, aiMetadata?: import('../../types/websocket-types').AIMetadata): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		const messageDate = timestamp ? new Date(timestamp) : new Date();
		this.addDateSeparatorIfNeeded(messageDate);

		const messageDiv = this.createMessageDiv(text, sender, timestamp, senderId, isAI, aiMetadata);
		this.containerMessages.appendChild(messageDiv);

		this.scrollToBottom(true);
	}

	private createMessageDiv(text: string, sender: Sender, timestamp?: number, senderId?: string, isAI?: boolean, aiMetadata?: import('../../types/websocket-types').AIMetadata): HTMLDivElement {
		// ✅ USAR FUNCIÓN UNIFICADA - Garantiza el mismo estilo que mensajes cargados dinámicamente
		const messageData: MessageRenderData = {
			content: text,
			sender: isAI ? 'ai' : this.mapSenderType(sender), // Mapear tipos compatibles
			timestamp: timestamp,
			senderId: senderId,
			// 🤖 Información de IA
			isAI: isAI,
			aiMetadata: aiMetadata
		};

		return MessageRenderer.createMessageElement(messageData);
	}
	
	/**
	 * Mapea el tipo Sender local al tipo MessageRenderer.Sender
	 */
	private mapSenderType(sender: Sender): import('../utils/message-renderer').Sender {
		switch (sender) {
			case 'user':
				return 'user';
			case 'other':
				return 'agent';
			default:
				return 'agent';
		}
	}

	private getParticipantInitials(senderId: string): string {
		if (!senderId) {
			return 'BOT';
		}

		if (!this.chatDetail) {
			return 'AH';
		}

		const participant = this.chatDetail.participants.find(p => p.id === senderId);
		if (!participant) {
			return 'AH';
		}

		if (isBot(participant.name)) {
			return 'BOT';
		}

		return generateInitials(participant.name);
	}

	/**
	 * Escapa HTML para prevenir XSS (adaptado de ChatMessagesUI)
	 */
	private escapeHtml(text: string): string {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Aplica estilos CSS modernos a un mensaje (adaptado de ChatMessagesUI)
	 */
	private applyModernMessageStyles(messageDiv: HTMLElement, isUserMessage: boolean): void {
		const avatar = messageDiv.querySelector('.message-avatar') as HTMLElement;
		const bubble = messageDiv.querySelector('.message-bubble') as HTMLElement;
		const content = messageDiv.querySelector('.message-content') as HTMLElement;
		const text = messageDiv.querySelector('.message-text') as HTMLElement;
		const metadata = messageDiv.querySelector('.message-metadata') as HTMLElement;
		const time = messageDiv.querySelector('.message-time') as HTMLElement;
		const status = messageDiv.querySelector('.message-status') as HTMLElement;

		// Estilos base del contenedor del mensaje
		messageDiv.style.cssText = `
			display: flex;
			align-items: flex-end;
			margin-bottom: 16px;
			${isUserMessage ? 'flex-direction: row-reverse; padding-left: 60px;' : 'flex-direction: row; padding-right: 60px;'}
			animation: messageSlideIn 0.3s ease-out;
		`;

		// Avatar (solo para mensajes de otros)
		if (avatar) {
			avatar.style.cssText = `
				margin-right: 12px;
				margin-bottom: 4px;
			`;
			
			const avatarCircle = avatar.querySelector('.avatar-circle') as HTMLElement;
			if (avatarCircle) {
				avatarCircle.style.cssText = `
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
					font-size: 11px;
					font-weight: 600;
					border: none;
					box-sizing: border-box;
					min-width: 32px;
					min-height: 32px;
					max-width: 32px;
					max-height: 32px;
				`;
			}
		}

		// Burbuja del mensaje
		if (bubble) {
			bubble.style.cssText = `
				position: relative;
				max-width: 85%;
				min-width: 120px;
			`;
		}

		// Contenido del mensaje
		if (content) {
			content.style.cssText = `
				padding: 12px 16px 8px;
				border-radius: 20px;
				position: relative;
				word-break: break-word;
				${isUserMessage ? 
					`background: linear-gradient(145deg, #0084ff 60%, #00c6fb 100%);
					 color: white;
					 border-bottom-right-radius: 6px;
					 box-shadow: 0 2px 12px rgba(0, 132, 255, 0.3);` : 
					`background: white;
					 color: #1d1d1f;
					 border: 1px solid rgba(0, 0, 0, 0.08);
					 border-bottom-left-radius: 6px;
					 box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);`
				}
				backdrop-filter: blur(10px);
				transition: all 0.2s ease;
			`;
		}

		// Texto del mensaje
		if (text) {
			text.style.cssText = `
				font-size: 15px;
				line-height: 1.4;
				margin: 0;
				font-weight: 400;
				letter-spacing: -0.01em;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			`;
		}

		// Metadatos (tiempo y estado)
		if (metadata) {
			metadata.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: ${isUserMessage ? 'flex-end' : 'flex-start'};
				gap: 6px;
				margin-top: 2px;
				padding: 0 4px;
			`;
		}

		// Tiempo
		if (time) {
			time.style.cssText = `
				font-size: 11px;
				color: ${isUserMessage ? 'rgba(0, 0, 0, 0.8)' : 'rgba(60, 60, 67, 0.6)'};
				font-weight: 500;
				letter-spacing: 0.01em;
			`;
		}

		// Estado del mensaje (solo para mensajes del usuario)
		if (status) {
			status.style.cssText = `
				font-size: 12px;
				color: rgba(255, 255, 255, 0.8);
				margin-left: 2px;
			`;
		}

		// Añadir animaciones CSS
		this.addMessageAnimations();

		// Efecto hover deshabilitado por solicitud del usuario
	}

	/**
	 * Añade animaciones CSS globales para mensajes (adaptado de ChatMessagesUI)
	 */
	private addMessageAnimations(): void {
		// Solo añadir una vez
		if (document.getElementById('modern-message-animations')) return;

		const style = document.createElement('style');
		style.id = 'modern-message-animations';
		style.textContent = `
			@keyframes messageSlideIn {
				from {
					opacity: 0;
					transform: translateY(10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			/* Efecto hover deshabilitado por solicitud del usuario */

			/* Mejorar tipografía */
			.modern-message .message-text {
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}

			/* Estilos responsivos */
			@media (max-width: 480px) {
				.modern-message {
					padding-left: 20px !important;
					padding-right: 20px !important;
				}
				
				.modern-message .message-bubble {
					max-width: 95% !important;
				}
			}

			/* Fix específico para Safari */
			@media not all and (min-resolution: 0.001dpcm) {
				@supports (-webkit-appearance: none) {
					.chat-input-container {
						display: -webkit-box !important;
						display: -webkit-flex !important;
						-webkit-box-align: center !important;
						-webkit-align-items: center !important;
						position: relative !important;
					}
					
					.chat-send-btn {
						position: relative !important;
						-webkit-flex-shrink: 0 !important;
						flex-shrink: 0 !important;
						width: 36px !important;
						height: 36px !important;
						min-width: 36px !important;
						min-height: 36px !important;
						display: -webkit-box !important;
						display: -webkit-flex !important;
						-webkit-box-pack: center !important;
						-webkit-justify-content: center !important;
						-webkit-box-align: center !important;
						-webkit-align-items: center !important;
					}
					
					.chat-input-field {
						-webkit-flex: 1 1 auto !important;
						flex: 1 1 auto !important;
						min-width: 0 !important;
					}
				}
			}
		`;
		
		document.head.appendChild(style);
	}

	private getParticipantName(senderId: string): string {
		if (!senderId) {
			return 'Asistente';
		}

		if (!this.chatDetail) {
			return 'Asesor';
		}

		const participant = this.chatDetail.participants.find(p => p.id === senderId);
		if (!participant) {
			return 'Asesor';
		}

		if (isBot(participant.name)) {
			return 'Asistente';
		}

		return participant.name;
	}

	private addDateSeparatorIfNeeded(date: Date): void {
		if (!this.containerMessages) return;

		const dateStr = formatDate(date);

		if (!this.lastMessageDate || this.lastMessageDate !== dateStr) {
			const separator = createDateSeparator(dateStr);
			this.containerMessages.appendChild(separator);
			this.lastMessageDate = dateStr;
		}
	}

	private rebuildDateSeparators(): void {
		if (!this.containerMessages) return;

		this.lastMessageDate = null;

		const existingSeparators = this.containerMessages.querySelectorAll('.chat-date-separator');
		existingSeparators.forEach(sep => sep.parentNode?.removeChild(sep));

		const messageWrappers = Array.from(this.containerMessages.querySelectorAll('.chat-message-wrapper'));

		if (messageWrappers.length === 0) return;

		let currentDateStr: string | null = null;

		messageWrappers.forEach((wrapper) => {
			// ✅ Leer timestamp del data attribute (agregado por MessageRenderer)
			const createdAtAttr = wrapper.getAttribute('data-created-at');
			const messageDate = createdAtAttr ? new Date(createdAtAttr) : new Date();
			const messageDateStr = formatDate(messageDate);

			if (messageDateStr !== currentDateStr) {
				currentDateStr = messageDateStr;

				const separator = createDateSeparator(messageDateStr);

				if (this.containerMessages) {
					this.containerMessages.insertBefore(separator, wrapper);
				}
			}
		});

		if (currentDateStr) {
			this.lastMessageDate = currentDateStr;
		}
	}

	private async initializeChatContent(): Promise<void> {
		try {
			debugLog("💬 [ChatUI] Inicializando contenido del chat...");
			
			if (this.isVisible()) {
				this.loadChatContent();
			}
		} catch (err) {
			// Mensajes iniciales se manejan automáticamente en checkAndAddInitialMessages()
		}
	}

	private async loadChatContent(): Promise<void> {
		if (!this.container?.getAttribute('data-chat-initialized')) {
			debugLog("Chat no inicializado aún, esperando...");
			return;
		}

		if (this.messagesLoaded) {
			debugLog("Los mensajes ya fueron cargados previamente, omitiendo fetch...");
			return;
		}

		debugLog("Cargando contenido del chat...");

		try {
			this.messagesLoaded = true;

			if (this.chatDetail && this.chatDetail.status === 'active') {
				this.checkInitialCommercialStatus();
			}
		} catch (error) {
			// Mensajes iniciales se manejan automáticamente en checkAndAddInitialMessages()

			if (this.chatDetail && this.chatDetail.status === 'active') {
				this.checkInitialCommercialStatus();
			}
		}
	}

	private async loadChatDetails(force: boolean = false): Promise<void> {
		console.log('📋 [ChatUI] loadChatDetails LLAMADO, chatId:', this.chatId, 'force:', force);

		if (!this.chatId) {
			console.log('⚠️ [ChatUI] loadChatDetails: No hay chatId');
			return;
		}

		try {
			console.log('📋 [ChatUI] Cargando detalles del chat desde backend...');
			this.chatDetail = await fetchChatDetail(this.chatId, force);
			console.log('📋 [ChatUI] chatDetail obtenido:', {
				id: this.chatDetail?.id,
				status: this.chatDetail?.status,
				assignedCommercial: this.chatDetail?.assignedCommercial,
				participantsCount: this.chatDetail?.participants?.length
			});

			this.lastKnownChatStatus = this.chatDetail.status;

			console.log('📋 [ChatUI] Llamando updateChatHeader...');
			this.updateChatHeader();
			console.log('📋 [ChatUI] updateChatHeader completado');
		} catch (error) {
			console.log('❌ [ChatUI] Error en loadChatDetails:', error);
		}
	}

	private checkInitialCommercialStatus(): void {
		if (!this.chatDetail) return;
		
		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);
		
		commercialParticipants.forEach(commercial => {
			if (!commercial.isOnline && this.lastNotificationType !== 'offline') {
				debugLog("Comercial", commercial.name, "está offline en la carga inicial");
				setTimeout(() => {
					this.sendOfflineNotificationMessage(commercial.name, true);
					this.lastNotificationType = 'offline';
				}, 100);
			}
		});
	}

	private updateChatHeader(): void {
		console.log('🎯 [ChatUI] updateChatHeader LLAMADO', {
			hasChatDetail: !!this.chatDetail,
			hasTitleElement: !!this.titleElement,
			hasAvatarContainer: !!this.avatarContainer,
			hasAvatarStatusDot: !!this.avatarStatusDot
		});

		if (!this.chatDetail || !this.titleElement) {
			console.log('⚠️ [ChatUI] updateChatHeader: Falta chatDetail o titleElement');
			return;
		}

		console.log('🎯 [ChatUI] Actualizando header con chatDetail:', {
			chatId: this.chatDetail.id,
			status: this.chatDetail.status,
			assignedCommercial: this.chatDetail.assignedCommercial,
			participants: this.chatDetail.participants.map(p => ({
				id: p.id,
				name: p.name,
				isCommercial: p.isCommercial,
				isOnline: p.isOnline
			}))
		});

		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);

		// Actualizar solo el título del chat con el nombre del comercial
		if (commercialParticipants.length > 0) {
			const advisor = commercialParticipants[0];
			this.titleElement.textContent = advisor.name || 'Asesor';
			console.log('✅ [ChatUI] Título actualizado:', advisor.name, 'isOnline:', advisor.isOnline);

			// Actualizar estado online del comercial
			// Solo actualizar si NO hemos recibido ya un evento de presencia del WebSocket
			// (para evitar sobrescribir el estado real con el estado persistido)
			if (!this.hasReceivedPresenceEvent) {
				// 🔧 FIX: Asumir offline por defecto hasta que el sistema de presencia
				// confirme el estado real. Esto evita mostrar "online" incorrectamente
				// cuando el comercial está realmente offline.
				// El sistema de presencia (activatePresence → getChatPresence) actualizará
				// el estado correcto en milisegundos.
				console.log('📥 [ChatUI] Estado de presencia pendiente - asumiendo offline hasta confirmación');
				this.updateAvatarStatus('offline');
			} else {
				console.log('📥 [ChatUI] Saltando actualización de estado - ya tenemos estado real del WebSocket');
			}

			// Mostrar avatar y estado de conexión
			if (this.avatarContainer) {
				this.avatarContainer.style.display = 'block';
			}
			// Mostrar el punto de estado cuando hay comercial asignado
			if (this.avatarStatusDot) {
				this.avatarStatusDot.style.display = 'block';
			}
		} else {
			this.titleElement.textContent = 'Chat';
			debugLog('⚠️ [ChatUI] No hay comerciales asignados, ocultando avatar y estado');

			// Ocultar avatar y estado de conexión cuando no hay comercial
			if (this.avatarContainer) {
				this.avatarContainer.style.display = 'none';
			}
			if (this.avatarStatusDot) {
				this.avatarStatusDot.style.display = 'none';
			}
		}

		// Actualizar avatar si hay avatarUrl disponible
		if (this.chatDetail.assignedCommercial?.avatarUrl && this.avatarElement) {
			debugLog('👤 [ChatUI] Actualizando avatar del comercial:', {
				name: this.chatDetail.assignedCommercial.name,
				avatarUrl: this.chatDetail.assignedCommercial.avatarUrl
			});
			// Reemplazar el SVG con una imagen
			const avatarUrl = this.chatDetail.assignedCommercial.avatarUrl;
			const avatarName = this.chatDetail.assignedCommercial.name;

			// Crear elemento de imagen
			const img = document.createElement('img');
			img.src = avatarUrl;
			img.alt = avatarName;
			img.style.cssText = `
				width: 44px;
				height: 44px;
				object-fit: cover;
				border-radius: 50%;
				display: block;
			`;

			// Manejar error de carga
			img.onerror = () => {
				// Si falla, restaurar el SVG por defecto
				this.avatarElement!.innerHTML = `
					<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="white"/>
					</svg>
				`;
			};

			// Limpiar contenido anterior, quitar fondo y añadir imagen
			this.avatarElement.innerHTML = '';
			this.avatarElement.style.background = 'transparent';
			this.avatarElement.style.padding = '0';
			this.avatarElement.appendChild(img);
		}

		// El punto de estado en el avatar maneja la presencia visualmente
		// No necesitamos subtitleElement - se elimina
	}

	private sendOfflineNotificationMessage(commercialName: string, isInitialLoad: boolean = false): void {
		let offlineMessage: string;
		
		if (isInitialLoad) {
			offlineMessage = `${commercialName} no está disponible en este momento. Te responderá tan pronto como esté online.`;
		} else {
			offlineMessage = `${commercialName} se ha desconectado temporalmente. Te responderá tan pronto como esté disponible nuevamente.`;
		}
		
		debugLog("Enviando mensaje automático de desconexión:", offlineMessage);
		this.addSystemMessage(offlineMessage);
	}

	// Métodos públicos adicionales para la API

	/**
	 * Verifica si el chat está vacío y agrega mensajes iniciales si es necesario
	 * Este método se llama automáticamente cuando se abre el chat
	 * Público para ser llamado desde TrackingPixelSDK después de cargar mensajes
	 */
	public checkAndAddInitialMessages(): void {
		// Solo agregar mensajes iniciales si no hay mensajes y no se están cargando
		if (!this.containerMessages) {
			debugLog('💬 [ChatUI] Container de mensajes no disponible, omitiendo verificación de mensajes iniciales');
			return;
		}

		// 🔒 PROTECCIÓN CONTRA RACE CONDITION: Verificar si se está cargando mensajes iniciales
		if (this.isLoadingInitialMessages) {
			debugLog('💬 [ChatUI] 🔒 Carga inicial de mensajes en progreso, omitiendo verificación de mensajes iniciales para evitar race condition');
			return;
		}

		// Verificar si hay indicador de carga activo
		const hasLoadingIndicator = this.containerMessages.querySelector('.loading-messages-indicator') as HTMLElement;
		if (hasLoadingIndicator && hasLoadingIndicator.style.display !== 'none') {
			debugLog('💬 [ChatUI] Indicador de carga visible, omitiendo mensajes iniciales automáticos');
			return;
		}

		// Contar mensajes reales (excluyendo indicadores de carga, separadores de fecha y mensaje de consentimiento)
		const messageElements = Array.from(this.containerMessages.children).filter(el =>
			el.classList && (
				el.classList.contains('chat-message-user-wrapper') ||
				el.classList.contains('chat-message-other-wrapper')
			)
		);

		debugLog(`💬 [ChatUI] Verificación automática: ${messageElements.length} mensajes encontrados`);

		if (messageElements.length === 0) {
			debugLog('💬 [ChatUI] ✅ Chat vacío confirmado, agregando mensajes iniciales');

			// Mostrar Quick Actions si están habilitados
			if (this.quickActionsUI && this.quickActionsConfig.enabled) {
				debugLog('💬 [ChatUI] Mostrando Quick Actions');
				this.quickActionsUI.show();
			}

			// Añadir mensaje de consentimiento (si está habilitado)
			this.addChatConsentMessage();
		} else {
			debugLog('💬 [ChatUI] Chat tiene mensajes, omitiendo mensajes iniciales');

			// Ocultar Quick Actions si hay mensajes
			if (this.quickActionsUI) {
				this.quickActionsUI.hide();
			}
		}
	}

	public addSystemMessage(text: string): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		this.addDateSeparatorIfNeeded(new Date());

		const systemMessageDiv = document.createElement('div');
		systemMessageDiv.classList.add('chat-message-wrapper', 'chat-system-message-wrapper');

		const messageDiv = document.createElement('div');
		messageDiv.classList.add('chat-message', 'chat-system-message');
		messageDiv.textContent = text;
		systemMessageDiv.appendChild(messageDiv);

		this.containerMessages.appendChild(systemMessageDiv);
		this.scrollToBottom(true);
	}

	/**
	 * Añade el mensaje de consentimiento del chat
	 * Similar al de Zara: "Al unirte al chat, confirmas que has leído y entiendes nuestra..."
	 */
	public addChatConsentMessage(): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		// Verificar si está habilitado
		if (!this.chatConsentMessageConfig.enabled) {
			debugLog('💬 [ChatUI] Mensaje de consentimiento del chat deshabilitado');
			return;
		}

		// Verificar si ya se mostró (si showOnce está activo)
		if (this.chatConsentMessageConfig.showOnce && this.chatConsentMessageShown) {
			debugLog('💬 [ChatUI] Mensaje de consentimiento del chat ya fue mostrado');
			return;
		}

		// Crear el wrapper del mensaje
		const consentMessageDiv = document.createElement('div');
		consentMessageDiv.classList.add('chat-message-wrapper', 'chat-consent-message-wrapper');

		// Crear el contenedor del mensaje de consentimiento
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('chat-message', 'chat-consent-message');

		// Construir el contenido del mensaje con enlaces
		const messageContent = document.createElement('div');
		messageContent.className = 'chat-consent-message-content';

		// Texto principal
		const messageText = document.createElement('span');
		messageText.textContent = this.chatConsentMessageConfig.message + ' ';
		messageContent.appendChild(messageText);

		// Enlaces de políticas
		const links: HTMLAnchorElement[] = [];

		if (this.chatConsentMessageConfig.privacyPolicyUrl) {
			const privacyLink = document.createElement('a');
			privacyLink.href = this.chatConsentMessageConfig.privacyPolicyUrl;
			privacyLink.textContent = this.chatConsentMessageConfig.privacyPolicyText || 'Política de Privacidad';
			privacyLink.className = 'chat-consent-link';
			privacyLink.target = '_blank';
			privacyLink.rel = 'noopener noreferrer';
			links.push(privacyLink);
		}

		if (this.chatConsentMessageConfig.cookiesPolicyUrl) {
			const cookiesLink = document.createElement('a');
			cookiesLink.href = this.chatConsentMessageConfig.cookiesPolicyUrl;
			cookiesLink.textContent = this.chatConsentMessageConfig.cookiesPolicyText || 'Política de Cookies';
			cookiesLink.className = 'chat-consent-link';
			cookiesLink.target = '_blank';
			cookiesLink.rel = 'noopener noreferrer';
			links.push(cookiesLink);
		}

		// Añadir enlaces al mensaje con separador " y "
		links.forEach((link, index) => {
			if (index > 0) {
				const separator = document.createElement('span');
				separator.textContent = ' y ';
				messageContent.appendChild(separator);
			}
			messageContent.appendChild(link);
		});

		messageDiv.appendChild(messageContent);
		consentMessageDiv.appendChild(messageDiv);

		// Añadir al contenedor de mensajes (al principio, antes de otros mensajes)
		const firstMessage = this.containerMessages.querySelector('.chat-message-wrapper');
		if (firstMessage) {
			this.containerMessages.insertBefore(consentMessageDiv, firstMessage);
		} else {
			this.containerMessages.appendChild(consentMessageDiv);
		}

		// Marcar como mostrado
		this.chatConsentMessageShown = true;

		debugLog('💬 [ChatUI] ✅ Mensaje de consentimiento del chat agregado');
	}

	/**
	 * Refresca los detalles del chat desde el backend
	 * @param force Si es true, ignora caché y fuerza carga desde backend (útil para obtener datos actualizados del comercial)
	 */
	public async refreshChatDetails(force: boolean = false): Promise<void> {
		await this.loadChatDetails(force);
	}

	/**
	 * Alias conveniente para forzar refresh de detalles del chat desde backend
	 * Útil cuando se recibe el primer mensaje del comercial para obtener datos actualizados
	 */
	public async refreshChatDetailsForced(): Promise<void> {
		console.log('🔄 [ChatUI] refreshChatDetailsForced LLAMADO, chatId:', this.chatId);
		await this.loadChatDetails(true);
		console.log('🔄 [ChatUI] refreshChatDetailsForced COMPLETADO');
	}

	/**
	 * Obtiene los detalles del chat listando todos los chats del visitante
	 * Útil cuando un chat nuevo es creado por el comercial y GET /chats/{id} aún no funciona
	 * @param visitorId ID del visitante
	 */
	public async refreshChatDetailsFromVisitorList(visitorId: string): Promise<void> {
		if (!this.chatId) {
			debugLog('⚠️ [ChatUI] No hay chatId, omitiendo refresh desde lista de visitante');
			return;
		}

		try {
			debugLog('🔄 [ChatUI] Obteniendo chats del visitante para encontrar chat:', this.chatId);

			const ChatV2Service = (await import('../../services/chat-v2-service')).ChatV2Service;
			const chatService = ChatV2Service.getInstance();

			// Obtener lista de chats del visitante
			const chatList = await chatService.getVisitorChats(visitorId, undefined, 50);

			debugLog('✅ [ChatUI] Chats del visitante obtenidos:', {
				total: chatList.total,
				count: chatList.chats.length
			});

			// Buscar el chat específico en la lista
			const chat = chatList.chats.find(c => c.id === this.chatId);

			if (!chat) {
				return;
			}

			debugLog('✅ [ChatUI] Chat encontrado en lista:', {
				chatId: chat.id,
				status: chat.status,
				assignedCommercial: chat.assignedCommercial
			});

			// Convertir ChatV2 a ChatDetailV2 para actualizar el header
			const { convertV2ToLegacy } = await import('../../services/chat-detail-service');

			// Crear un ChatDetailV2 a partir del ChatV2
			// IMPORTANTE: Convertir strings de fecha a objetos Date
			const chatDetailV2 = {
				id: chat.id,
				status: chat.status,
				priority: chat.priority,
				visitorInfo: chat.visitorInfo,
				assignedCommercialId: chat.assignedCommercialId,
				assignedCommercial: chat.assignedCommercial,
				availableCommercialIds: chat.availableCommercialIds,
				metadata: chat.metadata,
				createdAt: new Date(chat.createdAt),
				assignedAt: chat.assignedAt ? new Date(chat.assignedAt) : undefined,
				closedAt: chat.closedAt ? new Date(chat.closedAt) : undefined,
				lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined,
				totalMessages: chat.totalMessages,
				unreadMessagesCount: chat.unreadMessagesCount,
				isActive: chat.isActive,
				visitorId: chat.visitorId,
				department: chat.department,
				tags: chat.tags,
				updatedAt: chat.updatedAt ? new Date(chat.updatedAt) : undefined
			};

			// Convertir a formato legacy para compatibilidad
			this.chatDetail = convertV2ToLegacy(chatDetailV2);
			this.lastKnownChatStatus = this.chatDetail.status;

			debugLog('✅ [ChatUI] Chat detail actualizado desde lista del visitante');

			// Actualizar header con información del comercial
			this.updateChatHeader();
		} catch (error) {
		}
	}

	public onOpen(callback: () => void): void {
		this.openCallbacks.push(callback);
	}

	public onClose(callback: () => void): void {
		this.closeCallbacks.push(callback);
	}

	// Métodos adicionales requeridos por tracking-pixel-SDK.ts
	public onChatInitialized(callback: () => void): void {
		this.initializationCallbacks.push(callback);
	}

	public onActiveInterval(callback: () => void, intervalMs: number = 5000): void {
		this.activeIntervals.push({ id: null, callback, intervalMs });
	}

	public isCreatingChat(): boolean {
		return this.isCreatingChatFlag;
	}

	public async waitForChatCreation(): Promise<void> {
		if (this.chatCreationPromise) {
			await this.chatCreationPromise;
		}
	}

	public setCreatingChat(isCreating: boolean): void {
		this.isCreatingChatFlag = isCreating;
		
		if (isCreating) {
			// Crear la promesa de espera
			this.chatCreationPromise = new Promise<void>((resolve) => {
				this.chatCreationResolve = resolve;
			});
		} else {
			// Resolver la promesa si existe
			if (this.chatCreationResolve) {
				this.chatCreationResolve();
				this.chatCreationResolve = null;
			}
			this.chatCreationPromise = null;
		}
	}

	/**
	 * Muestra indicador de carga de mensajes
	 */
	public showLoadingMessages(): void {
		if (!this.containerMessages) return;

		// Crear indicador de carga si no existe
		let loadingIndicator = this.containerMessages.querySelector('.loading-messages-indicator') as HTMLElement;
		
		if (!loadingIndicator) {
			loadingIndicator = document.createElement('div');
			loadingIndicator.className = 'loading-messages-indicator';
			loadingIndicator.style.cssText = `
				text-align: center;
				padding: 20px;
				color: #666;
				font-size: 14px;
			`;
			loadingIndicator.innerHTML = `
				<div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #0084ff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
				Cargando mensajes...
				<style>
					@keyframes spin {
						0% { transform: rotate(0deg); }
						100% { transform: rotate(360deg); }
					}
				</style>
			`;
			
			this.containerMessages.appendChild(loadingIndicator);
		}

		loadingIndicator.style.display = 'block';
		debugLog('💬 [ChatUI] Indicador de carga de mensajes mostrado');
	}

	/**
	 * Oculta indicador de carga de mensajes
	 */
	public hideLoadingMessages(): void {
		if (!this.containerMessages) return;

		const loadingIndicator = this.containerMessages.querySelector('.loading-messages-indicator') as HTMLElement;
		
		if (loadingIndicator) {
			loadingIndicator.style.display = 'none';
		}

		debugLog('💬 [ChatUI] Indicador de carga de mensajes ocultado');
	}

	/**
	 * Limpia todos los mensajes del chat
	 */
	public clearMessages(): void {
		if (!this.containerMessages) return;

		// Limpiar todos los elementos excepto: indicador de carga, quick actions, y el div inferior
		const children = Array.from(this.containerMessages.children);
		children.forEach(child => {
			// Preservar: indicador de carga, quick actions, y el div inferior (chat-messages-bottom)
			if (!child.classList.contains('loading-messages-indicator') &&
				!child.classList.contains('guiders-quick-actions') &&
				!child.classList.contains('chat-messages-bottom')) {
				child.remove();
			}
		});

		this.messagesLoaded = false;
		this.lastMessageDate = null;
		debugLog('💬 [ChatUI] Mensajes limpiados');
	}

	/**
	 * Método de scroll alternativo para compatibilidad con el TrackingPixelSDK
	 */
	public scrollToBottomV2(): void {
		if (!this.containerMessages) return;

		requestAnimationFrame(() => {
			if (this.containerMessages) {
				this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
				debugLog('💬 [ChatUI] Scroll al bottom realizado (V2)');
			}
		});
	}

	/**
	 * Establece el estado de carga inicial de mensajes
	 * Usado por TrackingPixelSDK para coordinar la carga de mensajes
	 */
	public setLoadingInitialMessages(loading: boolean): void {
		this.isLoadingInitialMessages = loading;
		debugLog(`💬 [ChatUI] 🔒 Estado isLoadingInitialMessages cambiado a: ${loading}`);
	}

	/**
	 * Obtiene el estado de carga inicial de mensajes
	 */
	public isLoadingMessages(): boolean {
		return this.isLoadingInitialMessages;
	}

	/**
	 * Obtiene la posición resuelta del widget
	 * Útil para que otros componentes (como ChatToggleButton) se posicionen relativamente
	 */
	public getResolvedPosition(): ResolvedPosition {
		return this.resolvedPosition;
	}

	/**
	 * Configura el servicio de presencia para el chat
	 * @param presenceService Instancia del servicio de presencia
	 */
	public setPresenceService(presenceService: PresenceService): void {
		this.presenceService = presenceService;
		debugLog('💬 [ChatUI] PresenceService configurado');
	}

	/**
	 * Configura si se debe mostrar el banner offline
	 * @param enabled true para mostrar el banner, false para ocultarlo
	 */
	public setShowOfflineBanner(enabled: boolean): void {
		this.showOfflineBannerEnabled = enabled;
		debugLog('💬 [ChatUI] Banner offline:', enabled ? 'habilitado' : 'deshabilitado');

		// Si se deshabilita mientras está visible, ocultarlo
		if (!enabled) {
			this.hideOfflineBanner();
		}
	}

	/**
	 * Actualiza el punto de estado en el avatar según el estado de presencia
	 * @param status Estado de presencia del comercial
	 */
	private updateAvatarStatus(status: PresenceStatus): void {
		console.log('👤 [ChatUI] updateAvatarStatus llamado con:', status, 'avatarStatusDot existe:', !!this.avatarStatusDot);

		if (!this.avatarStatusDot) {
			console.log('⚠️ [ChatUI] avatarStatusDot es null, no se puede actualizar estado');
			return;
		}

		// Limpiar clases anteriores de estado
		this.avatarStatusDot.className = 'avatar-status-dot';

		// Aplicar nueva clase de estado
		this.avatarStatusDot.classList.add(`status-${status}`);

		// Persistir estado en sessionStorage por commercialId
		// Esto permite que el estado se comparta entre múltiples chats del mismo comercial
		this.persistPresenceState(status);

		console.log('✅ [ChatUI] Avatar status dot actualizado a:', status);
	}

	/**
	 * Obtiene el ID del comercial asignado al chat actual
	 */
	private getCurrentCommercialId(): string | null {
		return this.chatDetail?.assignedCommercial?.id || null;
	}

	/**
	 * Persiste el estado de presencia en sessionStorage por commercialId
	 * Esto permite que el estado se comparta entre múltiples chats del mismo comercial
	 */
	private persistPresenceState(status: PresenceStatus): void {
		const commercialId = this.getCurrentCommercialId();
		if (!commercialId) return;

		try {
			const stateJson = sessionStorage.getItem(PRESENCE_STATE_KEY);
			const state = stateJson ? JSON.parse(stateJson) : {};
			state[commercialId] = {
				status,
				timestamp: Date.now()
			};
			sessionStorage.setItem(PRESENCE_STATE_KEY, JSON.stringify(state));
			debugLog('💾 [ChatUI] Estado de presencia persistido:', status, 'para comercial:', commercialId);
		} catch (e) {
			// Silenciar errores de storage
		}
	}

	/**
	 * Recupera el estado de presencia persistido por commercialId
	 */
	private getPersistedPresenceState(): PresenceStatus | null {
		const commercialId = this.getCurrentCommercialId();
		if (!commercialId) return null;

		try {
			const stateJson = sessionStorage.getItem(PRESENCE_STATE_KEY);
			if (!stateJson) return null;

			const state = JSON.parse(stateJson);
			const commercialState = state[commercialId];

			if (!commercialState) return null;

			// Expirar después de 5 minutos (el comercial pudo cambiar de estado)
			const MAX_AGE_MS = 5 * 60 * 1000;
			if (Date.now() - commercialState.timestamp > MAX_AGE_MS) {
				debugLog('⏰ [ChatUI] Estado de presencia expirado para comercial:', commercialId);
				return null;
			}

			debugLog('📥 [ChatUI] Estado de presencia recuperado:', commercialState.status, 'para comercial:', commercialId);
			return commercialState.status as PresenceStatus;
		} catch (e) {
			return null;
		}
	}

	/**
	 * 🆕 2025: Verifica si un evento de presencia es relevante para este chat
	 *
	 * Maneja dos formatos de payload:
	 * - **Granular**: evento tiene `chatId` (enviado a sala `chat:{chatId}`)
	 * - **Global**: evento tiene `affectedChatIds` (enviado a sala personal)
	 *
	 * @param event Evento de presencia recibido
	 * @returns true si el evento aplica a este chat
	 */
	private isPresenceEventRelevant(event: PresenceChangedEvent): boolean {
		if (!this.chatId) {
			debugLog('💬 [ChatUI] ⚠️ No hay chatId actual, ignorando evento');
			return false;
		}

		// Formato granular: evento específico para un chat
		if (event.chatId) {
			const isRelevant = event.chatId === this.chatId;
			debugLog(`💬 [ChatUI] Evento GRANULAR - chatId=${event.chatId}, actual=${this.chatId}, relevante=${isRelevant}`);
			return isRelevant;
		}

		// Formato global: evento con lista de chats afectados
		if (event.affectedChatIds && Array.isArray(event.affectedChatIds)) {
			const isRelevant = event.affectedChatIds.includes(this.chatId);
			debugLog(`💬 [ChatUI] Evento GLOBAL - afectados=${event.affectedChatIds.length}, incluye actual=${isRelevant}`);
			return isRelevant;
		}

		// Formato legacy (sin chatId ni affectedChatIds): asumir relevante
		// Esto mantiene compatibilidad con backends antiguos
		debugLog('💬 [ChatUI] Evento LEGACY (sin chatId/affectedChatIds) - asumiendo relevante');
		return true;
	}

	/**
	 * Activa el sistema de presencia para el chat actual
	 * Se llama cuando se abre el chat
	 */
	private activatePresence(): void {
		if (!this.presenceService || !this.chatId) {
			debugLog('💬 [ChatUI] ⚠️ No se puede activar presencia: servicio o chatId faltante');
			return;
		}

		debugLog('💬 [ChatUI] 🟢 Activando sistema de presencia para chat:', this.chatId);

		// Unirse a la sala de chat
		this.presenceService.joinChatRoom(this.chatId);

		// Obtener estado inicial de presencia
		this.presenceService.getChatPresence(this.chatId).then(presence => {
			if (!presence) {
				debugLog('💬 [ChatUI] ⚠️ No se pudo obtener presencia inicial');
				return;
			}

			debugLog('💬 [ChatUI] ✅ Presencia inicial obtenida:', presence);

			// 🔧 FIX: Si ya recibimos un evento en tiempo real más reciente,
			// no sobrescribir el estado con la respuesta de la API (que puede estar desactualizada)
			if (this.hasReceivedPresenceEvent) {
				console.log('⏭️ [ChatUI] Ignorando presencia inicial - ya tenemos estado más reciente del WebSocket');
				return;
			}

			// Buscar el comercial en los participantes
			const commercial = this.presenceService!.getCommercialFromParticipants(presence.participants);

			if (commercial && this.avatarStatusDot) {
				// Marcar que ya tenemos estado de presencia real (desde API inicial)
				this.hasReceivedPresenceEvent = true;

				console.log('📡 [ChatUI] Aplicando presencia inicial:', commercial.connectionStatus);

				// Actualizar punto de estado en el avatar
				this.updateAvatarStatus(commercial.connectionStatus);
				debugLog('💬 [ChatUI] Avatar status dot actualizado (presencia inicial):', commercial.connectionStatus);

				// Mostrar/ocultar banner offline
				if (commercial.connectionStatus === 'offline') {
					this.showOfflineBanner();
				} else {
					this.hideOfflineBanner();
				}
			}
		});

		// Suscribirse a cambios de presencia
		this.presenceUnsubscribe = this.presenceService.onPresenceChanged((event: PresenceChangedEvent) => {
			console.log('🔔 [ChatUI] EVENTO DE PRESENCIA RECIBIDO:', {
				userId: event.userId,
				userType: event.userType,
				status: event.status,
				previousStatus: event.previousStatus,
				chatId: event.chatId,
				affectedChatIds: event.affectedChatIds,
				currentChatId: this.chatId,
				currentCommercialId: this.getCurrentCommercialId()
			});

			// 🆕 2025: Verificar si el evento es relevante para este chat
			const isRelevantEvent = this.isPresenceEventRelevant(event);
			console.log('🔍 [ChatUI] ¿Evento relevante?', isRelevantEvent);

			if (!isRelevantEvent) {
				console.log('⏭️ [ChatUI] Evento ignorado - no relevante para este chat');
				return;
			}

			// Actualizar punto de estado en el avatar
			console.log('🎯 [ChatUI] Procesando evento...', {
				hasAvatarStatusDot: !!this.avatarStatusDot,
				eventUserType: event.userType,
				eventStatus: event.status
			});

			if (this.avatarStatusDot && event.userType === 'commercial') {
				// Marcar que ya recibimos un evento de presencia real del WebSocket
				this.hasReceivedPresenceEvent = true;

				console.log('✅ [ChatUI] Actualizando avatar status a:', event.status);
				this.updateAvatarStatus(event.status);

				// Actualizar banner offline
				if (event.status === 'offline') {
					this.showOfflineBanner();
				} else {
					this.hideOfflineBanner();
				}
			} else {
				console.log('⚠️ [ChatUI] No se actualizó avatar:', {
					hasAvatarStatusDot: !!this.avatarStatusDot,
					userType: event.userType
				});
			}
		});

		// Suscribirse a cambios de typing
		this.typingUnsubscribe = this.presenceService.onTypingChanged((event: TypingEvent, isTyping: boolean) => {
			debugLog('💬 [ChatUI] ✍️ Evento de typing recibido:', { ...event, isTyping });

			// El indicador de typing se maneja en ChatMessagesUI
			// El punto de estado en el avatar muestra la presencia visualmente
			// No necesitamos actualizar texto adicional aquí
		});

		debugLog('💬 [ChatUI] ✅ Sistema de presencia activado');
	}

	/**
	 * Desactiva el sistema de presencia
	 * Se llama cuando se cierra el chat o se cambia a otro chat
	 */
	private deactivatePresence(): void {
		// Solo requerir presenceService, chatId puede ser null si estamos limpiando
		if (!this.presenceService) {
			return;
		}

		// Si no hay suscripciones activas, no hay nada que limpiar
		if (!this.presenceUnsubscribe && !this.typingUnsubscribe) {
			return;
		}

		debugLog('💬 [ChatUI] 🔴 Desactivando sistema de presencia para chat:', this.chatId || '(ninguno)');

		// Desuscribirse de eventos
		if (this.presenceUnsubscribe) {
			this.presenceUnsubscribe();
			this.presenceUnsubscribe = null;
		}

		if (this.typingUnsubscribe) {
			this.typingUnsubscribe();
			this.typingUnsubscribe = null;
		}

		// 🚨 NO salir de la sala de chat cuando se cierra el widget
		// El visitante DEBE permanecer en la sala para seguir recibiendo mensajes
		// y poder mostrar notificaciones de badge cuando el chat está cerrado
		// Solo se debe salir cuando el usuario abandona el sitio web (beforeunload)
		// this.presenceService.leaveChatRoom(this.chatId); // ← COMENTADO

		// Resetear punto de estado a offline
		if (this.avatarStatusDot) {
			this.updateAvatarStatus('offline');
		}
		this.hideOfflineBanner();

		debugLog('💬 [ChatUI] ✅ Sistema de presencia desactivado (permanece en sala WebSocket)');
	}

	/**
	 * Muestra el banner de advertencia offline
	 */
	private showOfflineBanner(): void {
		console.log('👁️ [ChatUI] showOfflineBanner llamado', {
			hasOfflineBanner: !!this.offlineBanner,
			showOfflineBannerEnabled: this.showOfflineBannerEnabled,
			currentDisplay: this.offlineBanner?.style.display
		});

		// Solo mostrar si está habilitado en la configuración
		if (this.offlineBanner && this.showOfflineBannerEnabled) {
			this.offlineBanner.style.display = 'block';
			console.log('👁️ [ChatUI] Banner offline mostrado - display:', this.offlineBanner.style.display);
		} else if (!this.showOfflineBannerEnabled) {
			console.log('⚠️ [ChatUI] Banner offline deshabilitado en configuración');
		}
		// Sincronizar indicador de estado del avatar
		this.updateAvatarStatus('offline');
	}

	/**
	 * Oculta el banner de advertencia offline
	 */
	private hideOfflineBanner(): void {
		console.log('🙈 [ChatUI] hideOfflineBanner llamado', {
			hasOfflineBanner: !!this.offlineBanner,
			currentDisplay: this.offlineBanner?.style.display
		});

		if (this.offlineBanner) {
			this.offlineBanner.style.display = 'none';
			console.log('🙈 [ChatUI] Banner offline ocultado - display:', this.offlineBanner.style.display);
		} else {
			console.log('⚠️ [ChatUI] No hay offlineBanner para ocultar');
		}
		// Sincronizar indicador de estado del avatar
		this.updateAvatarStatus('online');
	}
}