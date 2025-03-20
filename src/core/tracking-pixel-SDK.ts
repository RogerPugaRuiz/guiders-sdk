

import { PipelineStage } from "../pipeline/pipeline-stage";
import { TrackingEvent } from "../types";

export class TrackingPixelSDK {
	private pipelineStages: PipelineStage[] = [];
	private eventQueue: TrackingEvent[] = [];
	private endpoint: string;

	constructor(endpoint: string) {
		this.endpoint = endpoint;
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
