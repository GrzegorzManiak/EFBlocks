import * as Renderer from "../renderer";
import { Block } from "./block";
import type {SegmentDefinition} from "../renderer/types";
import type {CreatedInput} from "../renderer/inputs";

function getDistanceBetween(a: Renderer.Types.Point, b: Renderer.Types.Point): number {
	return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

type CallbackDict = {
	variableClick: (block: Block, segment: SegmentDefinition, input: CreatedInput) => void;
};

export {
	getDistanceBetween,

	type CallbackDict,
}