import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {type InputMap, type FunctionMap, orderInputs, slowLoops, syncSleep, slowLoopBy} from "./_common";
import {evalStatement} from "./_eval";
const Log = console.log;
const logHeader = '[whileLoop] ';

function whileLoop(inputs: InputMap, functionMap: FunctionMap) {
    Log(logHeader + 'Called');

    const data = orderInputs(inputs, functionMap, [
        {
            totalInputs: 3,
            segmentName: 'if'
        }
    ]);

    if (data.size === 0) {
        Log(logHeader + 'Invalid input 1');
        return;
    }

    const firstInput = data.get('while');
    if (!firstInput) {
        Log(logHeader + 'Invalid input 2');
        return;
    }

    if (firstInput.function === undefined) return;

    while (true) {
        if (slowLoops) syncSleep(slowLoopBy);
        GlobalEventEmitter.on('!!stop', () => {
            Log(logHeader + 'Stopping');
            return;
        });

        if (evalStatement(
            GlobalVariableStore.get(firstInput.inputs.get('varA')?.key),
            GlobalVariableStore.get(firstInput.inputs.get('varB')?.key),
            GlobalVariableStore.get(firstInput.inputs.get('eval')?.key),
        )) {
            try {
                firstInput.function();
            }

            catch (e) {
                Log(logHeader + 'Error', e);
            }

            continue;
        }

        break;
    }
}

export {
    whileLoop,
}