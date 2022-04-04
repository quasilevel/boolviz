export default class SpatialMap {
    constructor() {
        this.m = new Map();
    }
    has(c) {
        var _a;
        return ((_a = this.m.get(c.x)) === null || _a === void 0 ? void 0 : _a.has(c.y)) === true;
    }
    set(c, val) {
        if (!this.m.has(c.x)) {
            this.m.set(c.x, new Map([[c.y, val]]));
            return this;
        }
        this.m.get(c.x).set(c.y, val);
        return this;
    }
    get(c) {
        var _a;
        return (_a = this.m.get(c.x)) === null || _a === void 0 ? void 0 : _a.get(c.y);
    }
    remove(c) {
        var _a;
        if (!this.has(c)) {
            return false;
        }
        (_a = this.m.get(c.x)) === null || _a === void 0 ? void 0 : _a.delete(c.y);
        return true;
    }
}
