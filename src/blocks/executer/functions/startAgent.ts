import {GlobalEventEmitter} from "../events";
const Log = console.log;
const logHeader = '[Agent Start] ';

function startAgent(func: Function) {
	const logHeader = '[Agent Start] ';
	Log(logHeader + 'Called');

	GlobalEventEmitter.on('!!start', () => {

		if (!func) Log(logHeader + 'No function to execute');
		else try {
			Log(logHeader + 'Executing');
			func();
		}

		catch (e) {
			Log(logHeader + 'Error', e);
		}
	});
}

export {
	startAgent,
}