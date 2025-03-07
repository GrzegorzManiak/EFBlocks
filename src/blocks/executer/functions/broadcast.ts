import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {type InputMap, verifyNinputs} from "./_common";
const Log = console.log;
const logHeader = '[Broadcast] ';

function broadCast(inputs: InputMap) {
	Log(logHeader + 'Called');

	const data = verifyNinputs(inputs, 1);
	if (data.length === 0) {
		Log(logHeader + 'Invalid input');
		return;
	}

	const varValue = GlobalVariableStore.get(data[0].id);
	if (!varValue) {
		Log(logHeader + 'Variable not found');
		return;
	}

	Log(logHeader + 'Broadcasting', varValue, data);
	GlobalEventEmitter.emit(varValue, data);
}

export {
	broadCast,
}