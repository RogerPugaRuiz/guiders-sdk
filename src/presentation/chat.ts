// chat-ui.ts

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

// Clase ChatUI para renderizar mensajes en el chat.
export class ChatUI {
	private container: HTMLElement | null = null;
	private containerMessages: HTMLElement | null = null;
	private options: ChatUIOptions;

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
	 * Inicializa el chat: si la opción widget está activa o no se pasa containerId,
	 * creamos un contenedor propio. 
	 */
	public init(): void {
		// Si no hay un contenedor definido o se configura como widget, creamos uno en el body.
		if (!this.container || this.options.widget) {
			this.container = document.createElement('div');
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
		const containerMessages = document.createElement('div');
		containerMessages.style.display = 'flex';
		containerMessages.style.flexDirection = 'column';
		containerMessages.style.flex = '1'; // Ocupa el espacio disponible
		containerMessages.style.overflowY = 'auto'; // Scroll vertical
		this.container.appendChild(containerMessages);
		this.containerMessages = containerMessages;

		const div = document.createElement('div');
		div.style.marginTop = 'auto'; // Agrega margin-top auto
		this.containerMessages.appendChild(div);

		// Estilo general del contenedor (puede ir en CSS, pero lo dejamos aquí como ejemplo)
		this.container.style.display = 'flex';
		this.container.style.flexDirection = 'column';
		this.container.style.gap = '5px';
	}

	/**
	 * Renderiza un mensaje. Alias de addMessage para mayor legibilidad.
	 * @param text El texto del mensaje
	 * @param sender Quien envía el mensaje
	 */
	public renderChatMessage(params: { text: string; sender: Sender }): void {
		const { text, sender } = params;
		this.addMessage(text, sender);
	}


	/**
	 * Esconde el chat.
	 * @returns void
	 */
	public hide(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display = 'none';
	}

	/**
	 * Muestra el chat.
	 * @returns void
	 */
	public show(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display = 'flex';
	}

	/**
	 * Cambia la visibilidad del chat.
	 * @returns void
	 */
	public toggle(): void {
		if (!this.container) {
			throw new Error('No se ha inicializado el chat');
		}
		this.container.style.display = this.container.style.display === 'none' ? 'flex' : 'none';
	}

	public getOptions(): ChatUIOptions {
		return this.options;
	}


	/**
	 * Crea y agrega un mensaje al chat.
	 * @param text El texto del mensaje
	 * @param sender El remitente del mensaje (user | other)
	 */
	private addMessage(text: string, sender: Sender): void {
		if (!this.container || !this.containerMessages) {
			throw new Error('No se ha inicializado el chat');
		}
		const messageDiv = document.createElement('div');
		messageDiv.classList.add('chat-message'); // clase genérica para estilos

		// Para mayor flexibilidad, aplica clases según remitente
		if (sender === 'user') {
			messageDiv.classList.add('chat-message-user');
		} else {
			messageDiv.classList.add('chat-message-other');
		}

		// Asigna contenido
		messageDiv.textContent = text;

		// Estilos en línea de ejemplo (recomendable usar CSS)
		messageDiv.style.padding = '10px';
		messageDiv.style.margin = '5px';
		messageDiv.style.borderRadius = '10px';
		messageDiv.style.maxWidth = this.options.maxWidthMessage!;

		if (sender === 'user') {
			messageDiv.style.backgroundColor = this.options.userBgColor!;
			messageDiv.style.color = this.options.textColor!;
			messageDiv.style.alignSelf = 'flex-end';
		} else {
			messageDiv.style.backgroundColor = this.options.otherBgColor!;
			messageDiv.style.color = this.options.textColor!;
			messageDiv.style.alignSelf = 'flex-start';
		}

		this.containerMessages.appendChild(messageDiv);
	}
}
