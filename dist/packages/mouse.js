import Coord from './coord.js';
export default class Mouse {
    constructor() {
        this.coord = new Coord(0, 0);
    }
    attach(el) {
        el.onmousemove = (ev) => {
            const rect = el.getBoundingClientRect();
            this.coord.x = ev.x - rect.left;
            this.coord.y = ev.y - rect.top;
        };
    }
}
