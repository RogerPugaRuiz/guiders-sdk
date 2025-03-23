import { PipelineStage } from "./pipeline-stage";

export class PipelineProcessor<I = any, O = I> {
	private stages: PipelineStage<I, O>[];

	constructor(stages: PipelineStage<I, O>[] = []) {
		this.stages = stages;
	}

	public process(input: I): O {
		let output;
		for (const stage of this.stages) {
			try {
				output = stage.process(input);
			} catch (error) {
				console.error(`Error en el pipeline: ${error}`);
				break;
			}
		}
		if (!output) {
			throw new Error('No se pudo procesar el evento');
		}

		return output;
		// return this.stages.reduce((acc, stage) => stage.process(acc), input as any);
	}

	public addStage(stage: PipelineStage<I, O>) {
		this.stages.push(stage);
	}
}

export class PipelineProcessorBuilder<I = any, O = I> {
	private stages: PipelineStage<I, O>[] = [];

	public addStage(stage: PipelineStage<I, O>): PipelineProcessorBuilder<I, O> {
		this.stages.push(stage);
		return this;
	}

	public build(): PipelineProcessor<I, O> {
		return new PipelineProcessor(this.stages);
	}
}