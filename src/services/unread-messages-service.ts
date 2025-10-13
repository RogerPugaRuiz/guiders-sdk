/**
 * 📬 UnreadMessagesService - Gestión de mensajes no leídos
 *
 * Características:
 * - Obtiene mensajes no leídos desde la API
 * - Marca mensajes como leídos
 * - Escucha eventos WebSocket para actualizar contador en tiempo real
 * - Filtra mensajes del propio usuario
 * - Integración con ChatToggleButtonUI para mostrar badge
 */

import { EndpointManager } from '../core/tracking-pixel-SDK';
import { WebSocketService } from './websocket-service';
import { RealtimeMessage } from '../types/websocket-types';

export interface UnreadMessage {
	id: string;
	chatId: string;
	senderId: string;
	senderType: string;
	content: string;
	type: string;
	isRead: boolean;
	readAt: string | null;
	readBy: string | null;
	createdAt: string;
	updatedAt: string;
	isInternal: boolean;
}

export interface UnreadMessagesServiceOptions {
	/** ID del visitante actual */
	visitorId: string;
	/** Callback cuando el contador cambia */
	onCountChange?: (count: number) => void;
	/** Habilitar logs de debug */
	debug?: boolean;
}

export class UnreadMessagesService {
	private static instance: UnreadMessagesService | null = null;
	private visitorId: string = '';
	private currentChatId: string | null = null;
	private unreadCount: number = 0;
	private unreadMessages: UnreadMessage[] = [];
	private onCountChangeCallback: ((count: number) => void) | null = null;
	private wsService: WebSocketService;
	private debug: boolean = false;

	private constructor() {
		this.wsService = WebSocketService.getInstance();
		console.log('📬 [UnreadMessagesService] Instancia creada');
	}

	public static getInstance(): UnreadMessagesService {
		if (!UnreadMessagesService.instance) {
			UnreadMessagesService.instance = new UnreadMessagesService();
		}
		return UnreadMessagesService.instance;
	}

	/**
	 * Inicializa el servicio
	 */
	public initialize(options: UnreadMessagesServiceOptions): void {
		this.visitorId = options.visitorId;
		this.onCountChangeCallback = options.onCountChange || null;
		this.debug = options.debug || false;

		this.log('🚀 Inicializando servicio con:', {
			visitorId: this.visitorId,
			hasCallback: !!this.onCountChangeCallback
		});

		// Registrar listener para mensajes nuevos del WebSocket
		this.wsService.updateCallbacks({
			onMessage: (message) => this.handleNewMessage(message)
		});

		this.log('✅ Servicio inicializado correctamente');
	}

	/**
	 * Establece el chat activo
	 */
	public setCurrentChat(chatId: string): void {
		if (this.currentChatId === chatId) {
			this.log('Chat ya activo:', chatId);
			return;
		}

		this.log('📌 Cambiando chat activo:', {
			anterior: this.currentChatId,
			nuevo: chatId
		});

		this.currentChatId = chatId;

		// Cargar mensajes no leídos del nuevo chat
		this.refreshUnreadMessages();
	}

	/**
	 * Obtiene los headers de autorización para las peticiones
	 */
	private getAuthHeaders(): Record<string, string> {
		const baseHeaders: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Agregar sessionId como header X-Guiders-Sid
		const sessionId = sessionStorage.getItem('guiders_backend_session_id');
		if (sessionId) {
			baseHeaders['X-Guiders-Sid'] = sessionId;
		}

		// Agregar Authorization en modo JWT
		const accessToken = localStorage.getItem('accessToken');
		if (accessToken) {
			baseHeaders['Authorization'] = `Bearer ${accessToken}`;
		}

		return baseHeaders;
	}

	/**
	 * Obtiene las opciones de fetch
	 */
	private getFetchOptions(method: string = 'GET', body?: string): RequestInit {
		return {
			method,
			headers: this.getAuthHeaders(),
			credentials: 'include',
			...(body && { body })
		};
	}

	/**
	 * Obtiene la URL base para la API
	 */
	private getApiUrl(): string {
		const endpoints = EndpointManager.getInstance();
		const baseEndpoint = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
		const apiRoot = baseEndpoint.endsWith('/api') ? baseEndpoint : `${baseEndpoint}/api`;
		return apiRoot;
	}

