import { Connections, drawConnection as dc, drawConnections as dcs, getCoordMappers } from './packages/connections.js';
import { GateDrawer, GateType } from './packages/gates.js';
import Grid from './packages/grid.js';
import Mouse from './packages/mouse.js';
import SpatialMap from './packages/spatialmap.js';
import Coord from './packages/coord.js';
import { circuitSolver } from './packages/solver.js';
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
const gt = [];
const gateMap = new SpatialMap();
const addGate = ((m, t) => (g) => {
    t.push(g);
    m.set(g.coord, t.length - 1);
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
        .map(([idx, _]) => (gt[idx].coord))
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
            gate: gt[gateIndex],
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
    ctx.globalAlpha = 0.4;
    drawConnection(fidx, tidx);
    ctx.restore();
})(gb.ctx);
const canPreviewConnection = (fidx, tidx) => {
    return isValidConnection(gt[fidx].coord, gt[tidx].coord);
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
        const g = gt[state.selected];
        gb.drawAt(g.coord, drawSelected);
    }
    if (typeof currentIdx !== "undefined" &&
        state.connectionPending !== null &&
        canPreviewConnection(state.connectionPending.idx, currentIdx)) {
        previewConnection(state.connectionPending.idx, currentIdx);
    }
    drawGateTable(gt);
    drawConnections(connTable);
    drawSolution(solution);
};
requestAnimationFrame(frame);
export const selectGate = (idx) => {
    if (typeof gt[idx] === "undefined") {
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
        const fromGate = gt[idx];
        if (!isValidConnection(fromGate.coord, ev.detail.coord)) {
            res(3 /* Rejected */);
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
        if (gt[idx] === undefined) {
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
    const [solveFor, _] = circuitSolver(gt, connTable)(solution);
    [5, 6].map(solveFor);
});
