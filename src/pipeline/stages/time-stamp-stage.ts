import { TrackingEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class TimeStampStage implements PipelineStage<TrackingEvent, TrackingEvent> {
	process(event: TrackingEvent): TrackingEvent {
		event.timestamp = new Date().getTime();
		return event;
	}
}