	/**
	 * Obtiene los mensajes no leídos del chat actual
	 */
	public async refreshUnreadMessages(): Promise<void> {
		if (!this.currentChatId) {
			this.log('⚠️ No hay chat activo, omitiendo refresh');
			return;
		}

		this.log('🔄 Obteniendo mensajes no leídos del chat:', this.currentChatId);

		try {
			const url = `${this.getApiUrl()}/v2/messages/chat/${this.currentChatId}/unread`;
			const response = await fetch(url, this.getFetchOptions('GET'));

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[UnreadMessagesService] ❌ Error al obtener mensajes no leídos:', errorText);
				throw new Error(`Error al obtener mensajes no leídos (${response.status}): ${errorText}`);
			}

			const messages: UnreadMessage[] = await response.json();

			// Filtrar mensajes del propio usuario
			this.unreadMessages = messages.filter(m => m.senderId !== this.visitorId);
			this.unreadCount = this.unreadMessages.length;

			this.log('✅ Mensajes no leídos obtenidos:', {
				total: messages.length,
				filtrados: this.unreadCount,
				mensajes: this.unreadMessages.map(m => ({ id: m.id, senderId: m.senderId }))
			});

			// Notificar cambio de contador
			this.notifyCountChange();

		} catch (error) {
			console.error('[UnreadMessagesService] ❌ Error en refreshUnreadMessages:', error);
		}
	}

	/**
	 * Marca mensajes como leídos
	 */
	public async markAsRead(messageIds: string[]): Promise<boolean> {
		if (messageIds.length === 0) {
			this.log('⚠️ No hay mensajes para marcar como leídos');
			return false;
		}

		this.log('📝 Marcando mensajes como leídos:', messageIds);

		try {
			const url = `${this.getApiUrl()}/v2/messages/mark-as-read`;
			const response = await fetch(
				url,
				this.getFetchOptions('PUT', JSON.stringify({ messageIds }))
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[UnreadMessagesService] ❌ Error al marcar mensajes como leídos:', errorText);
				return false;
			}

			const result = await response.json();
			this.log('✅ Mensajes marcados como leídos:', result.markedCount);

			// Actualizar estado local
			this.unreadMessages = this.unreadMessages.filter(m => !messageIds.includes(m.id));
			this.unreadCount = this.unreadMessages.length;

			// Notificar cambio de contador
			this.notifyCountChange();

			return true;

		} catch (error) {
			console.error('[UnreadMessagesService] ❌ Error en markAsRead:', error);
			return false;
		}
	}

	/**
	 * Marca todos los mensajes no leídos del chat actual como leídos
	 */
	public async markAllAsRead(): Promise<boolean> {
		const messageIds = this.unreadMessages.map(m => m.id);
		return this.markAsRead(messageIds);
	}

	/**
	 * Maneja la llegada de un nuevo mensaje via WebSocket
	 */
	private handleNewMessage(message: RealtimeMessage): void {
		// Verificar que pertenece al chat actual
		if (message.chatId !== this.currentChatId) {
			this.log('⚠️ Mensaje de otro chat, ignorando');
			return;
		}

		// Ignorar mensajes propios
		if (message.senderId === this.visitorId) {
			this.log('🚫 Mensaje propio ignorado');
			return;
		}

		// Ignorar mensajes internos
		if (message.isInternal) {
			this.log('🔒 Mensaje interno ignorado');
			return;
		}

		this.log('📨 Nuevo mensaje no leído recibido:', {
			messageId: message.messageId,
			senderId: message.senderId
		});

		// Añadir a la lista de no leídos
		const unreadMessage: UnreadMessage = {
			id: message.messageId,
			chatId: message.chatId,
			senderId: message.senderId,
			senderType: 'commercial', // Los mensajes de WebSocket siempre son de comerciales o bots
			content: message.content,
			type: message.type || 'text',
			isRead: false,
			readAt: null,
			readBy: null,
			createdAt: message.sentAt,
			updatedAt: message.sentAt,
			isInternal: message.isInternal || false
		};

		this.unreadMessages.push(unreadMessage);
		this.unreadCount = this.unreadMessages.length;

		this.log('✅ Contador actualizado:', this.unreadCount);

		// Notificar cambio de contador
		this.notifyCountChange();
	}

	/**
	 * Notifica el cambio de contador a los listeners
	 */
	private notifyCountChange(): void {
		if (this.onCountChangeCallback) {
			this.log('📢 Notificando cambio de contador:', this.unreadCount);
			this.onCountChangeCallback(this.unreadCount);
		}
	}

	/**
	 * Obtiene el número de mensajes no leídos actual
	 */
	public getUnreadCount(): number {
		return this.unreadCount;
	}

	/**
	 * Obtiene la lista de mensajes no leídos
	 */
	public getUnreadMessages(): UnreadMessage[] {
		return [...this.unreadMessages];
	}

	/**
	 * Resetea el contador (útil para testing)
	 */
	public reset(): void {
		this.unreadMessages = [];
		this.unreadCount = 0;
		this.currentChatId = null;
		this.notifyCountChange();
		this.log('🔄 Servicio reseteado');
	}

	/**
	 * Log helper
	 */
	private log(...args: any[]): void {
		if (this.debug) {
			console.log('📬 [UnreadMessagesService]', ...args);
		}
	}
}
