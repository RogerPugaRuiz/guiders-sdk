
import { TokenManager } from "../core/token-manager";
import { TrackingEvent } from "../types";
import { PipelineStage } from "./pipeline-stage";

export class TokenStage implements PipelineStage {
	process(event: TrackingEvent): TrackingEvent {
		return TokenManager.attachTokenToEvent(event);
	}
}
