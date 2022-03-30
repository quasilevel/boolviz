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
const frame = (_) => {
    requestAnimationFrame(frame);
    gb.ctx.clearRect(0, 0, canvas.width, canvas.height);
    gateMap.has(gb.getCurrentBox()) || gb.drawUnderCurrentBox((ctx, { x, y }) => {
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    });
    drawGateTable(gt);
};
requestAnimationFrame(frame);
export const requestGateAddition = (t) => {
    let cancel;
    const listener = (ev) => {
        addGate({
            type: t,
            coord: ev.detail.coord,
        });
        cancel();
    };
    cancel = () => removeEventListener("grid_click", listener);
    addEventListener("grid_click", listener);
    return cancel;
};
requestGateAddition(GateType.NOR);
