/**
 * Presence and Typing Indicators Types
 *
 * Tipos para el sistema de presencia en tiempo real y typing indicators
 * del SDK de Guiders (frontend para visitantes).
 *
 * 🆕 NOVEDADES 2025:
 * - Eventos filtrados por chats activos (99%+ reducción de tráfico)
 * - Auto-join automático a sala personal (visitor:{id})
 * - Nuevo evento PresenceJoinedEvent para confirmar auto-join
 * - Detección automática de inactividad (5 min → away, 15 min → offline)
 * - Sistema de heartbeat recomendado (30 segundos)
 *
 * Referencias:
 * - Guía oficial: PRESENCIA_CHAT_GUIA.md
 * - Backend endpoints: /presence/chat/:id, /visitors/session/heartbeat
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
 * Evento de confirmación de unión a sala personal (WebSocket)
 * 🆕 Nuevo en 2025: Confirma auto-join automático a sala personal
 */
export interface PresenceJoinedEvent {
  /** ID del usuario que se unió */
  userId: string;

  /** Tipo de usuario */
  userType: UserType;

  /** Nombre de la sala a la que se unió (ej: 'visitor:uuid' o 'commercial:uuid') */
  roomName: string;

  /** Timestamp del evento */
  timestamp: number;

  /** Indica si fue auto-join automático (true) o manual (false) */
  automatic: boolean;
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

  /** Intervalo de heartbeat automático en milisegundos (default: 30000 = 30s según guía oficial) */
  heartbeatInterval?: number;

  /** Throttle para heartbeats de user-interaction en milisegundos (default: 10000 = 10s) */
  userInteractionThrottle?: number;

  /** Throttle para eventos de alta frecuencia (mousemove, scroll) en milisegundos (default: 30000 = 30s) */
  highFrequencyThrottle?: number;
}

/**
 * Tipo de actividad para heartbeat
 * - 'heartbeat': Mantiene sesión viva (automático cada 30s según guía oficial)
 * - 'user-interaction': Usuario interactuó (reactiva a ONLINE)
 */
export type ActivityType = 'heartbeat' | 'user-interaction';

/**
 * Payload para enviar heartbeat al backend
 */
export interface HeartbeatPayload {
  /** Tipo de actividad que genera el heartbeat */
  activityType: ActivityType;
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
  online: 'En línea',
  busy: 'Ocupado',
  away: 'Ausente',
  offline: 'Desconectado',
  chatting: 'En conversación'
};

/**
 * Mapeo de estados de presencia a colores CSS (según guía de presencia)
 */
export const PresenceStatusColor: Record<PresenceStatus, string> = {
  online: '#10B981',    // Verde (guía)
  busy: '#EF4444',      // Rojo (guía)
  away: '#F59E0B',      // Amarillo (guía)
  offline: '#6B7280',   // Gris (guía)
  chatting: '#60a5fa'   // Azul
};

/**
 * Configuración visual completa del badge de presencia (según guía)
 */
export interface PresenceBadgeConfig {
  /** Icono emoji del badge */
  icon: string;

  /** Texto descriptivo corto */
  text: string;

  /** Color principal (hex) */
  color: string;

  /** Descripción adicional para tooltip */
  description: string;
}

/**
 * Mapeo de estados a configuración visual completa (según guía oficial)
 */
export const PRESENCE_BADGE_CONFIG: Record<PresenceStatus, PresenceBadgeConfig> = {
  online: {
    icon: '🟢',
    text: 'En línea',
    color: '#10B981',
    description: 'Responderá pronto'
  },
  away: {
    icon: '🟡',
    text: 'Ausente',
    color: '#F59E0B',
    description: 'Puede tardar en responder'
  },
  busy: {
    icon: '🔴',
    text: 'Ocupado',
    color: '#EF4444',
    description: 'Atendiendo otro chat'
  },
  offline: {
    icon: '⚫',
    text: 'Desconectado',
    color: '#6B7280',
    description: 'No disponible'
  },
  chatting: {
    icon: '💬',
    text: 'En conversación',
    color: '#60a5fa',
    description: 'Atendiendo otro chat'
  }
};
