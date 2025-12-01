import { debugLog } from '../../utils/debug-logger';
import {
	QuickActionsConfig,
	InternalQuickActionsConfig,
	QuickAction,
	QuickActionButton,
	QuickActionPayload
} from '../types/quick-actions-types';

/**
 * Quick Actions UI - Componente de botones de acción rápida para el chat
 *
 * Este componente renderiza un mensaje de bienvenida con botones de acción
 * rápida configurables. Soporta acciones como enviar mensaje, abrir URL,
 * solicitar agente humano, o acciones personalizadas.
 */
export class QuickActionsUI {
	private config: InternalQuickActionsConfig;
	private element: HTMLElement | null = null;
	private isHidden: boolean = false;

	// Callbacks públicos para acciones
	public onSendMessage: ((message: string, metadata?: Record<string, any>) => void) | null = null;
	public onRequestAgent: (() => void) | null = null;
	public onOpenUrl: ((url: string) => void) | null = null;
	public onActionClicked: ((buttonId: string, action: QuickAction) => void) | null = null;

	constructor(config: Partial<QuickActionsConfig> = {}) {
		this.config = {
			enabled: config.enabled ?? false,
			welcomeMessage: config.welcomeMessage ?? '¡Hola! 👋 ¿En qué puedo ayudarte?',
			showOnFirstOpen: config.showOnFirstOpen ?? true,
			showOnChatStart: config.showOnChatStart ?? true,
			buttons: config.buttons ?? [],
			onCustomAction: config.onCustomAction
		};

		debugLog('[QuickActionsUI] Inicializado con config:', this.config);
	}

	/**
	 * Renderiza el componente y devuelve el elemento HTML
	 */
	public render(): HTMLElement {
		// Crear contenedor principal
		this.element = document.createElement('div');
		this.element.className = 'guiders-quick-actions';
		this.element.setAttribute('role', 'region');
		this.element.setAttribute('aria-label', 'Opciones rápidas');

		// Mensaje de bienvenida
		if (this.config.welcomeMessage) {
			const welcomeDiv = document.createElement('div');
			welcomeDiv.className = 'guiders-quick-actions-welcome';
			welcomeDiv.textContent = this.config.welcomeMessage;
			this.element.appendChild(welcomeDiv);
		}

		// Contenedor de botones
		if (this.config.buttons.length > 0) {
			const buttonsContainer = document.createElement('div');
			buttonsContainer.className = 'guiders-quick-actions-buttons';

			for (const button of this.config.buttons) {
				const buttonElement = this.createButton(button);
				buttonsContainer.appendChild(buttonElement);
			}

			this.element.appendChild(buttonsContainer);
		}

		debugLog('[QuickActionsUI] Componente renderizado');
		return this.element;
	}

