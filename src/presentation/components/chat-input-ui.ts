// chat-input-ui.ts - Componente para la entrada de mensajes del chat

// Importar tipos desde la nueva ubicación
import { ChatUIOptions, Sender, ChatMessageParams } from '../types/chat-types';

/**
 * Clase ChatInputUI para manejar la entrada de mensajes en el chat
 * Proporciona una interfaz simple con input de texto y botón de envío
 */
export class ChatInputUI {
	private chatUI: any; // Cambiar a any temporalmente para evitar dependencia circular
	private inputContainer: HTMLElement | null = null;
	private submitCallbacks: Array<(message: string) => void> = [];

	constructor(chatUI: any) {
		this.chatUI = chatUI;
	}

	/**
	 * Inicializa el componente de entrada de mensajes
	 * Crea un input de texto y un botón de envío con sus event listeners
	 */
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
				this.chatUI.renderChatMessage({ text: msg, sender: 'user' });
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

	/**
	 * Registra un callback para cuando se envía un mensaje
	 * @param callback Función a ejecutar cuando se envía un mensaje
	 */
	public onSubmit(callback: (message: string) => void): void {
		this.submitCallbacks.push(callback);
	}

	/**
	 * Obtiene el contenedor del input
	 * @returns Elemento HTML del contenedor o null si no está inicializado
	 */
	public getContainer(): HTMLElement | null {
		return this.inputContainer;
	}

	/**
	 * Destruye el componente y limpia los event listeners
	 */
	public destroy(): void {
		if (this.inputContainer && this.inputContainer.parentNode) {
			this.inputContainer.parentNode.removeChild(this.inputContainer);
		}
		this.inputContainer = null;
		this.submitCallbacks = [];
	}
}