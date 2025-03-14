import { BaseComponent } from "../../interfaces/base-component.abstract";
import { ButtonLiveChatComponent } from "./button-live-chat.component";

export class LiveChatComponent extends BaseComponent {
	private chatContainer: HTMLDivElement;
	private chatHeader: HTMLDivElement;
	private chatBody: HTMLDivElement;
	private chatBottom: HTMLDivElement;
	private chatInput: HTMLInputElement;
	private chatButton: ButtonLiveChatComponent;

	constructor(props: { container: HTMLElement | string }) {
		super(props);
		this.chatContainer = document.createElement("div");
		this.chatHeader = document.createElement("div");
		this.chatBody = document.createElement("div");
		this.chatBottom = document.createElement("div");
		this.chatInput = document.createElement("input");
		this.chatButton = new ButtonLiveChatComponent({
			container: props.container
		});

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
			height: "70vh",
			width: "350px",
			background: "white",
			borderRadius: "10px",
			boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
			transition: "opacity 0.3s ease, transform 0.3s ease",
			opacity: "0",
			transform: "translateY(50px)",
			pointerEvents: "none",
		});

		Object.assign(this.chatHeader.style, <Partial<CSSStyleDeclaration>>{
			background: "#007bff",
			color: "white",
			padding: "10px",
			borderTopLeftRadius: "10px",
			borderTopRightRadius: "10px",
			fontSize: "18px",
			fontWeight: "bold",
			textAlign: "center",
			flex: "0 0 auto"
		});

		Object.assign(this.chatBody.style, <Partial<CSSStyleDeclaration>>{
			padding: "10px",
			overflowY: "auto",
			flex: "1 1 auto"
		});

		Object.assign(this.chatBottom.style, <Partial<CSSStyleDeclaration>>{
			display: "flex",
			flexDirection: "row",
			flexWrap: "nowrap",
			justifyContent: "space-between",
			alignItems: "center",
			flex: "0 0 auto",
		});

		Object.assign(this.chatInput.style, <Partial<CSSStyleDeclaration>>{
			width: "100%",
			outline: "none",
			margin: "10px",
			padding: "10px",
			borderTopLeftRadius: "10px",
			borderTopRightRadius: "10px",
			borderBottomLeftRadius: "10px",
			borderBottomRightRadius: "10px",
			border: "1px solid #ccc",
		});


		this.chatBottom.appendChild(this.chatInput);

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
				this.chatContainer.style.transform = "translateY(0)";
				this.chatContainer.style.pointerEvents = "auto";
			} else {
				this.chatContainer.style.opacity = "0";
				this.chatContainer.style.transform = "translateY(50px)";
				this.chatContainer.style.pointerEvents = "none";
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