	/**
	 * Crea un botón de acción rápida
	 */
	private createButton(button: QuickActionButton): HTMLButtonElement {
		const buttonElement = document.createElement('button');
		buttonElement.className = 'guiders-quick-action-btn';
		buttonElement.setAttribute('data-action-id', button.id);
		buttonElement.setAttribute('aria-label', button.label);

		// Texto con emoji opcional
		const text = button.emoji ? `${button.emoji} ${button.label}` : button.label;
		buttonElement.textContent = text;

		// Handler de clic
		buttonElement.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.handleButtonClick(button);
		});

		return buttonElement;
	}

	/**
	 * Maneja el clic en un botón
	 */
	private handleButtonClick(button: QuickActionButton): void {
		debugLog('[QuickActionsUI] Botón clickeado:', button.id, button.action.type);

		// Notificar el clic (para tracking)
		if (this.onActionClicked) {
			this.onActionClicked(button.id, button.action);
		}

		// Ejecutar la acción según el tipo
		switch (button.action.type) {
			case 'send_message':
				this.handleSendMessage(button.action);
				break;

			case 'open_url':
				this.handleOpenUrl(button.action);
				break;

			case 'request_agent':
				this.handleRequestAgent();
				break;

			case 'custom':
				this.handleCustomAction(button.id, button.action);
				break;

			default:
				debugLog('[QuickActionsUI] Tipo de acción no soportado:', button.action.type);
		}

		// Ocultar los botones después de cualquier clic
		this.hide();
	}

	/**
	 * Maneja la acción de enviar mensaje
	 */
	private handleSendMessage(action: QuickAction): void {
		let message: string;
		let metadata: Record<string, any> | undefined;

		if (typeof action.payload === 'string') {
			message = action.payload;
		} else if (action.payload && typeof action.payload === 'object') {
			const payload = action.payload as QuickActionPayload;
			message = payload.message ?? '';
			metadata = payload.metadata;
		} else {
			debugLog('[QuickActionsUI] send_message sin payload');
			return;
		}

		if (this.onSendMessage && message) {
			this.onSendMessage(message, metadata);
		}
	}

	/**
	 * Maneja la acción de abrir URL
	 */
	private handleOpenUrl(action: QuickAction): void {
		let url: string | undefined;

		if (typeof action.payload === 'string') {
			url = action.payload;
		} else if (action.payload && typeof action.payload === 'object') {
			// Si el payload es un objeto, intentar obtener la URL del mensaje
			const payload = action.payload as QuickActionPayload;
			url = payload.message;
		}

		if (url) {
			// Abrir en nueva pestaña
			window.open(url, '_blank', 'noopener,noreferrer');

			if (this.onOpenUrl) {
				this.onOpenUrl(url);
			}
		} else {
			debugLog('[QuickActionsUI] open_url sin URL válida');
		}
	}

	/**
	 * Maneja la solicitud de agente humano
	 */
	private handleRequestAgent(): void {
		debugLog('[QuickActionsUI] Solicitando agente humano');

		if (this.onRequestAgent) {
			this.onRequestAgent();
		}
	}

	/**
	 * Maneja acciones personalizadas
	 */
	private handleCustomAction(buttonId: string, action: QuickAction): void {
		if (this.config.onCustomAction) {
			this.config.onCustomAction(buttonId, action);
		} else {
			debugLog('[QuickActionsUI] Acción custom sin handler configurado');
		}
	}

	/**
	 * Muestra el componente con animación
	 */
	public show(): void {
		if (!this.element) return;

		this.isHidden = false;
		this.element.style.display = 'flex';
		this.element.style.opacity = '0';
		this.element.style.transform = 'translateY(10px)';

		// Trigger reflow para la animación
		void this.element.offsetHeight;

		this.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
		this.element.style.opacity = '1';
		this.element.style.transform = 'translateY(0)';

		debugLog('[QuickActionsUI] Componente mostrado');
	}

	/**
	 * Oculta el componente con animación fade-out
	 */
	public hide(): void {
		if (!this.element || this.isHidden) return;

		this.isHidden = true;
		this.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
		this.element.style.opacity = '0';
		this.element.style.transform = 'translateY(-10px)';

		// Ocultar después de la animación
		setTimeout(() => {
			if (this.element) {
				this.element.style.display = 'none';
			}
		}, 300);

		debugLog('[QuickActionsUI] Componente oculto');
	}

	/**
	 * Verifica si el componente está visible
	 */
	public isVisible(): boolean {
		return this.element !== null && !this.isHidden && this.element.style.display !== 'none';
	}

	/**
	 * Verifica si Quick Actions está habilitado
	 */
	public isEnabled(): boolean {
		return this.config.enabled && this.config.buttons.length > 0;
	}

	/**
	 * Obtiene el elemento HTML del componente
	 */
	public getElement(): HTMLElement | null {
		return this.element;
	}

	/**
	 * Destruye el componente y limpia recursos
	 */
	public destroy(): void {
		if (this.element && this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}
		this.element = null;
		this.isHidden = false;
		debugLog('[QuickActionsUI] Componente destruido');
	}

	/**
	 * Actualiza la configuración
	 */
	public updateConfig(config: Partial<QuickActionsConfig>): void {
		if (config.enabled !== undefined) this.config.enabled = config.enabled;
		if (config.welcomeMessage !== undefined) this.config.welcomeMessage = config.welcomeMessage;
		if (config.showOnFirstOpen !== undefined) this.config.showOnFirstOpen = config.showOnFirstOpen;
		if (config.showOnChatStart !== undefined) this.config.showOnChatStart = config.showOnChatStart;
		if (config.buttons) this.config.buttons = config.buttons;
		if (config.onCustomAction) this.config.onCustomAction = config.onCustomAction;

		debugLog('[QuickActionsUI] Configuración actualizada');

		// Re-renderizar si el elemento existe
		if (this.element && this.element.parentNode) {
			const parent = this.element.parentNode;
			const wasVisible = this.isVisible();
			this.destroy();
			parent.appendChild(this.render());
			if (wasVisible) {
				this.show();
			}
		}
	}
}
