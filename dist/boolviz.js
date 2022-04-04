var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Connections, drawConnection as dc, drawConnections as dcs, getCoordMappers } from './packages/connections.js';
import { GateDrawer, GateType } from './packages/gates.js';
import Grid from './packages/grid.js';
import Mouse from './packages/mouse.js';
import SpatialMap from './packages/spatialmap.js';
import Coord from './packages/coord.js';
import { circuitSolver, listInvalidGates } from './packages/solver.js';
const $ = document;
const canvas = $.querySelector('canvas#boolviz');
if (canvas === null) {
    throw new Error("Cannot find <canvas id='boolviz'></canvas>");
}
canvas.width = innerWidth;
canvas.height = innerHeight;
const mouse = new Mouse();
mouse.attach(canvas);
const gb = new Grid({
    ctx: canvas.getContext("2d"),
    mouse: mouse,
    boxSize: 100,
});
const gt = new Map();
let currentId = 0;
const gateMap = new SpatialMap();
const addGate = ((m, t) => (g) => {
    t.set(currentId, g);
    m.set(g.coord, currentId);
    currentId++;
})(gateMap, gt);
const drawGateTable = ((g) => (table) => (table.forEach(it => g.drawAt(it.coord, GateDrawer.get(it.type)))))(gb);
const drawConnections = dcs(gb)(gt);
const connTable = new Connections();
const solution = new Map();
const state = {
    gateAdditionRequest: null,
    selected: null,
    connectionPending: null,
};
const drawSolution = ((grid) => (sol) => {
    ;
    [...sol]
        .filter(([idx, val]) => val && (idx !== state.selected))
        .map(([idx, _]) => { var _a; return (_a = gt.get(idx)) === null || _a === void 0 ? void 0 : _a.coord; })
        .map(c => grid.drawAt(c, (ctx, { x, y }) => {
        ctx.beginPath();
        ctx.strokeStyle = "deeppink";
        ctx.lineWidth = 2;
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
    }));
})(gb);
const drawSelected = (ctx, { x, y }) => {
    ctx.beginPath();
    ctx.strokeStyle = "pink";
    ctx.lineWidth = 2;
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
};
addEventListener("grid_click", (({ detail }) => {
    const gateIndex = gateMap.get(detail.coord);
    if (typeof gateIndex === "undefined") {
        dispatchEvent(new CustomEvent("gate_click"));
        return;
    }
    dispatchEvent(new CustomEvent("gate_click", {
        detail: {
            index: gateIndex,
            gate: gt.get(gateIndex),
            absCoord: gb.absBoxCoord(gt.get(gateIndex).coord)
        }
    }));
}));
const isValidConnection = (from, to) => {
    return from.x < to.x;
};
const [fmapper, tmapper] = getCoordMappers(gb)(gt);
const drawConnection = dc(gb.ctx)(fmapper, tmapper);
const previewConnection = ((ctx) => (fidx, tidx) => {
    ctx.save();
    if (connTable.has(fidx, tidx)) {
        ctx.strokeStyle = "deeppink";
    }
    else {
        ctx.globalAlpha = 0.4;
    }
    drawConnection(fidx, tidx);
    ctx.restore();
})(gb.ctx);
const canPreviewConnection = (fidx, tidx) => {
    return isValidConnection(gt.get(fidx).coord, gt.get(tidx).coord);
};
const frame = (_) => {
    requestAnimationFrame(frame);
    gb.ctx.clearRect(0, 0, canvas.width, canvas.height);
    gb.ctx.lineWidth = 2;
    gb.ctx.strokeStyle = "pink";
    const { gateAdditionRequest: gar } = state;
    const currentIdx = gateMap.get(gb.getCurrentBox());
    if (gar !== null && typeof currentIdx === "undefined") {
        gb.drawUnderCurrentBox((ctx, coord) => {
            ctx.save();
            ctx.globalAlpha = 0.4;
            GateDrawer.get(gar.type)(ctx, coord);
            ctx.restore();
        });
    }
    if (state.selected !== null) {
        const g = gt.get(state.selected);
        gb.drawAt(g.coord, drawSelected);
    }
    drawGateTable(gt);
    drawConnections(connTable);
    drawSolution(solution);
    if (typeof currentIdx !== "undefined" &&
        state.connectionPending !== null &&
        canPreviewConnection(state.connectionPending.idx, currentIdx)) {
        previewConnection(state.connectionPending.idx, currentIdx);
    }
};
requestAnimationFrame(frame);
export const selectGate = (idx) => {
    if (typeof gt.get(idx) === "undefined") {
        return false;
    }
    state.selected = idx;
    return true;
};
export const deselectGate = () => {
    if (state.selected === null) {
        return false;
    }
    state.selected = null;
    return true;
};
export const requestNewConnection = (idx) => {
    let cleanUp;
    const listener = (res) => (ev) => {
        const toIndex = gateMap.get(ev.detail.coord);
        if (typeof toIndex === "undefined") {
            res(2 /* Cancelled */);
            cleanUp();
            return;
        }
        const fromGate = gt.get(idx);
        if (!isValidConnection(fromGate.coord, ev.detail.coord)) {
            res(3 /* Rejected */);
            cleanUp();
            return;
        }
        if (connTable.has(idx, toIndex)) {
            res(1 /* Disconnected */);
            connTable.delete(idx, toIndex);
            cleanUp();
            return;
        }
        connTable.add(idx, toIndex);
        res(0 /* Connected */);
        cleanUp();
        return;
    };
    return new Promise(res => {
        const l = listener(res);
        cleanUp = () => {
            removeEventListener("grid_click", l);
            state.connectionPending = null;
        };
        if (gt.get(idx) === undefined) {
            res(3 /* Rejected */);
            return;
        }
        state.connectionPending = { idx: idx };
        addEventListener("grid_click", l);
    });
};
export const requestGateAddition = (t) => {
    if (state.gateAdditionRequest !== null) {
        state.gateAdditionRequest.cancel();
    }
    let cleanUp;
    const listener = (res) => (ev) => {
        addGate({
            type: t,
            coord: ev.detail.coord,
        });
        res(0 /* Added */);
        cleanUp();
    };
    return new Promise(res => {
        const l = listener(res);
        cleanUp = () => {
            removeEventListener("grid_click", l);
            state.gateAdditionRequest = null;
        };
        state.gateAdditionRequest = {
            type: t, cancel: () => {
                res(1 /* Cancelled */);
                cleanUp();
            }
        };
        addEventListener("grid_click", l);
    });
};
const filterGate = (table, type) => {
    return [...table]
        .filter(([_, t]) => t.type === type)
        .map(([idx, _]) => idx);
};
export const validateCircuit = () => __awaiter(void 0, void 0, void 0, function* () {
    return listInvalidGates(gt, connTable);
});
export const requestCircuitEval = () => __awaiter(void 0, void 0, void 0, function* () {
    const inputs = filterGate(gt, GateType.IN_TERM);
    const outputs = filterGate(gt, GateType.OUT_TERM);
    inputs.map(it => solution.set(it, false));
    const [solveFor, updateFor] = circuitSolver(gt, connTable)(solution);
    outputs.map(solveFor);
    return (idx) => updateFor(idx, !solution.get(idx));
});
export const endCircuitEval = () => __awaiter(void 0, void 0, void 0, function* () {
    solution.clear();
});
export const deleteGate = (idx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!gt.has(idx))
        return false;
    gateMap.remove(gt.get(idx).coord);
    gt.delete(idx);
    connTable.deleteAll(idx);
    return true;
});
// test data
(() => {
    ;
    [
        [GateType.IN_TERM, 3, 2],
        [GateType.IN_TERM, 5, 3],
        [GateType.NOT, 5, 2],
        [GateType.AND, 7, 2],
        [GateType.XOR, 7, 3],
        [GateType.OUT_TERM, 9, 2],
        [GateType.OUT_TERM, 9, 3],
    ].map(([t, x, y]) => addGate({
        type: t, coord: new Coord(x, y)
    }));
    [
        [0, 2],
        [2, 3],
        [1, 4],
        [1, 3],
        [2, 4],
        [3, 5],
        [4, 6],
    ].map(([f, t]) => connTable.add(f, t));
    solution.set(0, false).set(1, true);
    console.log(listInvalidGates(gt, connTable));
    const [solveFor, _] = circuitSolver(gt, connTable)(solution);
    [5, 6].map(solveFor);
});
