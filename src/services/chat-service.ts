import { v4 as uuidv4 } from 'uuid';
import { EndpointManager } from '../core/tracking-pixel-SDK';

const chats: string[] = JSON.parse(localStorage.getItem('chats') || '[]');

export async function startChat(): Promise<any> {
	const accessToken = localStorage.getItem('accessToken');
	const endpoints = EndpointManager.getInstance();
	const baseEndpoint = localStorage.getItem('pixelEndpoint') || endpoints.getEndpoint();

	let validChatId: string | null = null;
	let chatsToKeep: string[] = [];

	// Verificar todos los chats en paralelo para mejorar el rendimiento
	if (chats.length > 0) {
		try {
			// Crear un array de promesas para todas las peticiones
			const checkPromises = chats.map(chatId => 
				fetch(`${baseEndpoint}/chat/${chatId}`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${accessToken || ''}`,
						'Content-Type': 'application/json'
					}
				})
				.then(response => {
					if (response.ok) {
						return chatId; // Devuelve el chatId si es válido
					}
					return null; // No válido
				})
				.catch(error => {
					console.warn(`Error al recuperar chat ${chatId}:`, error);
					return null;
				})
			);
			
			// Esperar a que todas las promesas se resuelvan
			const results = await Promise.all(checkPromises);
			
			// Filtrar los resultados válidos
			chatsToKeep = results.filter(id => id !== null) as string[];
			
			// Usar el primer chat válido
			if (chatsToKeep.length > 0) {
				validChatId = chatsToKeep[0];
			}
		} catch (error) {
			console.warn('Error al recuperar chats existentes:', error);
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