import { PipelineStage } from "../pipeline-stage";

export class SideEffectStage<I = any> implements PipelineStage<I, I> {
	private sideEffect: (input: I) => void;

	constructor(sideEffect: (input: I) => void) {
		this.sideEffect = sideEffect;
	}

	process(input: I): I {
		this.sideEffect(input);
		return input;
	}
}