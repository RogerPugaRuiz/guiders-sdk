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
		
		// Inicializar como oculto (no visible)
		this.isVisible = false;
		
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
		
		// Asegurar que el estado inicial sea coherente con el estado del chat
		// Inicialmente el botón no debe mostrar el estado 'open'
		this.isVisible = false;
		this.button.classList.remove('open');
		// Buscar el host del Shadow DOM del chat
		const shadowHost = document.querySelector('.chat-widget-host') as HTMLElement;
		if (shadowHost && shadowHost.shadowRoot) {
			// Insertar el botón flotante dentro del shadowRoot, pero antes del chat-widget para que quede visible
			shadowHost.shadowRoot.insertBefore(this.button, shadowHost.shadowRoot.firstChild);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			shadowHost.shadowRoot.appendChild(this.badgeElement);
			
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
						width: 56px;
						height: 56px;
						border-radius: 50%;
						background: linear-gradient(145deg, #0084ff, #0062cc);
						color: #fff !important;
						border: none;
						cursor: pointer;
						z-index: 2147483647;
						display: flex;
						align-items: center;
						justify-content: center;
						font-weight: bold;
						box-shadow: 0 4px 10px rgba(0,123,255,0.3), 0 0 0 rgba(0,123,255,0);
						transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
						position: relative; /* Asegurar que el badge se posicione correctamente */
						overflow: hidden;
					}
					.chat-toggle-btn::before {
						content: '';
						display: block;
						width: 24px;
						height: 24px;
						background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 3C6.5 3 2 6.58 2 11C2.05 13.15 3.06 15.17 4.75 16.5C4.75 17.1 4.33 18.67 2 21C4.37 20.89 6.64 20 8.47 18.5C9.61 18.83 10.81 19 12 19C17.5 19 22 15.42 22 11C22 6.58 17.5 3 12 3ZM12 17C7.58 17 4 14.31 4 11C4 7.69 7.58 5 12 5C16.42 5 20 7.69 20 11C20 14.31 16.42 17 12 17Z' fill='white'/%3E%3C/svg%3E");
						background-repeat: no-repeat;
						background-position: center;
						transition: transform 0.3s ease;
					}
					.chat-toggle-btn.open::before {
						background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z' fill='white'/%3E%3C/svg%3E");
					}
					.chat-toggle-btn:hover {
						transform: translateY(-3px);
						box-shadow: 0 6px 16px rgba(0,123,255,0.4);
						background: linear-gradient(145deg, #0090ff, #0070e0);
					}
					.chat-toggle-btn:active {
						transform: translateY(0) scale(0.95);
						box-shadow: 0 2px 8px rgba(0,123,255,0.3);
						background: linear-gradient(145deg, #0062cc, #0084ff);
					}
					.chat-unread-badge {
						position: fixed;
						top: calc(100% - 90px); /* Posición calculada basada en la posición del botón */
						right: 13px; /* Posición calculada para alinearse con el botón */
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
						pointer-events: none; /* Evitar que el badge interfiera con el botón */
						transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
				`;
				shadowHost.shadowRoot.appendChild(style);
			}
		} else {
			document.body.appendChild(this.button);
			
			// Crear el badge para los mensajes no leídos
			this.badgeElement = document.createElement('div');
			this.badgeElement.className = 'chat-unread-badge';
			this.badgeElement.setAttribute('id', 'chat-unread-badge');
			document.body.appendChild(this.badgeElement);
			
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
				// Para el estilo Intercom, usamos SVG directamente en CSS con ::before
				// Eliminamos cualquier texto o elemento span dentro del botón
				Array.from(this.button.childNodes).forEach(child => {
					if (child.nodeType === Node.TEXT_NODE || (child as Element).tagName === 'SPAN') {
						this.button.removeChild(child);
					}
				});
				
				// Aplicar estilos adicionales si es necesario
				const baseColor = this.options.backgroundColor || '#0084ff';
				this.button.style.background = `linear-gradient(145deg, ${baseColor}, #0062cc)`;
				this.button.style.color = this.options.textColor || '#ffffff';
	}

	/**
	 * Asocia los eventos (click para hacer toggle del chat).
	 */
	private addEventListeners(): void {
		this.button.addEventListener('click', () => {
			// Invierte el estado actual
			this.isVisible = !this.isVisible;
			
			console.log("Toggle button clicked, new state:", this.isVisible ? "visible" : "hidden");
			
			// Actualizar el estado de visibilidad en el servicio de mensajes no leídos
			this.unreadMessagesService.setActive(this.isVisible);
			
			// Aplicar/quitar clase para animar icono
			if (this.isVisible) {
				this.button.classList.add('open');
				
				// Si hay mensajes no leídos, resetear el contador
				if (this.unreadMessagesService.getUnreadCount() > 0) {
					this.unreadMessagesService.resetUnreadCount();
					this.updateUnreadBadge(0);
				}
			} else {
				this.button.classList.remove('open');
			}
			
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
			this.badgeElement.style.opacity = '0';
			this.badgeElement.textContent = '';
			console.log("🚫 Badge oculto - sin mensajes no leídos");
		} else {
			this.badgeElement.classList.remove('hidden');
			this.badgeElement.style.opacity = '1';
			this.badgeElement.textContent = count > 99 ? '99+' : count.toString();
			console.log(`🔴 Badge visible - ${count} mensajes no leídos`);
			
			// Asegurar que el badge sea visible con estilo explícito
			this.badgeElement.style.display = 'flex';
			this.badgeElement.style.opacity = '1';
			this.badgeElement.style.transform = 'scale(1)';
			
			// Aplicar animación de pulso cuando se actualizan los mensajes
			if (this.badgeElement) {
				this.badgeElement.style.animation = 'none';
				setTimeout(() => {
					if (this.badgeElement) {
						this.badgeElement.style.animation = 'pulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
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
			width: '56px',
			height: '56px',
			borderRadius: '50%',
			background: `linear-gradient(145deg, ${this.options.backgroundColor || '#0084ff'}, #0062cc)`,
			color: this.options.textColor || '#ffffff',
			border: 'none',
			cursor: 'pointer',
			zIndex: '2147483647',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontWeight: 'bold',
			boxShadow: '0 4px 10px rgba(0,123,255,0.3)',
			transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
			overflow: 'hidden'
		});

		// Si existe el badge, aplicar estilos inline
		if (this.badgeElement) {
			Object.assign(this.badgeElement.style, {
				position: 'fixed',
				top: 'calc(100% - 90px)', /* Posición calculada basada en la posición del botón */
				right: '13px', /* Posición calculada para alinearse con el botón */
				minWidth: '22px',
				height: '22px',
				background: 'linear-gradient(145deg, #ff5146, #e53a30)',
				color: 'white',
				borderRadius: '12px',
				fontSize: '12px',
				fontWeight: 'bold',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: '0 5px',
				boxSizing: 'border-box',
				border: '2px solid white',
				zIndex: '2147483647',
				boxShadow: '0 2px 8px rgba(255,65,54,0.3)',
				pointerEvents: 'none',
				transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
			});
		}
	}

	/**
	 * Muestra el botón del chat
	 */
	public show(): void {
		console.log("🔘 ChatToggleButton.show() llamado");
		console.log("🔘 Elemento botón existe:", !!this.button);
		if (this.button) {
			console.log("🔘 Estado antes de mostrar:", this.button.style.display);
			this.button.style.display = 'flex';
			console.log("🔘 Estado después de mostrar:", this.button.style.display);
			console.log("🔘 Botón en DOM:", document.contains(this.button));
		} else {
			console.error("🔘 Error: Elemento botón no existe");
		}
	}

	/**
	 * Oculta el botón del chat
	 */
	public hide(): void {
		console.log("🔘 ChatToggleButton.hide() llamado");
		console.log("🔘 Elemento botón existe:", !!this.button);
		if (this.button) {
			console.log("🔘 Estado antes de ocultar:", this.button.style.display);
			this.button.style.display = 'none';
			console.log("🔘 Estado después de ocultar:", this.button.style.display);
		} else {
			console.error("🔘 Error: Elemento botón no existe");
		}
	}

	/**
	 * Verifica si el botón está visible
	 */
	public isButtonVisible(): boolean {
		const isVisible = this.button && this.button.style.display !== 'none';
		console.log("🔘 isButtonVisible() - Elemento existe:", !!this.button);
		if (this.button) {
			console.log("🔘 isButtonVisible() - Display style:", this.button.style.display);
		}
		console.log("🔘 isButtonVisible() - Resultado:", isVisible);
		return isVisible;
	}
}
