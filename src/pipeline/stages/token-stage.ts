
import { TokenManager } from "../../core/token-manager";
import { TrackingEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class TokenInjectionStage implements PipelineStage<TrackingEvent, TrackingEvent> {
	process(event: TrackingEvent): TrackingEvent {
		const attachedToken = TokenManager.attachTokenToEvent(event);
		return attachedToken;
	}
}
