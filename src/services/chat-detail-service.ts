import { EndpointManager } from '../core/tracking-pixel-SDK';
import { debugLog } from '../utils/debug-logger';
import { ChatSessionStore } from './chat-session-store';
import { VisitorInfoV2, ChatMetadataV2, AssignedCommercial } from '../types';

// Interfaz para la respuesta V2 del chat basada en los DTOs del backend
export interface ChatDetailV2 {
	id: string;
	status: string;
	priority: string;
	visitorInfo: VisitorInfoV2;
	assignedCommercialId?: string;
	assignedCommercial?: AssignedCommercial;
	availableCommercialIds?: string[];
	metadata: ChatMetadataV2;
	createdAt: Date;
	assignedAt?: Date;
	closedAt?: Date;
	lastMessageDate?: Date;
	totalMessages: number;
	unreadMessagesCount: number;
	isActive: boolean;
	visitorId: string;
	department: string;
	tags?: string[];
	updatedAt?: Date;
	averageResponseTimeMinutes?: number;
	chatDurationMinutes?: number;
	resolutionStatus?: string;
	satisfactionRating?: number;
}

// Interfaces legacy para mantener compatibilidad
export interface ChatParticipant {
	id: string;
	name: string;
	isCommercial: boolean;
	isVisitor: boolean;
	isOnline: boolean;
	assignedAt: string;
	lastSeenAt: string | null;
	isViewing: boolean;
	isTyping: boolean;
	isAnonymous: boolean;
}

export interface ChatDetail {
	id: string;
	participants: ChatParticipant[];
	status: string;
	lastMessage: any | null;
	lastMessageAt: string | null;
	createdAt: string;
}

/**
 * Obtiene los detalles completos de un chat usando la API V2
 * @param chatId ID del chat a consultar
 * @returns Promesa con los detalles del chat en formato V2
 */
export async function fetchChatDetailV2(chatId: string): Promise<ChatDetailV2> {
	if (!chatId) {
		console.warn('[chat-detail-service] ❌ fetchChatDetailV2 llamado sin chatId');
		throw new Error('chatId requerido');
	}

	// 1) Intentar resolver desde cache guiders_recent_chats para evitar GET por ID
	try {
		const cachedRaw = localStorage.getItem('guiders_recent_chats');
		if (cachedRaw) {
			const list = JSON.parse(cachedRaw) as any[];
			const found = list.find(c => c && c.id === chatId);
			if (found) {
				// Normalizar campos a ChatDetailV2
				const detail: ChatDetailV2 = {
					id: found.id,
					status: found.status,
					priority: found.priority,
					visitorInfo: found.visitorInfo,
					assignedCommercialId: found.assignedCommercialId,
					assignedCommercial: found.assignedCommercial,
					availableCommercialIds: found.availableCommercialIds,
					metadata: found.metadata,
					createdAt: new Date(found.createdAt),
					assignedAt: found.assignedAt ? new Date(found.assignedAt) : undefined,
					closedAt: found.closedAt ? new Date(found.closedAt) : undefined,
					lastMessageDate: found.lastMessageDate ? new Date(found.lastMessageDate) : undefined,
					totalMessages: found.totalMessages ?? 0,
					unreadMessagesCount: found.unreadMessagesCount ?? 0,
					isActive: found.isActive ?? true,
					visitorId: found.visitorId,
					department: found.department,
					tags: found.tags,
					updatedAt: found.updatedAt ? new Date(found.updatedAt) : undefined,
					averageResponseTimeMinutes: found.averageResponseTimeMinutes,
					chatDurationMinutes: found.chatDurationMinutes,
					resolutionStatus: found.resolutionStatus,
					satisfactionRating: found.satisfactionRating
				};
				debugLog('[chat-detail-service] 📦 Usando detalle de chat desde cache local (sin GET):', chatId);
				return detail;
			}
		}
	} catch (cacheErr) {
		console.warn('[chat-detail-service] ⚠️ Error procesando cache guiders_recent_chats:', cacheErr);
	}

	const accessToken = localStorage.getItem('accessToken');
	const endpoints = EndpointManager.getInstance();
	const baseEndpointRaw = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
	// Normalizar raíz API (evitar duplicar /api)
	const apiRoot = baseEndpointRaw.endsWith('/api') ? baseEndpointRaw : `${baseEndpointRaw}/api`;

	const url = `${apiRoot}/v2/chats/${chatId}`;
	
	// Construir headers incluyendo sessionId
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};
	
	// Agregar sessionId como header X-Guiders-Sid
	const sessionId = sessionStorage.getItem('guiders_backend_session_id');
	if (sessionId) {
		headers['X-Guiders-Sid'] = sessionId;
	}
	
	// Agregar Authorization si existe (modo JWT)
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}
	
	const response = await fetch(url, {
		method: 'GET',
		headers
	});

	if (!response.ok) {
		throw new Error(`Error al obtener detalles del chat V2 (${response.status})`);
	}

	return response.json() as Promise<ChatDetailV2>;
}

