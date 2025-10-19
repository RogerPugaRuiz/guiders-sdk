import { PixelEvent } from '../../types';
import { PipelineStage } from '../pipeline-stage';

export class ValidationStage implements PipelineStage<PixelEvent, PixelEvent> {
    private authMode: 'jwt' | 'session';
    private uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    constructor(authMode: 'jwt' | 'session' = 'session') {
        this.authMode = authMode;
    }

    private isValidUUID(str: string): boolean {
        return this.uuidRegex.test(str);
    }

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

        // Validar token solo si estamos en modo JWT
        if (this.authMode === 'jwt' && !event.token) {
            throw new Error('El evento debe tener un token en modo JWT');
        }

        // Validar que el evento haya sido transformado correctamente (Tracking V2)
        const eventData = event.data as any;

        // TODOS los eventos deben estar transformados al formato TrackingEventDto
        // Un evento transformado DEBE tener: visitorId, sessionId, eventType, metadata, occurredAt
        if (!eventData.visitorId) {
            throw new Error('El evento debe tener visitorId. Asegúrate de que identify() se haya completado antes de enviar eventos.');
        }

        // Validar que visitorId sea un UUID válido
        if (!this.isValidUUID(eventData.visitorId)) {
            throw new Error(`El visitorId debe ser un UUID válido, recibido: ${eventData.visitorId}`);
        }

        if (!eventData.sessionId) {
            throw new Error('El evento debe tener sessionId válido');
        }

        // Validar que sessionId sea un UUID válido
        if (!this.isValidUUID(eventData.sessionId)) {
            throw new Error(`El sessionId debe ser un UUID válido, recibido: ${eventData.sessionId}`);
        }

        if (!eventData.eventType) {
            throw new Error('El evento debe tener eventType');
        }

        if (!eventData.metadata || typeof eventData.metadata !== 'object') {
            throw new Error('El evento debe tener metadata como objeto');
        }

        if (!eventData.occurredAt) {
            throw new Error('El evento debe tener occurredAt en formato ISO 8601');
        }

        return event;
    }
}