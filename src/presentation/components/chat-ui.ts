// chat-ui.ts - Componente principal del chat UI (versión simplificada)

import { Message } from "../../types";
import { ChatSessionStore } from "../../services/chat-session-store";
import { fetchChatDetail, ChatDetail, ChatParticipant } from "../../services/chat-detail-service";
import { ChatMemoryStore } from "../../core/chat-memory-store";
import { WelcomeMessageManager, WelcomeMessageConfig } from "../../core/welcome-message-manager";

// Importar tipos y utilidades
import { ChatUIOptions, Sender, ChatMessageParams, ActiveInterval } from '../types/chat-types';
import { formatTime, formatDate, isBot, generateInitials, createDateSeparator } from '../utils/chat-utils';
import { MessageRenderer, MessageRenderData } from '../utils/message-renderer';

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

	// Manager para mensajes de bienvenida
	private welcomeMessageManager: WelcomeMessageManager;

	// Control de estado para evitar creación de múltiples chats
	private isCreatingChatFlag: boolean = false;
	private chatCreationPromise: Promise<void> | null = null;
	private chatCreationResolve: (() => void) | null = null;

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

			console.log("Chat inicializado con estado: oculto");
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

		const titleEl = document.createElement('div');
		titleEl.className = 'chat-header-title';
		titleEl.textContent = 'Chat';
		this.titleElement = titleEl;

		const subtitleEl = document.createElement('div');
		subtitleEl.className = 'chat-header-subtitle';
		subtitleEl.textContent = 'Atención personalizada';
		this.subtitleElement = subtitleEl;
		titleEl.appendChild(subtitleEl);

		headerEl.appendChild(titleEl);

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
	 * Crea el cuerpo del chat (mensajes y footer)
	 */
	private createChatBody(): void {
		if (!this.container) return;

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
		return `
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
			:host { all: initial; font-family: 'Inter', sans-serif; }

			.chat-widget {
				box-shadow: 0 8px 48px 0 rgba(0,0,0,0.22), 0 1.5px 8px 0 rgba(0,0,0,0.10);
				border-radius: 8px;
				overflow: hidden;
				background: linear-gradient(135deg, #f7faff 0%, #e3e9f6 100%);
				font-family: 'Inter', sans-serif;
				display: flex;
				flex-direction: column;
				transition: box-shadow 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
			}
			
			.chat-widget-fixed { 
				width: 340px; 
				height: 520px; 
				position: fixed; 
				bottom: 90px; 
				right: 20px; 
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
				background: #0084ff;
				color: #fff;
				padding: 18px 20px 14px 20px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				border-top-left-radius: 8px;
				border-top-right-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,132,255,0.08);
			}
			
			/* 📱 Header móvil sin border-radius superior */
			@media (max-width: 768px) {
				.chat-header {
					border-top-left-radius: 0 !important;
					border-top-right-radius: 0 !important;
					padding: 20px 20px 16px 20px;
				}
			}
			
			.chat-header-title {
				font-weight: 700;
				font-size: 17px;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: 4px;
				letter-spacing: 0.01em;
			}
			
			.chat-header-subtitle {
				font-size: 13px;
				font-weight: 400;
				opacity: 0.85;
				margin-top: 2px;
				color: #fff;
			}
			
			.chat-header-actions {
				display: flex;
				align-items: center;
				gap: 8px;
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
				background: linear-gradient(120deg, #f7faff 60%, #e3e9f6 100%);
				scroll-behavior: smooth;
			}
			
			.chat-message-wrapper {
				position: relative;
				margin-bottom: 16px;
				max-width: 85%;
				display: flex;
				flex-direction: column;
			}
			
			.chat-message {
				padding: 12px 16px;
				border-radius: 18px;
				white-space: pre-wrap;
				word-break: break-word;
				line-height: 1.5;
				font-size: 14px;
				position: relative;
				box-shadow: 0 1px 2px rgba(0,0,0,0.1);
			}
			
			.chat-message-user-wrapper {
				align-self: flex-end;
			}
			
			.chat-message-user {
				background: linear-gradient(145deg, #0084ff 70%, #00c6fb 100%);
				color: #fff;
				border-bottom-right-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,132,255,0.08);
			}
			
			.chat-message-other-wrapper {
				align-self: flex-start;
				display: flex;
				gap: 8px;
			}
			
			.chat-message-other {
				background: #fff;
				color: #333;
				border: 1px solid #e1e9f1;
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
				color: #8a9aa9;
				margin-top: 4px;
				opacity: 0.8;
			}

			.chat-input-container {
				padding: 12px 16px;
				background: linear-gradient(120deg, #f7faff 60%, #e3e9f6 100%);
				display: -webkit-flex;
				display: flex;
				-webkit-align-items: center;
				align-items: center;
				gap: 8px;
				border-bottom-left-radius: 8px;
				border-bottom-right-radius: 8px;
				/* Fix Safari: Asegurar que el contenedor mantenga su altura */
				min-height: 60px;
				box-sizing: border-box;
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
				border: 1px solid #e1e9f1;
				border-radius: 8px;
				padding: 10px 16px;
				font-size: 14px;
				font-family: 'Inter', sans-serif;
				outline: none;
				background: #f8fafb;
				color: #333;
				transition: all 0.2s ease;
				/* Fix Safari: Asegurar que el input no cause overflow */
				min-width: 0;
				box-sizing: border-box;
			}
			
			.chat-input-field:focus {
				border-color: #0084ff;
				background: #fff;
				box-shadow: 0 0 0 3px rgba(0, 132, 255, 0.1);
			}
			
			.chat-input-field::placeholder {
				color: #8a9aa9;
			}
			
			.chat-send-btn {
				background: -webkit-linear-gradient(145deg, #0084ff, #00c6fb);
				background: linear-gradient(145deg, #0084ff, #00c6fb);
				color: white;
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
				/* Asegurar que el botón mantenga su posición */
				margin-left: auto;
			}
			
			.chat-send-btn:hover {
				background: -webkit-linear-gradient(145deg, #0090ff, #00d6fb);
				background: linear-gradient(145deg, #0090ff, #00d6fb);
				-webkit-transform: scale(1.05);
				transform: scale(1.05);
			}
			
			.chat-send-btn:active {
				-webkit-transform: scale(0.95);
				transform: scale(0.95);
			}
			
			.chat-send-btn::before {
				content: '';
				width: 20px;
				height: 20px;
				background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='white'/%3E%3C/svg%3E");
				background-repeat: no-repeat;
				background-position: center;
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
			const messageDate = new Date();
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
			console.log("💬 [ChatUI] Inicializando contenido del chat...");
			
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
			console.log("Chat no inicializado aún, esperando...");
			return;
		}

		if (this.messagesLoaded) {
			console.log("Los mensajes ya fueron cargados previamente, omitiendo fetch...");
			return;
		}

		console.log("Cargando contenido del chat...");

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
			console.log("Cargando detalles del chat...");
			this.chatDetail = await fetchChatDetail(this.chatId);
			console.log("Detalles del chat:", this.chatDetail);
			
			this.lastKnownChatStatus = this.chatDetail.status;
			console.log("Estado actual del chat:", this.lastKnownChatStatus);
			
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
				console.log("Comercial", commercial.name, "está offline en la carga inicial");
				setTimeout(() => {
					this.sendOfflineNotificationMessage(commercial.name, true);
					this.lastNotificationType = 'offline';
				}, 100);
			}
		});
	}

	private updateChatHeader(): void {
		if (!this.chatDetail || !this.titleElement || !this.subtitleElement) return;

		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);

		if (this.chatDetail.status === 'pending' && commercialParticipants.length > 1) {
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = `Conectando con asesor (${commercialParticipants.length} disponibles)...`;
		} else if (this.chatDetail.status === 'pending' && commercialParticipants.length === 1) {
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = `Conectando con ${commercialParticipants[0].name}...`;
		} else if (commercialParticipants.length > 0) {
			const advisor = commercialParticipants[0];
			
			if (this.chatDetail.status === 'active') {
				const titleWithIndicator = document.createElement('div');
				titleWithIndicator.className = 'chat-online-indicator';
				
				const statusDot = document.createElement('span');
				statusDot.className = `chat-status-dot ${advisor.isOnline ? 'online' : 'offline'}`;
				
				const titleText = document.createElement('span');
				titleText.textContent = `Chat con ${advisor.name}`;
				
				titleWithIndicator.appendChild(statusDot);
				titleWithIndicator.appendChild(titleText);
				
				this.titleElement.innerHTML = '';
				this.titleElement.appendChild(titleWithIndicator);
				
				const onlineStatus = advisor.isOnline ? 'En línea' : 'Desconectado';
				const typingStatus = advisor.isTyping ? ' • Escribiendo...' : '';
				this.subtitleElement.textContent = `${onlineStatus}${typingStatus}`;
			} else {
				this.titleElement.textContent = `Chat con ${advisor.name}`;
				const chatStatusText = this.chatDetail.status === 'inactive' ? 'Inactivo' : 
								   this.chatDetail.status === 'closed' ? 'Cerrado' : 
								   this.chatDetail.status === 'archived' ? 'Archivado' : 'Conectando...';
				this.subtitleElement.textContent = chatStatusText;
			}
		} else {
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = 'Buscando asesor disponible...';
		}
	}

	private sendOfflineNotificationMessage(commercialName: string, isInitialLoad: boolean = false): void {
		let offlineMessage: string;
		
		if (isInitialLoad) {
			offlineMessage = `${commercialName} no está disponible en este momento. Te responderá tan pronto como esté online.`;
		} else {
			offlineMessage = `${commercialName} se ha desconectado temporalmente. Te responderá tan pronto como esté disponible nuevamente.`;
		}
		
		console.log("Enviando mensaje automático de desconexión:", offlineMessage);
		this.addSystemMessage(offlineMessage);
	}

	// Métodos públicos adicionales para la API
	public addWelcomeMessage(): void {
		console.log('💬 [ChatUI] Verificando si agregar mensaje de bienvenida...');
		
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
				console.log('💬 [ChatUI] ✅ Mensaje de bienvenida agregado');
				
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
			console.log('💬 [ChatUI] Container de mensajes no disponible, omitiendo verificación de bienvenida');
			return;
		}

		// 🔒 PROTECCIÓN CONTRA RACE CONDITION: Verificar si se está cargando mensajes iniciales
		if (this.isLoadingInitialMessages) {
			console.log('💬 [ChatUI] 🔒 Carga inicial de mensajes en progreso, omitiendo verificación de bienvenida para evitar race condition');
			return;
		}

		// Verificar si hay indicador de carga activo
		const hasLoadingIndicator = this.containerMessages.querySelector('.loading-messages-indicator') as HTMLElement;
		if (hasLoadingIndicator && hasLoadingIndicator.style.display !== 'none') {
			console.log('💬 [ChatUI] Indicador de carga visible, omitiendo mensaje de bienvenida automático');
			return;
		}

		// Contar mensajes reales (excluyendo indicadores de carga y separadores de fecha)
		const messageElements = Array.from(this.containerMessages.children).filter(el =>
			el.classList && (
				el.classList.contains('chat-message-user-wrapper') ||
				el.classList.contains('chat-message-other-wrapper')
			)
		);

		console.log(`💬 [ChatUI] Verificación automática: ${messageElements.length} mensajes encontrados`);

		if (messageElements.length === 0) {
			console.log('💬 [ChatUI] ✅ Chat vacío confirmado, agregando mensaje de bienvenida automáticamente');
			this.addWelcomeMessage();
		} else {
			console.log('💬 [ChatUI] Chat tiene mensajes, omitiendo mensaje de bienvenida automático');
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
		console.log('💬 [ChatUI] Indicador de carga de mensajes mostrado');
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

		console.log('💬 [ChatUI] Indicador de carga de mensajes ocultado');
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
		console.log('💬 [ChatUI] Mensajes limpiados');
	}

	/**
	 * Método de scroll alternativo para compatibilidad con el TrackingPixelSDK
	 */
	public scrollToBottomV2(): void {
		if (!this.containerMessages) return;

		requestAnimationFrame(() => {
			if (this.containerMessages) {
				this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
				console.log('💬 [ChatUI] Scroll al bottom realizado (V2)');
			}
		});
	}

	/**
	 * Establece el estado de carga inicial de mensajes
	 * Usado por TrackingPixelSDK para coordinar la carga de mensajes
	 */
	public setLoadingInitialMessages(loading: boolean): void {
		this.isLoadingInitialMessages = loading;
		console.log(`💬 [ChatUI] 🔒 Estado isLoadingInitialMessages cambiado a: ${loading}`);
	}

	/**
	 * Obtiene el estado de carga inicial de mensajes
	 */
	public isLoadingMessages(): boolean {
		return this.isLoadingInitialMessages;
	}
}