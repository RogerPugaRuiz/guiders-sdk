import { ChatUI } from "./chat";

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
	private options: ChatToggleButtonOptions;
	private isVisible: boolean = false;

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
					}
					.chat-toggle-btn:hover {
						background: #005bb5;
					}
				`;
				shadowHost.shadowRoot.appendChild(style);
			}
		} else {
			document.body.appendChild(this.button);
		}
		this.applyStyles();
		this.addEventListeners();
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
			// El estilo se gestiona por CSS externo
			this.button.textContent = this.options.label || 'Chat';
	}

	/**
	 * Asocia los eventos (click para hacer toggle del chat).
	 */
	private addEventListeners(): void {
		this.button.addEventListener('click', () => {
			this.isVisible = !this.isVisible;
			this.toggleCallback.forEach(callback => {
				callback(this.isVisible);
			});
		});
	}
}
