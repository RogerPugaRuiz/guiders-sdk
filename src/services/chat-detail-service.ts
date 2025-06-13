import { EndpointManager } from '../core/tracking-pixel-SDK';

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
 * Obtiene los detalles completos de un chat incluyendo participantes
 * @param chatId ID del chat a consultar
 * @returns Promesa con los detalles del chat
 */
export async function fetchChatDetail(chatId: string): Promise<ChatDetail> {
	const accessToken = localStorage.getItem('accessToken');
	const endpoints = EndpointManager.getInstance();
	const baseEndpoint = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();
	
	const response = await fetch(`${baseEndpoint}/chats/${chatId}`, {
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
