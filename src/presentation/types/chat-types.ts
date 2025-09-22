// chat-types.ts - Tipos e interfaces para el sistema de chat

import { WelcomeMessageConfig } from "../../core/welcome-message-manager";

/**
 * Tipo para identificar el remitente de un mensaje
 */
export type Sender = 'user' | 'other';

/**
 * Opciones de configuración del chat UI
 */
export interface ChatUIOptions {
	/** ID de un contenedor existente donde renderizar el chat */
	containerId?: string;
	/** Indica si se debe crear un widget nuevo en el body */
	widget?: boolean;
	/** Ancho del widget del chat */
	widgetWidth?: string;
	/** Alto del widget del chat */
	widgetHeight?: string;
	/** Color de fondo para mensajes del usuario */
	userBgColor?: string;
	/** Color de fondo para mensajes de otros usuarios */
	otherBgColor?: string;
	/** Color del texto */
	textColor?: string;
	/** Ancho máximo de los mensajes */
	maxWidthMessage?: string;
	/** Configuración del mensaje de bienvenida */
	welcomeMessage?: Partial<WelcomeMessageConfig>;
}

/**
 * Parámetros para renderizar un mensaje en el chat
 */
export interface ChatMessageParams {
	/** Texto del mensaje */
	text: string;
	/** Remitente del mensaje */
	sender: Sender;
	/** Timestamp de creación del mensaje en milisegundos */
	timestamp?: number;
	/** ID del remitente del mensaje */
	senderId?: string;
}

/**
 * Configuración para intervalos activos del chat
 */
export interface ActiveInterval {
	/** ID del intervalo */
	id: number | null;
	/** Función callback a ejecutar */
	callback: () => void;
	/** Intervalo en milisegundos */
	intervalMs: number;
}