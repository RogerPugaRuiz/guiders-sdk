import { BaseComponent } from "../../interfaces/base-component.abstract";
import { WebSocketPort } from "../../interfaces/websocket.interface";
import { ButtonLiveChatComponent } from "./button-live-chat.component";

export class LiveChatComponent extends BaseComponent {
	private chatContainer: HTMLDivElement;
	private chatHeader: HTMLDivElement;
	private chatBody: HTMLDivElement;
	private chatBottom: HTMLDivElement;
	private chatInput: HTMLInputElement;
	private chatButton: ButtonLiveChatComponent;
	private socketService: WebSocketPort;
	private disconnectMessage: HTMLDivElement;

	// Lista de suscripciones para persistir los listeners
	private subscriptions: Array<{ event: string; callback: (...args: any[]) => void }> = [];

	constructor(props: {
		container: HTMLElement | string,
		socketService: WebSocketPort,
	}) {
		super(props);
		this.chatContainer = document.createElement("div");
		this.chatHeader = document.createElement("div");
		this.chatBody = document.createElement("div");
		this.chatBottom = document.createElement("div");
		this.chatInput = document.createElement("input");
		this.chatButton = new ButtonLiveChatComponent({
			container: props.container
		});
		this.disconnectMessage = document.createElement("div");
		this.disconnectMessage.classList.add("disconnect-message");
		this.disconnectMessage.textContent = "Conexión perdida. Intentando reconectar...";
		this.disconnectMessage.style.display = "none"; // Oculto por defecto
		Object.assign(this.disconnectMessage.style, <Partial<CSSStyleDeclaration>>{
			color: "red",
			fontSize: "0.8rem",
			textAlign: "center",
			marginTop: "10px",
			fontFamily: "Arial, sans-serif",
		});

		this.socketService = props.socketService;
		this.render();
		this.attachEvents();
	}

	render(): void {
		if (typeof this.container === "string") {
			throw new Error("Container must be an HTMLElement.");
		}
		this.chatContainer.classList.add("live-chat-container");
		this.chatHeader.classList.add("live-chat-header");
		this.chatBody.classList.add("live-chat-body");
		this.chatBottom.classList.add("live-chat-bottom");
		this.chatInput.classList.add("live-chat-input");

		this.chatHeader.textContent = "Mensajes";
		this.chatInput.placeholder = "Type a message...";
		this.chatInput.type = "text";

		Object.assign(this.chatContainer.style, <Partial<CSSStyleDeclaration>>{
			position: "fixed",
			bottom: "80px",
			right: "20px",
			zIndex: "1000",
			height: "calc(100% - 100px)",
			maxHeight: "500px",
			width: "350px",
			background: "white",
			borderRadius: "10px",
			boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
			opacity: "0",
			transform: "scale(0.8)",
			transformOrigin: "bottom right",
			pointerEvents: "none",
			display: "flex",
			flexDirection: "column",
		});

		Object.assign(this.chatHeader.style, <Partial<CSSStyleDeclaration>>{
			background: "#0089f6",
			color: "white",
			padding: "10px",
			borderTopLeftRadius: "10px",
			borderTopRightRadius: "10px",
			fontSize: "18px",
			fontWeight: "bold",
			textAlign: "center",
			flex: "0 0 auto",
			fontFamily: "Arial, sans-serif",
		});

		Object.assign(this.chatBody.style, <Partial<CSSStyleDeclaration>>{
			padding: "10px",
			overflowY: "auto",
			flex: "1 1 auto",
			minHeight: "0", // Permite que se encoja y active el scroll
			display: "flex",
			flexDirection: "column",
			// Sin justify-content; se controlará con margin-top en el último mensaje
		});

		Object.assign(this.chatBottom.style, <Partial<CSSStyleDeclaration>>{
			display: "flex",
			flexDirection: "column",
			flexWrap: "nowrap",
			justifyContent: "space-between",
			alignItems: "center",
			flex: "0 0 auto",
		});

		Object.assign(this.chatInput.style, <Partial<CSSStyleDeclaration>>{
			outline: "none",
			margin: "10px",
			padding: "10px",
			width: "calc(100% - 55px)",
			borderRadius: "20px",
			border: "1px solid #ccc",
		});

		this.chatBottom.appendChild(this.chatInput);
		this.chatBottom.appendChild(this.disconnectMessage);

		this.chatContainer.appendChild(this.chatHeader);
		this.chatContainer.appendChild(this.chatBody);
		this.chatContainer.appendChild(this.chatBottom);

		this.container.appendChild(this.chatContainer);
	}

