import { Message } from "../types";

export async function fetchMessages(chatId: string, cursor?: string | null, limit: number = 10): Promise<{
	total: number;
	cursor: string;
	messages: Array<Message>;
}> {
	const params = new URLSearchParams();
	if (cursor) params.append("cursor", cursor);
	params.append("limit", String(limit));
	const URL = `${localStorage.getItem('pixelEndpoint')}/chat/${chatId}/messages?${params.toString()}`;
	// const url = `http://localhost:3000/chat/${chatId}/messages?${params.toString()}`;
	const res = await fetch(URL, {
		headers: {
			'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
			'Content-Type': 'application/json',
		},
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