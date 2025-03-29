import { PixelEvent } from '../types';

export interface PipelineStage<I = any, O = I> {
	process(input: I): O;
}
