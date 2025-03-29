import { PixelEvent } from '../types';
import { PipelineStage } from './pipeline-stage';
import { WebSocketClient } from '../services/websocket-service';

export class WebSocketPipeline {
    private stages: PipelineStage[] = [];
    private websocketClient: WebSocketClient;

    constructor(websocketClient: WebSocketClient) {
        this.websocketClient = websocketClient;
        this.setupWebSocketListeners();
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
     * Configura los listeners del WebSocket
     */
    private setupWebSocketListeners(): void {
        // Aquí podríamos añadir listeners específicos del WebSocket
        // Por ejemplo, para manejar eventos de conexión, desconexión, etc.
        this.websocketClient.onConnect(() => {
            console.log("🌐 WebSocket conectado");
        });
    }

    /**
     * Envía un evento a través del pipeline y luego por WebSocket
     * @param event El evento a enviar
     */
    public sendEvent(event: PixelEvent): void {
        const processedEvent = this.processEvent(event);
        this.websocketClient.sendMessage(processedEvent);
    }
} 