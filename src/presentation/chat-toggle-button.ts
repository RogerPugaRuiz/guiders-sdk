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
			textColor: '#fff',
			positionRight: `20px`, // Centrar respecto al eje X
			positionBottom: '20px',
			borderRadius: '50%',
			...options
		};

		this.button = document.createElement('button');
		// this.button.style.transform = `translateX(50%)`; // Centrar respecto al eje X
	}

	/**
	 * Crea y muestra el botón flotante en el DOM, asociando el evento de toggle del chat.
	 */
	public init(): void {
		this.applyStyles();
		this.addEventListeners();

		// Añadimos el botón al body para que sea flotante en la pantalla.
		document.body.appendChild(this.button);
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
		// Texto o ícono en el botón
		this.button.textContent = this.options.label || 'Chat';

		// Estilos mínimos para que se vea como botón flotante.
		this.button.style.position = 'fixed';
		this.button.style.right = this.options.positionRight!;
		this.button.style.bottom = this.options.positionBottom!;
		this.button.style.width = this.options.buttonSize!;
		this.button.style.height = this.options.buttonSize!;
		this.button.style.borderRadius = this.options.borderRadius!;
		this.button.style.backgroundColor = this.options.backgroundColor!;
		this.button.style.color = this.options.textColor!;
		this.button.style.border = 'none';
		this.button.style.cursor = 'pointer';
		this.button.style.zIndex = '2147483647'; // Asegura que el botón esté por encima de otros elementos

		// Si es circular, podemos poner el texto centrado.
		this.button.style.display = 'flex';
		this.button.style.alignItems = 'center';
		this.button.style.justifyContent = 'center';
		this.button.style.fontWeight = 'bold';

		// Sombras, transiciones, etc. (opcional)
		this.button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
		this.button.style.transition = 'opacity 0.3s, transform 0.3s';
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
