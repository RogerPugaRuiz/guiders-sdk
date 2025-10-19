// chat-input-ui.ts - Componente para la entrada de mensajes del chat

// Importar tipos desde la nueva ubicación
import { ChatUIOptions, Sender, ChatMessageParams } from '../types/chat-types';
import { PresenceService } from '../../services/presence-service';

/**
 * Clase ChatInputUI para manejar la entrada de mensajes en el chat
 * Proporciona una interfaz simple con input de texto y botón de envío
 * Incluye detección de typing con debounce automático
 */
export class ChatInputUI {
	private chatUI: any; // Cambiar a any temporalmente para evitar dependencia circular
	private inputContainer: HTMLElement | null = null;
	private submitCallbacks: Array<(message: string) => void> = [];
	private inputElement: HTMLInputElement | null = null;

	// Typing indicators con debounce
	private presenceService: PresenceService | null = null;
	private chatId: string | null = null;
	private typingDebounceTimer: NodeJS.Timeout | null = null;
	private typingStopTimer: NodeJS.Timeout | null = null;
	private readonly TYPING_DEBOUNCE_MS = 300; // Esperar 300ms antes de enviar typing:start
	private readonly TYPING_STOP_MS = 2000; // Auto-stop después de 2s sin actividad

	constructor(chatUI: any) {
		this.chatUI = chatUI;
	}

	/**
	 * Configura el servicio de presencia para typing indicators
	 * @param presenceService Servicio de presencia
	 * @param chatId ID del chat actual
	 */
	public setPresenceService(presenceService: PresenceService, chatId: string): void {
		this.presenceService = presenceService;
		this.chatId = chatId;
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
		this.inputElement = input; // Guardar referencia

		const button = document.createElement('button');
		button.textContent = 'Enviar';

		button.addEventListener('click', () => {
			const msg = input.value.trim();
			if (msg) {
				// Detener typing antes de enviar
				this.stopTyping();

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

		// EventListener para typing detection (oninput)
		input.addEventListener('input', () => {
			this.handleTypingInput();
		});

		// EventListener para detener typing al perder foco (onblur)
		input.addEventListener('blur', () => {
			this.stopTyping();
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
	 * Maneja el evento de input con debounce
	 * Se ejecuta cada vez que el usuario escribe en el input
	 */
	private handleTypingInput(): void {
		if (!this.presenceService || !this.chatId) {
			return; // No hay servicio de presencia configurado
		}

		// Limpiar timer de debounce anterior
		if (this.typingDebounceTimer) {
			clearTimeout(this.typingDebounceTimer);
		}

		// Esperar TYPING_DEBOUNCE_MS antes de enviar typing:start
		this.typingDebounceTimer = setTimeout(() => {
			this.startTyping();
		}, this.TYPING_DEBOUNCE_MS);
	}

	/**
	 * Inicia el indicador de "estoy escribiendo"
	 * También programa el auto-stop
	 */
	private startTyping(): void {
		if (!this.presenceService || !this.chatId) {
			return;
		}

		// Enviar evento de typing:start al servidor
		this.presenceService.startTyping(this.chatId);

		// Limpiar timer de auto-stop anterior
		if (this.typingStopTimer) {
			clearTimeout(this.typingStopTimer);
		}

		// Programar auto-stop después de TYPING_STOP_MS de inactividad
		this.typingStopTimer = setTimeout(() => {
			this.stopTyping();
		}, this.TYPING_STOP_MS);
	}

	/**
	 * Detiene el indicador de "estoy escribiendo"
	 */
	private stopTyping(): void {
		if (!this.presenceService || !this.chatId) {
			return;
		}

		// Limpiar todos los timers
		this.clearTypingTimers();

		// Enviar evento de typing:stop al servidor
		this.presenceService.stopTyping(this.chatId);
	}

	/**
	 * Limpia todos los timers de typing
	 */
	private clearTypingTimers(): void {
		if (this.typingDebounceTimer) {
			clearTimeout(this.typingDebounceTimer);
			this.typingDebounceTimer = null;
		}

		if (this.typingStopTimer) {
			clearTimeout(this.typingStopTimer);
			this.typingStopTimer = null;
		}
	}

	/**
	 * Destruye el componente y limpia los event listeners
	 */
	public destroy(): void {
		// Detener typing antes de destruir
		this.stopTyping();
		this.clearTypingTimers();

		if (this.inputContainer && this.inputContainer.parentNode) {
			this.inputContainer.parentNode.removeChild(this.inputContainer);
		}
		this.inputContainer = null;
		this.inputElement = null;
		this.submitCallbacks = [];
		this.presenceService = null;
		this.chatId = null;
	}
}