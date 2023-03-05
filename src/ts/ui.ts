import { getGateInfo, getShareState, isInvalid, programMachine } from "./boolviz.js"
import Coord from "./packages/coord.js"
import { GateType } from "./packages/gates.js"
import { shareMachine } from "./packages/share.js"
import { Machine, } from "./packages/state.js"

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

const gatesButtons = $.querySelectorAll<HTMLDivElement>(".gate-con")

const gateButtonMap = new Map<GateType, HTMLDivElement>(
  [...gatesButtons] // take all gate buttons represented as divs in html
  .filter(button => { // remove the ones without a type set
    const type = gateEnumMap.get(button.dataset.type as string)
    const typeNotDefined = typeof type !== "undefined"
    if (!typeNotDefined) {
      console.warn("There exists a .gate-con without a data-type attrib set on it. (skipping)", button)
    }
    return typeNotDefined
  })
  .map<[GateType, HTMLDivElement]>(button => { // map each typed button to the type
    const type = gateEnumMap.get(button.dataset.type as string)!
    return [type, button]
  })
)

type SelectionStates = {
  normal: void,
  selected: GateType
}

type SelectionEvents = {
  select: GateType,
  deselect: void,
  cancel: void,
}

const selectionMachine = new Machine<SelectionStates, SelectionEvents>({
  state: "normal", data: undefined
}, {
    normal: {
      select: (to) => {
        gateButtonMap.get(to)!.dataset.state = GateButtonState.SELECTED
        programMachine.trigger("add_gate", { type: to })
        return { state: "selected", data: to }
      }
    },
    selected: {
      select: (to, from) => {
        gateButtonMap.get(from)!.dataset.state = GateButtonState.NORMAL
        gateButtonMap.get(to)!.dataset.state = GateButtonState.SELECTED
        programMachine.trigger("switch_gate", { type: to })
        return { state: "selected", data: to }
      },
      deselect: (_, from) => {
        gateButtonMap.get(from)!.dataset.state = GateButtonState.NORMAL
        return { state: "normal", data: undefined }
      },
      cancel: (_, from) => {
        gateButtonMap.get(from)!.dataset.state = GateButtonState.NORMAL
        programMachine.trigger("cancel_add_gate", undefined)
        return { state: "normal", data: undefined }
      }
    }
  })

programMachine.exit("adding", _ => {
  selectionMachine.trigger("deselect", undefined)
})

;[...gateButtonMap].map(([type, el])=> {
  el.addEventListener("click", async () => {
    if (
      selectionMachine.current.state === "selected" &&
      selectionMachine.current.data === type
    ) {
      return selectionMachine.trigger("cancel", undefined)
    }
    selectionMachine.trigger("select", type)
  })
})

const deleteButton = document.querySelector("#delete-widget") as HTMLButtonElement

const deleteWidgetCoord = (box: DOMRect) => {
  const x = box.left + (box.width / 2)
  const y = box.bottom
  return {
    left: `${x + 15}px`,
    top: `${y + 44}px`,
  }
}

const showDeleteButton = ( idx: number ): void => {
  const { transformedBox: tbox } = getGateInfo(idx)! // guaranteed because idx is provided by the machine
  const { left, top } = deleteWidgetCoord(tbox)

  deleteButton.animate(
    { left, top },
    {
      duration: 0,
      fill: "forwards"
    }
  )

  deleteButton.dataset.state = "active"
}

const showDeleteButtonOnIfSelected = () => {
  if (programMachine.current.state !== "selected") return

  const { idx } = programMachine.current.data
  const { transformedBox: tbox } = getGateInfo(idx)! // guaranteed because idx is provided by the machine
  const { left, top } = deleteWidgetCoord(tbox)

  deleteButton.animate(
    { left, top },
    {
      duration: 350,
      fill: "forwards"
    }
  )
}

type DeleteButtonStates = {
  hidden: void,
  visible: {
    aborter: AbortController
  }
}

type DeleteButtonEvents = {
  hide: void,
  show: number, // idx
}

const deleteButtonMachine = new Machine<DeleteButtonStates, DeleteButtonEvents>(
  { state: "hidden", data: undefined },
  {
    hidden: {
      show: idx => {
        const aborter = new AbortController()
        const { signal } = aborter
        showDeleteButton(idx)
        addEventListener("panning", showDeleteButtonOnIfSelected, { signal })
        addEventListener("zooming", showDeleteButtonOnIfSelected, { signal })
        return { state: "visible", data: { aborter } }
      }
    },
    visible: {
      hide: (_, { aborter }) => {
        aborter.abort()
        deleteButton.dataset.state = "inactive"
        return { state: "hidden", data: undefined }
      }
    }
  }
)

