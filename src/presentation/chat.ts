// chat-ui.ts

import { Message } from "../types";
import { startChat } from "../services/chat-service";
import { fetchMessages } from "../services/fetch-messages";
import { fetchChatDetail, ChatDetail, ChatParticipant } from "../services/chat-detail-service";
import { WebSocketClient } from "../services/websocket-service";

// Posible tipo para el remitente
export type Sender = 'user' | 'other';

// Opciones de configuración del chat
export interface ChatUIOptions {
	containerId?: string;     // ID de un contenedor existente
	widget?: boolean;         // Indica si se debe crear un widget nuevo en el body
	widgetWidth?: string;
	widgetHeight?: string;
	userBgColor?: string;
	otherBgColor?: string;
	textColor?: string;
	maxWidthMessage?: string;
}

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

	/**
	 * Guarda un "index" para paginación inversa.
	 * Por defecto, null (no hay más mensajes que cargar).
	 */
	private currentIndex: string | null = null;

	private chatId: string | null = null;
	private chatDetail: ChatDetail | null = null;
	
	// Almacenar el último estado conocido del chat para detectar cambios
	private lastKnownChatStatus: string | null = null;
	
	// Rastrear el último mensaje de notificación enviado para evitar duplicados
	private lastNotificationType: 'online' | 'offline' | null = null;

	// Flag para controlar si los mensajes ya fueron cargados (evitar recargas innecesarias)
	private messagesLoaded: boolean = false;

	// Callbacks para eventos de apertura y cierre
	private openCallbacks: Array<() => void> = [];
	private closeCallbacks: Array<() => void> = [];

	// Estructura para almacenar múltiples intervalos y callbacks
	private activeIntervals: Array<{ id: number | null, callback: () => void, intervalMs: number }> = [];

	// Elemento del título del chat para poder actualizarlo
	private titleElement: HTMLElement | null = null;
	private subtitleElement: HTMLElement | null = null;

	private typingIndicator: HTMLElement | null = null;

	private lastMessageDate: string | null = null;

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

		// Si se pasa un containerId, se obtiene ese contenedor; si no, ya veremos si creamos el widget.
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
	 * Si la opción widget está activa o no se pasa containerId,
	 * creamos un contenedor propio en el body.
	 */
	public init(): void {
		if (!this.container || this.options.widget) {
			// Crear un host para el Shadow DOM
			const shadowHost = document.createElement('div');
			shadowHost.classList.add('chat-widget-host');
			// Adjuntar al body
			document.body.appendChild(shadowHost);
			// Crear el shadow root
			const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
			// Crear el contenedor principal dentro del shadow root
			this.container = document.createElement('div');
			this.container.classList.add('chat-widget');
			if (this.options.widget) {
				this.container.classList.add('chat-widget-fixed');
			}
			// Ocultar el chat por defecto al inicializarlo (establecer explícitamente)
			this.container.style.display = 'none';
			this.container.style.opacity = '0';
			this.container.style.transform = 'translateY(20px)';

			// Asegurar que el chat comience oculto desde el principio, sin posibilidad de verse
			this.container.setAttribute('data-initial-state', 'hidden');

			console.log("Chat inicializado con estado: oculto");
			shadowRoot.appendChild(this.container);

			// Añadir encabezado del chat
			const headerEl = document.createElement('div');
			headerEl.className = 'chat-header';

			const titleEl = document.createElement('div');
			titleEl.className = 'chat-header-title';

			// Mostrar título simplificado sin indicador de estado
			titleEl.textContent = 'Chat';
			this.titleElement = titleEl; // Guardar referencia

			// Añadir subtítulo con nombre del asesor
			const subtitleEl = document.createElement('div');
			subtitleEl.className = 'chat-header-subtitle';
			subtitleEl.textContent = 'Atención personalizada';
			this.subtitleElement = subtitleEl; // Guardar referencia
			titleEl.appendChild(subtitleEl);

			headerEl.appendChild(titleEl);

			const actionsEl = document.createElement('div');
			actionsEl.className = 'chat-header-actions';

			const closeBtn = document.createElement('button');
			closeBtn.className = 'chat-close-btn';
			closeBtn.setAttribute('aria-label', 'Cerrar chat');
			closeBtn.addEventListener('click', () => {
				this.hide();
			});

			actionsEl.appendChild(closeBtn);
			headerEl.appendChild(actionsEl);

			this.container.appendChild(headerEl);

			// Inyectar el CSS dentro del shadow root
			const style = document.createElement('style');
			style.textContent = `
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
				:host { all: initial; font-family: 'Inter', sans-serif; }

				/* Fondo degradado premium para el área de mensajes */
				.chat-widget {
					box-shadow: 0 8px 48px 0 rgba(0,0,0,0.22), 0 1.5px 8px 0 rgba(0,0,0,0.10);
					border-radius: 20px;
					overflow: hidden;
					background: linear-gradient(135deg, #f7faff 0%, #e3e9f6 100%);
					font-family: 'Inter', sans-serif;
					display: flex;
					flex-direction: column;
					transition: box-shadow 0.3s cubic-bezier(0.175,0.885,0.32,1.275);
				}

				.chat-widget:focus-within {
					box-shadow: 0 12px 64px 0 rgba(0,0,0,0.28), 0 2px 12px 0 rgba(0,0,0,0.13);
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
				
				/* Cabecera del chat */
				.chat-header {
					background: linear-gradient(145deg, #0084ff 60%, #00c6fb 100%);
					color: #fff;
					padding: 18px 20px 14px 20px;
					display: flex;
					align-items: center;
					justify-content: space-between;
					border-top-left-radius: 20px;
					border-top-right-radius: 20px;
					box-shadow: 0 2px 8px rgba(0,132,255,0.08);
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
				
				/* Indicador de estado online del comercial */
				.chat-online-indicator {
					display: inline-flex;
					align-items: center;
					gap: 6px;
				}
				
				.chat-status-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					display: inline-block;
					transition: background-color 0.3s ease;
				}
				
				.chat-status-dot.online {
					background-color: #00d26a;
					box-shadow: 0 0 0 2px rgba(0, 210, 106, 0.3);
				}
				
				.chat-status-dot.offline {
					background-color: #8a9aa9;
					box-shadow: 0 0 0 2px rgba(138, 154, 169, 0.3);
				}
				
				.chat-header-subtitle {
					font-size: 13px;
					font-weight: 400;
					opacity: 0.92;
					margin-top: 2px;
					color: #e3f2fd;
				}
				
				.chat-header-actions {
					display: flex;
					gap: 10px;
				}
				
				.chat-close-btn {
					background: transparent;
					border: none;
					color: white;
					cursor: pointer;
					width: 24px;
					height: 24px;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0;
					opacity: 0.8;
					transition: opacity 0.2s;
				}
				
				.chat-close-btn:hover {
					opacity: 1;
				}
				
				.chat-close-btn::before {
					content: '';
					display: block;
					width: 16px;
					height: 16px;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E");
					background-repeat: no-repeat;
					background-position: center;
				}
				
				/* Contenedor de mensajes */
				.chat-messages {
					display: flex;
					flex-direction: column;
					flex: 1;
					overflow-y: auto;
					padding: 18px 16px 12px 16px;
					background: linear-gradient(120deg, #f7faff 60%, #e3e9f6 100%);
					scroll-behavior: smooth;
					transition: background 0.3s;
				}
				
				.chat-messages-bottom { 
					margin-top: auto; 
				}
				
				/* Estilos de los mensajes */
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
				
				.chat-message-time {
					font-size: 11px;
					color: #8a9aa9;
					margin-top: 4px;
					opacity: 0.8;
				}
				
				.chat-message-user-wrapper {
					align-self: flex-end;
				}
				
				.chat-message-user {
					background: linear-gradient(145deg, #0084ff 70%, #00c6fb 100%);
					color: #fff;
					border-bottom-right-radius: 8px;
					box-shadow: 0 2px 8px rgba(0,132,255,0.08);
					position: relative;
					overflow: hidden;
				}

				.chat-message-user:active::after {
					content: '';
					position: absolute;
					top: 50%;
					left: 50%;
					width: 120%;
					height: 120%;
					background: rgba(255,255,255,0.18);
					border-radius: 50%;
					transform: translate(-50%, -50%) scale(0);
					animation: ripple 0.5s linear;
					pointer-events: none;
				}

				@keyframes ripple {
					to {
						transform: translate(-50%, -50%) scale(1);
						opacity: 0;
					}
				}
				
				.chat-message-user + .chat-message-time {
					text-align: right;
				}
				
				.chat-message-other-wrapper {
					align-self: flex-start;
					display: flex;
					gap: 8px;
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
				
				.chat-avatar img {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					object-fit: cover;
				}
				
				.chat-message-other { 
					background: #fff; 
					color: #333;
					border: 1px solid #e1e9f1;
					border-bottom-left-radius: 4px;
				}
				
				/* Contenedor de input */
				.chat-input-container { 
					display: flex; 
					align-items: center; 
					padding: 12px 16px; 
					background: #fff; 
					position: relative;
					border-top: 1px solid #e1e9f1;
					gap: 8px; /* Espacio consistente entre elementos */
				}
				
				.chat-input-field {
					flex: 1; /* Ocupa todo el espacio disponible */
					padding: 10px 14px;
					border: 1.5px solid #e1e9f1;
					border-radius: 24px;
					font-size: 15px;
					outline: none;
					transition: border-color 0.2s, box-shadow 0.2s;
					font-family: 'Inter', sans-serif;
					background: #f7faff;
					color: #222;
					min-height: 20px; /* Altura mínima consistente */
					box-sizing: border-box;
				}
				
				.chat-input-field:focus {
					border-color: #0084ff;
					box-shadow: 0 0 0 2px #cce6ff;
				}
				
				.chat-send-btn {
					flex-shrink: 0;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					background: transparent;
					color: #000;
					border: none;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: transform 0.18s, box-shadow 0.18s;
					box-sizing: border-box;
					overflow: visible;
					padding: 0;
					box-shadow: none;
					position: relative;
				}
				
				.chat-send-btn:active {
					transform: scale(0.96);
				}
				
				.chat-send-btn:hover {
					transform: scale(1.07);
				}
				
				.chat-send-btn::before {
					content: '';
					display: block;
					width: 24px;
					height: 24px;
					margin: auto;
					background-image: url("data:image/svg+xml,%3Csvg width='24px' height='24px' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' color='%23666666' stroke-width='1.5'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='%23666666'%3E%3C/path%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
				}
				
				/* Animaciones de entrada */
				@keyframes slideInUp {
					from { transform: translateY(20px); opacity: 0; }
					to { transform: translateY(0); opacity: 1; }
				}
				
				.chat-widget-fixed {
					animation: slideInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
					}
					
				/* Indicador de escritura */
				.chat-typing-indicator {
					display: flex;
					align-items: center;
					margin-top: 8px;
					margin-bottom: 16px;
					max-width: 100px;
					align-self: flex-start;
				}
				
				.chat-typing-avatar {
					width: 28px;
					height: 28px;
					border-radius: 50%;
					background-color: #e1e9f1;
					margin-right: 8px;
					flex-shrink: 0;
				}
				
				.chat-typing-bubble {
					background-color: #f1f3f5;
					padding: 10px 14px;
					border-radius: 18px;
					position: relative;
					display: flex;
					align-items: center;
					border: 1px solid #e1e9f1;
				}
				
				.chat-typing-dot {
					width: 8px;
					height: 8px;
					background-color: #adb5bd;
					border-radius: 50%;
					margin: 0 2px;
					animation: typingAnimation 1.2s infinite ease-in-out;
				}
				
				.chat-typing-dot:nth-child(1) { animation-delay: 0s; }
				.chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
				chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
				
				@keyframes typingAnimation {
					0%, 60%, 100% { transform: translateY(0); }
					30% { transform: translateY(-4px); }
					}
					
				/* Animaciones para los mensajes */
				@keyframes fadeInRight {
					from { transform: translateX(20px); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				
				@keyframes fadeInLeft {
					from { transform: translateX(-20px); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				
				.chat-message-user-wrapper {
					animation: fadeInRight 0.3s ease forwards;
				}
				
				.chat-message-other-wrapper {
					animation: fadeInLeft 0.3s ease forwards;
					}
					
				/* Footer del chat */
				.chat-footer {
					padding: 10px 18px;
					background: linear-gradient(90deg, #f7faff 80%, #e3e9f6 100%);
					border-top: 1.5px solid #e1e9f1;
					font-size: 13px;
					color: #8a9aa9;
					text-align: center;
					display: flex;
					align-items: center;
					justify-content: center;
					letter-spacing: 0.01em;
				}
				
				.chat-unread-badge {
					position: fixed;
					top: calc(100% - 90px);
					right: 13px;
					min-width: 22px;
					height: 22px;
					background: linear-gradient(145deg, #ff5146, #e53a30);
					color: white;
					border-radius: 12px;
					font-size: 12px;
					font-weight: bold;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0 5px;
					box-sizing: border-box;
					border: 2px solid white;
					z-index: 2147483647;
					box-shadow: 0 2px 8px rgba(255,65,54,0.3);
					pointer-events: none;
					transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
					animation: bounceIn 0.5s;
				}
				.chat-unread-badge.hidden {
					transform: scale(0);
					opacity: 0;
					display: flex !important;
				}
				@keyframes pulse {
					0% { transform: scale(0.8); opacity: 0.7; }
					50% { transform: scale(1.3); opacity: 1; }
					80% { transform: scale(0.95); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
				@keyframes bounceIn {
					0% { transform: scale(0.5); opacity: 0.5; }
					60% { transform: scale(1.2); opacity: 1; }
					80% { transform: scale(0.95); }
					100% { transform: scale(1); }
				}
				
				.chat-attachment-btn::before {
					content: '';
					display: block;
					width: 20px;
					height: 20px;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
					margin: auto;
				}

				/* Estilos para mensajes del sistema */
				.chat-system-message-wrapper {
					align-self: center; /* Centrar el mensaje del sistema */
					max-width: 90%; /* Un poco más ancho para mensajes informativos */
					margin-top: 8px;
					margin-bottom: 8px;
				}

				.chat-system-message {
					background: #e9ecef; /* Un fondo neutro */
					color: #495057; /* Texto oscuro para legibilidad */
					border-radius: 8px; /* Bordes más suaves */
					font-size: 13px; /* Ligeramente más pequeño */
					text-align: center;
					font-style: italic;
					padding: 8px 12px; /* Añadido padding para que no se vea apretado */
				}
				/* Fin de estilos para mensajes del sistema */
				
				/* Contenedor de mensajes */
				.chat-messages { 
					display: flex; 
					flex-direction: column; 
					flex: 1; 
					overflow-y: auto; 
					padding: 16px; 
					background-color: #f7f9fc;
					scroll-behavior: smooth;
				}
				
				.chat-messages-bottom { 
					margin-top: auto; 
				}
				
				/* Estilos de los mensajes */
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
				
				.chat-message-time {
					font-size: 11px;
					color: #8a9aa9;
					margin-top: 4px;
					opacity: 0.8;
				}
				
				.chat-message-user-wrapper {
					align-self: flex-end;
				}
				
				.chat-message-user { 
					background: linear-gradient(145deg, #0084ff, #0062cc);
					color: #fff; 
					border-bottom-right-radius: 4px;
				}
				
				.chat-message-user + .chat-message-time {
					text-align: right;
				}
				
				.chat-message-other-wrapper {
					align-self: flex-start;
					display: flex;
					gap: 8px;
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
				
				.chat-avatar img {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					object-fit: cover;
				}
				
				.chat-message-other { 
					background: #fff; 
					color: #333;
					border: 1px solid #e1e9f1;
					border-bottom-left-radius: 4px;
				}
				
				/* Contenedor de input */
				.chat-input-container { 
					display: flex; 
					align-items: center; 
					padding: 12px 16px; 
					background: #fff; 
					position: relative;
					border-top: 1px solid #e1e9f1;
					gap: 8px; /* Espacio consistente entre elementos */
				}
				
				.chat-input-field { 
					flex: 1; /* Ocupa todo el espacio disponible */
					padding: 10px 14px;
					border: 1px solid #e1e9f1; 
					border-radius: 24px; 
					font-size: 14px;
					outline: none;
					transition: border-color 0.2s;
					font-family: 'Inter', sans-serif;
					min-height: 20px; /* Altura mínima consistente */
					box-sizing: border-box;
				}
				
				.chat-input-field:focus {
					border-color: #0084ff;
				}
				
				.chat-send-btn {
					flex-shrink: 0;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					background: transparent;
					color: #000;
					border: none;
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: transform 0.2s;
					box-sizing: border-box;
					overflow: visible;
					padding: 0;
				}
				
				.chat-send-btn:hover {
					transform: scale(1.05);
				}
				
				.chat-send-btn::before {
					content: '';
					display: block;
					width: 24px;
					height: 24px;
					margin: auto;
					background-image: url("data:image/svg+xml,%3Csvg width='24px' height='24px' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' color='%23666666' stroke-width='1.5'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z' fill='%23666666'%3E%3C/path%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
				}
				
				/* Animaciones de entrada */
				@keyframes slideInUp {
					from { transform: translateY(20px); opacity: 0; }
					to { transform: translateY(0); opacity: 1; }
				}
				
				.chat-widget-fixed {
					animation: slideInUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
					}
					
				/* Indicador de escritura */
				.chat-typing-indicator {
					display: flex;
					align-items: center;
					margin-top: 8px;
					margin-bottom: 16px;
					max-width: 100px;
					align-self: flex-start;
				}
				
				.chat-typing-avatar {
					width: 28px;
					height: 28px;
					border-radius: 50%;
					background-color: #e1e9f1;
					margin-right: 8px;
					flex-shrink: 0;
				}
				
				.chat-typing-bubble {
					background-color: #f1f3f5;
					padding: 10px 14px;
					border-radius: 18px;
					position: relative;
					display: flex;
					align-items: center;
					border: 1px solid #e1e9f1;
				}
				
				.chat-typing-dot {
					width: 8px;
					height: 8px;
					background-color: #adb5bd;
					border-radius: 50%;
					margin: 0 2px;
					animation: typingAnimation 1.2s infinite ease-in-out;
				}
				
				.chat-typing-dot:nth-child(1) { animation-delay: 0s; }
				.chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
				chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
				
				@keyframes typingAnimation {
					0%, 60%, 100% { transform: translateY(0); }
					30% { transform: translateY(-4px); }
					}
					
				/* Animaciones para los mensajes */
				@keyframes fadeInRight {
					from { transform: translateX(20px); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				
				@keyframes fadeInLeft {
					from { transform: translateX(-20px); opacity: 0; }
					to { transform: translateX(0); opacity: 1; }
				}
				
				.chat-message-user-wrapper {
					animation: fadeInRight 0.3s ease forwards;
				}
				
				.chat-message-other-wrapper {
					animation: fadeInLeft 0.3s ease forwards;
					}
					
				/* Footer del chat */
				.chat-footer {
					padding: 8px 16px;
					background-color: #f7f9fc;
					border-top: 1px solid #e1e9f1;
					font-size: 12px;
					color: #8a9aa9;
					text-align: center;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.chat-footer-text {
					opacity: 0.8;
				}
				
				.chat-footer-text strong {
					font-weight: 500;
					color: #0084ff;
				}
				
				/* Botones adicionales para el input */
				.chat-input-actions {
					display: flex;
					align-items: center;
				}
				
				.chat-attachment-btn {
					flex-shrink: 0; /* No se encoge */
					width: 40px;
					height: 40px;
					background: transparent;
					border: none;
					cursor: pointer;
					opacity: 0.6;
					transition: opacity 0.2s, transform 0.2s;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
				}
				
				.chat-attachment-btn:hover {
					opacity: 1;
					transform: scale(1.05);
				}
				
				.chat-attachment-btn::before {
					content: '';
					display: block;
					width: 20px;
					height: 20px;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
					margin: auto;
					}
					
				/* Indicador de satisfacción */
				.chat-satisfaction {
					margin-top: 16px;
					padding: 12px 16px;
					background-color: #fff;
					border: 1px solid #e1e9f1;
					border-radius: 12px;
					font-size: 13px;
					display: flex;
					flex-direction: column;
					gap: 10px;
					align-self: flex-start;
					box-shadow: 0 2px 8px rgba(0,0,0,0.05);
					max-width: 85%;
				}
				
				.chat-satisfaction-question {
					color: #5a6877;
					font-weight: 500;
				}
				
				.chat-satisfaction-options {
					display: flex;
					gap: 8px;
				}
				
				.chat-satisfaction-option {
					padding: 6px 12px;
					background-color: #f1f3f5;
					border: 1px solid #e1e9f1;
					border-radius: 16px;
					color: #5a6877;
					font-size: 12px;
					cursor: pointer;
					transition: all 0.2s;
				}
				
				.chat-satisfaction-option:hover {
					background-color: #e7f3ff;
					border-color: #0084ff;
					color: #0084ff;
				}
				
				/* Separador de fecha para mensajes */
				.chat-date-separator {
					text-align: center;
					margin: 16px 0;
					position: relative;
					font-size: 12px;
					color: #8a9aa9;
				}
				
				.chat-date-separator::before {
					content: '';
					position: absolute;
					top: 50%;
					left: 0;
					right: 0;
					height: 1px;
					background-color: #e1e9f1;
					z-index: 1;
				}
				
				.chat-date-text {
					position: relative;
					z-index: 2;
					background-color: #f7f9fc;
					padding: 0 10px;
					display: inline-block;
				}
			`;
			shadowRoot.appendChild(style);
		} else {
			if (!this.container || this.options.widget) {
				this.container = document.createElement('div');
				this.container.classList.add('chat-widget');
				document.body.appendChild(this.container);

				// Configuramos el widget si así se requiere
				if (this.options.widget) {
					this.container.classList.add('chat-widget-fixed');
				}
			}
		}

		// Creamos un contenedor para mensajes con scroll vertical
		const containerMessages = document.createElement('div');
		containerMessages.className = 'chat-messages';
		this.container.appendChild(containerMessages);
		this.containerMessages = containerMessages;

		// Bloque inferior para "empujar" mensajes hacia arriba
		const div = document.createElement('div');
		div.className = 'chat-messages-bottom';
		this.containerMessages.appendChild(div);

		// Agregar footer con información
		const footerEl = document.createElement('div');
		footerEl.className = 'chat-footer';

		const footerText = document.createElement('div');
		footerText.className = 'chat-footer-text';
		footerText.innerHTML = 'Equipo de atención al cliente';
		footerEl.appendChild(footerText);

		this.container.appendChild(footerEl);

		// Estilo general - MANTENER OCULTO HASTA QUE SE LLAME EXPLÍCITAMENTE A show()
		this.container.style.display = 'none'; // Cambio crítico: mantener oculto
		this.container.style.flexDirection = 'column';
		this.container.style.gap = '0'; // Cambio a 0 para evitar espacios entre secciones

		// Agregar bandera para indicar que el contenido está listo pero no debe mostrarse
		this.container.setAttribute('data-content-ready', 'true');

		// --- Scroll infinito: detecta scroll top ---
		this.containerMessages.addEventListener('scroll', () => {
			// Si el usuario llegó al tope (scrollTop == 0) y tenemos index
			if (this.containerMessages && this.containerMessages.scrollTop === 0 && this.currentIndex) {
				// Cargar más mensajes antiguos
				this.loadOlderMessages();
			}
		});

		// Inicializar el chat de forma lazy - solo cargar contenido cuando se muestre por primera vez
		this.initializeChatContent();
	}

	/**
	 * Agrega un mensaje de bienvenida al chat solo si no hay mensajes existentes
	 */
	private addWelcomeMessage(): void {
		// Verificamos primero si ya hay mensajes en el chat
		// Buscar si hay algún mensaje real (excluir elementos que no son mensajes como separadores de fecha)
		const hasMessages = this.containerMessages &&
			Array.from(this.containerMessages.children).some(el =>
				el.classList && (
					el.classList.contains('chat-message-user-wrapper') ||
					el.classList.contains('chat-message-other-wrapper')
				)
			);

		// Solo mostramos el mensaje de bienvenida si no hay mensajes existentes
		if (!hasMessages) {
			const welcomeText = "¡Hola! 👋 Bienvenido a nuestro servicio de atención al cliente. Estoy aquí para ayudarte con cualquier consulta que tengas. Por favor, escribe tu pregunta y un asesor humano te responderá en breve.";

			this.addMessage(welcomeText, 'other');
		}
	}
	/**
	 * Establece el ID del chat actual.
	 * @param chatId ID del chat
	 */
	public setChatId(chatId: string): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		
		// Si cambia el chat ID, debemos resetear el estado de carga de mensajes
		if (this.chatId !== chatId) {
			this.messagesLoaded = false;
			this.lastKnownChatStatus = null; // Resetear el estado conocido al cambiar de chat
			this.lastNotificationType = null; // Resetear las notificaciones al cambiar de chat
		}
		
		this.chatId = chatId;
		this.container.setAttribute('data-chat-id', chatId);
	}

	/**
	 * Devuelve el ID del chat actual.
	 * @returns chatId
	 */

	public getChatId(): string | null {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		return this.chatId;
	}

	/**
	 * Renderiza un mensaje (alias de addMessage).
	 * @param params Parámetros del mensaje
	 */
	public renderChatMessage(params: { text: string; sender: Sender; timestamp?: number; senderId?: string }): void {
		const { text, sender, timestamp, senderId } = params;
		this.addMessage(text, sender, timestamp, senderId);

		// Reconstruir los separadores de fecha después de añadir un mensaje
		this.rebuildDateSeparators();

		// DESACTIVADO TEMPORALMENTE: Indicador de satisfacción del cliente
		// Si es un mensaje del operador (no del usuario),
		// ocasionalmente mostrar el indicador de satisfacción
		/*
		if (sender === 'other') {
			// Mostrar el indicador con una probabilidad del 20%
			if (Math.random() < 0.2) {
				setTimeout(() => {
					this.showSatisfactionIndicator();
				}, 1000);
			}
		}
		*/
	}

	/**
	 * Carga inicial de mensajes desde el servidor (los más recientes).
	 * @param chatId ID del chat
	 * @param limit  cuántos mensajes traer
	 */
	public async loadInitialMessages(limit = 20): Promise<void> {
		if (!this.containerMessages) return;
		if (!this.chatId) {
			throw new Error('No se ha establecido un chatId');
		}
		const chatId = this.chatId;

		// Iniciar la carga de mensajes y procesar el token en paralelo
		const messagePromise = fetchMessages(chatId, null, limit);

		// Extraer el ID de usuario del token mientras se cargan los mensajes
		let user = '';
		try {
			const accessToken = localStorage.getItem('accessToken') || '';
			if (accessToken) {
				const payload = JSON.parse(atob(accessToken.split('.')[1]));
				user = payload.sub; // ID del usuario
			}
		} catch (tokenErr) {
			console.warn("Error al procesar el token de acceso:", tokenErr);
		}

		try {
			// Esperar por los mensajes
			const data = await messagePromise;

			// Guardamos el index para futuras peticiones (mensajes antiguos)
			this.currentIndex = data.cursor || null;

			// Renderizamos los mensajes (los más recientes)
			if (data.messages && data.messages.length > 0) {
				const reversedMessages = [...data.messages].reverse(); // Invertimos para mostrar los más nuevos al final

				// Crear un fragmento para renderizar todos los mensajes de una vez (mejor rendimiento)
				const batch = reversedMessages.map(msg => {
					const sender: Sender = (user && msg.senderId.includes(user)) ? 'user' : 'other';
					return {
						text: msg.content,
						sender,
						timestamp: msg.createdAt, // Usar el timestamp de creación del mensaje
						senderId: msg.senderId // Incluir el ID del remitente
					};
				});

				// Renderizar mensajes en lote
				batch.forEach(item => this.renderChatMessage(item));

				// Reconstruir los separadores de fecha después de cargar mensajes
				this.rebuildDateSeparators();

				// Ajustar scroll al final (donde están los más nuevos)
				this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
			}
		} catch (err) {
			console.error("Error cargando mensajes iniciales:", err);
		}
	}

	/**
	 * Scroll hacia abajo (último mensaje).
	 * @param scrollToBottom
	 */
	public scrollToBottom(scrollToBottom: boolean): void {
		if (!this.containerMessages) return;
		if (scrollToBottom) {
			this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
		} else {
			this.containerMessages.scrollTop = 0;
		}
	}

	/**
	 * Cuando hacemos scroll hacia arriba, cargamos los mensajes "más antiguos".
	 */
	private async loadOlderMessages(): Promise<void> {
		if (!this.containerMessages || !this.currentIndex) return;

		// Guardamos la posición inicial para restaurarla
		const oldScrollHeight = this.containerMessages.scrollHeight;
		const oldScrollTop = this.containerMessages.scrollTop;

		try {
			const chatId = this.getChatId();
			if (!chatId) {
				throw new Error('No se ha establecido un chatId');
			}
			const data = await fetchMessages(chatId, this.currentIndex, 20);

			// Actualizamos el index para la siguiente carga (si hay más)
			this.currentIndex = data.cursor || null;

			// Extraer el ID de usuario del token
			let user = '';
			try {
				const accessToken = localStorage.getItem('accessToken') || '';
				if (accessToken) {
					const payload = JSON.parse(atob(accessToken.split('.')[1]));
					user = payload.sub; // ID del usuario
				}
			} catch (tokenErr) {
				console.warn("Error al procesar el token de acceso para mensajes antiguos:", tokenErr);
			}

			// "Prepend" de mensajes antiguos
			for (const msg of data.messages) {
				const sender: Sender = (user && msg.senderId.includes(user)) ? "user" : "other";
				this.prependMessage(msg.content, sender, msg.createdAt, msg.senderId);
			}

			// Reconstruir los separadores de fecha después de cargar mensajes antiguos
			this.rebuildDateSeparators();

			// Restaurar la posición del scroll para que no se mueva de golpe
			const newScrollHeight = this.containerMessages.scrollHeight;
			this.containerMessages.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
		} catch (err) {
			console.error("Error cargando mensajes antiguos:", err);
		}
	}

	/**
	 * Agrega un mensaje al final de la lista
	 */
	private addMessage(text: string, sender: Sender, timestamp?: number, senderId?: string): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		// Usar el timestamp si se proporciona, de lo contrario usar la fecha actual
		const messageDate = timestamp ? new Date(timestamp) : new Date();

		// Añadir separador de fecha si es necesario
		this.addDateSeparatorIfNeeded(messageDate);

		// Crear y añadir el mensaje
		const messageDiv = this.createMessageDiv(text, sender, timestamp, senderId);
		this.containerMessages.appendChild(messageDiv);

		// Scroll al final
		this.scrollToBottom(true);
	}

	/**
	 * Envía un mensaje automático informando que el comercial no está disponible
	 * @param commercialName Nombre del comercial que se desconectó
	 * @param isInitialLoad Si es la primera carga (true) o una desconexión en tiempo real (false)
	 */
	private sendOfflineNotificationMessage(commercialName: string, isInitialLoad: boolean = false): void {
		let offlineMessage: string;
		
		if (isInitialLoad) {
			offlineMessage = `${commercialName} no está disponible en este momento. Te responderá tan pronto como esté online.`;
		} else {
			offlineMessage = `${commercialName} se ha desconectado temporalmente. Te responderá tan pronto como esté disponible nuevamente.`;
		}
		
		console.log("Enviando mensaje automático de desconexión:", offlineMessage);
		
		// Usar el método existente para agregar mensaje del sistema
		this.addSystemMessage(offlineMessage);
	}

	/**
	 * Envía un mensaje automático informando que el comercial se ha reconectado
	 * @param commercialName Nombre del comercial que se reconectó
	 */
	private sendOnlineNotificationMessage(commercialName: string): void {
		const onlineMessage = `${commercialName} se ha reconectado y está disponible para responder tus preguntas.`;
		
		console.log("Enviando mensaje automático de reconexión:", onlineMessage);
		
		// Usar el método existente para agregar mensaje del sistema
		this.addSystemMessage(onlineMessage);
	}

	/**
	 * Agrega un mensaje del sistema al chat.
	 * Estos mensajes se utilizan para notificaciones o información importante.
	 * @param text Texto del mensaje del sistema
	 */
	public addSystemMessage(text: string): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}

		// Añadir separador de fecha si es necesario
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
	 * Inserta un mensaje al principio de la lista (para mensajes antiguos)
	 * @param text Texto del mensaje
	 * @param sender Remitente del mensaje
	 * @param timestamp Timestamp de creación del mensaje en milisegundos
	 * @param senderId ID del remitente del mensaje
	 */
	private prependMessage(text: string, sender: Sender, timestamp?: number, senderId?: string): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}
		const messageDiv = this.createMessageDiv(text, sender, timestamp, senderId);

		if (this.containerMessages.firstChild) {
			this.containerMessages.insertBefore(messageDiv, this.containerMessages.firstChild);
		} else {
			// Si no hay nada, es equivalente a un addMessage
			this.containerMessages.appendChild(messageDiv);
		}
	}

	/**
	 * Crea un nodo <div> con estilos de mensaje y contenido
	 * @param text Texto del mensaje
	 * @param sender Remitente del mensaje (user/other)
	 * @param timestamp Timestamp de creación del mensaje en milisegundos
	 * @param senderId ID del remitente del mensaje para obtener información del participante
	 */
	private createMessageDiv(text: string, sender: Sender, timestamp?: number, senderId?: string): HTMLDivElement {
		// Contenedor principal del mensaje
		const wrapperDiv = document.createElement('div');
		wrapperDiv.classList.add('chat-message-wrapper');

		// Si hay timestamp, lo guardamos como atributo data para referencia futura
		if (timestamp) {
			wrapperDiv.setAttribute('data-timestamp', timestamp.toString());
		}

		// Configuración según el remitente
		if (sender === 'user') {
			// Mensaje del usuario (derecha)
			wrapperDiv.classList.add('chat-message-user-wrapper');

			// Mensaje con texto
			const messageDiv = document.createElement('div');
			messageDiv.classList.add('chat-message', 'chat-message-user');
			messageDiv.textContent = text;
			wrapperDiv.appendChild(messageDiv);

			// Hora del mensaje
			const timeDiv = document.createElement('div');
			timeDiv.classList.add('chat-message-time');
			// Usar el timestamp si se proporciona, de lo contrario usar la fecha actual
			timeDiv.textContent = this.formatTime(timestamp ? new Date(timestamp) : new Date());
			wrapperDiv.appendChild(timeDiv);

		} else {
			// Mensaje del asesor (izquierda)
			wrapperDiv.classList.add('chat-message-other-wrapper');

			// Avatar del asesor con iniciales
			const avatarDiv = document.createElement('div');
			avatarDiv.classList.add('chat-avatar');

			// Añadir iniciales del asesor basadas en el participante real
			const participantInitials = this.getParticipantInitials(senderId || '');
			avatarDiv.textContent = participantInitials;
			avatarDiv.style.display = 'flex';
			avatarDiv.style.alignItems = 'center';
			avatarDiv.style.justifyContent = 'center';
			avatarDiv.style.color = '#0062cc';
			avatarDiv.style.fontWeight = '600';
			avatarDiv.style.fontSize = '10px';

			wrapperDiv.appendChild(avatarDiv);

			// Contenedor para mensaje y tiempo
			const contentDiv = document.createElement('div');

			// Añadir nombre real del participante
			const nameDiv = document.createElement('div');
			nameDiv.classList.add('chat-message-name');
			const participantName = this.getParticipantName(senderId || '');
			nameDiv.textContent = participantName;
			nameDiv.style.fontSize = '11px';
			nameDiv.style.color = '#5a6877';
			nameDiv.style.marginBottom = '3px';
			nameDiv.style.fontWeight = '500';
			contentDiv.appendChild(nameDiv);

			// Mensaje con texto
			const messageDiv = document.createElement('div');
			messageDiv.classList.add('chat-message', 'chat-message-other');
			messageDiv.textContent = text;
			contentDiv.appendChild(messageDiv);

			// Hora del mensaje
			const timeDiv = document.createElement('div');
			timeDiv.classList.add('chat-message-time');
			// Usar el timestamp si se proporciona, de lo contrario usar la fecha actual
			timeDiv.textContent = this.formatTime(timestamp ? new Date(timestamp) : new Date());
			contentDiv.appendChild(timeDiv);

			wrapperDiv.appendChild(contentDiv);
		}

		return wrapperDiv;
	}

	/**
	 * Formatea la hora para mostrarla en los mensajes
	 */
	private formatTime(date: Date): string {
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	public hide(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}

		// Si ya está oculto, no necesitamos hacer nada
		if (this.container.style.display === 'none') {
			return;
		}

		// Añadir animación de salida
		this.container.style.transform = 'translateY(20px)';
		this.container.style.opacity = '0';

		// Ocultar después de que termine la animación
		setTimeout(() => {
			this.container!.style.display = 'none';

			// Limpia todos los intervalos activos
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

		// Primero mostrar el contenedor (pero transparente)
		this.container.style.display = 'flex';

		// Forzar un reflow para que la animación funcione
		this.container.offsetHeight;

		// Animar entrada
		this.container.style.opacity = '1';
		this.container.style.transform = 'translateY(0)';

		// Cargar contenido del chat si es la primera vez que se muestra
		this.loadChatContent();

		// Actualizar detalles del chat para información en tiempo real
		this.refreshChatDetails();

		this.scrollToBottom(true);

		// Inicia todos los intervalos configurados
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

		// Si está oculto, lo mostramos con animación
		if (this.container.style.display === 'none') {
			this.show();
		} else {
			// Si está visible, lo ocultamos con animación
			this.hide();
		}
	}

	public getOptions(): ChatUIOptions {
		return this.options;
	}

	/**
	 * Verifica si el chat está actualmente visible
	 * @returns boolean true si el chat está visible, false si está oculto
	 */
	public isVisible(): boolean {
		if (!this.container) return false;
		return this.container.style.display !== 'none';
	}

	/**
	 * Suscribe un callback al evento de apertura del chat.
	 */
	public onOpen(callback: () => void): void {
		this.openCallbacks.push(callback);
	}

	/**
	 * Suscribe un callback al evento de cierre del chat.
	 */
	public onClose(callback: () => void): void {
		this.closeCallbacks.push(callback);
	}

	/**
	 * Permite registrar múltiples callbacks periódicos mientras el chat está activo.
	 * @param callback Función a ejecutar
	 * @param intervalMs Intervalo en milisegundos (por defecto 5000ms)
	 */
	public onActiveInterval(callback: () => void, intervalMs: number = 5000): void {
		this.activeIntervals.push({ id: null, callback, intervalMs });
	}

	/**
	 * Actualiza la información de un participante específico
	 * Útil para actualizaciones en tiempo real (ej: estado de typing, online status)
	 * @param participantId ID del participante a actualizar
	 * @param updates Objeto con las propiedades a actualizar
	 */
	public updateParticipant(participantId: string, updates: Partial<ChatParticipant>): void {
		if (!this.chatDetail) return;

		const participant = this.chatDetail.participants.find(p => p.id === participantId);
		if (participant) {
			Object.assign(participant, updates);
			this.updateChatHeader();

			console.log(`Participante ${participantId} actualizado:`, updates);
		}
	}

	/**
	 * Obtiene la información actual del chat con participantes
	 * @returns Detalles del chat o null si no está cargado
	 */
	public getChatDetail(): ChatDetail | null {
		return this.chatDetail;
	}

	/**
	 * Recarga los detalles del chat desde el servidor
	 */
	public async refreshChatDetails(): Promise<void> {
		await this.loadChatDetails();
	}

	/**
	 * Muestra un indicador de "escribiendo..."
	 * Este indicador permanecerá visible hasta que se llame a hideTypingIndicator().
	 * @param typingParticipantId ID del participante que está escribiendo (opcional)
	 */
	public showTypingIndicator(typingParticipantId?: string): void {
		if (!this.containerMessages) return;

		// Si ya hay un indicador visible, no hacer nada.
		if (this.typingIndicator) return;

		// Crear el indicador de escritura
		const indicator = document.createElement('div');
		indicator.className = 'chat-typing-indicator';

		// Avatar con iniciales del participante que está escribiendo
		const avatar = document.createElement('div');
		avatar.className = 'chat-typing-avatar';

		// Obtener iniciales reales del participante que está escribiendo
		const typingInitials = this.getParticipantInitials(typingParticipantId || '');
		avatar.textContent = typingInitials;
		avatar.style.display = 'flex';
		avatar.style.alignItems = 'center';
		avatar.style.justifyContent = 'center';
		avatar.style.color = '#0062cc';
		avatar.style.fontWeight = '600';
		avatar.style.fontSize = '10px';
		indicator.appendChild(avatar);

		// Burbuja con puntos
		const bubble = document.createElement('div');
		bubble.className = 'chat-typing-bubble';

		// Puntos animados
		for (let i = 0; i < 3; i++) {
			const dot = document.createElement('div');
			dot.className = 'chat-typing-dot';
			bubble.appendChild(dot);
		}

		indicator.appendChild(bubble);

		// Agregar al contenedor
		this.containerMessages.appendChild(indicator);
		this.typingIndicator = indicator; // Guardar referencia al indicador activo

		// Scroll para ver el indicador
		this.scrollToBottom(true);
	}

	/**
	 * Oculta el indicador de escritura
	 */
	public hideTypingIndicator(): void {
		if (this.typingIndicator && this.typingIndicator.parentNode) {
			this.typingIndicator.parentNode.removeChild(this.typingIndicator);
			this.typingIndicator = null;
		}
	}

	/**
	 * Actualiza las iniciales del indicador de escritura con información en tiempo real
	 * @param participantId ID del participante que está escribiendo
	 */
	public updateTypingIndicator(participantId: string): void {
		if (!this.typingIndicator) return;

		const avatar = this.typingIndicator.querySelector('.chat-typing-avatar');
		if (avatar) {
			const typingInitials = this.getParticipantInitials(participantId);
			avatar.textContent = typingInitials;
		}
	}

	// La implementación de isVisible() ya existe en la línea 1327

	/**
	 * Muestra un indicador de satisfacción del cliente
	 */
	public showSatisfactionIndicator(): void {
		if (!this.containerMessages) return;

		// Crear contenedor principal
		const container = document.createElement('div');
		container.className = 'chat-satisfaction';

		// Pregunta
		const question = document.createElement('div');
		question.className = 'chat-satisfaction-question';
		question.textContent = '¿Te ha sido útil la ayuda de nuestro asesor humano?';
		container.appendChild(question);

		// Opciones
		const options = document.createElement('div');
		options.className = 'chat-satisfaction-options';

		// Opciones: Sí, No
		const optionYes = document.createElement('div');
		optionYes.className = 'chat-satisfaction-option';
		optionYes.textContent = 'Sí, gracias';
		optionYes.addEventListener('click', () => {
			container.innerHTML = '<div class="chat-satisfaction-question">¡Gracias por tu feedback! Nos alegra haber podido ayudarte.</div>';
			setTimeout(() => {
				if (container.parentNode) {
					container.parentNode.removeChild(container);
				}
			}, 2000);
		});

		const optionNo = document.createElement('div');
		optionNo.className = 'chat-satisfaction-option';
		optionNo.textContent = 'No';
		optionNo.addEventListener('click', () => {
			container.innerHTML = '<div class="chat-satisfaction-question">Lamentamos no haber podido resolver tu consulta. Transmitiremos tu feedback al equipo.</div>';
			setTimeout(() => {
				if (container.parentNode) {
					container.parentNode.removeChild(container);
				}
			}, 2000);
		});

		options.appendChild(optionYes);
		options.appendChild(optionNo);
		container.appendChild(options);

		// Agregar al contenedor
		this.containerMessages.appendChild(container);
		this.scrollToBottom(true);
	}

	/**
	 * Inicializa el contenido del chat de forma lazy
	 * Solo se ejecuta cuando el chat se muestra por primera vez
	 */
	private async initializeChatContent(): Promise<void> {
		try {
			console.log("Inicializando contenido del chat...");
			const res = await startChat();
			console.log("Chat iniciado:", res);
			this.setChatId(res.id);

			// Cargar detalles del chat con participantes
			await this.loadChatDetails();

			// Registrar listeners de WebSocket para eventos del chat
			this.registerWebSocketListeners();

			// Marcar que el chat está listo para mostrar contenido
			this.container?.setAttribute('data-chat-initialized', 'true');

			// Si el chat está visible, cargar el contenido inmediatamente
			if (this.isVisible()) {
				this.loadChatContent();
			}
		} catch (err) {
			console.error("Error iniciando chat:", err);
		}
	}
	/**
	 * Carga los detalles del chat incluyendo participantes y actualiza la UI
	 */
	private async loadChatDetails(): Promise<void> {
		if (!this.chatId) return;
		
		try {
			console.log("Cargando detalles del chat...");
			this.chatDetail = await fetchChatDetail(this.chatId);
			console.log("Detalles del chat:", this.chatDetail);
			
			// Guardar el estado actual del chat para comparaciones futuras
			this.lastKnownChatStatus = this.chatDetail.status;
			console.log(`Estado actual del chat: ${this.lastKnownChatStatus}`);
			
			// Actualizar encabezado con información de participantes
			this.updateChatHeader();
			
			// Nota: checkInitialCommercialStatus se llamará desde loadChatContent 
			// después de cargar los mensajes para que aparezca al final
		} catch (error) {
			console.warn("Error al cargar detalles del chat:", error);
		}
	}

	/**
	 * Verifica el estado inicial de los comerciales y envía mensaje si están offline
	 * Este método debe llamarse después de cargar los mensajes iniciales
	 */
	private checkInitialCommercialStatus(): void {
		if (!this.chatDetail) return;
		
		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);
		
		// Si hay comerciales asignados y alguno está offline, enviar mensaje
		commercialParticipants.forEach(commercial => {
			if (!commercial.isOnline && this.lastNotificationType !== 'offline') {
				console.log(`Comercial ${commercial.name} está offline en la carga inicial`);
				// Programar el mensaje para que aparezca después de los mensajes existentes
				setTimeout(() => {
					this.sendOfflineNotificationMessage(commercial.name, true); // true = es carga inicial
					this.lastNotificationType = 'offline';
				}, 100); // Pequeño delay para asegurar que se ejecute después de cargar mensajes
			}
		});
	}

	/**
	 * Actualiza el encabezado del chat con información de los participantes
	 */
	private updateChatHeader(): void {
		if (!this.chatDetail || !this.titleElement || !this.subtitleElement) return;

		const commercialParticipants = this.chatDetail.participants.filter(p => p.isCommercial);
		const visitorParticipants = this.chatDetail.participants.filter(p => p.isVisitor);

		// Actualizar título según el estado del chat y número de comerciales
		if (this.chatDetail.status === 'pending' && commercialParticipants.length > 1) {
			// Chat pendiente con múltiples comerciales asignados
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = `Conectando con asesor (${commercialParticipants.length} disponibles)...`;
		} else if (this.chatDetail.status === 'pending' && commercialParticipants.length === 1) {
			// Chat pendiente con un solo comercial asignado
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = `Conectando con ${commercialParticipants[0].name}...`;
		} else if (commercialParticipants.length > 0) {
			// Chat activo con comercial asignado
			const advisor = commercialParticipants[0];
			
			// Solo mostrar estado online/offline cuando el chat está activo
			if (this.chatDetail.status === 'active') {
				// Crear el contenido del título con indicador de estado
				const titleWithIndicator = document.createElement('div');
				titleWithIndicator.className = 'chat-online-indicator';
				
				// Crear el punto indicador de estado
				const statusDot = document.createElement('span');
				statusDot.className = `chat-status-dot ${advisor.isOnline ? 'online' : 'offline'}`;
				
				// Crear el texto del título
				const titleText = document.createElement('span');
				titleText.textContent = `Chat con ${advisor.name}`;
				
				// Agregar elementos al contenedor
				titleWithIndicator.appendChild(statusDot);
				titleWithIndicator.appendChild(titleText);
				
				// Limpiar y agregar el nuevo contenido
				this.titleElement.innerHTML = '';
				this.titleElement.appendChild(titleWithIndicator);
				
				const onlineStatus = advisor.isOnline ? 'En línea' : 'Desconectado';
				const typingStatus = advisor.isTyping ? ' • Escribiendo...' : '';
				this.subtitleElement.textContent = `${onlineStatus}${typingStatus}`;
			} else {
				// Para otros estados que no sean 'active', mostrar solo el texto sin indicador
				this.titleElement.textContent = `Chat con ${advisor.name}`;
				const chatStatusText = this.chatDetail.status === 'inactive' ? 'Inactivo' : 
									   this.chatDetail.status === 'closed' ? 'Cerrado' : 
									   this.chatDetail.status === 'archived' ? 'Archivado' : 'Conectando...';
				this.subtitleElement.textContent = chatStatusText;
			}
		} else {
			// Chat sin comerciales asignados
			this.titleElement.textContent = 'Chat';
			this.subtitleElement.textContent = 'Buscando asesor disponible...';
		}

		// Log información de participantes para debugging
		console.log(`Chat ${this.chatDetail.id} - Participantes:`, {
			comerciales: commercialParticipants.length,
			visitantes: visitorParticipants.length,
			total: this.chatDetail.participants.length,
			estado: this.chatDetail.status,
			comercialOnline: commercialParticipants.length > 0 ? commercialParticipants[0].isOnline : null
		});
	}

	/**
	 * Carga el contenido del chat (mensajes de bienvenida e iniciales)
	 * Solo se ejecuta cuando el chat está visible y los mensajes no se han cargado previamente
	 */
	private async loadChatContent(): Promise<void> {
		if (!this.container?.getAttribute('data-chat-initialized')) {
			console.log("Chat no inicializado aún, esperando...");
			return;
		}

		// Si ya cargamos los mensajes previamente, evitamos volver a ejecutar la solicitud
		if (this.messagesLoaded) {
			console.log("Los mensajes ya fueron cargados previamente, omitiendo fetch...");
			return;
		}

		console.log("Cargando contenido del chat...");

		// Primero cargamos los mensajes iniciales
		try {
			await this.loadInitialMessages(20);

			// Marcar que los mensajes fueron cargados exitosamente
			this.messagesLoaded = true;

			// Después de cargar los mensajes, verificamos si debemos mostrar el mensaje de bienvenida
			this.addWelcomeMessage();
			
			// Verificar estado inicial de los comerciales si el chat está activo
			// Esto se hace al final para que el mensaje aparezca después de todos los mensajes existentes
			if (this.chatDetail && this.chatDetail.status === 'active') {
				this.checkInitialCommercialStatus();
			}
		} catch (error) {
			console.error("Error al cargar el contenido del chat:", error);
			// Si no pudimos cargar mensajes, mostramos el mensaje de bienvenida de todos modos
			this.addWelcomeMessage();
			
			// También verificar el estado de comerciales en caso de error
			if (this.chatDetail && this.chatDetail.status === 'active') {
				this.checkInitialCommercialStatus();
			}
		}
	}

	/**
	 * Fuerza la recarga de mensajes del chat incluso si ya fueron cargados previamente
	 * Útil cuando hay nuevos mensajes o cuando el usuario solicita explícitamente refrescar
	 * @param limit Cantidad de mensajes a cargar
	 */
	public async forceReloadMessages(limit: number = 20): Promise<void> {
		// Resetear el estado de carga de mensajes
		this.messagesLoaded = false;

		// Si el chat está visible, cargar los mensajes inmediatamente
		if (this.isVisible()) {
			await this.loadChatContent();
		}
	}

	/**
	 * Registra listeners para eventos WebSocket
	 */
	private registerWebSocketListeners(): void {
		// Obtener la instancia existente del WebSocket
		// Endpoint por defecto actualizado al dominio oficial en producción
		const webSocketEndpoint = localStorage.getItem('pixelWebSocketEndpoint') || 'wss://guiders.es';
		const webSocketClient = WebSocketClient.getInstance(webSocketEndpoint);

		if (!webSocketClient) {
			console.error("No se pudo obtener la instancia de WebSocketClient");
			return;
		}

		console.log("Registrando listener para evento chat:status-updated");

		// Registrar listener para el evento de cambio de estado del chat
		webSocketClient.addListener("chat:status-updated", (payload) => {
			console.log("Evento chat:status-updated recibido:", payload);
			const data = payload.data as {
				chatId: string;
				status:
				'active' |
				'inactive' |
				'closed' |
				'archived' |
				'pending';
			};
			
			// Solo actualizar si este es el chat actualmente abierto
			if (this.chatId && data.chatId === this.chatId) {
				console.log(`Estado del chat actualizado: ${this.lastKnownChatStatus || 'desconocido'} → ${data.status}`);
				
				// Si el estado anterior era pendiente y ahora es activo, actualizamos los detalles del chat
				const isPendingToActive = this.lastKnownChatStatus === 'pending' && data.status === 'active';
				
				// Detectar cualquier cambio de estado importante
				const isStatusChange = this.lastKnownChatStatus !== data.status;
				
				// Si es un cambio de pending a active o cualquier otro cambio de estado
				if (isPendingToActive || isStatusChange) {
					console.log("Cambio de estado importante detectado - Recargando detalles del chat");
					
					// Actualizar nuestro estado conocido inmediatamente para evitar múltiples actualizaciones
					this.lastKnownChatStatus = data.status;
					
					// Recargar los detalles del chat para reflejar los cambios
					this.loadChatDetails().then(() => {
						console.log("Detalles del chat actualizados después del cambio de estado");
						
						// Si cambió de pending a active, verificar estado de comerciales
						if (isPendingToActive && this.chatDetail && this.chatDetail.status === 'active') {
							console.log("Chat activado - verificando estado inicial de comerciales");
							// Verificar el estado de comerciales después de un pequeño delay
							setTimeout(() => {
								this.checkInitialCommercialStatus();
							}, 200);
						}
					});
				}
			}
		});

		// Registrar listener para cuando un nuevo participante se une al chat
		webSocketClient.addListener("chat:participant-joined", (payload) => {
			console.log("Evento chat:participant-joined recibido:", payload);

			const data = payload.data as {
				chatId: string;
				newParticipant: ChatParticipant;
			};

			// Solo actualizar si este es el chat actualmente abierto
			if (this.chatId && data.chatId === this.chatId) {
				console.log("Nuevo participante unido al chat:", data.newParticipant);

				// Verificar que tenemos detalles del chat cargados
				if (this.chatDetail) {
					// Añadir el nuevo participante a la lista de participantes
					this.chatDetail.participants.push(data.newParticipant);

					// Actualizar el encabezado para reflejar el nuevo participante
					this.updateChatHeader();

					console.log("Lista de participantes actualizada:", this.chatDetail.participants);
				} else {
					// Si no tenemos detalles del chat, cargarlos completamente
					this.loadChatDetails();
				}
			}
		});

		// Registrar listener para cuando un participante abandona el chat
		webSocketClient.addListener("chat:participant-left", (payload) => {
			console.log("Evento chat:participant-left recibido:", payload);

			const data = payload.data as {
				chatId: string;
				participantId: string;
			};

			// Solo actualizar si este es el chat actualmente abierto
			if (this.chatId && data.chatId === this.chatId && this.chatDetail) {
				console.log("Participante abandonó el chat:", data.participantId);

				// Filtrar la lista de participantes para eliminar al que se fue
				this.chatDetail.participants = this.chatDetail.participants.filter(
					participant => participant.id !== data.participantId
				);

				// Actualizar el encabezado para reflejar el cambio de participantes
				this.updateChatHeader();

				console.log("Lista de participantes actualizada:", this.chatDetail.participants);
			}
		});

		// Registrar listener para actualizaciones de participantes existentes
		webSocketClient.addListener("chat:participant-updated", (payload) => {
			console.log("Evento chat:participant-updated recibido:", payload);

			const data = payload.data as {
				chatId: string;
				participant: Partial<ChatParticipant> & { id: string };
			};

			// Solo actualizar si este es el chat actualmente abierto
			if (this.chatId && data.chatId === this.chatId && this.chatDetail) {
				console.log("Actualización de participante recibida:", data.participant);

				// Encontrar y actualizar el participante en la lista
				const participantIndex = this.chatDetail.participants.findIndex(
					p => p.id === data.participant.id
				);

				if (participantIndex !== -1) {
					// Actualizar el participante con los nuevos datos
					this.chatDetail.participants[participantIndex] = {
						...this.chatDetail.participants[participantIndex],
						...data.participant
					};

					// Actualizar el encabezado para reflejar cambios (online, typing, etc.)
					this.updateChatHeader();

					// Si está escribiendo, mostrar indicador
					if (data.participant.isTyping) {
						this.showTypingIndicator(data.participant.id);
					} else {
						this.hideTypingIndicator();
					}

					console.log("Participante actualizado:", this.chatDetail.participants[participantIndex]);
				}
			}
		});

		// Registrar listener para actualizaciones del estado online de los participantes
		webSocketClient.addListener("participant:online-status-updated", (payload) => {
			console.log("Evento participant:online-status-updated recibido:", payload);
			
			const data = payload.data as {
				isOnline: boolean;
				participantId: string;
			};
			
			// Solo actualizar si tenemos detalles del chat cargados
			if (this.chatDetail) {
				console.log(`Actualizando estado online del participante ${data.participantId}: ${data.isOnline}`);
				
				// Encontrar y actualizar el participante
				const participant = this.chatDetail.participants.find(p => p.id === data.participantId);
				if (participant) {
					// Guardar el estado anterior para detectar cambios
					const wasOnline = participant.isOnline;
					
					// Actualizar el estado online del participante
					participant.isOnline = data.isOnline;
					
					// Si es un participante comercial y el chat está activo
					if (participant.isCommercial && this.chatDetail.status === 'active') {
						console.log(`Participante comercial ${participant.name} está ahora ${data.isOnline ? 'online' : 'offline'}`);
						
						// Si el comercial se desconectó (pasó de online a offline), enviar mensaje automático
						if (wasOnline && !data.isOnline && this.lastNotificationType !== 'offline') {
							this.sendOfflineNotificationMessage(participant.name, false); // false = desconexión en tiempo real
							this.lastNotificationType = 'offline';
						}
						// Si el comercial se reconectó (pasó de offline a online), enviar mensaje de reconexión
						else if (!wasOnline && data.isOnline && this.lastNotificationType !== 'online') {
							this.sendOnlineNotificationMessage(participant.name);
							this.lastNotificationType = 'online';
						}
						
						// Actualizar el encabezado para reflejar el cambio
						this.updateChatHeader();
					}
				} else {
					console.warn(`No se encontró el participante con ID ${data.participantId}`);
				}
			}
		});
	}

	/**
	 * Agrega un separador de fecha si es necesario
	 * @param date Fecha a evaluar
	 */
	private addDateSeparatorIfNeeded(date: Date): void {
		if (!this.containerMessages) return;

		const dateStr = this.formatDate(date);

		// Si es el primer mensaje o la fecha es diferente a la última, añadir separador
		if (!this.lastMessageDate || this.lastMessageDate !== dateStr) {
			const separator = document.createElement('div');
			separator.className = 'chat-date-separator';
			separator.setAttribute('data-date', dateStr);

			const dateText = document.createElement('span');
			dateText.className = 'chat-date-text';
			dateText.textContent = dateStr;

			separator.appendChild(dateText);
			this.containerMessages.appendChild(separator);

			// Actualizar la última fecha
			this.lastMessageDate = dateStr;
		}
	}

	/**
	 * Formatea la fecha para el separador
	 */
	private formatDate(date: Date): string {
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const isToday = date.toDateString() === today.toDateString();
		const isYesterday = date.toDateString() === yesterday.toDateString();

		if (isToday) {
			return 'Hoy';
		} else if (isYesterday) {
			return 'Ayer';
		} else {
			const options: Intl.DateTimeFormatOptions = {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			};
			return date.toLocaleDateString('es-ES', options);
		}
	}

	/**
	 * Reconstruye todos los separadores de fecha en el chat
	 * Esta función debería llamarse después de cargar mensajes o cuando
	 * se realizan cambios importantes en la estructura del chat
	 */
	private rebuildDateSeparators(): void {
		if (!this.containerMessages) return;

		// Resetear el estado de la última fecha
		this.lastMessageDate = null;

		// Eliminar todos los separadores existentes
		const existingSeparators = this.containerMessages.querySelectorAll('.chat-date-separator');
		existingSeparators.forEach(sep => sep.parentNode?.removeChild(sep));

		// Ordenar los mensajes por fecha
		const messageWrappers = Array.from(this.containerMessages.querySelectorAll('.chat-message-wrapper'));

		// Si no hay mensajes, no hay nada que hacer
		if (messageWrappers.length === 0) return;

		// Para cada día, crear un separador antes del primer mensaje de ese día
		let currentDateStr: string | null = null;
		let insertPoint: HTMLElement | null = null;

		messageWrappers.forEach((wrapper) => {
			// Intentar obtener la fecha del mensaje de su atributo o timestamp
			const messageTime = wrapper.querySelector('.chat-message-time');
			if (!messageTime) return;

			// Para simplificar, usamos la fecha actual (en una implementación real,
			// deberías extraer la fecha real del mensaje)
			const messageDate = new Date();
			const messageDateStr = this.formatDate(messageDate);

			// Si es un nuevo día, insertar un separador
			if (messageDateStr !== currentDateStr) {
				currentDateStr = messageDateStr;

				// Crear nuevo separador
				const separator = document.createElement('div');
				separator.className = 'chat-date-separator';
				separator.setAttribute('data-date', messageDateStr);

				const dateText = document.createElement('span');
				dateText.className = 'chat-date-text';
				dateText.textContent = messageDateStr;

				separator.appendChild(dateText);

				// Insertar el separador antes del mensaje actual
				if (this.containerMessages) {
					this.containerMessages.insertBefore(separator, wrapper);
				}
			}
		});

		// Actualizar la última fecha conocida
		if (currentDateStr) {
			this.lastMessageDate = currentDateStr;
		}
	}

	/**
	 * Verifica si un participante es un bot basándose en su nombre
	 * @param participantName Nombre del participante
	 * @returns true si es un bot, false en caso contrario
	 */
	private isBot(participantName: string): boolean {
		const botKeywords = ['bot', 'chatbot', 'assistant', 'asistente', 'ia', 'ai', 'automático', 'virtual'];
		const lowerName = participantName.toLowerCase();
		return botKeywords.some(keyword => lowerName.includes(keyword));
	}

	/**
	 * Obtiene las iniciales de un participante basándose en su ID
	 * @param senderId ID del remitente del mensaje
	 * @returns Iniciales del participante
	 */
	private getParticipantInitials(senderId: string): string {
		// Si no hay senderId, es un mensaje automático del sistema (bot)
		if (!senderId) {
			return 'BOT';
		}

		if (!this.chatDetail) {
			console.warn('No se ha cargado el chat o no se proporcionó un ID de remitente válido', senderId);
			return 'BOT'; // Fallback por defecto para mensajes automáticos
		}

		const participant = this.chatDetail.participants.find(p => p.id === senderId);
		if (!participant) {
			console.warn(`No se encontró el participante con ID ${senderId}`);
			return 'BOT'; // Fallback si no se encuentra el participante (probablemente automático)
		}

		// Verificar si es un bot
		if (this.isBot(participant.name)) {
			return 'BOT';
		}

		// Generar iniciales del nombre
		const nameParts = participant.name.trim().split(' ');
		if (nameParts.length >= 2) {
			return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
		} else if (nameParts.length === 1) {
			return nameParts[0].substring(0, 2).toUpperCase();
		}

		return 'AH'; // Fallback
	}

	/**
	 * Obtiene el nombre de un participante basándose en su ID
	 * @param senderId ID del remitente del mensaje
	 * @returns Nombre del participante
	 */
	private getParticipantName(senderId: string): string {
		// Si no hay senderId, es un mensaje automático del sistema (bot)
		if (!senderId) {
			return 'Asistente Virtual';
		}

		if (!this.chatDetail) {
			return 'Asistente Virtual'; // Fallback por defecto para mensajes automáticos
		}

		const participant = this.chatDetail.participants.find(p => p.id === senderId);
		if (!participant) {
			return 'Asistente Virtual'; // Fallback si no se encuentra el participante (probablemente automático)
		}

		// Verificar si es un bot
		if (this.isBot(participant.name)) {
			return 'Asistente Virtual';
		}

		return participant.name;
	}
}

