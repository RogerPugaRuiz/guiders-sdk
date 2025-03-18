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
			transform: "scale(0.8)", // Comienza contraído
			transformOrigin: "bottom right", // 🔥 La transformación ocurre desde la esquina inferior derecha
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
			display: "flex",
			flexDirection: "column",
		});

		Object.assign(this.chatBottom.style, <Partial<CSSStyleDeclaration>>{
			display: "flex",
			flexDirection: "column", // Cambiado a columna para que el mensaje esté debajo del input
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

		const message = document.createElement("div");
		message.classList.add("live-chat-message");
		message.classList.add("live-chat-message--other");
		message.textContent = "Hola, ¿en qué puedo ayudarte?";

		Object.assign(message.style, <Partial<CSSStyleDeclaration>>{
			background: "#ebebeb",
			padding: "10px",
			margin: "2px",
			borderRadius: "12px",
			fontFamily: "Arial, sans-serif",
			fontSize: "0.8rem",
			width: "fit-content",
		});

		this.chatBody.appendChild(message);


		this.chatBottom.appendChild(this.chatInput);
		this.chatBottom.appendChild(this.disconnectMessage);

		this.chatContainer.appendChild(this.chatHeader);
		this.chatContainer.appendChild(this.chatBody);
		this.chatContainer.appendChild(this.chatBottom);

		this.container.appendChild(this.chatContainer);
	}

	attachEvents(): void {
		this.chatButton.onClick(() => {
			const isOpen = this.chatContainer.classList.toggle("chat-open");

			if (isOpen) {
				this.chatContainer.style.opacity = "1";
				this.chatContainer.style.transform = "scale(1)";
				this.chatContainer.style.pointerEvents = "auto";
				this.chatContainer.style.transition = "transform 0.3s, opacity 0.3s"; // 🔥 Se agrega transición

				this.chatInput.focus();
			} else {
				this.chatContainer.style.opacity = "0";
				this.chatContainer.style.transform = "scale(0.8)"; // Se contrae hacia la esquina
				this.chatContainer.style.pointerEvents = "none";
				// quitar la transición para que no se vea al cerrar
				this.chatContainer.style.transition = "none";
			}
		});

		this.chatInput.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				const message = document.createElement("div");
				message.classList.add("live-chat-message");
				message.classList.add("live-chat-message--self");
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
				this.chatInput.value = "";
				this.chatBody.scrollTop = this.chatBody.scrollHeight;
			}
		});
	}

	updateProps(props: Record<string, any>): void {
		throw new Error("Method not implemented.");
	}
	destroy(): void {
		throw new Error("Method not implemented.");
	}
}