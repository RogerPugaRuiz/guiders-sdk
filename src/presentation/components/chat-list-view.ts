// chat-list-view.ts - Vista de lista de conversaciones estilo Intercom

import { debugLog } from '../../utils/debug-logger';
import {
	ChatSelectorItem,
	ChatSelectorConfig,
	InternalChatSelectorConfig
} from '../types/chat-selector-types';
import { ChatV2 } from '../../types';
import {
	createInternalConfig,
	formatRelativeTime,
	truncateText,
	getStatusText,
	chatV2ListToSelectorItems
} from '../utils/chat-list-utils';

/**
 * Callbacks para la vista de lista de chats
 */
export interface ChatListViewCallbacks {
	/** Se seleccionó un chat existente */
	onChatSelected?: (chatId: string) => void;
	/** Se solicitó crear un nuevo chat */
	onNewChatRequested?: () => void;
	/** Se solicitó cerrar la vista (volver al chat) */
	onBackToChat?: () => void;
	/** Se solicitó cerrar el widget completo */
	onClose?: () => void;
}

/**
 * Estado de la vista de lista de chats
 */
interface ChatListViewState {
	isLoading: boolean;
	chats: ChatSelectorItem[];
	selectedChatId: string | null;
	error: string | null;
}

/**
 * ChatListView - Vista de lista de conversaciones estilo Intercom
 *
 * Muestra una lista de todas las conversaciones del visitante
 * con preview del último mensaje, fecha y badges de no leídos.
 */
export class ChatListView {
	private config: InternalChatSelectorConfig;
	private state: ChatListViewState;
	private callbacks: ChatListViewCallbacks;
	private container: HTMLElement | null = null;
	private listContainer: HTMLElement | null = null;

	constructor(config: Partial<ChatSelectorConfig> = {}, callbacks: ChatListViewCallbacks = {}) {
		this.config = createInternalConfig(config);

		this.state = {
			isLoading: false,
			chats: [],
			selectedChatId: null,
			error: null
		};

		this.callbacks = callbacks;
		debugLog('[ChatListView] Inicializado con config:', this.config);
	}

	/**
	 * Renderiza la vista completa
	 */
	public render(): HTMLElement {
		this.container = document.createElement('div');
		this.container.className = 'guiders-chat-list-view';

		// Header
		const header = this.renderHeader();
		this.container.appendChild(header);

		// Lista de chats
		this.listContainer = document.createElement('div');
		this.listContainer.className = 'guiders-chat-list-container';
		this.updateListContent();
		this.container.appendChild(this.listContainer);

		// NOTA: Los estilos se inyectan en el Shadow DOM desde chat-ui.ts
		// No llamamos a injectStyles() aquí porque no funcionaría en Shadow DOM

		debugLog('[ChatListView] Vista renderizada');
		return this.container;
	}

	/**
	 * Renderiza el header con título y botón cerrar
	 */
	private renderHeader(): HTMLElement {
		const header = document.createElement('div');
		header.className = 'guiders-chat-list-header';

		// Título a la izquierda
		const title = document.createElement('h2');
		title.className = 'guiders-chat-list-title';
		title.textContent = 'Mensajes';

		// Botón de cerrar (X) a la derecha
		const closeButton = document.createElement('button');
		closeButton.className = 'guiders-chat-list-close-btn';
		closeButton.setAttribute('aria-label', 'Cerrar');
		closeButton.innerHTML = `
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		`;
		closeButton.addEventListener('click', () => {
			if (this.callbacks.onClose) {
				this.callbacks.onClose();
			}
		});

		header.appendChild(title);
		header.appendChild(closeButton);

		return header;
	}

	/**
	 * Actualiza el contenido de la lista
	 */
	private updateListContent(): void {
		if (!this.listContainer) return;

		this.listContainer.innerHTML = '';

		// Estado de carga
		if (this.state.isLoading) {
			const loading = document.createElement('div');
			loading.className = 'guiders-chat-list-loading';
			loading.innerHTML = '<span class="guiders-spinner"></span> Cargando conversaciones...';
			this.listContainer.appendChild(loading);
			return;
		}

		// Error
		if (this.state.error) {
			const error = document.createElement('div');
			error.className = 'guiders-chat-list-error';
			error.textContent = this.state.error;
			this.listContainer.appendChild(error);
			return;
		}

		// Botón nueva conversación (siempre al principio)
		const newChatButton = this.renderNewChatButton();
		this.listContainer.appendChild(newChatButton);

		// Lista de chats
		if (this.state.chats.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'guiders-chat-list-empty';
			empty.textContent = this.config.emptyStateMessage;
			this.listContainer.appendChild(empty);
		} else {
			this.state.chats.forEach(chat => {
				const chatItem = this.renderChatItem(chat);
				this.listContainer!.appendChild(chatItem);
			});
		}
	}

