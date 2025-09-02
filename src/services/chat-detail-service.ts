import { EndpointManager } from '../core/tracking-pixel-SDK';
import { ChatSessionStore } from './chat-session-store';
import { VisitorInfoV2, ChatMetadataV2 } from '../types';

// Interfaz para la respuesta V2 del chat basada en los DTOs del backend
export interface ChatDetailV2 {
	id: string;
	status: string;
	priority: string;
	visitorInfo: VisitorInfoV2;
	assignedCommercialId?: string;
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
	const accessToken = localStorage.getItem('accessToken');
	const endpoints = EndpointManager.getInstance();
	const baseEndpointRaw = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
	// Normalizar raíz API (evitar duplicar /api)
	const apiRoot = baseEndpointRaw.endsWith('/api') ? baseEndpointRaw : `${baseEndpointRaw}/api`;

	const url = `${apiRoot}/v2/chats/${chatId}`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${accessToken || ''}`,
			'Content-Type': 'application/json'
		}
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
		participants.push({
			id: chatDetailV2.assignedCommercialId,
			name: `Comercial ${chatDetailV2.assignedCommercialId}`, // Nombre genérico
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
		try {
			// Intentar primero con la API V2
			const chatDetailV2 = await fetchChatDetailV2(chatId);
			return convertV2ToLegacy(chatDetailV2);
		} catch (error) {
			console.warn('Error al obtener detalles del chat con API V2, intentando crear chat V2 por PUT:', error);
			// Fallback: intentar crear el chat V2 por PUT (idempotente)
			try {
				// Aquí deberías construir el payload mínimo requerido según el endpoint
				// Por simplicidad, se asume que visitorId y visitorInfo están disponibles en localStorage o contexto global
				const visitorId = localStorage.getItem('visitorId');
				const visitorName = localStorage.getItem('visitorName') || 'Visitante';
				const visitorEmail = localStorage.getItem('visitorEmail') || 'no-email@example.com';
				const availableCommercialIds = JSON.parse(localStorage.getItem('availableCommercialIds') || '[]');
				const payload = {
					visitorId,
					visitorInfo: {
						name: visitorName,
						email: visitorEmail
					},
					availableCommercialIds
				};
				const { ChatV2Service } = await import('./chat-v2-service');
				const chatV2Service = ChatV2Service.getInstance();
				const chatV2 = await chatV2Service.createChat(chatId, payload);
				return convertV2ToLegacy(chatV2 as any);
			} catch (putError) {
				console.warn('Error al crear chat V2 por PUT, intentando con API legacy:', putError);
				// Fallback a la API legacy
				const accessToken = localStorage.getItem('accessToken');
				const endpoints = EndpointManager.getInstance();
				const baseEndpointRaw = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
				const apiRoot = baseEndpointRaw.endsWith('/api') ? baseEndpointRaw : `${baseEndpointRaw}/api`;
				const response = await fetch(`${apiRoot}/chats/${chatId}`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${accessToken || ''}`,
						'Content-Type': 'application/json'
					}
				});
				if (!response.ok) {
					throw new Error(`Error al obtener detalles del chat (${response.status})`);
				}
				return response.json() as Promise<ChatDetail>;
			}
		}
}