/**
 * Convierte los detalles del chat V2 al formato legacy para compatibilidad
 * @param chatDetailV2 Detalles del chat en formato V2
 * @returns Detalles del chat en formato legacy
 */
export function convertV2ToLegacy(chatDetailV2: ChatDetailV2): ChatDetail {
	const participants: ChatParticipant[] = [];
	
	// Añadir el visitante como participante
	participants.push({
		id: chatDetailV2.visitorInfo.id,
		name: chatDetailV2.visitorInfo.name,
		isCommercial: false,
		isVisitor: true,
		isOnline: true, // Asumimos que el visitante está online si el chat está activo
		assignedAt: chatDetailV2.createdAt.toISOString(),
		lastSeenAt: chatDetailV2.lastMessageDate?.toISOString() || null,
		isViewing: chatDetailV2.isActive,
		isTyping: false,
		isAnonymous: false
	});

	// Añadir comerciales disponibles/asignados como participantes
	if (chatDetailV2.assignedCommercialId) {
		// Usar el nombre real del comercial si está disponible, sino usar nombre genérico
		const commercialName = chatDetailV2.assignedCommercial?.name || `Comercial ${chatDetailV2.assignedCommercialId}`;

		participants.push({
			id: chatDetailV2.assignedCommercialId,
			name: commercialName,
			isCommercial: true,
			isVisitor: false,
			isOnline: chatDetailV2.isActive, // Si el chat está activo, asumimos que está online
			assignedAt: chatDetailV2.assignedAt?.toISOString() || chatDetailV2.createdAt.toISOString(),
			lastSeenAt: chatDetailV2.lastMessageDate?.toISOString() || null,
			isViewing: chatDetailV2.isActive,
			isTyping: false,
			isAnonymous: false
		});
	} else if (chatDetailV2.availableCommercialIds) {
		// Añadir comerciales disponibles como participantes offline
		chatDetailV2.availableCommercialIds.forEach(commercialId => {
			participants.push({
				id: commercialId,
				name: `Comercial ${commercialId}`,
				isCommercial: true,
				isVisitor: false,
				isOnline: false, // Disponibles pero no asignados = offline
				assignedAt: chatDetailV2.createdAt.toISOString(),
				lastSeenAt: null,
				isViewing: false,
				isTyping: false,
				isAnonymous: false
			});
		});
	}

	return {
		id: chatDetailV2.id,
		participants,
		status: chatDetailV2.status,
		lastMessage: null, // V2 no incluye el último mensaje directamente
		lastMessageAt: chatDetailV2.lastMessageDate?.toISOString() || null,
		createdAt: chatDetailV2.createdAt.toISOString()
	};
}

/**
 * Obtiene los detalles completos de un chat (legacy, mantiene compatibilidad)
 * Internamente usa la API V2 y convierte al formato legacy
 * @param chatId ID del chat a consultar
 * @returns Promesa con los detalles del chat en formato legacy
 */
export async function fetchChatDetail(chatId: string): Promise<ChatDetail> {
	const chatDetailV2 = await fetchChatDetailV2(chatId);
	return convertV2ToLegacy(chatDetailV2);
}
