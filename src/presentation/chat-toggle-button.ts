import { ChatUI } from "./chat";
import { UnreadMessagesService } from "../services/unread-messages-service";

interface ChatToggleButtonOptions {
	label?: string;            // Texto o ícono a mostrar en el botón
	buttonSize?: string;       // Tamaño (width/height) del botón (ej. '50px')
	backgroundColor?: string;  // Color de fondo del botón
	textColor?: string;        // Color del texto/ícono del botón
	positionRight?: string;    // Distancia del botón respecto a la parte derecha de la ventana
	positionBottom?: string;   // Distancia del botón respecto a la parte inferior de la ventana
	borderRadius?: string;     // Radio de la esquina (para un look "circular" o "pill")
}

export class ChatToggleButtonUI {
	private chatUI: ChatUI;
	private button: HTMLButtonElement;
	private badgeElement: HTMLElement | null = null;
	private options: ChatToggleButtonOptions;
	private isVisible: boolean = false;
	private unreadMessagesService: UnreadMessagesService;

	private toggleCallback: Array<(visible: boolean) => void> = [];

	constructor(chatUI: ChatUI, options: ChatToggleButtonOptions = {}) {
		this.chatUI = chatUI;
		const chatWidth = this.chatUI.getOptions().widgetWidth || '300px';
		const num = parseInt(chatWidth.replace('px', ''));
		this.options = {
			label: 'Chat',
			buttonSize: '50px',
			backgroundColor: '#007bff',
			textColor: '#ffffff',
			positionRight: `20px`, // Centrar respecto al eje X
			positionBottom: '20px',
			borderRadius: '50%',
			...options
		};

		this.button = document.createElement('button');
		this.button.className = 'chat-toggle-btn';
		
		// Obtener la instancia del servicio de mensajes no leídos
		this.unreadMessagesService = UnreadMessagesService.getInstance();
	}

	/**
	 * Crea y muestra el botón flotante en el DOM, asociando el evento de toggle del chat.
	 */
	public init(): void {
		if (!this.button) {
			this.button = document.createElement('button');
			this.button.className = 'chat-toggle-btn';
		}
		// Buscar el host del Shadow DOM del chat
		const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
		if (shadowHost && shadowHost.shadowRoot) {
			// Insertar el botón flotante dentro del shadowRoot, pero antes del chat-widget para que quede visible
			shadowHost.shadowRoot.insertBefore(this.button, shadowHost.shadowRoot.firstChild);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			this.button.appendChild(this.badgeElement);
			
			// Inicialmente ocultar el badge si no hay mensajes
			console.log("Inicializando badge de mensajes no leídos");
			
			// Comprobar si ya hay mensajes no leídos al iniciar
			const currentCount = this.unreadMessagesService.getUnreadCount();
			console.log("Contador actual de mensajes no leídos:", currentCount);
			this.updateUnreadBadge(currentCount);
			
			// Inyectar estilos específicos del botón si no existen
			if (!shadowHost.shadowRoot.querySelector('style[data-chat-toggle-btn]')) {
				const style = document.createElement('style');
				style.setAttribute('data-chat-toggle-btn', 'true');
				style.textContent = `
					.chat-toggle-btn {
						position: fixed;
						right: 20px;
						bottom: 20px;
						width: 50px;
						height: 50px;
						border-radius: 50%;
						background: #007bff;
						color: #fff !important;
						border: none;
						cursor: pointer;
						z-index: 2147483647;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: bold;
						box-shadow: 0 2px 5px rgba(0,0,0,0.15);
						transition: opacity 0.3s, transform 0.3s;
						position: relative; /* Asegurar que el badge se posicione correctamente */
					}
					.chat-toggle-btn:hover {
						background: #005bb5;
					}
					.chat-unread-badge {
						position: absolute;
						top: -8px;
						right: -8px;
						min-width: 20px;
						height: 20px;
						background-color: #ff4136;
						color: white;
						border-radius: 50%;
						font-size: 12px;
						font-weight: bold;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 0 4px;
						box-sizing: border-box;
						border: 2px solid white;
						z-index: 2147483647;
						box-shadow: 0 2px 5px rgba(0,0,0,0.2);
						pointer-events: none; /* Evitar que el badge interfiera con el botón */
					}
					.chat-unread-badge.hidden {
						display: none !important;
					}
					@keyframes pulse {
						0% { transform: scale(1); }
						50% { transform: scale(1.3); }
						100% { transform: scale(1); }
					}
				`;
				shadowHost.shadowRoot.appendChild(style);
			}
		} else {
			document.body.appendChild(this.button);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			this.button.appendChild(this.badgeElement);
			
			// Inicialmente comprobar si hay mensajes no leídos al iniciar
			console.log("Inicializando badge de mensajes no leídos (sin shadow DOM)");
			const currentCount = this.unreadMessagesService.getUnreadCount();
			console.log("Contador actual de mensajes no leídos:", currentCount);
			this.updateUnreadBadge(currentCount);
		}
		
		this.applyStyles();
		this.addEventListeners();
		this.initializeStyles(); // Inicializar estilos inline además de CSS
		
		// Suscribirse a cambios en el contador de mensajes no leídos
		this.unreadMessagesService.onCountChange((count) => {
			this.updateUnreadBadge(count);
		});
	}