deleteButton?.addEventListener("click", async () => {
  programMachine.trigger("delete_gate", undefined)
})

programMachine.on("selected", ({ idx }) => deleteButtonMachine.trigger("show", idx))

programMachine.on("adding", _ => {
  deleteButton.dataset.state = "inactive"
})

programMachine.on("designing", _ => {
  deleteButtonMachine.trigger("hide", undefined)
  $.body.dataset.state = "designing"
  $.body.dataset.state = isInvalid() ? "invalid" : "designing"
})

programMachine.on("running", _ => {
  $.body.dataset.state = "running"
})

programMachine.on("selected", _ => {
  $.body.dataset.state = isInvalid() ? "invalid" : "designing"
})

const runButton = definitely($.querySelector<HTMLButtonElement>("#runner button"), "runer button is missing")

runButton.addEventListener("click", async () => {
  programMachine.trigger("toggle_running", undefined)
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

const openShareModal = (_: MouseEvent): boolean => !isInvalid() && shareMachine.trigger("Open", undefined)
const closeShareModal = (_: MouseEvent): boolean => shareMachine.trigger("Close", undefined)

shareDOM.shareButton.addEventListener("click", openShareModal)
shareDOM.closeButton.addEventListener("click", closeShareModal)

shareDOM.inputs.title.button.addEventListener("click", _ => {
  const circuit = getShareState()

  shareMachine.trigger("ShareStart", {
    title: shareDOM.inputs.title.input.value,
    circuit
  })
})

const copyOutput = (value: () => string) => async function (this: HTMLButtonElement, _ev: MouseEvent) {
  try {
    await navigator.clipboard.writeText(value())
  } catch (error) {
    console.error(error)
    return
  }

  const color = getComputedStyle(this).backgroundColor
  const duration = 200

  this.animate(
    { backgroundColor: "var(--green-100)" },
    { duration, fill: "forwards" }
  )

  this.innerText = "copied"
  setTimeout((el: HTMLButtonElement) => {
    el.animate(
      { backgroundColor: color },
      { duration, fill: "forwards" }
    )
    el.innerText = "copy"
  }, 1500, this)
}

const buildShareIframe = (embed: URL) => `<iframe src="${embed.toString()}"></iframe>`

shareDOM.outputs.iframe.copy.addEventListener("click", copyOutput(() => {
  if (shareMachine.current.state !== "Shared") {
    throw new Error("Invalid share state to copy")
  }
  return buildShareIframe(shareMachine.current.data.embed)
}))

shareDOM.outputs.url.copy.addEventListener("click", copyOutput(() => {
  if (shareMachine.current.state !== "Shared") {
    throw new Error("Invalid share state to copy")
  }
  return shareMachine.current.data.url.toString()
}))

shareMachine.on("Closed", _ => shareDOM.overlay.classList.add("hidden")) 
shareMachine.on("Opened", _ => {
  shareDOM.overlay.classList.remove("hidden")
  shareDOM.modal.dataset.state = "opened"
  shareDOM.inputs.title.input.value = ""
})

shareMachine.on("Sharing", async ({ title: _ }) => { shareDOM.modal.dataset.state = "sharing" })

shareMachine.on("Shared", ({ url, embed }) => {
  shareDOM.modal.dataset.state = "shared"
  shareDOM.outputs.url.output.innerText = url.toString()
  shareDOM.outputs.iframe.output.innerText = buildShareIframe(embed)
})

// welcome banner
const getStartedButton = definitely($.querySelector<HTMLButtonElement>("#welcome #cta button"), "Get started button is missing")
const welcomeOverlay = definitely($.querySelector<HTMLDivElement>("#welcome-overlay"), "Welcome overlay is missing")
const BANNER_KEY = "welcomed"

if (localStorage.getItem(BANNER_KEY) === null) {
  welcomeOverlay.classList.remove("hidden")
}

getStartedButton.addEventListener("click", _ => {
  localStorage.setItem(BANNER_KEY, "true")
  welcomeOverlay.classList.add("hidden")
})