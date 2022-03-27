import Coord from './packages/coord.js';
import { GateType } from './packages/gates.js';
import Grid from './packages/grid.js';
import Mouse from './packages/mouse.js';
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
});
const gt = [];
gt[0] = {
    type: GateType.IN_TERM,
    coord: new Coord(3, 3)
};
gt[1] = {
    type: GateType.OUT_TERM,
    coord: new Coord(4, 3)
};
const drawGateTable = ((g) => (table) => (table.forEach(it => g.drawAt(it.coord, (ctx, { x, y }) => {
    ctx.beginPath();
    ctx.fillStyle = "pink";
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
}))))(gb);
const frame = (_) => {
    requestAnimationFrame(frame);
    gb.ctx.clearRect(0, 0, canvas.width, canvas.height);
    gb.drawUnderCurrentBox((ctx, { x, y }) => {
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    });
    drawGateTable(gt);
};
requestAnimationFrame(frame);
