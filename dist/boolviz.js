import { Connections, drawConnections as dc } from './packages/connections.js';
import Coord from './packages/coord.js';
import { GateDrawer, GateType } from './packages/gates.js';
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
addGate({
    type: GateType.IN_TERM, coord: new Coord(4, 3)
});
addGate({
    type: GateType.AND, coord: new Coord(6, 3)
});
addGate({
    type: GateType.OUT_TERM, coord: new Coord(8, 3)
});
addGate({
    type: GateType.OUT_TERM, coord: new Coord(8, 4)
});
addGate({
    type: GateType.OUT_TERM, coord: new Coord(6, 2)
});
addGate({
    type: GateType.IN_TERM, coord: new Coord(4, 4)
});
const connTable = new Connections();
connTable.add(0, 1);
connTable.add(0, 4);
connTable.add(1, 2);
connTable.add(1, 3);
connTable.add(5, 1);
const state = {
    gateAdditionRequest: null
};
const frame = (_) => {
    requestAnimationFrame(frame);
    gb.ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { gateAdditionRequest: gar } = state;
    if (gar !== null && !gateMap.has(gb.getCurrentBox())) {
        gb.drawUnderCurrentBox((ctx, coord) => {
            ctx.save();
            ctx.globalAlpha = 0.4;
            GateDrawer.get(gar.type)(ctx, coord);
            ctx.restore();
        });
    }
    drawGateTable(gt);
    drawConnections(connTable);
};
requestAnimationFrame(frame);
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
