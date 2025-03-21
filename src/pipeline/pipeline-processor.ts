import { PipelineStage } from "./pipeline-stage";

export class PipelineProcessor<I = any, O = I> {
	private stages: PipelineStage<I, O>[];

	constructor(stages: PipelineStage<I, O>[] = []) {
		this.stages = stages;
	}

	public process(input: I): O {
		return this.stages.reduce((acc, stage) => stage.process(acc), input as any);
	}

	public addStage(stage: PipelineStage<I, O>) {
		this.stages.push(stage);
	}
}