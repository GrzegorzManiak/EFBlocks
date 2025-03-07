import * as STD from './std';
import * as Events from './events';
import {EventEmitter, GlobalEventEmitter} from "./events";
import {GlobalVariableStore} from "./variable";

const sample = `
   STD.startAgent(() => {
        STD.ifFunc({
            "fae13frk6": [{
                "id": "7fs5fv71b",
                "type": 0,
                "name": "Variable A",
                "mode": 0,
                "internalName": "varA",
                "value": null,
                "segmentName": "if"
            }, {
                "id": "f1x740gex",
                "type": 1,
                "name": "Eval",
                "mode": 0,
                "internalName": "eval",
                "value": null,
                "segmentName": "if"
            }, {
                "id": "5l77wa8m7",
                "type": 0,
                "name": "Variable B",
                "mode": 0,
                "internalName": "varB",
                "value": null,
                "segmentName": "if"
            }]
        }, {
            "fae13frk6": () => {
                STD.broadCast({
                    "irk3e1vhe": [{
                        "id": "evql3tfh4",
                        "type": 0,
                        "name": "Message",
                        "mode": 0,
                        "internalName": "chanel",
                        "value": null,
                        "segmentName": "broadCast"
                    }]
                });
                STD.endAgent();
            }
        });
    });
`;


async function execute(evalCode: string) {
	let clientReceive: Function;
	let serverReceive: Function;

	const api = {
		client: {
			onReceive: (func: Function) => {
				clientReceive = func;
			},
			send: (msg: any) => {
				if (serverReceive) serverReceive(msg);
				else console.error('Server not ready');
			}
		},
		server: {
			onReceive: (func: Function) => {
				serverReceive = func;
			},
			send: (msg: any) => {
				if (clientReceive) clientReceive(msg);
				else console.error('Client not ready');
			}
		}
	};

	const dynamicFunction = new Function('STD', 'api', 'GlobalEventEmitter', 'GlobalVariableStore', evalCode);
	const result = await dynamicFunction(STD, api, GlobalEventEmitter, GlobalVariableStore);
	GlobalEventEmitter.emit('!!start');

	return result;
}

execute(sample);
while (true) {
	await new Promise(resolve => setTimeout(resolve, 100));
}