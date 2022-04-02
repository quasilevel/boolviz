import Coord from "./coord.js";
const CONNECTION_JOIN_GAP = 15; // px
export class Connections {
    constructor() {
        this.c = new Map();
    }
    add(from, to) {
        var _a;
        if (!this.c.has(from)) {
            this.c.set(from, new Set());
        }
        (_a = this.c.get(from)) === null || _a === void 0 ? void 0 : _a.add(to);
    }
    delete(from, to) {
        var _a;
        (_a = this.c.get(from)) === null || _a === void 0 ? void 0 : _a.delete(to);
    }
    deleteAll(from) {
        this.c.delete(from);
        this.c.forEach(tos => tos.delete(from));
    }
    forEach(callback) {
        this.c.forEach((tos, from) => tos.forEach(to => callback(from, to)));
    }
}
const getCoord = (adjuster) => (gt) => (index) => {
    const { coord } = gt[index];
    return adjuster(coord);
};
const getAdjustedCoord = (left) => (g) => getCoord(c => {
    const rect = g.getGridRect(c);
    return new Coord((left) ? (rect.x + CONNECTION_JOIN_GAP) : (rect.x + rect.w - CONNECTION_JOIN_GAP), rect.y + (rect.h / 2));
});
const getFromCoord = getAdjustedCoord(false);
const getToCoord = getAdjustedCoord(true);
export const getCoordMappers = (g) => (gt) => [getFromCoord(g)(gt), getToCoord(g)(gt)];
export const drawConnection = ((ctx) => (fromCoordMap, toCoordMap) => (from, to) => {
    const [fcoord, tcoord] = [fromCoordMap(from), toCoordMap(to)];
    ctx.beginPath();
    ctx.moveTo(fcoord.x, fcoord.y);
    ctx.bezierCurveTo(fcoord.x, fcoord.y, tcoord.x, tcoord.y, tcoord.x, tcoord.y);
    ctx.stroke();
    ctx.closePath();
});
export const drawConnections = (g) => (gt) => (c) => {
    const { ctx } = g;
    const [gfcoord, gtcoord] = getCoordMappers(g)(gt);
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "pink";
    c.forEach(drawConnection(ctx)(gfcoord, gtcoord));
    ctx.restore();
};
