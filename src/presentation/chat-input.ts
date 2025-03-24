// chat-input-ui.ts

import { ChatUI } from "./chat";

interface ChatInputUIOptions {
	placeholder?: string;
	// Podrías añadir más opciones de estilo, eventos, etc.
}

export class ChatInputUI {
	private chatUI: ChatUI;
	private inputContainer: HTMLDivElement;
	private inputField: HTMLInputElement;
	private options: ChatInputUIOptions;

	private listeners: { [event: string]: (message: string) => void } = {};

	constructor(chatUI: ChatUI, options: ChatInputUIOptions = {}) {
		this.chatUI = chatUI;
		this.options = {
			placeholder: 'Escribe tu mensaje...',
			...options
		};

		// Creamos un contenedor para el input, por si quieres separarlo visualmente
		this.inputContainer = document.createElement('div');
		this.inputContainer.style.display = 'flex';
		this.inputContainer.style.alignItems = 'center';
		this.inputContainer.style.padding = '10px';
		// Puedes cambiar el color de fondo a tu preferencia
		this.inputContainer.style.backgroundColor = '#f8f9fa';
		// Posición "sticky" en la parte inferior, para que se quede fijo en el widget
		this.inputContainer.style.position = 'sticky';
		this.inputContainer.style.bottom = '0';

		// Creamos el campo de texto
		this.inputField = document.createElement('input');
		this.inputField.type = 'text';
		this.inputField.placeholder = this.options.placeholder!;
		// Ajustes de estilo mínimos
		this.inputField.style.flex = '1'; // ocupa el ancho disponible
		this.inputField.style.padding = '5px';

		// Suscribimos el evento "keydown" para que "Enter" envíe el mensaje
		this.inputField.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				this.handleSendMessage();
			}
		});
	}

	/**
	 * Añade el input al contenedor del ChatUI.
	 */
	public init(): void {
		// Obtenemos el contenedor principal del chat
		const chatContainer = this.getChatContainer();

		// Agregamos el contenedor de input al chat
		chatContainer.appendChild(this.inputContainer);

		// Insertamos el input en el contenedor
		this.inputContainer.appendChild(this.inputField);
	}

	/**
	 * Suscribe el evento "submit" del formulario para enviar mensajes.
	 * @param callback Función a ejecutar al enviar un mensaje.
	 */
	public onSubmit(callback: (message: string) => void): void {
		this.listeners.submit = callback;
	}

	/**
	 * Lógica para tomar el texto y enviarlo al ChatUI.
	 */
	private handleSendMessage(): void {
		const text = this.inputField.value.trim();
		if (!text) return;

		// Mandamos el texto al ChatUI como remitente "user"
		this.chatUI.renderChatMessage({ text, sender: 'user' });

		// Limpiamos el campo de texto
		this.inputField.value = '';

		// Ejecutamos el callback de "submit"
		if (this.listeners.submit) {
			this.listeners.submit(text);
		}
	}

	/**
	 * Retorna el contenedor del ChatUI.
	 * - Asegúrate de que ChatUI exponga un método o propiedad para obtenerlo.
	 */
	private getChatContainer(): HTMLElement {
		// Si "container" es privado en ChatUI, podrías crear un getter:
		//   public getContainer(): HTMLElement | null { return this.container; }
		// Y luego usar: this.chatUI.getContainer().

		// En este ejemplo forzamos la conversión con "as any" solo para ilustrar,
		// pero es recomendable exponer un método o propiedad oficial en ChatUI.
		const container = (this.chatUI as any).container as HTMLElement;
		if (!container) {
			throw new Error('ChatUI no está inicializado o el contenedor es null');
		}
		return container;
	}
}