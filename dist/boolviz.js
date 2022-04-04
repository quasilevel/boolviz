import { Connections, drawConnections as dc } from './packages/connections.js';
import { GateDrawer } from './packages/gates.js';
import Grid from './packages/grid.js';
import Mouse from './packages/mouse.js';
import SpatialMap from './packages/spatialmap.js';
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
const drawConnections = dc(gb)(gt);
const connTable = new Connections();
const solution = new Map();
const state = {
    gateAdditionRequest: null,
    selected: null,
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
const frame = (_) => {
    requestAnimationFrame(frame);
    gb.ctx.clearRect(0, 0, canvas.width, canvas.height);
    gb.ctx.lineWidth = 2;
    gb.ctx.strokeStyle = "pink";
    const { gateAdditionRequest: gar } = state;
    if (gar !== null && !gateMap.has(gb.getCurrentBox())) {
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
