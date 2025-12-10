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

import { EndpointManager } from '../core/endpoint-manager';
import { WebSocketService } from './websocket-service';
import { RealtimeMessage } from '../types/websocket-types';
import { getCommonHeaders, getCommonFetchOptions } from '../utils/http-headers';
import { debugLog } from '../utils/debug-logger';

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
	/** Callback cuando se recibe un mensaje nuevo (con chat cerrado) - recibe chatId del mensaje */
	onMessageReceived?: (chatId: string) => void;
	/** Auto-abrir el chat cuando se recibe un mensaje (solo si el chat está cerrado) */
	autoOpenChatOnMessage?: boolean;
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
	private onMessageReceivedCallback: ((chatId: string) => void) | null = null;
	private autoOpenChatOnMessage: boolean = false;
	private wsService: WebSocketService;
	private debug: boolean = false;
	private isChatOpen: boolean = false; // Track if chat is currently open
	// 🔧 FIX: Cooldown para evitar re-apertura automática tras cerrar manualmente
	private autoOpenCooldownUntil: number = 0;
	private static readonly AUTO_OPEN_COOLDOWN_MS = 5000; // 5 segundos de cooldown (sincronizado con ChatUI)

	private constructor() {
		this.wsService = WebSocketService.getInstance();
		debugLog('📬 [UnreadMessagesService] Instancia creada');
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
		this.onMessageReceivedCallback = options.onMessageReceived || null;
		this.autoOpenChatOnMessage = options.autoOpenChatOnMessage || false;
		this.debug = options.debug || false;

		this.log('🚀 Inicializando servicio con:', {
			visitorId: this.visitorId,
			hasCallback: !!this.onCountChangeCallback,
			autoOpenChatOnMessage: this.autoOpenChatOnMessage
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
	 * Establece el estado de visibilidad del chat
	 * Cuando el chat está abierto, las notificaciones de badge se pausan
	 */
	public setChatOpenState(isOpen: boolean): void {
		this.isChatOpen = isOpen;
		this.log('💬 Estado del chat cambiado:', isOpen ? 'abierto' : 'cerrado');

		// 🔧 FIX: Si se cierra el chat, activar cooldown para evitar re-apertura automática
		if (!isOpen) {
			this.autoOpenCooldownUntil = Date.now() + UnreadMessagesService.AUTO_OPEN_COOLDOWN_MS;
			this.log('⏱️ Cooldown de auto-apertura activado hasta:', new Date(this.autoOpenCooldownUntil).toISOString());
		}

		// Si se cierra el chat, refrescar el contador para mostrar badge si hay mensajes
		if (!isOpen && this.unreadCount > 0) {
			this.log('📢 Chat cerrado con mensajes no leídos, notificando badge');
			this.notifyCountChange();
		}
	}

	/**
	 * Obtiene los headers de autorización para las peticiones
	 */
	private getAuthHeaders(): Record<string, string> {
		return getCommonHeaders();
	}

	/**
	 * Obtiene las opciones de fetch
	 */
	private getFetchOptions(method: string = 'GET', body?: string): RequestInit {
		const options = getCommonFetchOptions(method);
		if (body) {
			options.body = body;
		}
		return options;
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

			// Si hay mensajes no leídos Y auto-open habilitado Y chat cerrado → abrir chat
			// 🔧 FIX: Verificar que no estemos en período de cooldown (tras cierre manual)
			const isInCooldown = Date.now() < this.autoOpenCooldownUntil;
			if (this.unreadCount > 0 && this.autoOpenChatOnMessage && !this.isChatOpen && this.onMessageReceivedCallback && !isInCooldown) {
				this.log('🔓 Auto-apertura: mensajes no leídos previos detectados - abriendo chat con chatId:', this.currentChatId);
				this.onMessageReceivedCallback(this.currentChatId);
				this.isChatOpen = true;

				// Marcar todos los mensajes como leídos
				const messageIds = this.unreadMessages.map(m => m.id);
				this.markAsRead(messageIds).catch(error => {
				});

				// Limpiar lista de no leídos
				this.unreadMessages = [];
				this.unreadCount = 0;
				return; // No notificar badge (el chat se está abriendo)
			} else if (isInCooldown && this.unreadCount > 0) {
				this.log('⏱️ Auto-apertura bloqueada por cooldown - mostrando badge en su lugar');
			}

			// Notificar cambio de contador (solo si el chat no se abrió automáticamente)
			this.notifyCountChange();

		} catch (error) {
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
		// Si no hay chat asignado y llega un mensaje, este es un nuevo chat iniciado por el comercial
		if (!this.currentChatId && message.chatId) {
			this.log('🆕 Nuevo chat iniciado por comercial, asignando chatId:', message.chatId);
			this.currentChatId = message.chatId;
		}

		// Verificar que pertenece al chat actual (después de asignar si es nuevo)
		if (message.chatId !== this.currentChatId) {
			this.log('⚠️ Mensaje de otro chat, ignorando:', {
				mensajeChatId: message.chatId,
				currentChatId: this.currentChatId
			});
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

		this.log('📨 Nuevo mensaje recibido:', {
			messageId: message.messageId,
			senderId: message.senderId,
			chatAbierto: this.isChatOpen,
			autoOpenHabilitado: this.autoOpenChatOnMessage
		});

		// Si el chat está abierto, marcar como leído automáticamente
		if (this.isChatOpen) {
			this.log('✅ Chat abierto - marcando mensaje como leído automáticamente');
			this.markAsRead([message.messageId]).catch(error => {
			});
			return; // No añadir a no leídos ni notificar badge
		}

		// Si el chat está cerrado Y auto-open está habilitado → abrir chat inmediatamente
		// 🔧 FIX: Verificar que no estemos en período de cooldown (tras cierre manual)
		const isInCooldown = Date.now() < this.autoOpenCooldownUntil;
		if (this.autoOpenChatOnMessage && this.onMessageReceivedCallback && !isInCooldown) {
			this.log('🔓 Auto-apertura habilitada - abriendo chat con chatId:', message.chatId);
			this.onMessageReceivedCallback(message.chatId);
			this.isChatOpen = true;
			this.log('💬 Chat abierto por auto-apertura - marcando mensaje como leído');

			// Marcar mensaje como leído inmediatamente
			this.markAsRead([message.messageId]).catch(error => {
			});
			return; // No añadir a no leídos ni mostrar badge
		} else if (isInCooldown) {
			this.log('⏱️ Auto-apertura bloqueada por cooldown (mensaje nuevo), agregando a no leídos');
		}

		// Si llegamos aquí, el chat está cerrado y auto-open NO habilitado
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
	 * Si el chat está abierto, pausa las notificaciones para evitar badge flickering
	 */
	private notifyCountChange(): void {
		// Si el chat está abierto, no notificar (pausa las notificaciones de badge)
		if (this.isChatOpen) {
			this.log('⏸️ Chat abierto - pausando notificaciones de badge (contador:', this.unreadCount + ')');
			return;
		}

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
			debugLog('📬 [UnreadMessagesService]', ...args);
		}
	}
}
