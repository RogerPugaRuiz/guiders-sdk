import { PixelEvent } from '../types';
import { PipelineStage } from './pipeline-stage';

// Archivo desactivado - WebSocket pipeline removido
export class WebSocketPipeline {
    private stages: PipelineStage[] = [];

    constructor() {
        console.log("💬 WebSocket pipeline desactivado");
    }

    /**
     * Añade una etapa al pipeline
     * @param stage La etapa a añadir
     */
    public addStage(stage: PipelineStage): void {
        this.stages.push(stage);
    }

    /**
     * Procesa un evento a través de todas las etapas del pipeline
     * @param event El evento a procesar
     */
    private processEvent(event: PixelEvent): PixelEvent {
        return this.stages.reduce((processedEvent, stage) => {
            return stage.process(processedEvent);
        }, event);
    }

    /**
     * Envía un evento (desactivado)
     * @param event El evento a enviar
     */
    public sendEvent(event: PixelEvent): void {
        console.log("💬 Envío WebSocket desactivado:", event.type);
    }
} 