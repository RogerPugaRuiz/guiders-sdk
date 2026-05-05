// chat-selector-types.ts - Tipos e interfaces para el sistema de selección de chats
//
// Patches (Chunk 2):
//   #20 — `ChatSelectorStatus` extracted as a named alias instead of an inline
//         union on `ChatSelectorItem.status`. Note: this is intentionally NOT
//         aliased to `ChatStatus` from `types/websocket-types`; the two enums
//         describe different concepts (server-canonical vs UI-categorical) and
//         have only `'PENDING'` and `'CLOSED'` in common.
//   #21 — All fields marked `readonly` to make the structural intent explicit
//         and to prevent accidental in-place mutation of objects flowing
//         through signals (which would bypass change detection).

/**
 * Status values surfaced by the chat selector.
 *
 * Distinct from `ChatStatus` in `src/types/websocket-types.ts`: the server's
 * canonical status enum is `'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'`;
 * the selector groups conversations into UI-meaningful buckets (assigned vs
 * abandoned vs transferred). The selector's status is derived from a richer
 * server-side record by `chatV2ListToSelectorItems`, not from `ChatStatus`
 * directly.
 */
export type ChatSelectorStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'ACTIVE'
    | 'CLOSED'
    | 'TRANSFERRED'
    | 'ABANDONED';

/**
 * Representación de un chat en el selector dropdown
 */
export interface ChatSelectorItem {
    /** ID único del chat */
    readonly id: string;
    /** Título o descripción breve del chat */
    readonly title: string;
    /** Fecha del último mensaje */
    readonly lastMessageDate?: Date;
    /** Preview del último mensaje (truncado) */
    readonly lastMessagePreview?: string;
    /** Número de mensajes no leídos */
    readonly unreadCount: number;
    /** Estado del chat */
    readonly status: ChatSelectorStatus;
    /** Indica si es el chat actualmente seleccionado */
    readonly isSelected?: boolean;
    /** URL del avatar del comercial asignado */
    readonly avatarUrl?: string;
    /** ID del comercial asignado al chat (para lookup de presencia) */
    readonly assignedCommercialId?: string;
}

/**
 * Configuración del selector de chats (para el usuario)
 */
export interface ChatSelectorConfig {
    /** Habilitar el selector de chats */
    readonly enabled: boolean;
    /** Texto del botón para crear nuevo chat */
    readonly newChatLabel?: string;
    /** Emoji del botón nuevo chat */
    readonly newChatEmoji?: string;
    /** Máximo de chats a mostrar en el dropdown */
    readonly maxChatsToShow?: number;
    /** Mostrar badge de mensajes no leídos */
    readonly showUnreadBadge?: boolean;
    /** Mensaje cuando no hay conversaciones anteriores */
    readonly emptyStateMessage?: string;
}

/**
 * Configuración interna con todos los valores resueltos
 */
export interface InternalChatSelectorConfig {
    readonly enabled: boolean;
    readonly newChatLabel: string;
    readonly newChatEmoji: string;
    readonly maxChatsToShow: number;
    readonly showUnreadBadge: boolean;
    readonly emptyStateMessage: string;
}

/**
 * Estado interno del componente selector
 */
export interface ChatSelectorState {
    /** El dropdown está abierto */
    readonly isOpen: boolean;
    /** Se están cargando los chats */
    readonly isLoading: boolean;
    /** Lista de chats disponibles */
    readonly chats: readonly ChatSelectorItem[];
    /** ID del chat actualmente seleccionado */
    readonly selectedChatId: string | null;
    /** Error al cargar chats */
    readonly error: string | null;
}

/**
 * Callbacks del selector de chats
 */
export interface ChatSelectorCallbacks {
    /** Se seleccionó un chat existente */
    readonly onChatSelected?: (chatId: string) => void;
    /** Se solicitó crear un nuevo chat */
    readonly onNewChatRequested?: () => void;
    /** El dropdown se abrió (para cargar chats) */
    readonly onDropdownOpen?: () => void;
    /** El dropdown se cerró */
    readonly onDropdownClose?: () => void;
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
    emptyStateMessage: 'No hay conversaciones anteriores',
} as const;
