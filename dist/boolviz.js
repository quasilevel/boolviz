import GridBox from './packages/gridbox.js';
const $ = document;
const canvas = $.querySelector('canvas#boolviz');
if (canvas === null) {
    throw new Error("Cannot find <canvas id='boolviz'></canvas>");
}
canvas.width = innerWidth;
canvas.height = innerHeight;
const gb = new GridBox({
    canvas: canvas,
});
console.log(gb);
