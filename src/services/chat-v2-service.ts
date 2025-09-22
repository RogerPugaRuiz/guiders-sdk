import { EndpointManager } from '../core/tracking-pixel-SDK';
import { ChatV2, ChatListV2 } from '../types';

/**
 * Servicio para interactuar con la API V2 de chats
 * Proporciona métodos optimizados para las operaciones de chat
 */
export class ChatV2Service {
	private static instance: ChatV2Service;

	private constructor() { }

	public static getInstance(): ChatV2Service {
		if (!ChatV2Service.instance) {
			ChatV2Service.instance = new ChatV2Service();
		}
		return ChatV2Service.instance;
	}

	/**
	 * Obtiene los headers de autorización para las peticiones
	 */
	private getAuthHeaders(): Record<string, string> {
		const baseHeaders: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Agregar sessionId como header X-Guiders-Sid para todas las peticiones de chat
		const sessionId = sessionStorage.getItem('guiders_backend_session_id');
		if (sessionId) {
			baseHeaders['X-Guiders-Sid'] = sessionId;
		}

		// Solo agregar Authorization en modo JWT
		// En modo session, la autenticación se maneja automáticamente por cookies
		const accessToken = localStorage.getItem('accessToken');
		if (accessToken) {
			baseHeaders['Authorization'] = `Bearer ${accessToken}`;
		}

		return baseHeaders;
	}

	/**
	 * Obtiene las opciones de fetch con autenticación adecuada
	 */
	private getFetchOptions(method: string = 'GET', body?: string): RequestInit {
		return {
			method,
			headers: this.getAuthHeaders(),
			credentials: 'include', // Incluir cookies para autenticación session-based
			...(body && { body })
		};
	}

	/**
	 * Obtiene la URL base para la API V2
	 */
	private getBaseUrl(): string {
		const endpoints = EndpointManager.getInstance();
		const baseEndpoint = (localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint());
		// Asegurar que /api no se duplique
		const apiRoot = baseEndpoint.endsWith('/api') ? baseEndpoint : `${baseEndpoint}/api`;
		return `${apiRoot}/v2/chats`;
	}