	async attachEvents(): Promise<void> {
		await this.socketService.waitForConnection();

		// Función para manejar el nuevo mensaje
		const newMessageHandler = (data: { message: string }) => {
			const message = document.createElement("div");
			message.classList.add("live-chat-message", "live-chat-message--other");
			message.textContent = data.message;

			Object.assign(message.style, <Partial<CSSStyleDeclaration>>{
				background: "#ebebeb",
				padding: "10px",
				margin: "2px",
				borderRadius: "12px",
				fontFamily: "Arial, sans-serif",
				fontSize: "0.8rem",
				width: "fit-content",
			});
			// Al agregar un mensaje, actualizamos el margin-top de todos para que solo el último tenga auto.
			this.chatBody.appendChild(message);
			this.updateMessagesMargin();
			this.chatBody.scrollTop = this.chatBody.scrollHeight;
		};

		// Función para manejar la reconexión
		const connectHandler = () => {
			console.log("WebSocket reconectado. Re-activando listeners.");
			// Vuelve a suscribir todos los listeners guardados
			this.subscriptions.forEach(sub => {
				this.socketService.on(sub.event, sub.callback);
			});
		};

		// Registrar las suscripciones y guardarlas
		this.registerSubscription("new_message", newMessageHandler);
		this.registerSubscription("connect", connectHandler);

		// Suscribirse inmediatamente
		this.socketService.on("new_message", newMessageHandler);
		this.socketService.on("connect", connectHandler);

		// Eventos locales: botón y envío de mensajes
		this.chatButton.onClick(() => {
			const isOpen = this.chatContainer.classList.toggle("chat-open");

			if (isOpen) {
				this.chatContainer.style.opacity = "1";
				this.chatContainer.style.transform = "scale(1)";
				this.chatContainer.style.pointerEvents = "auto";
				this.chatContainer.style.transition = "transform 0.3s, opacity 0.3s";
				this.chatInput.focus();
			} else {
				this.chatContainer.style.opacity = "0";
				this.chatContainer.style.transform = "scale(0.8)";
				this.chatContainer.style.pointerEvents = "none";
				this.chatContainer.style.transition = "none";
			}
		});

		this.chatInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				const message = document.createElement("div");
				message.classList.add("live-chat-message", "live-chat-message--self");
				message.textContent = this.chatInput.value;

				Object.assign(message.style, <Partial<CSSStyleDeclaration>>{
					background: "#0089f6",
					color: "white",
					padding: "10px",
					margin: "2px",
					borderRadius: "12px",
					fontFamily: "Arial, sans-serif",
					fontSize: "0.8rem",
					width: "fit-content",
					alignSelf: "flex-end",
				});

				this.chatBody.appendChild(message);
				this.updateMessagesMargin();
				this.chatInput.value = "";
				this.chatBody.scrollTop = this.chatBody.scrollHeight;

				this.socketService.sendMsg("send_chat_message", {
					message: message.textContent,
				});
			}
		});
	}

	// Método para registrar una suscripción y guardarla en la lista
	private registerSubscription(event: string, callback: (...args: any[]) => void): void {
		// Evitamos duplicados
		if (!this.subscriptions.find(sub => sub.event === event && sub.callback === callback)) {
			this.subscriptions.push({ event, callback });
		}
	}

	// Actualiza el margin-top para que solo el último mensaje tenga "auto"
	private updateMessagesMargin(): void {
		const children = Array.from(this.chatBody.children);
		children.forEach((child, index) => {
			child instanceof HTMLElement && (child.style.marginTop = index === children.length - 1 ? "auto" : "");
		});
	}

	updateProps(props: Record<string, any>): void {
		throw new Error("Method not implemented.");
	}
	destroy(): void {
		throw new Error("Method not implemented.");
	}
}
