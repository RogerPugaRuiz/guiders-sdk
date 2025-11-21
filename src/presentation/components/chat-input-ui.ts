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
	private inputElement: HTMLTextAreaElement | null = null;

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
		// Contenedor principal
		this.inputContainer = document.createElement('div');
		this.inputContainer.style.display = 'flex';
		this.inputContainer.style.padding = '8px 12px';
		this.inputContainer.style.background = '#ffffff';

		// Wrapper del input con estilo moderno
		const inputWrapper = document.createElement('div');
		inputWrapper.style.display = 'flex';
		inputWrapper.style.alignItems = 'flex-end';
		inputWrapper.style.flex = '1';
		inputWrapper.style.background = '#ffffff';
		inputWrapper.style.borderRadius = '24px';
		inputWrapper.style.padding = '6px 6px 6px 16px';
		inputWrapper.style.gap = '8px';
		inputWrapper.style.minHeight = '44px';
		inputWrapper.style.boxSizing = 'border-box';
		inputWrapper.style.border = '1px solid #e4e4e7';
		inputWrapper.style.transition = 'all 0.2s ease';

		const input = document.createElement('textarea');
		input.rows = 1;
		input.style.flex = '1';
		input.style.border = 'none';
		input.style.background = 'transparent';
		input.style.outline = 'none';
		input.style.fontSize = '14px';
		input.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
		input.style.color = '#18181b';
		input.style.padding = '4px 0';
		input.style.resize = 'none';
		input.style.overflow = 'hidden';
		input.style.lineHeight = '1.4';
		input.style.maxHeight = '120px';
		input.style.minHeight = '24px';
		input.placeholder = 'Escribe un mensaje...';
		this.inputElement = input;

		// Auto-resize del textarea
		const autoResize = () => {
			input.style.height = 'auto';
			input.style.height = Math.min(input.scrollHeight, 120) + 'px';
			// Permitir scroll si excede maxHeight
			if (input.scrollHeight > 120) {
				input.style.overflow = 'auto';
			} else {
				input.style.overflow = 'hidden';
			}
		};

		// Focus styles
		input.addEventListener('focus', () => {
			inputWrapper.style.background = '#ffffff';
			inputWrapper.style.borderColor = '#d4d4d8';
			inputWrapper.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.04)';
		});
		input.addEventListener('blur', () => {
			inputWrapper.style.background = '#ffffff';
			inputWrapper.style.borderColor = '#e4e4e7';
			inputWrapper.style.boxShadow = 'none';
			this.stopTyping();
		});

		const button = document.createElement('button');
		button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.29106 3.3088C3.00745 3.18938 2.67967 3.25533 2.4643 3.47514C2.24894 3.69495 2.1897 4.02401 2.31488 4.30512L5.40752 11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H5.40754L2.31488 19.6949C2.1897 19.976 2.24894 20.3051 2.4643 20.5249C2.67967 20.7447 3.00745 20.8107 3.29106 20.6912L22.2911 12.6913C22.5692 12.5742 22.75 12.3018 22.75 12C22.75 11.6983 22.5692 11.4259 22.2911 11.3088L3.29106 3.3088Z" fill="currentColor"/></svg>';
		button.style.display = 'flex';
		button.style.alignItems = 'center';
		button.style.justifyContent = 'center';
		button.style.width = '32px';
		button.style.height = '32px';
		button.style.border = 'none';
		button.style.borderRadius = '50%';
		button.style.background = '#18181b';
		button.style.color = 'white';
		button.style.cursor = 'pointer';
		button.style.transition = 'all 0.15s ease';
		button.style.flexShrink = '0';

		// Hover styles
		button.addEventListener('mouseenter', () => {
			button.style.background = '#27272a';
			button.style.transform = 'scale(1.05)';
		});
		button.addEventListener('mouseleave', () => {
			button.style.background = '#18181b';
			button.style.transform = 'scale(1)';
		});

		button.addEventListener('click', () => {
			const msg = input.value.trim();
			if (msg) {
				// Detener typing antes de enviar
				this.stopTyping();

				this.submitCallbacks.forEach(cb => cb(msg));
				// Opcional, también podemos renderizarlo en el chat de inmediato
				this.chatUI.renderChatMessage({ text: msg, sender: 'user' });
				input.value = '';
				// Resetear altura del textarea
				input.style.height = 'auto';
				input.style.overflow = 'hidden';
			}
		});

		// EventListener para Enter (enviar) y Shift+Enter (nueva línea)
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				button.click();
			}
			// Shift+Enter permite nueva línea naturalmente
		});

		// EventListener para typing detection y auto-resize
		input.addEventListener('input', () => {
			this.handleTypingInput();
			autoResize();
		});

		// EventListener para detener typing al perder foco (onblur)
		input.addEventListener('blur', () => {
			this.stopTyping();
		});

		inputWrapper.appendChild(input);
		inputWrapper.appendChild(button);
		this.inputContainer.appendChild(inputWrapper);

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