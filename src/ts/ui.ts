import { requestGateAddition } from "./boolviz.js"
import { GateType } from "./packages/gates.js"

const $ = document
const gateEnumMap = new Map([
  ["in", GateType.IN_TERM],
  ["out", GateType.OUT_TERM],
  ["not", GateType.NOT],
  ["and", GateType.AND],
  ["or", GateType.OR],
  ["xor", GateType.XOR],
  ["nand", GateType.NAND],
  ["nor", GateType.NOR],
])

enum GateButtonState {
  SELECTED = "selected",
  NORMAL = "normal"
}

const gatesButtons = $.querySelectorAll(".gate-con")

gatesButtons.forEach(it => {
  const el = it as HTMLDivElement
  el.dataset.state = GateButtonState.NORMAL
  const gate = el.dataset.type
  if (typeof gate === "undefined") {
    console.warn("There exists a .gate-con without a data-type attrib set on it. (skipping)", el)
    return
  }
  const gt = gateEnumMap.get(gate as string)

  el.addEventListener("click", async () => {
    if (el.dataset.state === GateButtonState.SELECTED) {
      return
    }
    el.dataset.state = GateButtonState.SELECTED
    await requestGateAddition(gt as GateType)
    el.dataset.state = GateButtonState.NORMAL
  })
})
