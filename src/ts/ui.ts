import { requestGateAddition, GateClickEvent, selectGate, deselectGate, requestNewConnection, validateCircuit, requestCircuitEval, endCircuitEval, deleteGate } from "./boolviz.js"
import Coord from "./packages/coord.js"
import { GateType } from "./packages/gates.js"
import { shareMachine } from "./packages/share.js"

setTimeout(() => {
  document.body.classList.remove("hide-el")
}, 1200)

const $ = document
const definitely = <T>(el: T | null, error: string): T => {
  if (el === null) {
    throw new Error(error)
  }
  return el
}

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

const runButton = definitely($.querySelector<HTMLButtonElement>("#runner button"), "runer button is missing")

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

// Share
const shareDOM = {
  overlay: definitely($.querySelector<HTMLDivElement>("#share-modal-overlay"), "share modal overlay is missing"),
  shareButton: definitely($.querySelector<HTMLButtonElement>("button#share"), "share button is missing"),
  closeButton: definitely($.querySelector<HTMLButtonElement>("#share-modal #close-button"), "share modal's close button is missing"),
  modal: definitely($.querySelector<HTMLDivElement>("#share-modal"), "share modal is missing"),

  inputs: {
    title: {
      button: definitely($.querySelector<HTMLButtonElement>("#share-modal #inputs #title button"), "Share modal's title button is missing"),
      input: definitely($.querySelector<HTMLInputElement>("#share-modal #inputs #title input"), "Share modal's title input is missing"),
    },
  },
  outputs: {
    iframe: {
      copy: definitely($.querySelector<HTMLButtonElement>("#share-modal #outputs #iframe button"), "Share modal's iframe copy button is missing"),
      output: definitely($.querySelector<HTMLInputElement>("#share-modal #outputs #iframe .output"), "Share modal's iframe output element is missing"),
    },
    url: {
      copy: definitely($.querySelector<HTMLButtonElement>("#share-modal #outputs #url button"), "Share modal's url copy button is missing"),
      output: definitely($.querySelector<HTMLInputElement>("#share-modal #outputs #url .output"), "Share modal's url output element is missing"),
    },
  }
}

function delay(ms: number) {
  return new Promise<number>((res) => {
    setTimeout(() => res(ms), ms)
  })
}

const openShareModal = (_: MouseEvent): boolean => shareMachine.trigger("Open", undefined)
const closeShareModal = (_: MouseEvent): boolean => shareMachine.trigger("Close", undefined)

shareDOM.shareButton.addEventListener("click", openShareModal)
shareDOM.closeButton.addEventListener("click", closeShareModal)

shareDOM.inputs.title.button.addEventListener("click", _ => shareMachine.trigger("ShareStart", { title: shareDOM.inputs.title.input.value }))

shareMachine.on("Closed", _ => shareDOM.overlay.classList.add("hidden")) 
shareMachine.on("Opened", _ => {
  shareDOM.overlay.classList.remove("hidden")
  shareDOM.modal.dataset.state = "opened"
  shareDOM.inputs.title.input.value = ""
})

shareMachine.on("Sharing", async ({ title: _ }) => {
  shareDOM.modal.dataset.state = "sharing"
  await delay(2000)
  shareMachine.trigger("ShareEnd", { url: new URL(window.location.toString()) , embed: new URL(window.location.toString()) })
})

shareMachine.on("Shared", ({ url, embed }) => {
  shareDOM.modal.dataset.state = "shared"
  shareDOM.outputs.url.output.innerText = url.toString()
  shareDOM.outputs.iframe.output.innerText = `<iframe src="${embed.toString()}"></iframe>`
})