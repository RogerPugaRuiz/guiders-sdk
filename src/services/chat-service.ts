import { v4 as uuidv4 } from 'uuid';
import { WebSocketClient } from './websocket-service';

const chats: string[] = JSON.parse(localStorage.getItem('chats') || '[]');



export async function startChat(): Promise<any> {
	const uuid = uuidv4();
	const accessToken = localStorage.getItem('accessToken');

	if (chats.length > 0) {
		return {
			id: chats[0],
		}
	}

	try {
		const webSocketClient = WebSocketClient.getInstance(localStorage.getItem('pixelEndpoint') || '');
		const response = await webSocketClient.sendMessage({
			type: 'visitor:start-chat',
			data: {
				chatId: uuid,
			},
		})

		if ('error' in response) {
			throw new Error('Network response was not ok');
		}
		console.log('Chat started:', response);

		chats.push(uuid);
		localStorage.setItem('chats', JSON.stringify(chats));

		return {
			id: uuid,
		}
	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
		throw error;
	}
}