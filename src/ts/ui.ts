import { requestGateAddition, GateClickEvent, selectGate, deselectGate, requestNewConnection, validateCircuit, requestCircuitEval, endCircuitEval, deleteGate } from "./boolviz.js"
import Coord from "./packages/coord.js"
import { GateType } from "./packages/gates.js"

setTimeout(() => {
  document.body.classList.remove("hide-el")
}, 1200)

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

enum State {
  Designing, Running,
}

interface Program {
  state: State
  flipper?: (idx: number) => void
  selected?: number
}

const program: Program = {
  state: State.Designing,
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

const deleteButton = document.querySelector("#delete-widget") as HTMLButtonElement
deleteButton?.addEventListener("click", async () => {
  if (typeof program.selected === "undefined") {
    return
  }

  await deleteGate(program.selected)
  deselect()

  document.querySelector("canvas")?.click()
})

const moveUnder = (c: Coord) => {
  deleteButton.style.left = `${c.x}px`
  deleteButton.style.top = `${c.y + 40}px`
}

const select = (data: GateClickEvent) => {
  selectGate(data.index)
  program.selected = data.index

  moveUnder(data.absCoord)
  deleteButton.dataset.state = "active"
}

const deselect = () => {
  deselectGate()
  program.selected = undefined

  deleteButton.dataset.state = "inactive"
}

const selectionEv = async ({ detail: data }: CustomEvent<GateClickEvent>) => {
  if (data === null) {
    deselect()
    return
  }

  select(data)
  removeEventListener("gate_click", (selectionEv as unknown) as EventListener)

  await requestNewConnection(data.index)
  deselect()

  addEventListener("gate_click", (selectionEv as unknown) as EventListener)
}

const flippingEv = async ({ detail: data }: CustomEvent<GateClickEvent>) => {
  if (data === null) return
  if (data.gate.type !== GateType.IN_TERM) return

  program.flipper?.(data.index)
}

const events: Map<State, unknown> = new Map([
  [State.Designing, selectionEv],
  [State.Running, flippingEv],
])

const switchEventHandlers = (from: State, to: State) => {
  removeEventListener("gate_click", events.get(from) as EventListener)
  addEventListener("gate_click", events.get(to) as EventListener)
}

addEventListener("gate_click", (selectionEv as unknown) as EventListener)

const runButton = document.querySelector("button#run") as HTMLButtonElement

const buttonIcons = new Map([
  [State.Running, "/src/svg/End.svg"],
  [State.Designing, "/src/svg/Run.svg"]
])

const switchButtonState = ((b: HTMLButtonElement) => {
  const img = b.querySelector("img") as HTMLImageElement
  return (s: State) => {
    img.src = buttonIcons.get(s) as string
  }
})(runButton)

runButton.addEventListener("click", async () => {
  if (program.state === State.Designing) {
    const invalid = await validateCircuit()
    if (invalid.size !== 0) {
      console.error(invalid)
      return
    }
    program.flipper = await requestCircuitEval()
  } else if (program.state === State.Running) {
    await endCircuitEval()
  }

  const newState = program.state === State.Running ? State.Designing : State.Running
  switchButtonState(newState)
  switchEventHandlers(program.state, newState)
  program.state = newState
})
