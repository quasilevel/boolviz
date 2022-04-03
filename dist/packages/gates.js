export var GateType;
(function (GateType) {
    GateType["IN_TERM"] = "input terminal";
    GateType["OUT_TERM"] = "output terminal";
    GateType["AND"] = "and";
    GateType["OR"] = "or";
    GateType["XOR"] = "xor";
    GateType["NOT"] = "not";
    GateType["NAND"] = "nand";
    GateType["NOR"] = "nor";
})(GateType || (GateType = {}));
const drawer = (id) => {
    const paths = [...document.querySelectorAll(`#${id} path`)]
        .map(it => { var _a; return (_a = it.attributes.getNamedItem("d")) === null || _a === void 0 ? void 0 : _a.value; })
        .filter(it => it !== undefined)
        .map(it => new Path2D(it));
    return (ctx, { x, y }) => {
        ctx.translate(x - 30, y - 30);
        paths.map(it => ctx.stroke(it));
    };
};
export const GateDrawer = new Map([
    [GateType.IN_TERM, drawer("in")],
    [GateType.OUT_TERM, drawer("out")],
    [GateType.AND, drawer("and")],
    [GateType.OR, drawer("or")],
    [GateType.XOR, drawer("xor")],
    [GateType.NOT, drawer("not")],
    [GateType.NAND, drawer("nand")],
    [GateType.NOR, drawer("nor")],
]);
export const GateArgCount = new Map([
    [GateType.IN_TERM, 0],
    [GateType.OUT_TERM, 1],
    [GateType.AND, 2],
    [GateType.OR, 2],
    [GateType.XOR, 2],
    [GateType.NOT, 1],
    [GateType.NAND, 2],
    [GateType.NOR, 2],
]);
export const GateSolver = new Map([
    [GateType.OUT_TERM, ([a]) => a],
    [GateType.AND, ([a, b]) => a && b],
    [GateType.OR, ([a, b]) => a || b],
    [GateType.XOR, ([a, b]) => a !== b],
    [GateType.NOT, ([a]) => !a],
    [GateType.NAND, ([a, b]) => !(a && b)],
    [GateType.NOR, ([a, b]) => !(a || b)],
]);
