// chat.ts - Archivo de compatibilidad que re-exporta desde las nuevas ubicaciones

// Re-exportar tipos
export type { Sender, ChatUIOptions, ChatMessageParams, ActiveInterval } from './types/chat-types';

// Re-exportar utilidades
export { 
	formatTime, 
	formatDate, 
	isBot, 
	generateInitials, 
	createDateSeparator 
} from './utils/chat-utils';

// Re-exportar componentes principales - usando export * para incluir TODOS los métodos
export { ChatUI } from './components/chat-ui';
export { ChatInputUI } from './components/chat-input-ui';

// Asegurar compatibilidad completa importando y re-exportando todo
export * from './components/chat-ui';
export * from './components/chat-input-ui';
export * from './types/chat-types';
export * from './utils/chat-utils';