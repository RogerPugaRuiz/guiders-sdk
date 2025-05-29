// chat-ui.ts

import { Message } from "../types";
import { startChat } from "../services/chat-service";
import { fetchMessages } from "../services/fetch-messages";

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

	// Callbacks para eventos de apertura y cierre
	private openCallbacks: Array<() => void> = [];
	private closeCallbacks: Array<() => void> = [];

	// Estructura para almacenar múltiples intervalos y callbacks
	private activeIntervals: Array<{ id: number | null, callback: () => void, intervalMs: number }> = [];

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
			
			// Añadir subtítulo con nombre del asesor
			const subtitleEl = document.createElement('div');
			subtitleEl.className = 'chat-header-subtitle';
			subtitleEl.textContent = 'Atención personalizada';
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
				
				/* Contenedor principal del chat */
				.chat-widget { 
					box-shadow: 0 5px 40px rgba(0,0,0,0.16); 
					border-radius: 16px; 
					overflow: hidden; 
					background: #fff;
					font-family: 'Inter', sans-serif;
					display: flex;
					flex-direction: column;
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
					background: linear-gradient(145deg, #0084ff, #0062cc);
					color: white;
					padding: 16px;
					display: flex;
					align-items: center;
					justify-content: space-between;
					border-top-left-radius: 16px;
					border-top-right-radius: 16px;
				}
				
				.chat-header-title {
					font-weight: 600;
					font-size: 16px;
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: 4px;
				}
				
				/* Se eliminó el indicador de status (punto verde) */
				
				.chat-header-subtitle {
					font-size: 12px;
					font-weight: 400;
					opacity: 0.9;
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
				}
				
				.chat-input-field { 
					flex-shrink: 1;
					padding: 10px 14px; 
					border: 1px solid #e1e9f1; 
					border-radius: 24px; 
					font-size: 14px;
					outline: none;
					transition: border-color 0.2s;
					font-family: 'Inter', sans-serif;
				}
				
				.chat-input-field:focus {
					border-color: #0084ff;
				}
				
				.chat-send-btn {
					flex-shrink: 0;
					width: 36px;
					height: 36px;
					border-radius: 50%;
					background: linear-gradient(145deg, #0084ff, #0062cc);
					color: white;
					border: none;
					cursor: pointer;
					margin-left: 8px;
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
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-send-icon lucide-send'%3E%3Cpath d='M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z'/%3E%3Cpath d='m21.854 2.147-10.94 10.939'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
					background-size: 24px 24px;
					margin: auto;
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
					margin-right: 10px;
				}
				
				.chat-attachment-btn {
					flex-shrink: 0;
					width: 30px;
					height: 30px;
					background: transparent;
					border: none;
					cursor: pointer;
					opacity: 0.6;
					transition: opacity 0.2s;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.chat-attachment-btn:hover {
					opacity: 1;
				}
				
				.chat-attachment-btn::before {
					content: '';
				 display: block;
				 width: 18px;
				 height: 18px;
				 background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E");
				 background-repeat: no-repeat;
				 background-position: center;
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
				}
				
				.chat-input-field { 
					flex-shrink: 0;
					width: calc(100% - 120px); /* Ajustar el ancho para el botón de enviar */
					padding: 10px 14px;
					border: 1px solid #e1e9f1; 
					border-radius: 24px; 
					font-size: 14px;
					outline: none;
					transition: border-color 0.2s;
					font-family: 'Inter', sans-serif;
				}
				
				.chat-input-field:focus {
					border-color: #0084ff;
				}
				
				.chat-send-btn {
					flex-shrink: 0;
					width: 40px;
					height: 40px;
					border-radius: 50%;
					background: linear-gradient(145deg, #0084ff, #0062cc);
					color: white;
					border: none;
					cursor: pointer;
					margin-left: 8px;
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
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-send-icon lucide-send'%3E%3Cpath d='M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z'/%3E%3Cpath d='m21.854 2.147-10.94 10.939'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
					background-size: 24px 24px;
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
					width: 30px;
					height: 30px;
					background: transparent;
					border: none;
					cursor: pointer;
					opacity: 0.6;
					transition: opacity 0.2s;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				
				.chat-attachment-btn:hover {
					opacity: 1;
				}
				
				.chat-attachment-btn::before {
					content: '';
					display: block;
					width: 18px;
					height: 18px;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E");
					background-repeat: no-repeat;
					background-position: center;
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
		footerText.innerHTML = 'Equipo de atención al cliente de <strong>Guiders</strong>';
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
	 * Agrega un mensaje de bienvenida al chat
	 */
	private addWelcomeMessage(): void {
			// Ya no mostramos el indicador de escritura aquí, será controlado por WebSocket.
			
			// Mostrar el mensaje de bienvenida inmediatamente sin delay
			const welcomeText = "👋 ¡Hola! Soy una persona real de nuestro equipo y estoy aquí para ayudarte. Cuéntame, ¿qué necesitas? No dudes en escribir cualquier pregunta o problema que tengas 😊";
			this.addMessage(welcomeText, 'other');
		}

	/**
	 * Establece el ID del chat actual.
	 * @param chatId ID del chat
	 */
	public setChatId(chatId: string): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
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
	 * @param params 
	 */
	public renderChatMessage(params: { text: string; sender: Sender }): void {
		const { text, sender } = params;
		this.addMessage(text, sender);
		
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
					return { text: msg.content, sender };
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

			// "Prepend" de mensajes antiguos
			for (const msg of data.messages) {
				const sender: Sender = (msg.senderId === "MI_USUARIO_ID") ? "user" : "other";
				this.prependMessage(msg.content, sender);
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
	private addMessage(text: string, sender: Sender): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
			}
			
			// Añadir separador de fecha si es necesario
			this.addDateSeparatorIfNeeded(new Date());
			
			// Crear y añadir el mensaje
			const messageDiv = this.createMessageDiv(text, sender);
			this.containerMessages.appendChild(messageDiv);
			
			// Scroll al final
			this.scrollToBottom(true);
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
	 */
	private prependMessage(text: string, sender: Sender): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}
		const messageDiv = this.createMessageDiv(text, sender);

		if (this.containerMessages.firstChild) {
			this.containerMessages.insertBefore(messageDiv, this.containerMessages.firstChild);
		} else {
			// Si no hay nada, es equivalente a un addMessage
			this.containerMessages.appendChild(messageDiv);
		}
	}

	/**
	 * Crea un nodo <div> con estilos de mensaje y contenido
	 */
	private createMessageDiv(text: string, sender: Sender): HTMLDivElement {
		// Contenedor principal del mensaje
		const wrapperDiv = document.createElement('div');
		wrapperDiv.classList.add('chat-message-wrapper');
		
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
			timeDiv.textContent = this.formatTime(new Date());
			wrapperDiv.appendChild(timeDiv);
			
		} else {
			// Mensaje del asesor (izquierda)
			wrapperDiv.classList.add('chat-message-other-wrapper');
			
			// Avatar del asesor con iniciales
			const avatarDiv = document.createElement('div');
			avatarDiv.classList.add('chat-avatar');
			
			// Añadir iniciales del asesor (aquí podríamos usar datos reales)
			const advisorInitials = 'AH'; // Iniciales de "Asesor Humano"
			avatarDiv.textContent = advisorInitials;
			avatarDiv.style.display = 'flex';
			avatarDiv.style.alignItems = 'center';
			avatarDiv.style.justifyContent = 'center';
			avatarDiv.style.color = '#0062cc';
			avatarDiv.style.fontWeight = '600';
			avatarDiv.style.fontSize = '10px';
			
			wrapperDiv.appendChild(avatarDiv);
			
			// Contenedor para mensaje y tiempo
			const contentDiv = document.createElement('div');
			
			// Añadir nombre del asesor (opcional)
			const nameDiv = document.createElement('div');
			nameDiv.classList.add('chat-message-name');
			nameDiv.textContent = 'Asesor Humano';
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
			timeDiv.textContent = this.formatTime(new Date());
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
	 * Muestra un indicador de "escribiendo..."
	 * Este indicador permanecerá visible hasta que se llame a hideTypingIndicator().
	 */
	public showTypingIndicator(): void {
		if (!this.containerMessages) return;

		// Si ya hay un indicador visible, no hacer nada.
		if (this.typingIndicator) return;
		
		// Crear el indicador de escritura
		const indicator = document.createElement('div');
		indicator.className = 'chat-typing-indicator';
		
		// Avatar con iniciales para humanizar (podría ser dinámico con el nombre del asesor real)
		const avatar = document.createElement('div');
		avatar.className = 'chat-typing-avatar';
		avatar.textContent = 'AH'; // Iniciales de "Asesor Humano"
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
	 * Carga el contenido del chat (mensajes de bienvenida e iniciales)
	 * Solo se ejecuta cuando el chat está visible
	 */
	private loadChatContent(): void {
		if (!this.container?.getAttribute('data-chat-initialized')) {
			console.log("Chat no inicializado aún, esperando...");
			return;
		}
		
		console.log("Cargando contenido del chat...");
		
		// Mostramos el mensaje de bienvenida
		this.addWelcomeMessage();
		
		// Cargar mensajes iniciales
		this.loadInitialMessages(20);
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