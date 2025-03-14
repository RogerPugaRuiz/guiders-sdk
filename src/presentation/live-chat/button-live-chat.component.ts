import { BaseComponent } from "../../interfaces/base-component.abstract";

export class ButtonLiveChatComponent extends BaseComponent {
	private button: HTMLButtonElement;

	constructor(props: { container: HTMLElement | string }) {
		super(props); // Llama al constructor de BaseComponent
		this.button = document.createElement("button");
		this.render();
		this.attachEvents();
	}

	render(): void {
		if (typeof this.container === "string") {
			throw new Error("Container must be an HTMLElement.");
		}

		this.button.textContent = "Live Chat";
		this.button.classList.add("live-chat-button");

		// Estilos para hacer el botón fijo en la esquina inferior derecha
		Object.assign(this.button.style, {
			position: "fixed",
			bottom: "20px",
			right: "20px",
			zIndex: "1000",
			background: "#0089f6",
			color: "white",
			border: "none",
			borderRadius: "50px",
			padding: "12px 20px",
			cursor: "pointer",
			boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
			fontSize: "16px",
			transition: "background 0.3s ease"
		});

		this.container.appendChild(this.button);
	}

	attachEvents(): void {

		// Efecto hover
		this.button.addEventListener("mouseover", () => {
			this.button.style.background = "#0056b3";
		});
		this.button.addEventListener("mouseout", () => {
			this.button.style.background = "#007bff";
		});
	}

	onClick(callback: () => void): void {
		this.button.addEventListener("click", callback);
	}

	updateProps(props: Record<string, any>): void {
		if (props.text) {
			this.button.textContent = props.text;
		}
		if (props.backgroundColor) {
			this.button.style.background = props.backgroundColor;
		}
	}

	destroy(): void {
		this.button.remove();
	}
}