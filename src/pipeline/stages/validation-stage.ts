import { PixelEvent } from '../../types';
import { PipelineStage } from '../pipeline-stage';

export class ValidationStage implements PipelineStage<PixelEvent, PixelEvent> {
    process(event: PixelEvent): PixelEvent {

        // Validar que el evento tenga los campos requeridos
        if (!event.type) {
            throw new Error('El evento debe tener un tipo');
        }

        if (!event.data) {
            throw new Error('El evento debe tener datos');
        }

        // Crear un nuevo evento con timestamp
        if (!event.timestamp) {
            throw new Error('El evento debe tener una marca de tiempo');
        }

        if (!event.token) {
            throw new Error('El evento debe tener un token');
        }
        return event;
    }
}