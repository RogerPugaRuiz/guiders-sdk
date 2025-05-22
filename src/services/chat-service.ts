import { v4 as uuidv4 } from 'uuid';
import { EndpointManager } from '../core/tracking-pixel-SDK';

const chats: string[] = JSON.parse(localStorage.getItem('chats') || '[]');

export async function startChat(): Promise<any> {
	const accessToken = localStorage.getItem('accessToken');
	const endpoints = EndpointManager.getInstance();
	const baseEndpoint = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();

	let validChatId: string | null = null;
	let chatsToKeep: string[] = [];

	// Buscar el primer chat válido en la lista
	for (const chatId of chats) {
		try {
			const response = await fetch(`${baseEndpoint}/chat/${chatId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken || ''}`,
					'Content-Type': 'application/json'
				}
			});
			if (response.ok) {
				validChatId = chatId;
				chatsToKeep.push(chatId);
				break;
			} else if (response.status !== 404) {
				// Si es otro error diferente a 404, solo lo logueamos
				console.warn(`Error al recuperar chat ${chatId}: status ${response.status}`);
			}
			// Si es 404, no lo agregamos a chatsToKeep (lo eliminamos de la lista)
		} catch (error) {
			console.warn('Error al recuperar chat existente:', error);
		}
	}

	if (validChatId) {
		localStorage.setItem('chats', JSON.stringify(chatsToKeep));
		console.log('Chat existente recuperado');
		return { id: validChatId };
	}

	// Si no hay chats válidos, crear uno nuevo
	try {
		const uuid = uuidv4();
		const response = await fetch(`${baseEndpoint}/chat/${uuid}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken || ''}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Error al crear chat (${response.status})`);
		}

		console.log('Chat creado:', uuid);

		chatsToKeep = [uuid];
		localStorage.setItem('chats', JSON.stringify(chatsToKeep));

		return { id: uuid };
	} catch (error) {
		console.error('Error al iniciar el chat:', error);
		throw error;
	}
}