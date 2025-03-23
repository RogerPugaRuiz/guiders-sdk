import { ClientJS } from "clientjs";
import { PipelineProcessor, PipelineProcessorBuilder } from "../pipeline/pipeline-processor";
import { PipelineStage } from "../pipeline/pipeline-stage";
import { TrackingEvent } from "../types";
import { TokenManager } from "./token-manager";
import { ensureTokens } from "../services/token-service";
import { checkServerConnection } from "../services/health-check-service";
import { WebSocketClient } from "../services/websocket-service";
import { TimeStampStage } from "../pipeline/stages/time-stamp-stage";
import { TokenInjectionStage } from "../pipeline/stages/token-stage";
import { ValidationStage } from "../pipeline/stages/validation-stage";

interface SDKOptions {
	endpoint?: string;
	apiKey: string;
	autoFlush?: boolean;
	flushInterval?: number;
	maxRetries?: number;
}

export class TrackingPixelSDK {
	private readonly pipelineBuilder = new PipelineProcessorBuilder<TrackingEvent, TrackingEvent>();
	private eventPipeline: PipelineProcessor<TrackingEvent, TrackingEvent>;

	private eventQueue: TrackingEvent[] = [];
	private endpoint: string;
	private apiKey: string;
	private fingerprint: string | null = null;
	private webSocket: WebSocketClient | null = null;

	private autoFlush = false;
	private flushInterval = 10000;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private maxRetries = 3;
	private listeners = new Map<string, Set<(msg: TrackingEvent) => void>>();

	constructor(options: SDKOptions) {
		this.endpoint = options.endpoint || "http://localhost:3000";
		this.apiKey = options.apiKey;
		this.autoFlush = options.autoFlush ?? false;
		this.flushInterval = options.flushInterval ?? 10000;
		this.maxRetries = options.maxRetries ?? 3;

		this.eventPipeline = this.pipelineBuilder
			.addStage(new TimeStampStage())
			.addStage(new TokenInjectionStage())
			.addStage(new ValidationStage())
			.build();

		this.webSocket = new WebSocketClient(this.endpoint);

	}

	public async init(): Promise<void> {
		

		await checkServerConnection(this.endpoint);
		console.log("✅ Conexión con el servidor establecida.");

		const client = new ClientJS();
		this.fingerprint = localStorage.getItem("fingerprint") || client.getFingerprint().toString();
		localStorage.setItem("fingerprint", this.fingerprint);

		if (!TokenManager.loadTokensFromStorage()) {
			console.log("No se encontraron tokens en el almacenamiento local.");
			const tokens = await ensureTokens(this.fingerprint, this.apiKey);
			TokenManager.setTokens(tokens);
		}

		const token = await TokenManager.getValidAccessToken();
		if (token && this.webSocket) this.webSocket.connect(token);
		else console.warn("WebSocket no conectado por falta de token.");

		TokenManager.startTokenMonitor();

		if (this.autoFlush) {
			this.startAutoFlush();
		}

		if (this.webSocket) {
			this.webSocket.onChatMessage((message) => {
				const processedMessage = this.eventPipeline.process(message as TrackingEvent);
				console.log("Mensaje recibido:", processedMessage);
				this.dispatchMessage(processedMessage);
			});
		}

		this.createChatWidget();
	}

	public on(type: string, listener: (msg: TrackingEvent) => void): void {
		if (!this.listeners.has(type)) {
			this.listeners.set(type, new Set());
		}
		this.listeners.get(type)?.add(listener);
	}

