import { PixelEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class TimeStampStage implements PipelineStage<PixelEvent, PixelEvent> {
	process(event: PixelEvent): PixelEvent {
		event.timestamp = new Date().getTime();
		return event;
	}
}