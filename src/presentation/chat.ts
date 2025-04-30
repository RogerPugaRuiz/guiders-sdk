// chat-ui.ts

import { Message } from "../types";
import { startChat } from "../services/chat-service";
import { fetchMessages } from "../services/fetch-messages";

// Posible tipo para el remitente
export type Sender = 'user' | 'other';

// Opciones de configuración del chat
export interface ChatUIOptions {
	containerId?: string;     // ID de un contenedor existente
	widget?: boolean;         // Indica si se debe crear un widget nuevo en el body
	widgetWidth?: string;
	widgetHeight?: string;
	userBgColor?: string;
	otherBgColor?: string;
	textColor?: string;
	maxWidthMessage?: string;
}

/**
 * Clase ChatUI para renderizar mensajes en el chat.
 * Se incluye lógica para:
 *  - scroll infinito (cargar mensajes antiguos en onScroll)
 *  - métodos para cargar mensajes iniciales y "prepend" mensajes antiguos
 */
export class ChatUI {
	private container: HTMLElement | null = null;
	private containerMessages: HTMLElement | null = null;
	private options: ChatUIOptions;

	/**
	 * Guarda un "index" para paginación inversa.
	 * Por defecto, null (no hay más mensajes que cargar).
	 */
	private currentIndex: string | null = null;

	private chatId: string | null = null;

	// Callbacks para eventos de apertura y cierre
	private openCallbacks: Array<() => void> = [];
	private closeCallbacks: Array<() => void> = [];

	// Estructura para almacenar múltiples intervalos y callbacks
	private activeIntervals: Array<{ id: number | null, callback: () => void, intervalMs: number }> = [];

	constructor(options: ChatUIOptions = {}) {
		this.options = {
			widget: false,
			widgetWidth: '300px',
			widgetHeight: '400px',
			userBgColor: '#007bff',
			otherBgColor: '#6c757d',
			textColor: '#fff',
			maxWidthMessage: '80%',
			...options
		};

		// Si se pasa un containerId, se obtiene ese contenedor; si no, ya veremos si creamos el widget.
		if (this.options.containerId) {
			const container = document.getElementById(this.options.containerId);
			if (!container) {
				throw new Error(`No se encontró el contenedor con ID "${this.options.containerId}"`);
			}
			this.container = container;
		}
	}

	/**
	 * Inicializa el chat.
	 * Si la opción widget está activa o no se pasa containerId,
	 * creamos un contenedor propio en el body.
	 */
	public init(): void {
		if (!this.container || this.options.widget) {
			this.container = document.createElement('div');
			this.container.style.backgroundColor = '#fff';
			this.container.classList.add('chat-widget'); // clase para estilos
			document.body.appendChild(this.container);

			// Configuramos el widget si así se requiere
			if (this.options.widget) {
				this.container.style.width = this.options.widgetWidth!;
				this.container.style.height = this.options.widgetHeight!;
				this.container.style.border = '1px solid #ccc';
				this.container.style.borderRadius = '10px';
				this.container.style.overflow = 'auto';
				this.container.style.display = 'flex';
				this.container.style.flexDirection = 'column';
				this.container.style.position = 'fixed';
				this.container.style.bottom = '80px';
				this.container.style.right = '20px';
				this.container.style.transition = 'all 0.3s';
			}
		}

		// Creamos un contenedor para mensajes con scroll vertical
		const containerMessages = document.createElement('div');
		containerMessages.style.display = 'flex';
		containerMessages.style.flexDirection = 'column';
		containerMessages.style.flex = '1';
		containerMessages.style.overflowY = 'auto'; // Scroll
		this.container.appendChild(containerMessages);
		this.containerMessages = containerMessages;

		// Bloque inferior para "empujar" mensajes hacia arriba
		const div = document.createElement('div');
		div.style.marginTop = 'auto';
		this.containerMessages.appendChild(div);

		// Estilo general
		this.container.style.display = 'flex';
		this.container.style.flexDirection = 'column';
		this.container.style.gap = '5px';

		// --- Scroll infinito: detecta scroll top ---
		this.containerMessages.addEventListener('scroll', () => {
			// Si el usuario llegó al tope (scrollTop == 0) y tenemos index
			if (this.containerMessages && this.containerMessages.scrollTop === 0 && this.currentIndex) {
				// Cargar más mensajes antiguos
				this.loadOlderMessages();
			}
		});

		startChat().then((res) => {
			console.log("Chat iniciado:", res);
			this.setChatId(res.id);
			this.loadInitialMessages(20);
		}).catch((err) => {
			console.error("Error iniciando chat:", err);
		});
	}