	/**
	 * Renderiza el botón de nueva conversación
	 */
	private renderNewChatButton(): HTMLElement {
		const button = document.createElement('button');
		button.className = 'guiders-chat-list-new-chat';
		button.innerHTML = `
			<span class="guiders-chat-list-new-icon">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					<line x1="12" y1="8" x2="12" y2="14"></line>
					<line x1="9" y1="11" x2="15" y2="11"></line>
				</svg>
			</span>
			<span class="guiders-chat-list-new-text">${this.config.newChatLabel}</span>
		`;

		button.addEventListener('click', () => {
			debugLog('[ChatListView] Nueva conversación solicitada');
			if (this.callbacks.onNewChatRequested) {
				this.callbacks.onNewChatRequested();
			}
		});

		return button;
	}

	/**
	 * Renderiza un item de chat en la lista
	 */
	private renderChatItem(chat: ChatSelectorItem): HTMLElement {
		const item = document.createElement('button');
		item.className = 'guiders-chat-list-item';
		if (chat.id === this.state.selectedChatId) {
			item.classList.add('selected');
		}
		if (chat.unreadCount > 0) {
			item.classList.add('unread');
		}

		// Avatar (imagen del comercial o icono genérico)
		const avatar = document.createElement('div');
		avatar.className = 'guiders-chat-list-avatar';
		if (chat.avatarUrl) {
			const img = document.createElement('img');
			img.src = chat.avatarUrl;
			img.alt = chat.title;
			img.className = 'guiders-chat-list-avatar-img';
			avatar.appendChild(img);
		} else {
			avatar.innerHTML = `
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
			`;
		}

		// Contenido (título y preview)
		const content = document.createElement('div');
		content.className = 'guiders-chat-list-content';

		const titleRow = document.createElement('div');
		titleRow.className = 'guiders-chat-list-title-row';

		const title = document.createElement('span');
		title.className = 'guiders-chat-list-item-title';
		title.textContent = chat.title || 'Conversación';

		const time = document.createElement('span');
		time.className = 'guiders-chat-list-item-time';
		time.textContent = chat.lastMessageDate ? formatRelativeTime(chat.lastMessageDate) : '';

		titleRow.appendChild(title);
		titleRow.appendChild(time);

		const previewRow = document.createElement('div');
		previewRow.className = 'guiders-chat-list-preview-row';

		const preview = document.createElement('span');
		preview.className = 'guiders-chat-list-preview';
		// Mostrar preview del mensaje o fallback al estado si no hay preview
		const previewText = chat.lastMessagePreview
			? truncateText(chat.lastMessagePreview, 50)
			: getStatusText(chat.status);
		preview.textContent = previewText;

		previewRow.appendChild(preview);

		// Badge de no leídos
		if (this.config.showUnreadBadge && chat.unreadCount > 0) {
			const badge = document.createElement('span');
			badge.className = 'guiders-chat-list-badge';
			badge.textContent = chat.unreadCount > 99 ? '99+' : chat.unreadCount.toString();
			previewRow.appendChild(badge);
		}

		content.appendChild(titleRow);
		content.appendChild(previewRow);

		item.appendChild(avatar);
		item.appendChild(content);

		// Click handler
		item.addEventListener('click', () => {
			debugLog('[ChatListView] Chat seleccionado:', chat.id);
			if (this.callbacks.onChatSelected) {
				this.callbacks.onChatSelected(chat.id);
			}
		});

		return item;
	}


	/**
	 * Establece la lista de chats
	 */
	public setChats(chats: ChatSelectorItem[]): void {
		this.state.chats = chats;
		this.state.isLoading = false;
		this.state.error = null;
		this.updateListContent();
		debugLog('[ChatListView] Chats actualizados:', chats.length);
	}

	/**
	 * Establece el chat seleccionado
	 */
	public setSelectedChat(chatId: string | null): void {
		this.state.selectedChatId = chatId;
		this.updateListContent();
	}

	/**
	 * Establece el estado de carga
	 */
	public setLoading(loading: boolean): void {
		this.state.isLoading = loading;
		this.updateListContent();
	}

	/**
	 * Establece un error
	 */
	public setError(error: string | null): void {
		this.state.error = error;
		this.state.isLoading = false;
		this.updateListContent();
	}

