/**
 * Utilidades compartidas para componentes de lista de chats
 * (ChatSelectorUI, ChatListView)
 */

import { ChatV2 } from '../../types';
import {
	ChatSelectorItem,
	ChatSelectorConfig,
	InternalChatSelectorConfig,
	DEFAULT_CHAT_SELECTOR_CONFIG
} from '../types/chat-selector-types';

/**
 * Crea la configuración interna mergeando con defaults
 */
export function createInternalConfig(config: Partial<ChatSelectorConfig>): InternalChatSelectorConfig {
	return {
		enabled: config.enabled ?? DEFAULT_CHAT_SELECTOR_CONFIG.enabled,
		newChatLabel: config.newChatLabel ?? DEFAULT_CHAT_SELECTOR_CONFIG.newChatLabel,
		newChatEmoji: config.newChatEmoji ?? DEFAULT_CHAT_SELECTOR_CONFIG.newChatEmoji,
		maxChatsToShow: config.maxChatsToShow ?? DEFAULT_CHAT_SELECTOR_CONFIG.maxChatsToShow,
		showUnreadBadge: config.showUnreadBadge ?? DEFAULT_CHAT_SELECTOR_CONFIG.showUnreadBadge,
		emptyStateMessage: config.emptyStateMessage ?? DEFAULT_CHAT_SELECTOR_CONFIG.emptyStateMessage
	};
}

/**
 * Formatea una fecha en formato relativo corto (1m, 2h, 3d)
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return 'Ahora';
	if (minutes < 60) return `${minutes}m`;
	if (hours < 24) return `${hours}h`;
	if (days < 7) return `${days}d`;
	return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Formatea una fecha para mostrar (Ayer, Hace X días, fecha completa)
 */
export function formatDate(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - new Date(date).getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (days === 0) {
		return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	} else if (days === 1) {
		return 'Ayer';
	} else if (days < 7) {
		return `Hace ${days} días`;
	} else {
		return new Date(date).toLocaleDateString();
	}
}

/**
 * Trunca un texto a una longitud máxima con ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength).trim() + '...';
}

/**
 * Obtiene el texto del estado del chat
 */
export function getStatusText(status: string): string {
	const statusMap: Record<string, string> = {
		'PENDING': 'Pendiente',
		'ASSIGNED': 'En curso',
		'ACTIVE': 'Activo',
		'CLOSED': 'Cerrado',
		'TRANSFERRED': 'Transferido',
		'ABANDONED': 'Sin respuesta'
	};
	return statusMap[status] || status;
}

/**
 * Genera un título para un chat basándose en sus datos
 * @param style 'full' para "Chat con X" o 'short' para solo el nombre
 */
export function generateChatTitle(chat: ChatV2, style: 'full' | 'short' = 'full'): string {
	// Si hay un comercial asignado
	if (chat.assignedCommercial?.name) {
		return style === 'full'
			? `Chat con ${chat.assignedCommercial.name}`
			: chat.assignedCommercial.name;
	}

	// Si hay fecha
	if (chat.createdAt) {
		const date = new Date(chat.createdAt);
		return style === 'full'
			? `Conversación del ${date.toLocaleDateString()}`
			: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
	}

	// Fallback
	return style === 'full'
		? `Conversación #${chat.id.slice(-4)}`
		: 'Conversación';
}

/**
 * Convierte una lista de ChatV2 a ChatSelectorItem[]
 * @param includePreview Si es true, incluye lastMessagePreview y avatarUrl
 */
export function chatV2ListToSelectorItems(
	chats: ChatV2[],
	selectedChatId?: string | null,
	includePreview: boolean = false
): ChatSelectorItem[] {
	return chats.map(chat => {
		const item: ChatSelectorItem = {
			id: chat.id,
			title: generateChatTitle(chat, includePreview ? 'short' : 'full'),
			lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined,
			unreadCount: chat.unreadMessagesCount || 0,
			status: chat.status as ChatSelectorItem['status'],
			isSelected: chat.id === selectedChatId
		};

		// Añadir campos opcionales para vista lista (Intercom style)
		if (includePreview) {
			item.lastMessagePreview = chat.lastMessagePreview;
			item.avatarUrl = chat.assignedCommercial?.avatarUrl;
		}

		return item;
	});
}
