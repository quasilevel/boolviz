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
