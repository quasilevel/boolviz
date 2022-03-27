export default class Coord {
    constructor(x, y) {
        this.x = 0;
        this.y = 0;
        this.x = x, this.y = y;
    }
    scale(val) {
        return new Coord(this.x * val, this.y * val);
    }
    add(c) {
        return new Coord(this.x + c.x, this.y + c.y);
    }
    mutScale(val) {
        this.x *= val;
        this.y *= val;
    }
    mutAdd(x, y) {
        this.x += x, this.y += y;
    }
    clone() {
        return new Coord(this.x, this.y);
    }
}
