// index.ts - Exports principales del módulo presentation

// Re-exportar desde chat.ts para mantener compatibilidad
export * from './chat';

// También permitir importaciones directas de componentes específicos
export { ChatUI } from './components/chat-ui';
export { ChatInputUI } from './components/chat-input-ui';

// Re-exportar tipos
export type { 
	Sender, 
	ChatUIOptions, 
	ChatMessageParams, 
	ActiveInterval 
} from './types/chat-types';

// Re-exportar utilidades
export { 
	formatTime, 
	formatDate, 
	isBot, 
	generateInitials, 
	createDateSeparator 
} from './utils/chat-utils';