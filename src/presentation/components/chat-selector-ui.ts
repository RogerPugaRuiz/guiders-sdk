import { debugLog } from '../../utils/debug-logger';
import {
	ChatSelectorConfig,
	InternalChatSelectorConfig,
	ChatSelectorItem,
	ChatSelectorState,
	ChatSelectorCallbacks
} from '../types/chat-selector-types';
import { ChatV2 } from '../../types';
import {
	createInternalConfig,
	formatDate,
	chatV2ListToSelectorItems
} from '../utils/chat-list-utils';

/**
 * Chat Selector UI - Componente dropdown para seleccionar entre múltiples chats
 *
 * Este componente renderiza un trigger clickeable en el header del chat y
 * un dropdown con la lista de chats del visitante más un botón para crear nuevo.
 */
export class ChatSelectorUI {
	private config: InternalChatSelectorConfig;
	private state: ChatSelectorState;
	private callbacks: ChatSelectorCallbacks;

	// Elementos DOM
	private container: HTMLElement | null = null;
	private triggerElement: HTMLElement | null = null;
	private dropdownElement: HTMLElement | null = null;

	// Referencia para cerrar al hacer clic fuera
	private boundHandleOutsideClick: (e: MouseEvent) => void;

	constructor(config: Partial<ChatSelectorConfig> = {}, callbacks: ChatSelectorCallbacks = {}) {
		this.config = createInternalConfig(config);

		this.state = {
			isOpen: false,
			isLoading: false,
			chats: [],
			selectedChatId: null,
			error: null
		};

		this.callbacks = callbacks;
		this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);

