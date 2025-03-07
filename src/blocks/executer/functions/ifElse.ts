import {GlobalVariableStore} from "../variable";
import {GlobalEventEmitter} from "../events";
import { type InputMap, type FunctionMap, orderInputs} from "./_common";
import {evalStatement} from "./_eval";
const Log = console.log;
const logHeader = '[IfElse] ';

function ifElse(inputs: InputMap, functionMap: FunctionMap) {
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
    if (firstInput !== undefined && firstInput.function !== undefined) if (evalStatement(
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

    const secondInput = data.get('elif');
    if (secondInput !== undefined && secondInput.function !== undefined) if (evalStatement(
        GlobalVariableStore.get(secondInput.inputs.get('varA')?.key),
        GlobalVariableStore.get(secondInput.inputs.get('varB')?.key),
        GlobalVariableStore.get(secondInput.inputs.get('eval')?.key),
    )) {
        try {
            secondInput.function();
        }

        catch (e) {
            Log(logHeader + 'Error', e);
        }
    }
}

export {
    ifElse,
}