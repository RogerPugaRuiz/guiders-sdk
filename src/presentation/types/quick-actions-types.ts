// quick-actions-types.ts - Tipos e interfaces para el sistema de Quick Actions

/**
 * Payload para acciones de Quick Action
 */
export interface QuickActionPayload {
	/** Mensaje a enviar al chat */
	message?: string;
	/** Metadata adicional para el backend */
	metadata?: Record<string, any>;
}

/**
 * Definición de una acción de Quick Action
 */
export interface QuickAction {
	/** Tipo de acción a ejecutar */
	type: 'send_message' | 'open_url' | 'request_agent' | 'custom';
	/** Payload de la acción (string para URL/mensaje simple, objeto para datos complejos) */
	payload?: string | QuickActionPayload;
}

/**
 * Configuración de un botón de Quick Action
 */
export interface QuickActionButton {
	/** Identificador único del botón */
	id: string;
	/** Texto visible del botón */
	label: string;
	/** Emoji opcional para mostrar antes del texto */
	emoji?: string;
	/** Acción a ejecutar cuando se hace clic */
	action: QuickAction;
}

/**
 * Configuración del sistema de Quick Actions (para el usuario)
 */
export interface QuickActionsConfig {
	/** Habilitar el sistema de Quick Actions */
	enabled: boolean;
	/** Mensaje de bienvenida mostrado sobre los botones */
	welcomeMessage?: string;
	/** Mostrar al abrir el chat por primera vez */
	showOnFirstOpen?: boolean;
	/** Mostrar al iniciar una nueva conversación */
	showOnChatStart?: boolean;
	/** Lista de botones a mostrar */
	buttons: QuickActionButton[];
	/** Callback para acciones personalizadas (type: 'custom') */
	onCustomAction?: (buttonId: string, action: QuickAction) => void;
}

/**
 * Configuración interna con todos los valores resueltos
 */
export interface InternalQuickActionsConfig {
	enabled: boolean;
	welcomeMessage: string;
	showOnFirstOpen: boolean;
	showOnChatStart: boolean;
	buttons: QuickActionButton[];
	onCustomAction?: (buttonId: string, action: QuickAction) => void;
}
