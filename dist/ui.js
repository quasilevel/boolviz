var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { requestGateAddition, selectGate, deselectGate, requestNewConnection } from "./boolviz.js";
import { GateType } from "./packages/gates.js";
const $ = document;
const gateEnumMap = new Map([
    ["in", GateType.IN_TERM],
    ["out", GateType.OUT_TERM],
    ["not", GateType.NOT],
    ["and", GateType.AND],
    ["or", GateType.OR],
    ["xor", GateType.XOR],
    ["nand", GateType.NAND],
    ["nor", GateType.NOR],
]);
var GateButtonState;
(function (GateButtonState) {
    GateButtonState["SELECTED"] = "selected";
    GateButtonState["NORMAL"] = "normal";
})(GateButtonState || (GateButtonState = {}));
const gatesButtons = $.querySelectorAll(".gate-con");
gatesButtons.forEach(it => {
    const el = it;
    el.dataset.state = GateButtonState.NORMAL;
    const gate = el.dataset.type;
    if (typeof gate === "undefined") {
        console.warn("There exists a .gate-con without a data-type attrib set on it. (skipping)", el);
        return;
    }
    const gt = gateEnumMap.get(gate);
    el.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        if (el.dataset.state === GateButtonState.SELECTED) {
            return;
        }
        el.dataset.state = GateButtonState.SELECTED;
        yield requestGateAddition(gt);
        el.dataset.state = GateButtonState.NORMAL;
    }));
});
const selectionEv = ({ detail: data }) => __awaiter(void 0, void 0, void 0, function* () {
    if (data === null) {
        deselectGate();
        return;
    }
    selectGate(data.index);
    removeEventListener("gate_click", selectionEv);
    yield requestNewConnection(data.index);
    deselectGate();
    addEventListener("gate_click", selectionEv);
});
addEventListener("gate_click", selectionEv);
