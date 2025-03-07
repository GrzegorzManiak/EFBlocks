import Konva from "konva";

type InputData = {
	text?: Konva.Text;
	inputs?: {
		group: Konva.Group;
		inputWidth: number;
		inputs: Array<CreatedInput>;
		segmentName: string;
	}
};

type SegmentAuxMap = Map<string, InputData>

enum BlockSegment {
	Header,
	Divider,
	Footer
}

enum SnapPointType {
	PrimaryNotch,
	PrimaryDivot,
	SecondaryNotch,
	Joint
}

enum InputType {
	Variable,
	EvalOperator,
	// MathOperator,
}

enum InputMode {
	Read,
	Write
}

type Input = {
	id: string;
	internalName: string;
	type: InputType;
	name: string;
	extraWidth?: number;
	mode: InputMode;
	key?: string;
}

type CreatedInput = {
	group: Konva.Group;
	mainBody: Konva.Shape;
	text: Konva.Text;
	occupied: boolean;
	originalColor: string;
} & Input;

type SegmentDefinition = {
	id: string;
	type: BlockSegment;
	text?: string;
	notch?: boolean;
	divot?: boolean;
	extraHeight?: number;
	inputs?: Array<Input>;
	name: string;
}

type SegmentReturnable = {
	path: string;
	newY: number;
}

type BlockConfiguration= {
	color: string;
	forceScope?: boolean;
}

type BlockDefinition = {
	name: string;
	isEntry?: boolean;
	segments: Array<SegmentDefinition>;
	configuration: BlockConfiguration;
}

type Point = [number, number];
type Path = Array<Point>;

type SnapPoint = {
	globalId: string;
	position: Point;
	type: SnapPointType;
	segment: BlockSegment;
	occupied?: boolean;
	segmentId: string;
	group: Konva.Group;
}

type SnapPointMap = Map<string, SnapPoint>;

type RendererContext = {
	id: string;
	totalSegments: number;
	snapPointMap: Map<string, SnapPoint>;
	currentHeight: number;

	color: string;
	outlineColor: string;
	fillColor: string;
	textWidth: number;

	modifier: RendererModifier;
}

type RendererModifier = {
	extraWidth: number;
	addToGroup: boolean;
	generateCircle: boolean;
	addTextToGroup: boolean;
	group?: Konva.Group;
}

export {
	BlockSegment,
	InputType,
	SnapPointType,
	InputMode,

	type SegmentAuxMap,
	type SegmentDefinition,
	type BlockConfiguration,
	type BlockDefinition,
	type Point,
	type Path,
	type SnapPoint,
	type SegmentReturnable,
	type RendererContext,
	type SnapPointMap,
	type RendererModifier,
	type Input,
	type InputData,
	type CreatedInput
}