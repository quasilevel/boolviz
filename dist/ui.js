var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { requestGateAddition, selectGate, deselectGate, requestNewConnection, validateCircuit, requestCircuitEval, endCircuitEval, deleteGate } from "./boolviz.js";
import { GateType } from "./packages/gates.js";
setTimeout(() => {
    document.body.classList.remove("hide-el");
}, 1200);
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
var State;
(function (State) {
    State[State["Designing"] = 0] = "Designing";
    State[State["Running"] = 1] = "Running";
})(State || (State = {}));
const program = {
    state: State.Designing,
};
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
const deleteButton = document.querySelector("#delete-widget");
deleteButton === null || deleteButton === void 0 ? void 0 : deleteButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (typeof program.selected === "undefined") {
        return;
    }
    yield deleteGate(program.selected);
    deselect();
    (_a = document.querySelector("canvas")) === null || _a === void 0 ? void 0 : _a.click();
}));
const moveUnder = (c) => {
    deleteButton.style.left = `${c.x}px`;
    deleteButton.style.top = `${c.y + 40}px`;
};
const select = (data) => {
    selectGate(data.index);
    program.selected = data.index;
    moveUnder(data.absCoord);
    deleteButton.dataset.state = "active";
};
const deselect = () => {
    deselectGate();
    program.selected = undefined;
    deleteButton.dataset.state = "inactive";
};
const selectionEv = ({ detail: data }) => __awaiter(void 0, void 0, void 0, function* () {
    if (data === null) {
        deselect();
        return;
    }
    select(data);
    removeEventListener("gate_click", selectionEv);
    yield requestNewConnection(data.index);
    deselect();
    addEventListener("gate_click", selectionEv);
});
const flippingEv = ({ detail: data }) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if (data === null)
        return;
    if (data.gate.type !== GateType.IN_TERM)
        return;
    (_b = program.flipper) === null || _b === void 0 ? void 0 : _b.call(program, data.index);
});
const events = new Map([
    [State.Designing, selectionEv],
    [State.Running, flippingEv],
]);
const switchEventHandlers = (from, to) => {
    removeEventListener("gate_click", events.get(from));
    addEventListener("gate_click", events.get(to));
};
addEventListener("gate_click", selectionEv);
const runButton = document.querySelector("button#run");
const buttonIcons = new Map([
    [State.Running, "/src/svg/End.svg"],
    [State.Designing, "/src/svg/Run.svg"]
]);
const switchButtonState = ((b) => {
    const img = b.querySelector("img");
    return (s) => {
        img.src = buttonIcons.get(s);
    };
})(runButton);
runButton.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    if (program.state === State.Designing) {
        const invalid = yield validateCircuit();
        if (invalid.size !== 0) {
            console.error(invalid);
            return;
        }
        program.flipper = yield requestCircuitEval();
    }
    else if (program.state === State.Running) {
        yield endCircuitEval();
    }
    const newState = program.state === State.Running ? State.Designing : State.Running;
    switchButtonState(newState);
    switchEventHandlers(program.state, newState);
    program.state = newState;
}));
