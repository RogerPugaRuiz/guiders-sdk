/**
 * Presence and Typing Indicators Types
 *
 * Tipos para el sistema de presencia en tiempo real y typing indicators
 * del SDK de Guiders (frontend para visitantes).
 */

/**
 * Estados de presencia posibles para usuarios
 */
export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy' | 'chatting';

/**
 * Tipo de usuario en el sistema
 */
export type UserType = 'commercial' | 'visitor';

/**
 * Participante de un chat con información de presencia
 */
export interface ChatParticipant {
  /** ID único del usuario */
  userId: string;

  /** Tipo de usuario (comercial o visitante) */
  userType: UserType;

  /** Estado de conexión actual */
  connectionStatus: PresenceStatus;

  /** Indica si el usuario está escribiendo actualmente */
  isTyping: boolean;

  /** Timestamp de la última actividad */
  lastActivity?: string;

  /** Nombre del usuario (opcional) */
  name?: string;

  /** Avatar del usuario (opcional) */
  avatar?: string;
}

/**
 * Estado de presencia completo de un chat
 */
export interface ChatPresence {
  /** ID del chat */
  chatId: string;

  /** Lista de participantes con su información de presencia */
  participants: ChatParticipant[];

  /** Timestamp del estado actual */
  timestamp: string;
}

/**
 * Evento de cambio de presencia (WebSocket)
 */
export interface PresenceChangedEvent {
  /** ID del usuario que cambió */
  userId: string;

  /** Tipo de usuario */
  userType: UserType;

  /** Nuevo estado */
  status: PresenceStatus;

  /** Estado anterior */
  previousStatus: PresenceStatus;

  /** Timestamp del cambio */
  timestamp: string;
}

/**
 * Evento de typing (WebSocket)
 */
export interface TypingEvent {
  /** ID del chat */
  chatId: string;

  /** ID del usuario que está escribiendo */
  userId: string;

  /** Tipo de usuario */
  userType: UserType;

  /** Timestamp del evento */
  timestamp: string;
}

/**
 * Payload para unirse a una sala de chat
 */
export interface JoinChatRoomPayload {
  chatId: string;
}

/**
 * Respuesta al unirse a una sala de chat
 */
export interface JoinChatRoomResponse {
  success: boolean;
  message?: string;
  chatId?: string;
}

/**
 * Payload para enviar evento de typing
 */
export interface TypingPayload {
  chatId: string;
  userId: string;
  userType: UserType;
}

/**
 * Configuración del sistema de presencia
 */
export interface PresenceConfig {
  /** Habilitar sistema de presencia */
  enabled: boolean;

  /** Intervalo de polling para actualizar presencia (ms) */
  pollingInterval: number;

  /** Mostrar indicador de typing */
  showTypingIndicator: boolean;

  /** Timeout para auto-detener typing (ms) */
  typingTimeout: number;

  /** Debounce para detectar typing (ms) */
  typingDebounce: number;
}

/**
 * Callback para cambios de presencia
 */
export type PresenceChangeCallback = (event: PresenceChangedEvent) => void;

/**
 * Callback para cambios de typing
 */
export type TypingChangeCallback = (event: TypingEvent, isTyping: boolean) => void;

/**
 * Mapeo de estados de presencia a textos legibles
 */
export const PresenceStatusText: Record<PresenceStatus, string> = {
  online: 'Disponible',
  busy: 'Ocupado',
  away: 'Ausente',
  offline: 'Sin conexión',
  chatting: 'En conversación'
};

/**
 * Mapeo de estados de presencia a colores CSS
 */
export const PresenceStatusColor: Record<PresenceStatus, string> = {
  online: '#4ade80',    // Verde
  busy: '#fbbf24',      // Amarillo
  away: '#fbbf24',      // Amarillo
  offline: '#9ca3af',   // Gris
  chatting: '#60a5fa'   // Azul
};
