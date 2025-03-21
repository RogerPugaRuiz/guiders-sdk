import { ClientJS } from "clientjs";
import { PipelineProcessor } from "../pipeline/pipeline-processor";
import { PipelineStage } from "../pipeline/pipeline-stage";
import { TrackingEvent } from "../types";
import { TokenManager } from "./token-manager";
import { ensureTokens } from "../services/token-service";
import { checkServerConnection } from "../services/health-check-service";
import { WebSocketClient } from "../services/websocket-service";

interface SDKOptions {
	endpoint?: string;
	apiKey: string;
	autoFlush?: boolean;
	flushInterval?: number;
	maxRetries?: number;
}

export class TrackingPixelSDK {
	private pipeline: PipelineProcessor<TrackingEvent, TrackingEvent>;
	private eventQueue: TrackingEvent[] = [];
	private endpoint: string;
	private apiKey: string;
	private fingerprint: string | null = null;
	private webSocket: WebSocketClient | null = null;

	private autoFlush = false;
	private flushInterval = 10000;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private maxRetries = 3;

	constructor(options: SDKOptions) {
		this.endpoint = options.endpoint || "http://localhost:3000";
		this.apiKey = options.apiKey;
		this.autoFlush = options.autoFlush ?? false;
		this.flushInterval = options.flushInterval ?? 10000;
		this.maxRetries = options.maxRetries ?? 3;

		this.pipeline = new PipelineProcessor<TrackingEvent, TrackingEvent>();
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
	}

	public addPipelineStage(stage: PipelineStage<TrackingEvent, TrackingEvent>): void {
		this.pipeline.addStage(stage);
	}

	public captureEvent(type: string, data: Record<string, unknown>): void {
		const rawEvent: TrackingEvent = {
			type,
			data,
			timestamp: Date.now(),
		};

		const processedEvent = this.pipeline.process(rawEvent);
		this.eventQueue.push(processedEvent);
	}

	public flushEvents(): void {
		if (this.eventQueue.length === 0) return;

		const eventsToSend = [...this.eventQueue];
		this.eventQueue = [];

		eventsToSend.forEach((event) => this.trySendEventWithRetry(event, this.maxRetries));
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

	private startAutoFlush(): void {
		if (this.flushTimer) clearInterval(this.flushTimer);
		this.flushTimer = setInterval(() => {
			this.flushEvents();
		}, this.flushInterval);
	}

	public stopAutoFlush(): void {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}
}
