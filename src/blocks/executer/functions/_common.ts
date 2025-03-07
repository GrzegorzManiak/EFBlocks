const Log = console.log;
const logHeader = '[Helper] ';

const slowLoops = true;
const slowLoopBy = 0.5;

type Input = {
	id: string;
	segmentName: string;
	type: number;
	name: string;
	mode: number;
	key: string | null;
	internalName: string;
}

type FunctionMap = Record<string, Function>;
type InputMap = Record<string, Input[]>;

function syncSleep(ms: number) {
	const end = Date.now() + ms;
	while (Date.now() < end);
}

function verifyNinputs(inputs: InputMap, n: number): Array<Input> {
	const keys = Object.keys(inputs);
	if (keys.length !== n) {
		Log(logHeader + 'Invalid input map');
		return [];
	}

	const processedInputs: Array<Input> = [];
	const inputsKeys = Object.keys(inputs);

	if (keys.length !== 1) {
		Log(logHeader + 'Invalid input map');
		return [];
	}

	const key = inputsKeys[0];
	const input = inputs[key];
	if (!input || input.length === 0) {
		Log(logHeader + 'Invalid input');
		return [];
	}

	processedInputs.push(...input);
	return processedInputs;
}

type InputOrder = Array<{
	segmentName: string;
	totalInputs: number;
}>;

type InputOrderReturnable = {
	segmentName: string;
	totalInputs: number;
	inputs: Map<string, Input>;
	function?: Function;
}

// string is segmentId
type InputOrderMap = Map<string, InputOrderReturnable>;

function orderInputs(inputs: InputMap, functionMap: FunctionMap, order: InputOrder): InputOrderMap {
	const inputOrderMap: InputOrderMap = new Map();
	const segmentMap: Map<string, {
		inputs: Array<Input>,
		segmentId: string,
	}> = new Map();

	for (const segmentId of Object.keys(inputs)) {
		const inputData = inputs[segmentId];
		if (!inputData || inputData.length === 0) continue;
		const name = inputData[0].segmentName;
		segmentMap.set(name, {
			inputs: inputData,
			segmentId,
		});
	}


	for (const {segmentName, totalInputs} of order) {
		const segmentData = segmentMap.get(segmentName);
		if (!segmentData) {
			Log(logHeader + 'Invalid segment data');
			continue;
		}

		const {inputs} = segmentData;
		const inputMap: Map<string, Input> = new Map();
		for (const input of inputs) {
			inputMap.set(input.name, input);
		}

		const functionItem = functionMap[segmentData.segmentId];

		inputOrderMap.set(segmentName, {
			segmentName,
			totalInputs,
			inputs: inputMap,
			function: functionItem,
		});
	}

	return inputOrderMap;
}

export {
	verifyNinputs,
	syncSleep,
	orderInputs,

	slowLoops,
	slowLoopBy,

	type Input,
	type InputMap,
	type FunctionMap,
	type InputOrder,
	type InputOrderReturnable,
	type InputOrderMap,
}