	/**
	 * Establece el ID del chat actual.
	 * @param chatId ID del chat
	 */
	public setChatId(chatId: string): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.chatId = chatId;
		this.container.setAttribute('data-chat-id', chatId);
	}

	/**
	 * Devuelve el ID del chat actual.
	 * @returns chatId
	 */

	public getChatId(): string | null {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		return this.chatId;
	}

	/**
	 * Renderiza un mensaje (alias de addMessage).
	 * @param params 
	 */
	public renderChatMessage(params: { text: string; sender: Sender }): void {
		const { text, sender } = params;
		this.addMessage(text, sender);
	}

	/**
	 * Carga inicial de mensajes desde el servidor (los más recientes).
	 * @param chatId ID del chat
	 * @param limit  cuántos mensajes traer
	 */
	public async loadInitialMessages(limit = 20): Promise<void> {
		if (!this.containerMessages) return;
		if (!this.chatId) {
			throw new Error('No se ha establecido un chatId');
		}
		const chatId = this.chatId;
		try {
			const data = await fetchMessages(chatId, null, limit);
			console.log("Mensajes iniciales:", data);
			// Ejemplo de respuesta: { total, index, message: [...] }

			// Guardamos el index para futuras peticiones (mensajes antiguos)
			this.currentIndex = data.cursor || null;
			// {"id": xxx, "email": xxx, roles: [xxx]}
			const accessToken = localStorage.getItem('accessToken') || '';
			if (!accessToken) {
				throw new Error('No se ha encontrado el token de acceso');
			}
			const payload = JSON.parse(atob(accessToken.split('.')[1]));
			const user = payload.sub; // ID del usuario
			console.log("Usuario:", user);

			// Renderizamos los mensajes (los más recientes)
			data.messages.reverse(); // Invertimos para mostrar los más nuevos al final
			for (const msg of data.messages) {
				console.log("Mensaje:", msg.senderId);
				const sender: Sender = (msg.senderId.includes(user)) ? 'user' : 'other';
				this.renderChatMessage({ text: msg.content, sender });
			}

			// Ajustar scroll al final (donde están los más nuevos)
			this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
		} catch (err) {
			console.error("Error cargando mensajes iniciales:", err);
		}
	}

	/**
	 * Scroll hacia abajo (último mensaje).
	 * @param scrollToBottom
	 */
	public scrollToBottom(scrollToBottom: boolean): void {
		if (!this.containerMessages) return;
		if (scrollToBottom) {
			this.containerMessages.scrollTop = this.containerMessages.scrollHeight;
		} else {
			this.containerMessages.scrollTop = 0;
		}
	}

	/**
	 * Cuando hacemos scroll hacia arriba, cargamos los mensajes "más antiguos".
	 */
	private async loadOlderMessages(): Promise<void> {
		if (!this.containerMessages || !this.currentIndex) return;

		// Guardamos la posición inicial para restaurarla
		const oldScrollHeight = this.containerMessages.scrollHeight;
		const oldScrollTop = this.containerMessages.scrollTop;

		try {
			const chatId = this.getChatId();
			if (!chatId) {
				throw new Error('No se ha establecido un chatId');
			}
			const data = await fetchMessages(chatId, this.currentIndex, 20);

			// Actualizamos el index para la siguiente carga (si hay más)
			this.currentIndex = data.cursor || null;

			// "Prepend" de mensajes antiguos
			for (const msg of data.messages) {
				const sender: Sender = (msg.senderId === "MI_USUARIO_ID") ? "user" : "other";
				this.prependMessage(msg.content, sender);
			}

			// Restaurar la posición del scroll para que no se mueva de golpe
			const newScrollHeight = this.containerMessages.scrollHeight;
			this.containerMessages.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
		} catch (err) {
			console.error("Error cargando mensajes antiguos:", err);
		}
	}

	/**
	 * Agrega un mensaje al final de la lista
	 */
	private addMessage(text: string, sender: Sender): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}
		const messageDiv = this.createMessageDiv(text, sender);
		this.containerMessages.appendChild(messageDiv);
	}

	/**
	 * Inserta un mensaje al principio de la lista (para mensajes antiguos)
	 */
	private prependMessage(text: string, sender: Sender): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}
		const messageDiv = this.createMessageDiv(text, sender);

		if (this.containerMessages.firstChild) {
			this.containerMessages.insertBefore(messageDiv, this.containerMessages.firstChild);
		} else {
			// Si no hay nada, es equivalente a un addMessage
			this.containerMessages.appendChild(messageDiv);
		}
	}

	/**
	 * Crea un nodo <div> con estilos de mensaje y contenido
	 */
	private createMessageDiv(text: string, sender: Sender): HTMLDivElement {
		const div = document.createElement('div');
		div.classList.add('chat-message');

		// Clases según remitente
		if (sender === 'user') {
			div.classList.add('chat-message-user');
		} else {
			div.classList.add('chat-message-other');
		}

		// Texto
		div.textContent = text;

		// Estilos en línea (recomendable usar CSS separado)
		div.style.padding = '10px';
		div.style.margin = '5px';
		div.style.borderRadius = '10px';
		div.style.maxWidth = this.options.maxWidthMessage!;
		div.style.whiteSpace = 'pre-wrap';

		if (sender === 'user') {
			div.style.backgroundColor = this.options.userBgColor!;
			div.style.color = this.options.textColor!;
			div.style.alignSelf = 'flex-end';
		} else {
			div.style.backgroundColor = this.options.otherBgColor!;
			div.style.color = this.options.textColor!;
			div.style.alignSelf = 'flex-start';
		}
		return div;
	}

	public hide(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display = 'none';
		// Limpia todos los intervalos activos
		this.activeIntervals.forEach(intervalObj => {
			if (intervalObj.id !== null) {
				clearInterval(intervalObj.id);
				intervalObj.id = null;
			}
		});
		this.closeCallbacks.forEach(cb => cb());
	}

	public show(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display = 'flex';
		this.scrollToBottom(true);
		// Inicia todos los intervalos configurados
		this.activeIntervals.forEach(intervalObj => {
			if (intervalObj.id === null) {
				intervalObj.id = window.setInterval(intervalObj.callback, intervalObj.intervalMs);
			}
		});
		this.openCallbacks.forEach(cb => cb());
	}

	public toggle(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display =
			this.container.style.display === 'none' ? 'flex' : 'none';

		this.scrollToBottom(true);

		if (this.container.style.display === 'flex') {
			this.openCallbacks.forEach(cb => cb());
		} else {
			this.closeCallbacks.forEach(cb => cb());
		}
	}

	public getOptions(): ChatUIOptions {
		return this.options;
	}

	/**
	 * Suscribe un callback al evento de apertura del chat.
	 */
	public onOpen(callback: () => void): void {
		this.openCallbacks.push(callback);
	}

	/**
	 * Suscribe un callback al evento de cierre del chat.
	 */
	public onClose(callback: () => void): void {
		this.closeCallbacks.push(callback);
	}

	/**
	 * Permite registrar múltiples callbacks periódicos mientras el chat está activo.
	 * @param callback Función a ejecutar
	 * @param intervalMs Intervalo en milisegundos (por defecto 5000ms)
	 */
	public onActiveInterval(callback: () => void, intervalMs: number = 5000): void {
		this.activeIntervals.push({ id: null, callback, intervalMs });
	}
}

