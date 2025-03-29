
import { TokenManager } from "../../core/token-manager";
import { PixelEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class TokenInjectionStage implements PipelineStage<PixelEvent, PixelEvent> {
	process(event: PixelEvent): PixelEvent {
		const attachedToken = TokenManager.attachTokenToEvent(event);
		return attachedToken;
	}
}
