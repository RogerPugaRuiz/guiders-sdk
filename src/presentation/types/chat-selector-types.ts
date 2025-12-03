// chat-selector-types.ts - Tipos e interfaces para el sistema de selección de chats

/**
 * Representación de un chat en el selector dropdown
 */
export interface ChatSelectorItem {
	/** ID único del chat */
	id: string;
	/** Título o descripción breve del chat */
	title: string;
	/** Fecha del último mensaje */
	lastMessageDate?: Date;
	/** Preview del último mensaje (truncado) */
	lastMessagePreview?: string;
	/** Número de mensajes no leídos */
	unreadCount: number;
	/** Estado del chat */
	status: 'PENDING' | 'ASSIGNED' | 'ACTIVE' | 'CLOSED' | 'TRANSFERRED' | 'ABANDONED';
	/** Indica si es el chat actualmente seleccionado */
	isSelected?: boolean;
	/** URL del avatar del comercial asignado */
	avatarUrl?: string;
}

/**
 * Configuración del selector de chats (para el usuario)
 */
export interface ChatSelectorConfig {
	/** Habilitar el selector de chats */
	enabled: boolean;
	/** Texto del botón para crear nuevo chat */
	newChatLabel?: string;
	/** Emoji del botón nuevo chat */
	newChatEmoji?: string;
	/** Máximo de chats a mostrar en el dropdown */
	maxChatsToShow?: number;
	/** Mostrar badge de mensajes no leídos */
	showUnreadBadge?: boolean;
	/** Mensaje cuando no hay conversaciones anteriores */
	emptyStateMessage?: string;
}

/**
 * Configuración interna con todos los valores resueltos
 */
export interface InternalChatSelectorConfig {
	enabled: boolean;
	newChatLabel: string;
	newChatEmoji: string;
	maxChatsToShow: number;
	showUnreadBadge: boolean;
	emptyStateMessage: string;
}

/**
 * Estado interno del componente selector
 */
export interface ChatSelectorState {
	/** El dropdown está abierto */
	isOpen: boolean;
	/** Se están cargando los chats */
	isLoading: boolean;
	/** Lista de chats disponibles */
	chats: ChatSelectorItem[];
	/** ID del chat actualmente seleccionado */
	selectedChatId: string | null;
	/** Error al cargar chats */
	error: string | null;
}

/**
 * Callbacks del selector de chats
 */
export interface ChatSelectorCallbacks {
	/** Se seleccionó un chat existente */
	onChatSelected?: (chatId: string) => void;
	/** Se solicitó crear un nuevo chat */
	onNewChatRequested?: () => void;
	/** El dropdown se abrió (para cargar chats) */
	onDropdownOpen?: () => void;
	/** El dropdown se cerró */
	onDropdownClose?: () => void;
}

/**
 * Valores por defecto para la configuración
 */
export const DEFAULT_CHAT_SELECTOR_CONFIG: InternalChatSelectorConfig = {
	enabled: false,
	newChatLabel: 'Nueva conversación',
	newChatEmoji: '+',
	maxChatsToShow: 10,
	showUnreadBadge: true,
	emptyStateMessage: 'No hay conversaciones anteriores'
};
