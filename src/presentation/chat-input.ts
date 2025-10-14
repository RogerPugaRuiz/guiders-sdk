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
		this.inputContainer.className = 'chat-input-container';

		// Creamos el campo de texto
		this.inputField = document.createElement('input');
		this.inputField.type = 'text';
		this.inputField.placeholder = this.options.placeholder!;
		this.inputField.className = 'chat-input-field';

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

		// Crear un contenedor para el input con estilo moderno
		this.inputContainer = document.createElement('div');
		this.inputContainer.className = 'chat-input-container';

		// Campo de entrada de texto
		this.inputField = document.createElement('input');
		this.inputField.type = 'text';
		this.inputField.className = 'chat-input-field';
		this.inputField.placeholder = this.options.placeholder || 'Escribe un mensaje...';
		this.inputField.setAttribute('aria-label', 'Mensaje');

		// Botón de envío
		const sendButton = document.createElement('button');
		sendButton.className = 'chat-send-btn';
		sendButton.setAttribute('aria-label', 'Enviar mensaje');
		sendButton.type = 'button';
		sendButton.addEventListener('click', () => this.handleSendMessage());

		// Agregar elementos al contenedor
		this.inputContainer.appendChild(this.inputField);
		this.inputContainer.appendChild(sendButton);
		
		// Evento para enviar con Enter
		this.inputField.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				this.handleSendMessage();
				event.preventDefault();
			}
		});

		// Agregamos el contenedor de input al chat
		chatContainer.appendChild(this.inputContainer);
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

		// 🎲 Interceptar comandos de desarrollo (solo en modo dev)
		if (this.isDevCommand(text)) {
			console.log(`🎲 [ChatInput] Comando de desarrollo detectado: ${text}`);
			this.handleDevCommand(text);
			// Limpiar el campo de texto sin enviar el comando como mensaje
			this.inputField.value = '';
			return;
		}

		// Mandamos el texto al ChatUI como remitente "user"
		this.chatUI.renderChatMessage({ text, sender: 'user' });

		// Limpiamos el campo de texto
		this.inputField.value = '';
		
		// Ya no mostramos el indicador de escritura aquí, será controlado por WebSocket.

		// Ejecutamos el callback de "submit"
		if (this.listeners.submit) {
			this.listeners.submit(text);
		}
	}

	/**
	 * Detecta si el texto es un comando de desarrollo
	 */
	private isDevCommand(text: string): boolean {
		const trimmedText = text.trim().toLowerCase();
		return trimmedText.match(/^#random(?::\d+)?$/) !== null;
	}

	/**
	 * Maneja comandos de desarrollo específicos
	 */
	private handleDevCommand(text: string): void {
		const trimmedText = text.trim().toLowerCase();
		
		// Comando #random o #random:N
		const randomMatch = trimmedText.match(/^#random(?::(\d+))?$/);
		if (randomMatch) {
			// Disparar evento personalizado para que DevRandomMessages lo capture
			if (typeof window !== 'undefined') {
				const customEvent = new CustomEvent('guidersDevCommand', {
					detail: {
						command: 'random',
						text: text,
						count: randomMatch[1] ? parseInt(randomMatch[1], 10) : null,
						chatId: this.getCurrentChatId()
					}
				});
				window.dispatchEvent(customEvent);
				console.log(`🎲 [ChatInput] Evento guidersDevCommand disparado para: ${text}`);
			}
		}
	}

	/**
	 * Obtiene el ID del chat actual (si está disponible)
	 */
	private getCurrentChatId(): string | null {
		// Intentar obtener el chat ID desde el ChatUI o desde el estado global
		try {
			const chatUI = this.chatUI as any;
			return chatUI.chatId || null;
		} catch (error) {
			console.warn('🎲 [ChatInput] No se pudo obtener el chat ID:', error);
			return null;
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