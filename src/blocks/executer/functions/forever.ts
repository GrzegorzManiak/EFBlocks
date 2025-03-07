import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {type InputMap, slowLoopBy, slowLoops, syncSleep, verifyNinputs} from "./_common";
const Log = console.log;
const logHeader = '[Forever] ';

function forever(func: Function) {
    Log(logHeader + 'Called');

    while (true) {
        if (slowLoops) syncSleep(slowLoopBy);
        GlobalEventEmitter.on('!!stop', () => {
            Log(logHeader + 'Stopping');
            return;
        });

        try {
            func();
        }

        catch (e) {
            Log(logHeader + 'Error', e);
        }
    }
}

export {
    forever,
}