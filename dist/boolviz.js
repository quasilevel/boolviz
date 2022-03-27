import Grid from './packages/gridbox.js';
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
console.log(gb);
