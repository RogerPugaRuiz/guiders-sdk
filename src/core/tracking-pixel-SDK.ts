

import { ClientJS } from "clientjs";
import { PipelineStage } from "../pipeline/pipeline-stage";
import { TrackingEvent } from "../types";
import { TokenManager } from "./token-manager";
import { ensureTokens } from "../services/token-service";
import { checkServerConnection } from "../services/health-check-service";

export class TrackingPixelSDK {
	private pipelineStages: PipelineStage[] = [];
	private eventQueue: TrackingEvent[] = [];
	private endpoint: string;
	private apiKey: string;
	private fingerprint: string | null = null;

	constructor(options: { endpoint?: string, apiKey: string }) {
		this.endpoint = options.endpoint || 'http://localhost:3000';
		this.apiKey = options.apiKey;

		// Acceder una sola vez a localStorage y evitar reflows innecesarios

	}



	public async init(): Promise<void> {
		
		// Cargar tokens desde localStorage si existen
		await checkServerConnection(this.endpoint);
		console.log('✅ Conexión con el servidor establecida.');
		const client = new ClientJS();
		this.fingerprint = localStorage.getItem('fingerprint') || client.getFingerprint().toString();
		localStorage.setItem('fingerprint', this.fingerprint);
		const loadedTokens = TokenManager.loadTokensFromStorage();
		
		if (!loadedTokens) {
			console.log('No se encontraron tokens en el almacenamiento local.');
			try{
				const tokens = await ensureTokens(this.fingerprint, this.apiKey);
				TokenManager.setTokens(tokens);
			} catch (error) {
				console.error('Error al obtener tokens:', error);
			}
		}
		if (TokenManager.isTokenExpiring(10)) {
			try{
				const token = await TokenManager.getValidAccessToken();
				if (token) {
					TokenManager.setAccessToken(token);
				}
			} catch (error) {
				console.error('Error al refrescar tokens:', error);
			}
		}

		// Inicializar el monitor de tokens
		TokenManager.startTokenMonitor();
	}

	public addPipelineStage(stage: PipelineStage): void {
		this.pipelineStages.push(stage);
	}

	public captureEvent(type: string, data: Record<string, any>): void {
		let event: TrackingEvent = {
			type,
			data,
			timestamp: Date.now()
		};

		// Procesar el evento a través del pipeline
		this.pipelineStages.forEach(stage => {
			event = stage.process(event);
		});

		this.eventQueue.push(event);
	}

	public flushEvents(): void {
		if (this.eventQueue.length > 0) {
			console.log(`Enviando eventos a ${this.endpoint}:`, this.eventQueue);
			// Aquí se podría integrar la lógica de envío (HTTP o WebSocket)
			this.eventQueue = [];
		}
	}
}
