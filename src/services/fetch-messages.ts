import { Message } from "../types";

export async function fetchMessages(chatId: string, cursor?: string | null, limit: number = 10): Promise<{
	total: number;
	cursor: string;
	messages: Array<Message>;
}> {
	if (!chatId) throw new Error('chatId requerido para fetchMessages');
	const params = new URLSearchParams();
	if (cursor) params.append("cursor", cursor);
	params.append("limit", String(limit));
	// Usar siempre endpoint V2 normalizado
	const base = localStorage.getItem('pixelEndpoint') || '';
	const apiRoot = base.endsWith('/api') ? base : `${base}/api`;
	const URL = `${apiRoot}/v2/chats/${chatId}/messages?${params.toString()}`;
	
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
	const accessToken = localStorage.getItem('accessToken');
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}
	
	const res = await fetch(URL, {
		headers
	});
	if (!res.ok) {
		throw new Error(`Error al obtener mensajes (${res.status})`);
	}
	return res.json() as Promise<{
		total: number;
		cursor: string;
		messages: Array<Message>;
	}>;
}