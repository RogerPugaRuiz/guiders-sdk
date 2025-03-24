import { TrackingEvent } from "../../types";
import { PipelineStage } from "../pipeline-stage";

export class MetadataInjectionStage implements PipelineStage<TrackingEvent, TrackingEvent> {
	process(event: TrackingEvent): TrackingEvent {
		event.metadata = {
			...event.metadata,
			// información sobre el dispositivo
			device: {
				userAgent: navigator.userAgent,
				platform: navigator.platform,
				language: navigator.language,
				screen: {
					width: screen.width,
					height: screen.height,
					pixelRatio: window.devicePixelRatio
				},
				hardware: {
					cores: navigator.hardwareConcurrency,
				},
				touch: {
					maxTouchPoints: navigator.maxTouchPoints
				}
			}

		};
		return event;
	}
}