// -------------------------------------------------------------------
// ChatInputUI.ts (ejemplo mínimo)
// -------------------------------------------------------------------
export class ChatInputUI {
	private chat: ChatUI;
	private inputContainer: HTMLElement | null = null;
	private submitCallbacks: Array<(message: string) => void> = [];

	constructor(chat: ChatUI) {
		this.chat = chat;
	}

	public init(): void {
		// Por simplicidad, creamos un input text y lo pegamos debajo del chat.
		this.inputContainer = document.createElement('div');
		this.inputContainer.style.display = 'flex';
		this.inputContainer.style.padding = '5px';

		const input = document.createElement('input');
		input.type = 'text';
		input.style.flex = '1';
		input.placeholder = 'Escribe un mensaje...';

		const button = document.createElement('button');
		button.textContent = 'Enviar';

		button.addEventListener('click', () => {
			const msg = input.value.trim();
			if (msg) {
				this.submitCallbacks.forEach(cb => cb(msg));
				// Opcional, también podemos renderizarlo en el chat de inmediato
				this.chat.renderChatMessage({ text: msg, sender: 'user' });
				input.value = '';
			}
		});

		// EventListener para Enter
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				button.click();
			}
		});

		this.inputContainer.appendChild(input);
		this.inputContainer.appendChild(button);

		document.body.appendChild(this.inputContainer);
	}

	public onSubmit(callback: (message: string) => void): void {
		this.submitCallbacks.push(callback);
	}
}