	public off(type: string, listener: (msg: TrackingEvent) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	public once(type: string, listener: (msg: TrackingEvent) => void): void {
		const wrappedListener = (msg: TrackingEvent) => {
			listener(msg);
			this.off(type, wrappedListener);
		};
		this.on(type, wrappedListener);
	}

	public addPipelineStage(stage: PipelineStage<TrackingEvent, TrackingEvent>): void {
		this.eventPipeline.addStage(stage);
	}

	public captureEvent(type: string, data: Record<string, unknown>): void {
		const rawEvent: TrackingEvent = {
			type,
			data,
			timestamp: Date.now(),
		};
		const processedEvent = this.eventPipeline.process(rawEvent);
		this.eventQueue.push(processedEvent);
	}

	public setMetadata(event: string, metadata: Record<string, unknown>): void {
		const eventIndex = this.eventQueue.findIndex((e) => e.type === event);
		if (eventIndex === -1) {
			console.warn(`Evento '${event}' no encontrado en la cola.`);
			return;
		}

		this.eventQueue[eventIndex].metadata = metadata;
	}

	public flushEvents(): void {
		if (this.eventQueue.length === 0) return;

		const eventsToSend = [...this.eventQueue];
		this.eventQueue = [];

		eventsToSend.forEach((event) => this.trySendEventWithRetry(event, this.maxRetries));
	}

	public stopAutoFlush(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}

	private async trySendEventWithRetry(event: TrackingEvent, retriesLeft: number): Promise<void> {
		try {
			if (this.webSocket?.isConnected()) {
				await this.webSocket.sendMessage(event);
			} else {
				throw new Error("WebSocket no conectado");
			}
		} catch (error) {
			if (retriesLeft > 0) {
				console.warn(`Retrying (${this.maxRetries - retriesLeft + 1})...`);
				setTimeout(() => {
					this.trySendEventWithRetry(event, retriesLeft - 1);
				}, 1000); // 1 segundo entre intentos
			} else {
				console.error("❌ No se pudo enviar el evento después de varios intentos:", event);
			}
		}
	}

	private setupInternalPipeline(): void {
		this.eventPipeline.addStage(new TimeStampStage());
		this.eventPipeline.addStage(new TokenInjectionStage());
		this.eventPipeline.addStage(new ValidationStage());
	}

	private startAutoFlush(): void {
		if (this.flushTimer) clearInterval(this.flushTimer);
		this.flushTimer = setInterval(() => {
			this.flushEvents();
		}, this.flushInterval);
	}

	private dispatchMessage(message: TrackingEvent): void {
		const listeners = this.listeners.get(message.type);
		if (!listeners || listeners.size === 0) return;

		listeners.forEach((listener) => {
			try {
				listener(message);
			} catch (error) {
				console.error("Error al ejecutar listener:", error);
			}
		});
	}

	// Método para crear un widget de chat similar a Intercom
	private createChatWidget(): void {
		// Crear contenedor del chat (inicialmente oculto)
		const chatContainer = document.createElement("div");
		chatContainer.id = "chatWidget";
		chatContainer.style.position = "fixed";
		chatContainer.style.bottom = "60px"; // Se deja espacio para el botón de toggle
		chatContainer.style.right = "20px";
		chatContainer.style.width = "300px";
		chatContainer.style.height = "400px";
		chatContainer.style.backgroundColor = "#fff";
		chatContainer.style.border = "1px solid #ccc";
		chatContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
		chatContainer.style.display = "none"; // Oculto inicialmente
		chatContainer.style.flexDirection = "column";
		chatContainer.style.zIndex = "1000";

		// Encabezado del chat
		const header = document.createElement("div");
		header.innerText = "Chat";
		header.style.backgroundColor = "#007bff";
		header.style.color = "#fff";
		header.style.padding = "10px";
		header.style.fontWeight = "bold";
		chatContainer.appendChild(header);

		// Contenedor de mensajes
		const messagesContainer = document.createElement("div");
		messagesContainer.id = "chatMessages";
		messagesContainer.style.flex = "1";
		messagesContainer.style.overflowY = "auto";
		messagesContainer.style.padding = "10px";
		chatContainer.appendChild(messagesContainer);

		// Contenedor de entrada (sin botón, se usa Enter)
		const inputContainer = document.createElement("div");
		inputContainer.style.display = "flex";
		inputContainer.style.borderTop = "1px solid #ccc";

		const input = document.createElement("input");
		input.type = "text";
		input.placeholder = "Escribe un mensaje y pulsa Enter...";
		input.style.flex = "1";
		input.style.padding = "10px";

		inputContainer.appendChild(input);
		chatContainer.appendChild(inputContainer);

		// Agregar el contenedor del chat al documento
		document.body.appendChild(chatContainer);

		// Crear el botón de toggle (si aún no existe)
		let toggleButton = document.getElementById("chatToggleButton");
		if (!toggleButton) {
			toggleButton = document.createElement("button");
			toggleButton.id = "chatToggleButton";
			toggleButton.innerText = "Chat";
			toggleButton.style.position = "fixed";
			toggleButton.style.bottom = "20px";
			toggleButton.style.right = "20px";
			toggleButton.style.padding = "10px 20px";
			toggleButton.style.zIndex = "1000";
			document.body.appendChild(toggleButton);
		}

		// Evento para el botón de toggle: muestra/oculta el widget de chat
		toggleButton.addEventListener("click", () => {
			chatContainer.style.display =
				chatContainer.style.display === "none" ? "flex" : "none";
		});

		// Enviar mensaje del chat al pulsar Enter en el input
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				const messageText = input.value.trim();
				if (messageText) {
					// Captura el evento de chat
					this.captureEvent("chat_message", { message: messageText });
					this.flushEvents();
					this.renderChatMessage({ message: messageText }, messagesContainer);
					input.value = "";
				}
			}
		});

		// Suscribirse a mensajes entrantes de chat y mostrarlos en el widget
		this.on("chat_message", (msg: TrackingEvent) => {
			const msgEl = document.createElement("div");
			msgEl.style.marginBottom = "8px";
			// Se asume que msg.timestamp está en segundos; ajusta si es en milisegundos.
			msgEl.innerHTML = `<strong>${new Date(
				msg.timestamp * 1000
			).toLocaleTimeString()}</strong>: ${JSON.stringify(msg.data)}`;
			messagesContainer.appendChild(msgEl);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		});

	}

	private renderChatMessage(message: Record<string, unknown>, container: HTMLElement): void {
		const msgEl = document.createElement("div");
		msgEl.style.marginBottom = "8px";
		msgEl.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong>: ${JSON.stringify(
			message
		)}`;
		container.appendChild(msgEl);
		container.scrollTop = container.scrollHeight;
	}

}
