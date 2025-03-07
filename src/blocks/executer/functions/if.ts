import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import {type InputMap, type FunctionMap, orderInputs} from "./_common";
import {evalStatement} from "./_eval";
const Log = console.log;
const logHeader = '[If] ';

function ifFunc(inputs: InputMap, functionMap: FunctionMap) {
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

    const firstInput = data.get('if');
    if (!firstInput) {
        Log(logHeader + 'Invalid input 2');
        return;
    }

    if (firstInput.function === undefined) return;

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
    }
}

export {
    ifFunc,
}