import Coord from './coord.js';
export default class Mouse {
    constructor() {
        this.coord = new Coord(0, 0);
    }
    attach(el) {
        el.onmousemove = (ev) => {
            this.coord.x = ev.x, this.coord.y = ev.y;
        };
    }
}
