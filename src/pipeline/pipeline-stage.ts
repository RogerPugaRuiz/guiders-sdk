import { TrackingEvent } from '../types';

export interface PipelineStage {
	process(event: TrackingEvent): TrackingEvent;
}