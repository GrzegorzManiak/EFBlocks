import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {type InputMap, verifyNinputs} from "./_common";
const Log = console.log;
const logHeader = '[On Message] ';

function onMessage(inputs: InputMap, func: Function) {
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

	Log(logHeader + 'Listening', varValue, data);
	GlobalEventEmitter.on(varValue, () => {
		Log(logHeader + 'Callback called');
		try {
			func();
		}

		catch (e) {
			Log(logHeader + 'Error', e);
		}
	});
}

export {
	onMessage,
}