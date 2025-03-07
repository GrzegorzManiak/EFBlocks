import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {Input, InputMap, verifyNinputs} from "./_common";
const Log = console.log;
const logHeader = '[SetVariableTo] ';

function setVariableTo(inputs: InputMap) {
	Log(logHeader + 'Called');

	const data = verifyNinputs(inputs, 2);
	if (data.length === 0) {
		Log(logHeader + 'Invalid input');
		return;
	}

	const [inp1, inp2] = [data[0], data[1]];
	let from, to: Input;

	if (inp1.internalName === 'from') {
		from = inp1;
		to = inp2;
	}

	else {
		from = inp2;
		to = inp1;
	}

	const toVal = GlobalVariableStore.get(to.key);
	if (toVal === undefined || from.key === null) {
		Log(logHeader + 'No Values gotten');
		return;
	}

	GlobalVariableStore.set(from.key, toVal)
}

export {
	setVariableTo,
}