import { TrackingEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class TimeStampStage implements PipelineStage<TrackingEvent, TrackingEvent> {
	process(event: TrackingEvent): TrackingEvent {
		console.log('Proceso de marca de tiempo');
		event.timestamp = new Date().getTime();
		return event;
	}
}