	/**
	 * Destruye el componente
	 */
	public destroy(): void {
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
		this.container = null;
		this.listContainer = null;
		debugLog('[ChatListView] Destruido');
	}

	/**
	 * Convierte una lista de ChatV2 a ChatSelectorItem[]
	 */
	public static fromChatV2List(chats: ChatV2[], selectedChatId?: string | null): ChatSelectorItem[] {
		return chatV2ListToSelectorItems(chats, selectedChatId, true);
	}

	/**
	 * Inyecta los estilos CSS del componente
	 */
	private injectStyles(): void {
		const styleId = 'guiders-chat-list-view-styles';
		if (document.getElementById(styleId)) return;

		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			.guiders-chat-list-view {
				display: flex;
				flex-direction: column;
				height: 100%;
				background: #fff;
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			}

			.guiders-chat-list-header {
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 16px;
				border-bottom: 1px solid #e5e5e5;
				position: relative;
				min-height: 56px;
				background: #1a1a1a;
				color: #fff;
			}

			.guiders-chat-list-title {
				margin: 0;
				font-size: 16px;
				font-weight: 600;
			}

			.guiders-chat-list-close-btn {
				position: absolute;
				right: 12px;
				top: 50%;
				transform: translateY(-50%);
				background: none;
				border: none;
				padding: 8px;
				cursor: pointer;
				color: #fff;
				opacity: 0.8;
				transition: opacity 0.2s;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.guiders-chat-list-close-btn:hover {
				opacity: 1;
			}

			.guiders-chat-list-container {
				flex: 1;
				overflow-y: auto;
			}

			.guiders-chat-list-loading,
			.guiders-chat-list-error,
			.guiders-chat-list-empty {
				padding: 24px;
				text-align: center;
				color: #666;
				font-size: 14px;
			}

			.guiders-chat-list-error {
				color: #d32f2f;
			}

			.guiders-chat-list-new-chat {
				display: flex;
				align-items: center;
				gap: 12px;
				width: 100%;
				padding: 16px;
				border: none;
				border-bottom: 1px solid #e5e5e5;
				background: #f8f9fa;
				cursor: pointer;
				text-align: left;
				transition: background 0.2s;
			}

			.guiders-chat-list-new-chat:hover {
				background: #e9ecef;
			}

			.guiders-chat-list-new-icon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: #1a1a1a;
				color: #fff;
			}

			.guiders-chat-list-new-text {
				font-size: 14px;
				font-weight: 500;
				color: #1a1a1a;
			}

			.guiders-chat-list-item {
				display: flex;
				align-items: center;
				gap: 12px;
				width: 100%;
				padding: 12px 16px;
				border: none;
				border-bottom: 1px solid #f0f0f0;
				background: #fff;
				cursor: pointer;
				text-align: left;
				transition: background 0.2s;
			}

			.guiders-chat-list-item:hover {
				background: #f5f5f5;
			}

			.guiders-chat-list-item.selected {
				background: #e3f2fd;
			}

			.guiders-chat-list-avatar {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: #e0e0e0;
				color: #666;
				flex-shrink: 0;
			}

			.guiders-chat-list-content {
				flex: 1;
				min-width: 0;
			}

			.guiders-chat-list-title-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
				margin-bottom: 4px;
			}

			.guiders-chat-list-item-title {
				font-size: 14px;
				font-weight: 500;
				color: #1a1a1a;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.guiders-chat-list-item-time {
				font-size: 12px;
				color: #999;
				flex-shrink: 0;
			}

			.guiders-chat-list-preview-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}

			.guiders-chat-list-preview {
				font-size: 13px;
				color: #666;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.guiders-chat-list-badge {
				background: #f44336;
				color: #fff;
				font-size: 11px;
				font-weight: 600;
				padding: 2px 6px;
				border-radius: 10px;
				min-width: 18px;
				text-align: center;
				flex-shrink: 0;
			}

			/* Estilo para items con mensajes no leídos */
			.guiders-chat-list-item.unread .guiders-chat-list-preview {
				font-weight: 600;
				color: #333;
			}

			.guiders-chat-list-item.unread .guiders-chat-list-item-title {
				font-weight: 600;
			}

			.guiders-spinner {
				display: inline-block;
				width: 16px;
				height: 16px;
				border: 2px solid #e0e0e0;
				border-top-color: #1a1a1a;
				border-radius: 50%;
				animation: guiders-spin 1s linear infinite;
				margin-right: 8px;
				vertical-align: middle;
			}

			@keyframes guiders-spin {
				to { transform: rotate(360deg); }
			}
		`;
		document.head.appendChild(style);
	}
}
