import { GateArgCount, GateSolver } from "./gates.js";
export const listInvalidGates = (gt, conns) => {
    const invt = conns.table();
    const bad = [...invt.entries()]
        .map(([to, froms]) => [to, [froms.size, GateArgCount.get(gt[to].type)]])
        .filter(([_, [actual, expexted]]) => actual !== expexted);
    return new Map(bad);
};
export const circuitSolver = (gt, conns) => {
    const inputmap = conns.table();
    const solveFor = (index, solution) => {
        var _a;
        if (!solution.has(index)) {
            const inputs = inputmap.get(index);
            const invals = [...inputs].map(it => solveFor(it, solution));
            const val = (_a = GateSolver.get(gt[index].type)) === null || _a === void 0 ? void 0 : _a(invals);
            if (typeof val === "undefined") {
                throw new Error(`Invalid index in input: ${index}`);
            }
            solution.set(index, val);
            return val;
        }
        return solution.get(index);
    };
    return solveFor;
};
