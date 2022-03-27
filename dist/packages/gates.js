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
    [GateType.OUT_TERM, drawer("pink")],
    [GateType.AND, drawer("pink")],
    [GateType.OR, drawer("pink")],
    [GateType.XOR, drawer("pink")],
    [GateType.NOT, drawer("pink")],
    [GateType.NAND, drawer("pink")],
    [GateType.NOR, drawer("pink")],
]);
