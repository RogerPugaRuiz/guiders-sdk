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
		const accessToken = localStorage.getItem('accessToken');
		return {
			'Authorization': `Bearer ${accessToken || ''}`,
			'Content-Type': 'application/json'
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
	 * Obtiene un chat específico por ID
	 * @param chatId ID del chat
	 * @returns Promise con los detalles del chat
	 */
	async getChatById(chatId: string): Promise<ChatV2> {
		if (!chatId) {
			console.error('[ChatV2Service] ❌ getChatById llamado con chatId falsy', { chatId });
			throw new Error('chatId requerido');
		}
		console.log(`[ChatV2Service] 🔍 Obteniendo chat por ID: ${chatId}`);

		const response = await fetch(`${this.getBaseUrl()}/${chatId}`, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al obtener chat ${chatId}:`, errorText);
			throw new Error(`Error al obtener chat (${response.status}): ${errorText}`);
		}

		const chat = await response.json() as ChatV2;
		console.log(`[ChatV2Service] ✅ Chat obtenido:`, {
			id: chat.id,
			status: chat.status,
			assignedCommercialId: chat.assignedCommercialId,
			isActive: chat.isActive
		});

		return chat;
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

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(`${this.getBaseUrl()}/${chatId}/assign/${commercialId}`, {
			method: 'PUT',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(`${this.getBaseUrl()}/${chatId}/close`, {
			method: 'PUT',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

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

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders()
		});

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
	 * Crea un chat V2 de forma idempotente (PUT /v2/chats/{chatId})
	 * @param chatId UUID del chat a crear
	 * @param payload Datos del chat (visitorId, visitorInfo, availableCommercialIds, priority, metadata...)
	 * @returns Promise con el chat creado o existente
	 */
	async createChat(chatId: string, payload: any): Promise<ChatV2> {
		console.log(`[ChatV2Service] 🆕 Creando chat V2 por PUT: ${chatId}`);
		const response = await fetch(`${this.getBaseUrl()}/${chatId}`, {
			method: 'PUT',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`[ChatV2Service] ❌ Error al crear chat V2:`, errorText);
			throw new Error(`Error al crear chat V2 (${response.status}): ${errorText}`);
		}
		const chat = await response.json() as ChatV2;
		console.log(`[ChatV2Service] ✅ Chat V2 creado/recuperado:`, chat.id);
		return chat;
	}

	/**
	 * Crea un chat V2 usando el endpoint mejorado POST /v2/chats (ID generado por el backend)
	 * @param payload Datos del chat
	 * @returns Promise con el chat creado
	 */
	async createChatAuto(payload: any): Promise<ChatV2> {
		console.log('[ChatV2Service] 🆕 Creando chat V2 por POST (auto-id)');
		const response = await fetch(`${this.getBaseUrl()}`, {
			method: 'POST',
			headers: this.getAuthHeaders(),
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			const errorText = await response.text();
			console.error('[ChatV2Service] ❌ Error al crear chat V2 (POST):', errorText);
			throw new Error(`Error al crear chat V2 (POST) (${response.status}): ${errorText}`);
		}
		const chat = await response.json() as ChatV2;
		console.log('[ChatV2Service] ✅ Chat V2 creado (POST):', chat.id);
		return chat;
	}
}
