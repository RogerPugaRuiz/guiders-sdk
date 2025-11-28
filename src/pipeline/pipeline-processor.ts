import { PipelineStage } from "./pipeline-stage";
import { debugLog } from '../utils/debug-logger';

export class PipelineProcessor<I = any, O extends I = I> {
	private stages: PipelineStage<I, O>[];

	constructor(stages: PipelineStage<I, O>[] = []) {
		this.stages = stages;
	}

	public process(input: I): O {
		let output;
		for (const stage of this.stages) {
			try {
				output = stage.process(input);
				input = output;
				debugLog(`Procesando evento con ${stage.constructor.name}`);
			} catch (error) {
				break;
			}
		}
		if (!output) {
			throw new Error('No se pudo procesar el evento');
		}
		debugLog('Evento procesado:', output);
		return output;
		// return this.stages.reduce((acc, stage) => stage.process(acc), input as any);
	}
}

export class PipelineProcessorBuilder<I = any, O extends I = I> {
	private stages: PipelineStage<I, O>[] = [];

	public addStage(stage: PipelineStage<I, O>): PipelineProcessorBuilder<I, O> {
		this.stages.push(stage);
		return this;
	}

	public build(): PipelineProcessor<I, O> {
		return new PipelineProcessor(this.stages);
	}
}