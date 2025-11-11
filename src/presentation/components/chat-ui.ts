// chat-ui.ts - Componente principal del chat UI (versión simplificada)

import { Message } from "../../types";
import { debugLog } from "../../utils/debug-logger";
import { ChatSessionStore } from "../../services/chat-session-store";
import { fetchChatDetail, ChatDetail, ChatParticipant } from "../../services/chat-detail-service";
import { ChatMemoryStore } from "../../core/chat-memory-store";
import { WelcomeMessageManager, WelcomeMessageConfig } from "../../core/welcome-message-manager";

// Importar tipos y utilidades
import { ChatUIOptions, Sender, ChatMessageParams, ActiveInterval } from '../types/chat-types';
import { formatTime, formatDate, isBot, generateInitials, createDateSeparator } from '../utils/chat-utils';
import { MessageRenderer, MessageRenderData } from '../utils/message-renderer';
import { resolvePosition, ResolvedPosition } from '../../utils/position-resolver';

// Importar componentes de presencia
import { PresenceService } from '../../services/presence-service';
import { PresenceChangedEvent, TypingEvent, PresenceStatus } from '../../types/presence-types';

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
	private avatarStatusDot: HTMLElement | null = null;

	// Componentes de presencia
	private offlineBanner: HTMLElement | null = null;
	private presenceService: PresenceService | null = null;
	private presenceUnsubscribe: (() => void) | null = null;
	private typingUnsubscribe: (() => void) | null = null;
	private showOfflineBannerEnabled: boolean = true; // Configuración para mostrar/ocultar banner

	// Manager para mensajes de bienvenida
	private welcomeMessageManager: WelcomeMessageManager;

	// Configuración y estado del mensaje de consentimiento del chat
	private chatConsentMessageConfig: import('../types/chat-types').ChatConsentMessageConfig;
	private chatConsentMessageShown: boolean = false;

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

		// Inicializar el manager de mensajes de bienvenida
		this.welcomeMessageManager = new WelcomeMessageManager(options.welcomeMessage);

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

		// Avatar del comercial
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'chat-header-avatar-container';
		avatarContainer.style.position = 'relative';

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

		// Guardar referencia al punto de estado para actualizarlo después
		this.avatarStatusDot = statusDot;

		// Contenedor de título (simplificado - solo nombre)
		const titleContainer = document.createElement('div');
		titleContainer.className = 'chat-header-title-container';
		titleContainer.style.display = 'flex';
		titleContainer.style.flexDirection = 'column';
		titleContainer.style.flex = '1';
		titleContainer.style.minWidth = '0'; // Para permitir truncamiento de texto

		const titleEl = document.createElement('div');
		titleEl.className = 'chat-header-title';
		titleEl.textContent = 'Chat';
		this.titleElement = titleEl;

		// Ensamblar header main
		titleContainer.appendChild(titleEl);

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
				background: linear-gradient(135deg, #0084ff 0%, #00c6fb 100%);
				color: #fff;
				padding: 16px 20px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-top-left-radius: 12px;
				border-top-right-radius: 12px;
				box-shadow: 0 2px 8px rgba(0, 132, 255, 0.1);
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
				border: 1.5px solid #0084ff; /* Mismo color del gradiente para consistencia */
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
				color: #fff;
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
				background: rgba(255, 255, 255, 0.1);
			}

			.chat-close-btn:active {
				transform: scale(0.95);
				background: rgba(255, 255, 255, 0.15);
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
			
			.chat-messages {
				display: flex;
				flex-direction: column;
				flex: 1;
				overflow-y: auto;
				padding: 18px 16px 12px 16px;
				background: #f8f9fa;
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
				padding: 12px 16px;
				border-radius: 16px;
				white-space: normal;
				overflow-wrap: break-word;
				word-wrap: break-word;
				line-height: 1.5;
				font-size: 14px;
				position: relative;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
			}

			.chat-message-user-wrapper {
				display: flex;
				align-self: flex-end;
			}

			.chat-message-user {
				background: linear-gradient(135deg, #0084ff 0%, #00c6fb 100%);
				color: #fff;
				border-bottom-right-radius: 4px;
				box-shadow: 0 2px 8px rgba(0, 132, 255, 0.15);
			}

			.chat-message-other-wrapper {
				align-self: flex-start;
				display: flex;
				gap: 8px;
			}

			.chat-message-other {
				background: #fff;
				color: #111827;
				border: 1px solid #e5e7eb;
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
				padding: 12px 16px;
				background: #ffffff;
				border-top: 1px solid #e5e7eb;
				display: -webkit-flex;
				display: flex;
				-webkit-align-items: center;
				align-items: center;
				gap: 8px;
				border-bottom-left-radius: 12px;
				border-bottom-right-radius: 12px;
				/* Fix Safari: Asegurar que el contenedor mantenga su altura */
				min-height: 60px;
				box-sizing: border-box;
				position: relative;
			}
			
			/* 📱 Input móvil sin border-radius inferior */
			@media (max-width: 768px) {
				.chat-input-container {
					border-bottom-left-radius: 0 !important;
					border-bottom-right-radius: 0 !important;
					padding: 14px 16px;
				}
			}
			
			.chat-input-field {
				-webkit-flex: 1;
				flex: 1;
				border: 1px solid #e5e7eb;
				border-radius: 10px;
				padding: 11px 48px 11px 16px;
				font-size: 14px;
				font-family: 'Inter', sans-serif;
				outline: none;
				background: #f9fafb;
				color: #111827;
				transition: all 0.2s ease;
				/* Fix Safari: Asegurar que el input no cause overflow */
				min-width: 0;
				box-sizing: border-box;
			}

			.chat-input-field:focus {
				border-color: #0084ff;
				background: #ffffff;
				box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.08);
			}
			
			.chat-input-field::placeholder {
				color: #8a9aa9;
			}
			
			.chat-send-btn {
				position: absolute;
				right: 20px;
				background: transparent;
				color: #6b7280;
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
				transition: all 0.2s ease;
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
				background: #f3f4f6;
				color: #111827;
				-webkit-transform: scale(1.05);
				transform: scale(1.05);
			}

			.chat-send-btn:active {
				-webkit-transform: scale(0.95);
				transform: scale(0.95);
				background: #e5e7eb;
			}
			
			.chat-send-btn::before {
				content: '';
				width: 20px;
				height: 20px;
				background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='%236b7280'/%3E%3C/svg%3E");
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
		ChatSessionStore.getInstance().setCurrent(chatId);
		ChatMemoryStore.getInstance().setChatId(chatId);
	}

	public getChatId(): string | null {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		
		if (!this.chatId) {
			this.chatId = ChatMemoryStore.getInstance().getChatId();
		}
		
		return this.chatId;
	}

	public getMessagesContainer(): HTMLElement | null {
		return this.containerMessages;
	}

	public renderChatMessage(params: ChatMessageParams): void {
		const { text, sender, timestamp, senderId } = params;
		this.addMessage(text, sender, timestamp, senderId);
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
		this.refreshChatDetails();
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
	private addMessage(text: string, sender: Sender, timestamp?: number, senderId?: string): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		const messageDate = timestamp ? new Date(timestamp) : new Date();
		this.addDateSeparatorIfNeeded(messageDate);

		const messageDiv = this.createMessageDiv(text, sender, timestamp, senderId);
		this.containerMessages.appendChild(messageDiv);

		this.scrollToBottom(true);
	}

	private createMessageDiv(text: string, sender: Sender, timestamp?: number, senderId?: string): HTMLDivElement {
		// ✅ USAR FUNCIÓN UNIFICADA - Garantiza el mismo estilo que mensajes cargados dinámicamente
		const messageData: MessageRenderData = {
			content: text,
			sender: this.mapSenderType(sender), // Mapear tipos compatibles
			timestamp: timestamp,
			senderId: senderId
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
			console.error("Error iniciando chat:", err);
			// No agregar mensaje de bienvenida aquí ya que se maneja automáticamente en checkAndAddWelcomeMessage()
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
			console.error("Error al cargar el contenido del chat:", error);
			// No agregar mensaje de bienvenida aquí ya que se maneja automáticamente en checkAndAddWelcomeMessage()
			
			if (this.chatDetail && this.chatDetail.status === 'active') {
				this.checkInitialCommercialStatus();
			}
		}
	}

	private async loadChatDetails(): Promise<void> {
		if (!this.chatId) return;
		
		try {
			debugLog("Cargando detalles del chat...");
			this.chatDetail = await fetchChatDetail(this.chatId);
			debugLog("Detalles del chat:", this.chatDetail);
			
			this.lastKnownChatStatus = this.chatDetail.status;
			debugLog("Estado actual del chat:", this.lastKnownChatStatus);
			
			this.updateChatHeader();
		} catch (error) {
			console.warn("Error al cargar detalles del chat:", error);
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
		if (!this.chatDetail || !this.titleElement) return;

		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);

		// Actualizar solo el título del chat con el nombre del comercial
		if (commercialParticipants.length > 0) {
			const advisor = commercialParticipants[0];
			this.titleElement.textContent = advisor.name || 'Asesor';
		} else {
			this.titleElement.textContent = 'Chat';
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
	public addWelcomeMessage(): void {
		debugLog('💬 [ChatUI] Verificando si agregar mensaje de bienvenida...');
		
		const hasMessages = this.containerMessages &&
			Array.from(this.containerMessages.children).some(el =>
				el.classList && (
					el.classList.contains('chat-message-user-wrapper') ||
					el.classList.contains('chat-message-other-wrapper')
				)
			);

		if (!hasMessages) {
			const welcomeText = this.welcomeMessageManager.getWelcomeMessage();
			
			if (welcomeText) {
				this.addMessage(welcomeText, 'other');
				debugLog('💬 [ChatUI] ✅ Mensaje de bienvenida agregado');
				
				const tips = this.welcomeMessageManager.getTips();
				if (tips.length > 0) {
					setTimeout(() => {
						tips.forEach((tip, index) => {
							setTimeout(() => {
								this.addMessage(tip, 'other');
							}, index * 1000);
						});
					}, 2000);
				}
			}
		}
	}

	/**
	 * Verifica si el chat está vacío y agrega el mensaje de bienvenida si es necesario
	 * Este método se llama automáticamente cuando se abre el chat
	 * Ahora es público para ser llamado desde TrackingPixelSDK después de cargar mensajes
	 */
	public checkAndAddWelcomeMessage(): void {
		// Solo agregar mensaje de bienvenida si no hay mensajes y no se están cargando
		if (!this.containerMessages) {
			debugLog('💬 [ChatUI] Container de mensajes no disponible, omitiendo verificación de bienvenida');
			return;
		}

		// 🔒 PROTECCIÓN CONTRA RACE CONDITION: Verificar si se está cargando mensajes iniciales
		if (this.isLoadingInitialMessages) {
			debugLog('💬 [ChatUI] 🔒 Carga inicial de mensajes en progreso, omitiendo verificación de bienvenida para evitar race condition');
			return;
		}

		// Verificar si hay indicador de carga activo
		const hasLoadingIndicator = this.containerMessages.querySelector('.loading-messages-indicator') as HTMLElement;
		if (hasLoadingIndicator && hasLoadingIndicator.style.display !== 'none') {
			debugLog('💬 [ChatUI] Indicador de carga visible, omitiendo mensaje de bienvenida automático');
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

			// Añadir mensaje de consentimiento primero (si está habilitado)
			this.addChatConsentMessage();

			// Luego añadir mensaje de bienvenida
			this.addWelcomeMessage();
		} else {
			debugLog('💬 [ChatUI] Chat tiene mensajes, omitiendo mensajes iniciales');
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

	public async refreshChatDetails(): Promise<void> {
		await this.loadChatDetails();
	}

	public onOpen(callback: () => void): void {
		this.openCallbacks.push(callback);
	}

	public onClose(callback: () => void): void {
		this.closeCallbacks.push(callback);
	}

	public setWelcomeMessage(config: Partial<WelcomeMessageConfig>): void {
		this.welcomeMessageManager.updateConfig(config);
	}

	public setCustomWelcomeMessage(message: string): void {
		this.welcomeMessageManager.updateConfig({
			style: 'custom',
			customMessage: message
		});
	}

	public getWelcomeMessageConfig(): WelcomeMessageConfig {
		return this.welcomeMessageManager.getConfig();
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

		// Limpiar todos los elementos excepto el indicador de carga
		const children = Array.from(this.containerMessages.children);
		children.forEach(child => {
			if (!child.classList.contains('loading-messages-indicator')) {
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
		if (!this.avatarStatusDot) return;

		// Limpiar clases anteriores de estado
		this.avatarStatusDot.className = 'avatar-status-dot';

		// Aplicar nueva clase de estado
		this.avatarStatusDot.classList.add(`status-${status}`);

		debugLog('💬 [ChatUI] Avatar status dot actualizado a:', status);
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

			// Buscar el comercial en los participantes
			const commercial = this.presenceService!.getCommercialFromParticipants(presence.participants);

			if (commercial && this.avatarStatusDot) {
				// Actualizar punto de estado en el avatar
				this.updateAvatarStatus(commercial.connectionStatus);
				debugLog('💬 [ChatUI] Avatar status dot actualizado:', commercial.connectionStatus);

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
			debugLog('💬 [ChatUI] 🟢 Evento de presencia recibido:', event);

			// Actualizar punto de estado en el avatar
			if (this.avatarStatusDot && event.userType === 'commercial') {
				this.updateAvatarStatus(event.status);

				// Actualizar banner offline
				if (event.status === 'offline') {
					this.showOfflineBanner();
				} else {
					this.hideOfflineBanner();
				}
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
	 * Se llama cuando se cierra el chat
	 */
	private deactivatePresence(): void {
		if (!this.presenceService || !this.chatId) {
			return;
		}

		debugLog('💬 [ChatUI] 🔴 Desactivando sistema de presencia para chat:', this.chatId);

		// Desuscribirse de eventos
		if (this.presenceUnsubscribe) {
			this.presenceUnsubscribe();
			this.presenceUnsubscribe = null;
		}

		if (this.typingUnsubscribe) {
			this.typingUnsubscribe();
			this.typingUnsubscribe = null;
		}

		// Salir de la sala de chat
		this.presenceService.leaveChatRoom(this.chatId);

		// Resetear punto de estado a offline
		if (this.avatarStatusDot) {
			this.updateAvatarStatus('offline');
		}
		this.hideOfflineBanner();

		debugLog('💬 [ChatUI] ✅ Sistema de presencia desactivado');
	}

	/**
	 * Muestra el banner de advertencia offline
	 */
	private showOfflineBanner(): void {
		// Solo mostrar si está habilitado en la configuración
		if (this.offlineBanner && this.showOfflineBannerEnabled) {
			this.offlineBanner.style.display = 'block';
			debugLog('💬 [ChatUI] 📢 Banner offline mostrado');
		} else if (!this.showOfflineBannerEnabled) {
			debugLog('💬 [ChatUI] ⚠️ Banner offline deshabilitado en configuración');
		}
	}

	/**
	 * Oculta el banner de advertencia offline
	 */
	private hideOfflineBanner(): void {
		if (this.offlineBanner) {
			this.offlineBanner.style.display = 'none';
			debugLog('💬 [ChatUI] 📢 Banner offline ocultado');
		}
	}
}