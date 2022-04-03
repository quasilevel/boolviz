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
const drawer = (color) => (ctx, { x, y }) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
};
export const GateDrawer = new Map([
    [GateType.IN_TERM, drawer("pink")],
    [GateType.OUT_TERM, drawer("deeppink")],
    [GateType.AND, drawer("#ba2fce")],
    [GateType.OR, drawer("#6552e3")],
    [GateType.XOR, drawer("#d5a840")],
    [GateType.NOT, drawer("#d55c40")],
    [GateType.NAND, drawer("#41e187")],
    [GateType.NOR, drawer("#3accee")],
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