		debugLog('[ChatSelectorUI] Inicializado con config:', this.config);
	}

	/**
	 * Renderiza el componente completo (trigger + dropdown)
	 */
	public render(): HTMLElement {
		this.container = document.createElement('div');
		this.container.className = 'guiders-chat-selector';
		this.container.setAttribute('role', 'combobox');
		this.container.setAttribute('aria-expanded', 'false');
		this.container.setAttribute('aria-haspopup', 'listbox');

		// Renderizar trigger
		this.triggerElement = this.renderTrigger();
		this.container.appendChild(this.triggerElement);

		// Renderizar dropdown (oculto inicialmente)
		this.dropdownElement = this.renderDropdown();
		this.container.appendChild(this.dropdownElement);

		debugLog('[ChatSelectorUI] Componente renderizado');
		return this.container;
	}

	/**
	 * Renderiza el trigger (botón/área clickeable en el header)
	 */
	private renderTrigger(): HTMLElement {
		const trigger = document.createElement('button');
		trigger.className = 'guiders-chat-selector-trigger';
		trigger.setAttribute('aria-label', 'Seleccionar conversación');
		trigger.setAttribute('type', 'button');

		// Icono de flecha
		const arrow = document.createElement('span');
		arrow.className = 'guiders-chat-selector-arrow';
		arrow.innerHTML = '▼';

		trigger.appendChild(arrow);

		// Event listener
		trigger.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.toggle();
		});

		return trigger;
	}

	/**
	 * Renderiza el dropdown con la lista de chats
	 */
	private renderDropdown(): HTMLElement {
		const dropdown = document.createElement('div');
		dropdown.className = 'guiders-chat-selector-dropdown';
		dropdown.setAttribute('role', 'listbox');
		dropdown.style.display = 'none';

		// Actualizar contenido
		this.updateDropdownContent(dropdown);

		return dropdown;
	}

	/**
	 * Actualiza el contenido del dropdown
	 */
	private updateDropdownContent(dropdown?: HTMLElement): void {
		const target = dropdown || this.dropdownElement;
		if (!target) return;

		target.innerHTML = '';

		// Estado de carga
		if (this.state.isLoading) {
			const loading = document.createElement('div');
			loading.className = 'guiders-chat-selector-loading';
			loading.innerHTML = '<span class="guiders-spinner"></span> Cargando...';
			target.appendChild(loading);
			return;
		}

		// Error
		if (this.state.error) {
			const error = document.createElement('div');
			error.className = 'guiders-chat-selector-error';
			error.textContent = this.state.error;
			target.appendChild(error);
			return;
		}

		// Botón nuevo chat (siempre visible arriba)
		const newChatBtn = this.createNewChatButton();
		target.appendChild(newChatBtn);

		// Separador
		if (this.state.chats.length > 0) {
			const separator = document.createElement('div');
			separator.className = 'guiders-chat-selector-separator';
			target.appendChild(separator);
		}

		// Lista de chats o mensaje vacío
		if (this.state.chats.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'guiders-chat-selector-empty';
			empty.textContent = this.config.emptyStateMessage;
			target.appendChild(empty);
		} else {
			const chatsToShow = this.state.chats.slice(0, this.config.maxChatsToShow);
			for (const chat of chatsToShow) {
				const item = this.createChatItem(chat);
				target.appendChild(item);
			}
		}
	}

	/**
	 * Crea el botón de nuevo chat
	 */
	private createNewChatButton(): HTMLElement {
		const btn = document.createElement('button');
		btn.className = 'guiders-chat-selector-new-chat';
		btn.setAttribute('type', 'button');

		const emoji = document.createElement('span');
		emoji.className = 'guiders-chat-selector-new-emoji';
		emoji.textContent = this.config.newChatEmoji;

		const label = document.createElement('span');
		label.textContent = this.config.newChatLabel;

		btn.appendChild(emoji);
		btn.appendChild(label);

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.handleNewChatClick();
		});

		return btn;
	}

	/**
	 * Crea un item de chat en el dropdown
	 */
	private createChatItem(chat: ChatSelectorItem): HTMLElement {
		const item = document.createElement('button');
		item.className = 'guiders-chat-selector-item';
		if (chat.isSelected) {
			item.classList.add('selected');
		}
		item.setAttribute('role', 'option');
		item.setAttribute('aria-selected', chat.isSelected ? 'true' : 'false');
		item.setAttribute('data-chat-id', chat.id);
		item.setAttribute('type', 'button');

		// Contenido principal
		const content = document.createElement('div');
		content.className = 'guiders-chat-selector-item-content';

		// Título
		const title = document.createElement('span');
		title.className = 'guiders-chat-selector-item-title';
		title.textContent = chat.title;
		content.appendChild(title);

		// Fecha del último mensaje
		if (chat.lastMessageDate) {
			const date = document.createElement('span');
			date.className = 'guiders-chat-selector-item-date';
			date.textContent = formatDate(chat.lastMessageDate);
			content.appendChild(date);
		}

		item.appendChild(content);

		// Badge de mensajes no leídos
		if (this.config.showUnreadBadge && chat.unreadCount > 0) {
			const badge = document.createElement('span');
			badge.className = 'guiders-chat-selector-badge';
			badge.textContent = chat.unreadCount > 99 ? '99+' : chat.unreadCount.toString();
			item.appendChild(badge);
		}

		// Event listener
		item.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.handleChatSelect(chat.id);
		});

		return item;
	}


	/**
	 * Abre el dropdown
	 */
	public open(): void {
		if (this.state.isOpen) return;

		this.state.isOpen = true;
		if (this.dropdownElement) {
			this.dropdownElement.style.display = 'block';
		}
		if (this.container) {
			this.container.setAttribute('aria-expanded', 'true');
		}
		if (this.triggerElement) {
			this.triggerElement.classList.add('open');
		}

		// Listener para cerrar al hacer clic fuera
		document.addEventListener('click', this.boundHandleOutsideClick);

		// Notificar apertura
		if (this.callbacks.onDropdownOpen) {
			this.callbacks.onDropdownOpen();
		}

		debugLog('[ChatSelectorUI] Dropdown abierto');
	}

	/**
	 * Cierra el dropdown
	 */
	public close(): void {
		if (!this.state.isOpen) return;

		this.state.isOpen = false;
		if (this.dropdownElement) {
			this.dropdownElement.style.display = 'none';
		}
		if (this.container) {
			this.container.setAttribute('aria-expanded', 'false');
		}
		if (this.triggerElement) {
			this.triggerElement.classList.remove('open');
		}

		// Remover listener
		document.removeEventListener('click', this.boundHandleOutsideClick);

		// Notificar cierre
		if (this.callbacks.onDropdownClose) {
			this.callbacks.onDropdownClose();
		}

		debugLog('[ChatSelectorUI] Dropdown cerrado');
	}

	/**
	 * Alterna el estado del dropdown
	 */
	public toggle(): void {
		if (this.state.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	/**
	 * Maneja clic fuera del dropdown
	 */
	private handleOutsideClick(e: MouseEvent): void {
		if (this.container && !this.container.contains(e.target as Node)) {
			this.close();
		}
	}

	/**
	 * Maneja la selección de un chat
	 */
	private handleChatSelect(chatId: string): void {
		debugLog('[ChatSelectorUI] Chat seleccionado:', chatId);

		this.state.selectedChatId = chatId;
		this.updateSelectedState();
		this.close();

		if (this.callbacks.onChatSelected) {
			this.callbacks.onChatSelected(chatId);
		}
	}

	/**
	 * Maneja clic en nuevo chat
	 */
	private handleNewChatClick(): void {
		debugLog('[ChatSelectorUI] Nuevo chat solicitado');

		this.close();

		if (this.callbacks.onNewChatRequested) {
			this.callbacks.onNewChatRequested();
		}
	}

	/**
	 * Actualiza el estado visual de selección
	 */
	private updateSelectedState(): void {
		this.state.chats = this.state.chats.map(chat => ({
			...chat,
			isSelected: chat.id === this.state.selectedChatId
		}));
		this.updateDropdownContent();
	}

	/**
	 * Establece la lista de chats
	 */
	public setChats(chats: ChatSelectorItem[]): void {
		this.state.chats = chats.map(chat => ({
			...chat,
			isSelected: chat.id === this.state.selectedChatId
		}));
		this.state.isLoading = false; // Resetear loading al establecer chats
		this.state.error = null;
		this.updateDropdownContent();
		debugLog('[ChatSelectorUI] Chats actualizados:', chats.length);
	}

	/**
	 * Establece el chat seleccionado
	 */
	public setSelectedChat(chatId: string | null): void {
		this.state.selectedChatId = chatId;
		this.updateSelectedState();
	}

	/**
	 * Establece el estado de carga
	 */
	public setLoading(loading: boolean): void {
		this.state.isLoading = loading;
		this.updateDropdownContent();
	}

	/**
	 * Establece un error
	 */
	public setError(error: string | null): void {
		this.state.error = error;
		this.state.isLoading = false;
		this.updateDropdownContent();
	}

	/**
	 * Convierte una lista de ChatV2 a ChatSelectorItem[]
	 */
	public static fromChatV2List(chats: ChatV2[], selectedChatId?: string | null): ChatSelectorItem[] {
		return chatV2ListToSelectorItems(chats, selectedChatId, false);
	}

	/**
	 * Verifica si el selector está habilitado
	 */
	public isEnabled(): boolean {
		return this.config.enabled;
	}

	/**
	 * Verifica si el dropdown está abierto
	 */
	public isOpen(): boolean {
		return this.state.isOpen;
	}

	/**
	 * Obtiene el elemento contenedor
	 */
	public getElement(): HTMLElement | null {
		return this.container;
	}

	/**
	 * Actualiza la configuración
	 */
	public updateConfig(config: Partial<ChatSelectorConfig>): void {
		if (config.enabled !== undefined) this.config.enabled = config.enabled;
		if (config.newChatLabel !== undefined) this.config.newChatLabel = config.newChatLabel;
		if (config.newChatEmoji !== undefined) this.config.newChatEmoji = config.newChatEmoji;
		if (config.maxChatsToShow !== undefined) this.config.maxChatsToShow = config.maxChatsToShow;
		if (config.showUnreadBadge !== undefined) this.config.showUnreadBadge = config.showUnreadBadge;
		if (config.emptyStateMessage !== undefined) this.config.emptyStateMessage = config.emptyStateMessage;

		this.updateDropdownContent();
		debugLog('[ChatSelectorUI] Configuración actualizada');
	}

	/**
	 * Actualiza los callbacks
	 */
	public updateCallbacks(callbacks: Partial<ChatSelectorCallbacks>): void {
		if (callbacks.onChatSelected) this.callbacks.onChatSelected = callbacks.onChatSelected;
		if (callbacks.onNewChatRequested) this.callbacks.onNewChatRequested = callbacks.onNewChatRequested;
		if (callbacks.onDropdownOpen) this.callbacks.onDropdownOpen = callbacks.onDropdownOpen;
		if (callbacks.onDropdownClose) this.callbacks.onDropdownClose = callbacks.onDropdownClose;
	}

	/**
	 * Destruye el componente y limpia recursos
	 */
	public destroy(): void {
		document.removeEventListener('click', this.boundHandleOutsideClick);

		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}

		this.container = null;
		this.triggerElement = null;
		this.dropdownElement = null;

		debugLog('[ChatSelectorUI] Componente destruido');
	}

	/**
	 * Retorna los estilos CSS del componente
	 */
	public static getStyles(): string {
		return `
			.guiders-chat-selector {
				position: relative;
				display: inline-flex;
				align-items: center;
			}

			.guiders-chat-selector-trigger {
				display: flex;
				align-items: center;
				justify-content: center;
				background: transparent;
				border: none;
				cursor: pointer;
				padding: 4px 8px;
				border-radius: 4px;
				transition: background-color 0.2s ease;
				margin-left: 4px;
			}

			.guiders-chat-selector-trigger:hover {
				background-color: rgba(255, 255, 255, 0.1);
			}

			.guiders-chat-selector-arrow {
				font-size: 10px;
				color: inherit;
				opacity: 0.7;
				transition: transform 0.2s ease;
			}

			.guiders-chat-selector-trigger.open .guiders-chat-selector-arrow {
				transform: rotate(180deg);
			}

			.guiders-chat-selector-dropdown {
				position: absolute;
				top: 100%;
				left: 0;
				min-width: 250px;
				max-width: 300px;
				max-height: 350px;
				overflow-y: auto;
				background: white;
				border-radius: 8px;
				box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
				z-index: 1000;
				margin-top: 8px;
			}

			.guiders-chat-selector-loading,
			.guiders-chat-selector-error,
			.guiders-chat-selector-empty {
				padding: 16px;
				text-align: center;
				color: #666;
				font-size: 14px;
			}

			.guiders-chat-selector-error {
				color: #dc3545;
			}

			.guiders-spinner {
				display: inline-block;
				width: 14px;
				height: 14px;
				border: 2px solid #e0e0e0;
				border-top-color: #007bff;
				border-radius: 50%;
				animation: guiders-spin 0.8s linear infinite;
				margin-right: 8px;
				vertical-align: middle;
			}

			@keyframes guiders-spin {
				to { transform: rotate(360deg); }
			}

			.guiders-chat-selector-new-chat {
				display: flex;
				align-items: center;
				width: 100%;
				padding: 12px 16px;
				background: transparent;
				border: none;
				cursor: pointer;
				text-align: left;
				font-size: 14px;
				color: #007bff;
				transition: background-color 0.2s ease;
			}

			.guiders-chat-selector-new-chat:hover {
				background-color: #f0f7ff;
			}

			.guiders-chat-selector-new-emoji {
				font-size: 16px;
				margin-right: 8px;
			}

			.guiders-chat-selector-separator {
				height: 1px;
				background: #e0e0e0;
				margin: 4px 0;
			}

			.guiders-chat-selector-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				padding: 12px 16px;
				background: transparent;
				border: none;
				cursor: pointer;
				text-align: left;
				transition: background-color 0.2s ease;
			}

			.guiders-chat-selector-item:hover {
				background-color: #f5f5f5;
			}

			.guiders-chat-selector-item.selected {
				background-color: #e8f4ff;
			}

			.guiders-chat-selector-item-content {
				flex: 1;
				overflow: hidden;
			}

			.guiders-chat-selector-item-title {
				display: block;
				font-size: 14px;
				color: #333;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.guiders-chat-selector-item-date {
				display: block;
				font-size: 12px;
				color: #999;
				margin-top: 2px;
			}

			.guiders-chat-selector-badge {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				min-width: 20px;
				height: 20px;
				padding: 0 6px;
				background: #dc3545;
				color: white;
				font-size: 11px;
				font-weight: bold;
				border-radius: 10px;
				margin-left: 8px;
			}
		`;
	}
}
