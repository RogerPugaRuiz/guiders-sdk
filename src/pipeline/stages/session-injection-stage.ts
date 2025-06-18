import { PixelEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";
import { SessionTrackingManager, SessionData } from "../../core/session-tracking-manager";

export class SessionInjectionStage implements PipelineStage<PixelEvent, PixelEvent> {
	private sessionManager: SessionTrackingManager | null;

	constructor(sessionManager: SessionTrackingManager | null = null) {
		this.sessionManager = sessionManager;
	}

	public setSessionManager(sessionManager: SessionTrackingManager | null): void {
		this.sessionManager = sessionManager;
	}

	process(event: PixelEvent): PixelEvent {
		console.log("SessionInjectionStage: Iniciando inyección de sesión...");
		if (!this.sessionManager) {
			console.warn("SessionInjectionStage: No session manager set, skipping session injection.");
			return event;
		}

		const sessionData = this.sessionManager.getCurrentSession();
		
		if (sessionData) {
			// Agregar información de sesión al metadata del evento
			if (!event.metadata) {
				event.metadata = {};
			}
			
			event.metadata.session = {
				sessionId: sessionData.sessionId,
				startTime: sessionData.startTime,
				lastActiveTime: sessionData.lastActiveTime,
				totalActiveTime: sessionData.totalActiveTime,
				isActive: sessionData.isActive,
				isIdle: sessionData.isIdle
			};

			// También agregar sessionId directamente al data para fácil acceso
			if (!event.data) {
				event.data = {};
			}
			
			(event.data as Record<string, unknown>).sessionId = sessionData.sessionId;
		}

		console.log("SessionInjectionStage: Sesión inyectada en el evento:", event.metadata?.session);

		return event;
	}
}