	/**
	 * Obtiene los chats de un visitante específico
	 * @param visitorId ID del visitante
	 * @param cursor Cursor para paginación (opcional)
	 * @param limit Límite de resultados (opcional, default: 20)
	 * @returns Promise con la lista de chats del visitante
	 */
	async getVisitorChats(visitorId: string, cursor?: string, limit: number = 20): Promise<ChatListV2> {
		console.log(`[ChatV2Service] 👤 Obteniendo chats del visitante: ${visitorId}`);

		const params = new URLSearchParams();
		if (cursor) params.append('cursor', cursor);
		params.append('limit', limit.toString());

		const url = `${this.getBaseUrl()}/visitor/${visitorId}?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener chats del visitante ${visitorId}:`, errorText);
			throw new Error(`Error al obtener chats del visitante (${response.status}): ${errorText}`);
		}

		const chatList = await response.json() as ChatListV2;
		console.log(`[ChatV2Service] ✅ Chats del visitante obtenidos:`, {
			count: chatList.chats.length,
			total: chatList.total,
			hasMore: chatList.hasMore
		});

		return chatList;
	}

	/**
	 * Obtiene el chat más reciente de un visitante.
	 * Internamente solicita hasta 20 para permitir caching de historial inmediato,
	 * pero solo devuelve el primero (más reciente) para la UI actual.
	 */
	async getLatestVisitorChat(visitorId: string): Promise<ChatV2 | null> {
		try {
			const list = await this.getVisitorChats(visitorId, undefined, 20);
			if (list.chats && list.chats.length > 0) return list.chats[0];
			return null;
		} catch (e) {
			console.warn('[ChatV2Service] ❌ Error obteniendo último chat del visitante:', e);
			return null;
		}
	}

	/**
	 * Obtiene los chats de un comercial específico
	 * @param commercialId ID del comercial
	 * @param cursor Cursor para paginación (opcional)
	 * @param limit Límite de resultados (opcional, default: 20)
	 * @param filters Filtros adicionales (opcional)
	 * @returns Promise con la lista de chats del comercial
	 */
	async getCommercialChats(
		commercialId: string,
		cursor?: string,
		limit: number = 20,
		filters?: Record<string, any>
	): Promise<ChatListV2> {
		console.log(`[ChatV2Service] 🏪 Obteniendo chats del comercial: ${commercialId}`);

		const params = new URLSearchParams();
		if (cursor) params.append('cursor', cursor);
		params.append('limit', limit.toString());
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					value.forEach(v => params.append(`filters[${key}][]`, v));
				} else {
					params.append(`filters[${key}]`, value);
				}
			});
		}

		const url = `${this.getBaseUrl()}/commercial/${commercialId}?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener chats del comercial ${commercialId}:`, errorText);
			throw new Error(`Error al obtener chats del comercial (${response.status}): ${errorText}`);
		}

		const chatList = await response.json() as ChatListV2;
		console.log(`[ChatV2Service] ✅ Chats del comercial obtenidos:`, {
			count: chatList.chats.length,
			total: chatList.total,
			hasMore: chatList.hasMore
		});

		return chatList;
	}

	/**
	 * Obtiene la cola de chats pendientes
	 * @param department Departamento específico (opcional)
	 * @param limit Límite de resultados (opcional, default: 50)
	 * @returns Promise con la lista de chats pendientes
	 */
	async getPendingQueue(department?: string, limit: number = 50): Promise<ChatV2[]> {
		console.log(`[ChatV2Service] 📋 Obteniendo cola de chats pendientes`);

		const params = new URLSearchParams();
		if (department) params.append('department', department);
		params.append('limit', limit.toString());

		const url = `${this.getBaseUrl()}/queue/pending?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener cola pendiente:`, errorText);
			throw new Error(`Error al obtener cola pendiente (${response.status}): ${errorText}`);
		}

		const chats = await response.json() as ChatV2[];
		console.log(`[ChatV2Service] ✅ Cola de chats pendientes obtenida:`, {
			count: chats.length
		});

		return chats;
	}

	/**
	 * Asigna un chat a un comercial
	 * @param chatId ID del chat
	 * @param commercialId ID del comercial
	 * @returns Promise con el chat actualizado
	 */
	async assignChat(chatId: string, commercialId: string): Promise<ChatV2> {
		console.log(`[ChatV2Service] 📌 Asignando chat ${chatId} al comercial ${commercialId}`);

		const response = await fetch(`${this.getBaseUrl()}/${chatId}/assign/${commercialId}`, this.getFetchOptions('PUT'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al asignar chat:`, errorText);
			throw new Error(`Error al asignar chat (${response.status}): ${errorText}`);
		}

		const chat = await response.json() as ChatV2;
		console.log(`[ChatV2Service] ✅ Chat asignado exitosamente`);

		return chat;
	}

	/**
	 * Cierra un chat
	 * @param chatId ID del chat
	 * @returns Promise con el chat actualizado
	 */
	async closeChat(chatId: string): Promise<ChatV2> {
		console.log(`[ChatV2Service] 🔒 Cerrando chat ${chatId}`);

		const response = await fetch(`${this.getBaseUrl()}/${chatId}/close`, this.getFetchOptions('PUT'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al cerrar chat:`, errorText);
			throw new Error(`Error al cerrar chat (${response.status}): ${errorText}`);
		}

		const chat = await response.json() as ChatV2;
		console.log(`[ChatV2Service] ✅ Chat cerrado exitosamente`);

		return chat;
	}

	/**
	 * Obtiene métricas de un comercial
	 * @param commercialId ID del comercial
	 * @param dateFrom Fecha de inicio (opcional)
	 * @param dateTo Fecha de fin (opcional)
	 * @returns Promise con las métricas del comercial
	 */
	async getCommercialMetrics(
		commercialId: string,
		dateFrom?: Date,
		dateTo?: Date
	): Promise<any> {
		console.log(`[ChatV2Service] 📊 Obteniendo métricas del comercial: ${commercialId}`);

		const params = new URLSearchParams();
		if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
		if (dateTo) params.append('dateTo', dateTo.toISOString());

		const url = `${this.getBaseUrl()}/metrics/commercial/${commercialId}?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener métricas:`, errorText);
			throw new Error(`Error al obtener métricas (${response.status}): ${errorText}`);
		}

		const metrics = await response.json();
		console.log(`[ChatV2Service] ✅ Métricas obtenidas`);

		return metrics;
	}

	/**
	 * Obtiene estadísticas de tiempo de respuesta
	 * @param dateFrom Fecha de inicio (opcional)
	 * @param dateTo Fecha de fin (opcional)
	 * @param groupBy Agrupación de datos (opcional)
	 * @returns Promise con las estadísticas
	 */
	async getResponseTimeStats(
		dateFrom?: Date,
		dateTo?: Date,
		groupBy: 'hour' | 'day' | 'week' = 'day'
	): Promise<any[]> {
		console.log(`[ChatV2Service] ⏱️ Obteniendo estadísticas de tiempo de respuesta`);

		const params = new URLSearchParams();
		if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
		if (dateTo) params.append('dateTo', dateTo.toISOString());
		params.append('groupBy', groupBy);

		const url = `${this.getBaseUrl()}/response-time-stats?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener estadísticas:`, errorText);
			throw new Error(`Error al obtener estadísticas (${response.status}): ${errorText}`);
		}

		const stats = await response.json();
		console.log(`[ChatV2Service] ✅ Estadísticas obtenidas`);

		return stats;
	}

	/**
	 * Crea un chat V2 usando el endpoint mejorado POST /v2/chats (ID generado por el backend)
	 * @param payload Datos del chat
	 * @returns Promise con el chat creado
	 */
	async createChatAuto(payload: any): Promise<ChatV2> {
		console.log('[ChatV2Service] 🆕 Creando chat V2 por POST (auto-id)');
		const response = await fetch(`${this.getBaseUrl()}`, this.getFetchOptions('POST', JSON.stringify(payload)));
		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ChatV2Service] ❌ Error al crear chat V2 (POST):', errorText);
			throw new Error(`Error al crear chat V2 (POST) (${response.status}): ${errorText}`);
		}
		const chat = await response.json() as ChatV2;
		console.log('[ChatV2Service] ✅ Chat V2 creado (POST):', chat.id);
		return chat;
	}

	/**
	 * Crea un chat V2 con mensaje inicial usando el endpoint POST /v2/chats/with-message
	 * Esta operación es atómica: crea el chat y envía el primer mensaje juntos
	 * @param chatData Datos del chat (department, priority, subject, etc.)
	 * @param messageData Datos del primer mensaje (content, type)
	 * @returns Promise con la respuesta de la API: { chatId, messageId, position }
	 */
	async createChatWithMessage(chatData: any, messageData: any): Promise<{ chatId: string; messageId: string; position: number }> {
		console.log('[ChatV2Service] 🆕💬 Creando chat V2 con mensaje inicial');
		
		// Estructura corregida según la API real: firstMessage en lugar de message
		const payload = {
			...chatData, // Los datos del chat van directamente en el root
			firstMessage: messageData // El mensaje va como firstMessage
		};

		console.log('[ChatV2Service] 📤 Payload enviado:', JSON.stringify(payload, null, 2));

		const response = await fetch(`${this.getBaseUrl()}/with-message`, this.getFetchOptions('POST', JSON.stringify(payload)));
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ChatV2Service] ❌ Error al crear chat V2 con mensaje:', errorText);
			throw new Error(`Error al crear chat V2 con mensaje (${response.status}): ${errorText}`);
		}

		const result = await response.json();
		console.log('[ChatV2Service] ✅ Chat V2 con mensaje creado:', result.chat?.chatId || result.chat?.id);
		
		return result;
	}

	/**
	 * Envía un mensaje a un chat existente usando POST /v2/messages
	 * @param chatId ID del chat al que enviar el mensaje
	 * @param content Contenido del mensaje
	 * @param type Tipo de mensaje (text, image, file, etc.)
	 * @returns Promise con el mensaje enviado
	 */
	async sendMessage(chatId: string, content: string, type: string = 'text'): Promise<any> {
		console.log(`[ChatV2Service] 💬 Enviando mensaje al chat ${chatId}`);
		
		const payload = {
			chatId,
			content,
			type
		};

		// Construir URL para el endpoint de mensajes
		const endpoints = EndpointManager.getInstance();
		const baseEndpoint = (localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint());
		const apiRoot = baseEndpoint.endsWith('/api') ? baseEndpoint : `${baseEndpoint}/api`;
		const messagesUrl = `${apiRoot}/v2/messages`;

		const response = await fetch(messagesUrl, this.getFetchOptions('POST', JSON.stringify(payload)));
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ChatV2Service] ❌ Error al enviar mensaje:', errorText);
			throw new Error(`Error al enviar mensaje (${response.status}): ${errorText}`);
		}

		const message = await response.json();
		console.log('[ChatV2Service] ✅ Mensaje enviado:', message.messageId || message.id);
		
		return message;
	}

	/**
	 * Método inteligente que decide si crear un chat nuevo con mensaje o enviar mensaje a chat existente
	 * @param visitorId ID del visitante
	 * @param content Contenido del mensaje
	 * @param chatData Datos del chat (solo se usa si se crea uno nuevo)
	 * @param messageType Tipo de mensaje (default: TEXT)
	 * @returns Promise con el resultado de la operación
	 */
	async sendMessageSmart(
		visitorId: string, 
		content: string, 
		chatData: any = {}, 
		messageType: string = 'text'
	): Promise<{ chat: { id: string }; message: { id: string }; isNewChat: boolean }> {
		console.log(`[ChatV2Service] 🧠 Enviando mensaje inteligente para visitante ${visitorId}`);

		try {
			// Primero intentar obtener chats existentes del visitante
			const chatList = await this.getVisitorChats(visitorId, undefined, 1);
			
			if (chatList.chats && chatList.chats.length > 0) {
				// Existe al menos un chat, usar el primero (más reciente) y enviar mensaje
				const existingChat = chatList.chats[0];
				console.log(`[ChatV2Service] 📋 Chat existente encontrado: ${existingChat.id}, enviando mensaje`);
				
				const message = await this.sendMessage(existingChat.id, content, messageType);
				
				return {
					chat: { id: existingChat.id },
					message: { id: message.messageId || message.id },
					isNewChat: false
				};
			} else {
				// No hay chats existentes, crear uno nuevo con el mensaje
				console.log(`[ChatV2Service] 🆕 No hay chats existentes, creando chat nuevo con mensaje`);
				
				const messageData = { content, type: messageType };
				const result = await this.createChatWithMessage(chatData, messageData);
				
				return {
					chat: { id: result.chatId }, // Crear objeto chat con el ID recibido
					message: { id: result.messageId }, // Crear objeto message con el ID recibido
					isNewChat: true
				};
			}
		} catch (error) {
			console.error('[ChatV2Service] ❌ Error en sendMessageSmart:', error);
			throw error;
		}
	}

	/**
	 * Obtiene los mensajes de un chat específico con paginación
	 * @param chatId ID del chat
	 * @param limit Límite de mensajes (default: 50)
	 * @param cursor Cursor para paginación (opcional)
	 * @returns Promise con la lista de mensajes
	 */
	async getChatMessages(
		chatId: string,
		limit: number = 50,
		cursor?: string
	): Promise<any> {
		console.log(`[ChatV2Service] 📋 Obteniendo mensajes del chat: ${chatId}`);

		const params = new URLSearchParams();
		params.append('limit', limit.toString());
		if (cursor) params.append('cursor', cursor);

		// Construir URL para el endpoint de mensajes
		const endpoints = EndpointManager.getInstance();
		const baseEndpoint = (localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint());
		const apiRoot = baseEndpoint.endsWith('/api') ? baseEndpoint : `${baseEndpoint}/api`;
		const url = `${apiRoot}/v2/messages/chat/${chatId}?${params.toString()}`;

		const response = await fetch(url, this.getFetchOptions('GET'));

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ChatV2Service] ❌ Error al obtener mensajes del chat:', errorText);
			throw new Error(`Error al obtener mensajes del chat (${response.status}): ${errorText}`);
		}

		const messageList = await response.json();
		console.log(`[ChatV2Service] ✅ Mensajes del chat obtenidos:`, {
			count: messageList.messages?.length || 0,
			total: messageList.total,
			hasMore: messageList.hasMore
		});

		return messageList;
	}
}