// -------------------------------------------------------------------
// ChatInputUI.ts (ejemplo mínimo)
// -------------------------------------------------------------------
export class ChatInputUI {
	private chat: ChatUI;
	private inputContainer: HTMLElement | null = null;
	private submitCallbacks: Array<(message: string) => void> = [];

	constructor(chat: ChatUI) {
		this.chat = chat;
	}

	public init(): void {
		// Por simplicidad, creamos un input text y lo pegamos debajo del chat.
		this.inputContainer = document.createElement('div');
		this.inputContainer.style.display = 'flex';
		this.inputContainer.style.padding = '5px';

		const input = document.createElement('input');
		input.type = 'text';
		input.style.flex = '1';
		input.placeholder = 'Escribe un mensaje...';

		const button = document.createElement('button');
		button.textContent = 'Enviar';

		button.addEventListener('click', () => {
			const msg = input.value.trim();
			if (msg) {
				this.submitCallbacks.forEach(cb => cb(msg));
				// Opcional, también podemos renderizarlo en el chat de inmediato
				this.chat.renderChatMessage({ text: msg, sender: 'user' });
				input.value = '';
			}
		});

		// EventListener para Enter
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				button.click();
			}
		});

		this.inputContainer.appendChild(input);
		this.inputContainer.appendChild(button);

		document.body.appendChild(this.inputContainer);
	}

	public onSubmit(callback: (message: string) => void): void {
		this.submitCallbacks.push(callback);
	}
}