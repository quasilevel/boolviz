import { GateArgCount, GateSolver } from "./gates.js";
export const listInvalidGates = (gt, conns) => {
    const invt = conns.invert().table();
    const bad = [...invt.entries()]
        .map(([to, froms]) => [to, [froms.size, GateArgCount.get(gt.get(to).type)]])
        .filter(([_, [actual, expexted]]) => actual !== expexted);
    return new Map(bad);
};
export const circuitSolver = (gt, output) => (solution) => {
    const outmap = output.table();
    const inputmap = output.invert().table();
    const solveIndex = (index) => {
        var _a;
        const inputs = inputmap.get(index);
        const invals = [...inputs].map(it => solveFor(it));
        const val = (_a = GateSolver.get(gt.get(index).type)) === null || _a === void 0 ? void 0 : _a(invals);
        if (typeof val === "undefined") {
            throw new Error(`Invalid index in input: ${index}`);
        }
        return val;
    };
    const solveFor = (index) => {
        if (!solution.has(index)) {
            const val = solveIndex(index);
            solution.set(index, val);
            return val;
        }
        return solution.get(index);
    };
    const updateFor = (index, newval) => {
        solution.set(index, newval);
        if (!outmap.has(index)) {
            return;
        }
        const outs = [...outmap.get(index)]
            .map((idx) => [idx, solveIndex(idx)])
            .filter(([idx, nv]) => solution.get(idx) !== nv);
        outs.map(([idx, nv]) => updateFor(idx, nv));
    };
    return [solveFor, updateFor];
};
