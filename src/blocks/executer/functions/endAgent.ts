import {GlobalEventEmitter} from "../events";
const Log = console.log;
const logHeader = '[End Start] ';

function endAgent(func: Function) {
	const logHeader = '[Agent Start] ';
	Log(logHeader + 'Called');
	GlobalEventEmitter.emit('!!stop');
}

export {
	endAgent,
}