	/**
	 * Subscribe a un evento de toggle del chat.
	 * @param callback Función a ejecutar cuando el chat cambia de estado.
	 * @returns void
	 */
	public onToggle(callback: (visible: boolean) => void): void {
		this.toggleCallback.push(callback);
	}

	/**
	 * Configura estilos y contenido del botón.
	 */
	private applyStyles(): void {
			// Crear un span para el texto dentro del botón
			const labelSpan = document.createElement('span');
			labelSpan.textContent = this.options.label || 'Chat';
			
			// Limpiar el contenido del botón antes de añadir el span
			// Esto mantiene el badge intacto si ya existe
			Array.from(this.button.childNodes).forEach(child => {
				if (child.nodeType === Node.TEXT_NODE || (child as Element).tagName === 'SPAN') {
					this.button.removeChild(child);
				}
			});
			
			this.button.appendChild(labelSpan);
			
			// Aplicar estilos adicionales si es necesario
			this.button.style.backgroundColor = this.options.backgroundColor || '#007bff';
			this.button.style.color = this.options.textColor || '#ffffff';
	}

	/**
	 * Asocia los eventos (click para hacer toggle del chat).
	 */
	private addEventListeners(): void {
		this.button.addEventListener('click', () => {
			this.isVisible = !this.isVisible;
			
			// Actualizar el estado de visibilidad en el servicio de mensajes no leídos
			this.unreadMessagesService.setActive(this.isVisible);
			
			// Notificar a todos los callbacks sobre el cambio de estado
			this.toggleCallback.forEach(callback => {
				callback(this.isVisible);
			});
		});
	}

	/**
	 * Actualiza el badge con el número de mensajes no leídos
	 * @param count Número de mensajes no leídos
	 */
	private updateUnreadBadge(count: number): void {
		if (!this.badgeElement) {
			console.error("Badge element no encontrado");
			return;
		}
		
		console.log(`📬 Actualizando badge: ${count} mensajes no leídos`);
		
		if (count <= 0) {
			this.badgeElement.classList.add('hidden');
			this.badgeElement.textContent = '';
			console.log("🚫 Badge oculto - sin mensajes no leídos");
		} else {
			this.badgeElement.classList.remove('hidden');
			this.badgeElement.textContent = count > 99 ? '99+' : count.toString();
			console.log(`🔴 Badge visible - ${count} mensajes no leídos`);
			
			// Asegurar que el badge sea visible con estilo explícito
			this.badgeElement.style.display = 'flex';
			this.badgeElement.style.opacity = '1';
			this.badgeElement.style.transform = 'scale(1)';
			
			// Aplicar animación de pulso cuando se actualizan los mensajes
			if (this.badgeElement) { // Verificación adicional para TypeScript
				this.badgeElement.style.animation = 'none';
				setTimeout(() => {
					if (this.badgeElement) { // También verificar dentro del setTimeout
						this.badgeElement.style.animation = 'pulse 0.5s 2';
					}
				}, 10);
			}
		}
	}

	/**
	 * Inicializa el botón y añade estilos CSS inline para evitar problemas de ShadowDOM
	 */
	private initializeStyles(): void {
		// Estilos inline para el botón
		Object.assign(this.button.style, {
			position: 'fixed',
			right: '20px',
			bottom: '20px',
			width: '50px',
			height: '50px',
			borderRadius: '50%',
			background: this.options.backgroundColor || '#007bff',
			color: this.options.textColor || '#ffffff',
			border: 'none',
			cursor: 'pointer',
			zIndex: '2147483647',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontWeight: 'bold',
			boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
			transition: 'opacity 0.3s, transform 0.3s'
		});

		// Si existe el badge, aplicar estilos inline
		if (this.badgeElement) {
			Object.assign(this.badgeElement.style, {
				position: 'absolute',
				top: '-8px',
				right: '-8px',
				minWidth: '20px',
				height: '20px',
				backgroundColor: '#ff4136',
				color: 'white',
				borderRadius: '50%',
				fontSize: '12px',
				fontWeight: 'bold',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '0 4px',
				boxSizing: 'border-box',
				border: '2px solid white',
				zIndex: '2147483647',
				boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
				pointerEvents: 'none'
			});
		}
	}
}
