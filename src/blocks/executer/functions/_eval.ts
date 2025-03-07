enum EvalOperation {
    Equals = '==',
    Different = '!=',
    LessThan = '<',
    GreaterThan = '>',
    LessThanOrEqual = '<=',
    GreaterThanOrEqual = '>='
}

function evalNumber(n1: number, n2: number, opr: EvalOperation): boolean {
    switch (opr) {
        case EvalOperation.Equals: return n1 == n2;
        case EvalOperation.Different: return n1 != n2;
        case EvalOperation.LessThan: return n1 < n2;
        case EvalOperation.GreaterThan: return n1 > n2;
        case EvalOperation.LessThanOrEqual: return n1 <= n2;
        case EvalOperation.GreaterThanOrEqual: return n1 >= n2;
    }
}

function evalBoolean(b1: boolean, b2: boolean, opr: EvalOperation): boolean {
    switch (opr) {
        case EvalOperation.Equals: return b1 == b2;
        case EvalOperation.Different: return b1 != b2;
        case EvalOperation.LessThan: return b1 < b2;
        case EvalOperation.GreaterThan: return b1 > b2;
        case EvalOperation.LessThanOrEqual: return b1 <= b2;
        case EvalOperation.GreaterThanOrEqual: return b1 >= b2;
    }
}

function evalString(s1: string, s2: string, opr: EvalOperation): boolean {
    switch (opr) {
        case EvalOperation.Equals: return s1 == s2;
        case EvalOperation.Different: return s1 != s2;
        case EvalOperation.LessThan: return s1 < s2;
        case EvalOperation.GreaterThan: return s1 > s2;
        case EvalOperation.LessThanOrEqual: return s1 <= s2;
        case EvalOperation.GreaterThanOrEqual: return s1 >= s2;
    }
}

function parseEvalOperation(evalOpr: string): EvalOperation | null {
    evalOpr = evalOpr.trim();
    switch (evalOpr) {
        case '==': return EvalOperation.Equals;
        case '!=': return EvalOperation.Different;
        case '<': return EvalOperation.LessThan;
        case '>': return EvalOperation.GreaterThan;
        case '=<': return EvalOperation.LessThanOrEqual;
        case '>=': return EvalOperation.GreaterThanOrEqual;
    }
    return null;
}

function isNumber(value: string): number | null {
    value = value.trim().toLowerCase();
    try {
        if (value.includes('.')) return parseFloat(value);
        else return parseInt(value);
    } catch {
        return null;
    }
}

function isBoolean(value: string): boolean | null {
    value = value.trim().toLowerCase();
    if (value === '!!false') return false;
    else if (value === '!!true') return true;
    return null;
}

function evalStatement(valueA: string | undefined, valueB: string | undefined, evalOpr: string | undefined): boolean {
    if (evalOpr === undefined) return false;

    const opr = parseEvalOperation(evalOpr);
    if (!opr) return false;

    if (valueA !== undefined && valueB !== undefined) {
        const [n1, n2] = [isNumber(valueA), isNumber(valueB)];
        if (n1 !== null && n2 !== null) return evalNumber(n1, n2, opr);

        const [b1, b2] = [isBoolean(valueA), isBoolean(valueB)];
        if (b1 !== null && b2 !== null) evalBoolean(b1, b2, opr);

        valueA = valueA.trim();
        valueB = valueB.trim();
        return evalString(valueA, valueB, opr);
    }

    return evalString(valueA ?? "", valueB ?? "", opr);
}

export {
    evalStatement,
    isBoolean,
    isNumber,

    EvalOperation
}