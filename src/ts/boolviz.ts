import { drawConnection as dc, drawConnections as dcs, getCoordMappers } from './packages/connections.js'
import { Gate, GateDrawer, GateTable, GateType } from './packages/gates.js'
import Grid, { drawAll, Drawer, GridClickEvent } from './packages/grid.js'
import Mouse from './packages/mouse.js'
import SpatialMap from './packages/spatialmap.js'
import Coord from './packages/coord.js'
import { circuitSolver, listInvalidGates } from './packages/solver.js'
import { Circuit } from './packages/circuit.js'
import { Machine, pass } from './packages/state.js'
const $ = document

const canvas = $.querySelector('canvas#boolviz') as HTMLCanvasElement

if (canvas === null) {
  throw new Error("Cannot find <canvas id='boolviz'></canvas>")
}

const css = getComputedStyle($.body)
const colors = {
  black300: css.getPropertyValue("--black-300"),
  black400: css.getPropertyValue("--black-400"),
  black500: css.getPropertyValue("--black-500"),
  black700: css.getPropertyValue("--black-700"),
  black800: css.getPropertyValue("--black-800"),
  black900: css.getPropertyValue("--black-900"),
  red100:   css.getPropertyValue("--red-100"),
  white:    css.getPropertyValue("--white-primary"),
}


{ // set canvas dimensions based on css
  const canvasDim = canvas.getBoundingClientRect()

  canvas.width = canvasDim.width
  canvas.height = canvasDim.height
}

const mouse = new Mouse()
mouse.attach(canvas)

const gb = new Grid({
  ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
  mouse: mouse,
  boxSize: 100,
})

const fetchSharedCircuit = async (id: string) => {
  const res = await fetch(
    `https://keogami-pocketbase.fly.dev/api/collections/circuits/records/${id}`
  )

  // FIXME actually check the response
  return await res.json() as { circuit: ConstructorParameters<typeof Circuit>[0] }
}

const gateMap = new SpatialMap<number>()
let invalidGates: Map<number, [number, number]>
let addGate: (g: Gate) => void;

export const isInvalid = () => (typeof invalidGates !== "undefined" && invalidGates.size > 0)

let currentId = 0
let circuit = Circuit.Default()
const shareID = new URLSearchParams(location.search).get("share")
if (shareID !== null) {
  const args = await fetchSharedCircuit(shareID)
  circuit = new Circuit(args.circuit)

  args.circuit.gates.map(([id, g]) => gateMap.set(g.coord, id))
}

addGate = ((m: SpatialMap<number>, t: GateTable) => (g: Gate) => {
  t.set(currentId, g)
  m.set(g.coord, currentId)
  currentId++
})(gateMap, circuit.gates)

export const getShareState = () => {
  return {
    ...circuit.asPlain(),
    transform: gb.getTransform()
  }
}

const gt = circuit.gates

const drawGateTable = ((g: Grid) => (table: GateTable, solution?: Map<number, boolean>) => {
  g.ctx.save()
  table.forEach((it, idx) => {
    const color = typeof solution === "undefined"
      ? colors.black800
      : !!solution.get(idx) ? colors.black800 : colors.black400
    g.ctx.strokeStyle = color
    g.drawAt(it.coord, GateDrawer.get(it.type) as Drawer)

    if (typeof invalidGates === "undefined" || !invalidGates.has(idx)) {
      return
    }
    if (programMachine.current.state === "selected" && programMachine.current.data.idx === idx) {
      return
    }
    g.drawAt(it.coord, drawError)
  })
  g.ctx.restore()
})(gb)

const drawConnections = dcs(gb)(gt)

const connTable = circuit.connections

const toggleConnection = (from: number, to: number): boolean => {
  const toGate = gt.get(to)! // FIXME make these definitely valid
  const fromGate = gt.get(from)!
  const has = connTable.has(from, to)
  if (!has && !isValidConnection(fromGate.coord, toGate.coord)) {
    return false
  }
  has ? connTable.delete(from, to) : connTable.add(from, to)
  return true
}

type ProgramStates = {
  designing: void,
  running: {
    solution: Map<number, boolean>,
    solveFor: ReturnType<ReturnType<typeof circuitSolver>>[0]
    updateFor: ReturnType<ReturnType<typeof circuitSolver>>[1]
  },
  selected: {
    idx: number
  },
  adding: {
    type: GateType
  }
}

type ProgramEvents = {
  add_gate: {
    type: GateType
  },
  cancel_add_gate: void,
  place_gate: {
    coord: Coord
  },
  switch_gate: {
    type: GateType
  },
  select_gate: {
    idx: number
  },
  deselect_gate: void,
  delete_gate: void,
  toggle_connection: {
    to: number
  },
  toggle_running: void,
  switch_input: {
    idx: number
  },
}

export const programMachine = new Machine<ProgramStates, ProgramEvents>({
  state: "designing",
  data: undefined
}, {
    designing: {
      select_gate: pass("selected"),
      add_gate: pass("adding"),
      toggle_running: _ => {
        const map = new Map()
        const inputs = filterGate(gt, GateType.IN_TERM)
        const outputs = filterGate(gt, GateType.OUT_TERM)

        inputs.map(it => map.set(it, false))
  
        const [solveFor, updateFor] = circuitSolver(gt, connTable)(map)
        outputs.map(solveFor)
        return {
          state: "running",
          data: {
            solution: map,
            solveFor, updateFor
          }
        }
      }
    },
    adding: {
      place_gate: ({ coord }, { type }) => {
        addGate({ type, coord })
        invalidGates = listInvalidGates(gt, connTable)
        return { state: "designing", data: undefined }
      },
      switch_gate: pass("adding"),
      cancel_add_gate: pass("designing")
    },
    running: {
      toggle_running: pass("designing"),
      switch_input: ({ idx }, from) => {
        from.updateFor(idx, !from.solution.get(idx))
        return {
          state: "running", data: from
        }
      }
    },
    selected: {
      select_gate: ({ idx: to }, { idx: from }) => {
        if (to !== from) {
          return { state: "selected", data: { idx: to }}
        }
        return { state: "designing", data: undefined }
      },
      toggle_connection: ({ to }, { idx: from }) => {
        if (toggleConnection(from, to)) {
          invalidGates = listInvalidGates(gt, connTable)
        }
        if (gt.get(to)!.type === GateType.OUT_TERM) {
          return { state: "designing", data: undefined }
        }
        return { state: "selected", data: { idx: to } }
      },
      delete_gate: (_, { idx }) => {
        deleteGate(idx)
        invalidGates = listInvalidGates(gt, connTable)
        return { state: "designing", data: undefined }
      },
      deselect_gate: pass("designing"),
      add_gate: pass("adding")
    }
  })

export const getGateInfo = (idx: number) => {
  const gate = gt.get(idx)
  if (typeof gate === "undefined") {
    return undefined
  }
  const box = gb.getBoundingBox(gate.coord)
  const transformedBox = gb.getTransformedBoundingBox(gate.coord)
  return { gate, box, transformedBox }
}

type StrokeAroundGateConfig = {
  color: string
  dashes: number[]
  width: number
}

const strokeAroundGate = (config: Partial<StrokeAroundGateConfig>): Drawer => (ctx, {x, y}) => {
  ctx.beginPath()
  ;("color" in config) && (ctx.strokeStyle = config.color!)
  ;("dashes" in config) && (ctx.setLineDash(config.dashes!))
  ;("width" in config) && (ctx.lineWidth = config.width!)
  ctx.arc(x, y, 35, 0, Math.PI * 2)
  ctx.stroke()
  ctx.closePath()
}

const drawSelected = strokeAroundGate({
  color: colors.black900,
  width: 2
})

const drawHover = strokeAroundGate({
  color: colors.black300,
  width: 2,
  dashes: [5, 5]
})

const drawError = strokeAroundGate({
  color: colors.red100,
  dashes: [5, 5],
  width: 2
})

const drawErrorSelected = strokeAroundGate({
  color: colors.red100,
  width: 2
})

const drawErrorLabel = (error: number): Drawer => (ctx, coord) => {
  const sign = (error <= 0) ? "-" : "+"
  const label = sign.repeat(Math.abs(error))
  ctx.font = "1.5rem monospace"
  const width = ctx.measureText(label).width
  const { x, y } = coord.clone().add(new Coord(-width/2, -36))
  ctx.beginPath()
  ctx.fillStyle = colors.red100
  ctx.fillText(label, x, y)
  ctx.fill()
  ctx.closePath()
}
const drawErrorHover = (error: number) => drawAll(drawErrorLabel(error), strokeAroundGate({
  color: colors.red100,
  dashes: [5, 5],
  width: 2
}))

export interface GateClickEvent {
  index: number
  gate: Gate
  absCoord: Coord,
  canvasCoord: Coord
}

addEventListener("grid_click", (({ detail }: CustomEvent<GridClickEvent>) => {
  const gateIndex = gateMap.get(detail.coord)
  if (typeof gateIndex === "undefined") {
    return
  }

  const absCoord = gb.absBoxCoord((gt.get(gateIndex) as Gate).coord)
  dispatchEvent(new CustomEvent<GateClickEvent>("gate_click", {
    detail: {
      index: gateIndex as number,
      gate: gt.get(gateIndex) as Gate,
      absCoord,
      canvasCoord: gb.getTransformedCoord(absCoord),
    }
  }))
}) as EventListener)

addEventListener("gate_click", (({ detail }: CustomEvent<GateClickEvent>) => {
  if (detail.gate.type === GateType.IN_TERM) {
    programMachine.trigger("switch_input", { idx: detail.index })
  }

  if (programMachine.current.state !== "selected") {
    programMachine.trigger("select_gate", { idx: detail.index })
    return
  }

  if (programMachine.current.state === "selected") {
    programMachine.trigger("toggle_connection", { to: detail.index })
    return
  }
}) as EventListener)

addEventListener("grid_click", (({ detail }: CustomEvent<GridClickEvent>) => {
  if (!gateMap.has(detail.coord)) {
    programMachine.trigger("place_gate", {
      coord: detail.coord, 
    })
    // short circuit if the above trigger succeeds
    || programMachine.trigger("deselect_gate", undefined)
    return
  }
}) as EventListener)

const isValidConnection = (from: Coord, to: Coord): boolean => {
  return from.x < to.x
}


const [fmapper, tmapper] = getCoordMappers(gb)(gt)
const drawConnection = dc(gb.ctx)(fmapper, tmapper)

const previewConnection = ((ctx: CanvasRenderingContext2D) => (fidx: number, tidx: number) => {
  ctx.save()
  ctx.strokeStyle = colors.black400
  drawConnection(fidx, tidx)
  ctx.restore()
})(gb.ctx)

const canPreviewConnection = (fidx: number, tidx: number): boolean => {
  return isValidConnection(
    (gt.get(fidx) as Gate).coord, (gt.get(tidx) as Gate).coord
  ) && !connTable.has(fidx, tidx)
}

const frame = (time: number) => {
  requestAnimationFrame(frame)
  const scale = gb.getScale()
  const origin = gb.ctx.getTransform().inverse().transformPoint(new DOMPoint(0, 0))
  gb.ctx.clearRect(origin.x, origin.y, canvas.width / scale, canvas.height / scale)
  gb.ctx.lineWidth = 2
  gb.ctx.strokeStyle = colors.black800

  const currentIdx = gateMap.get(gb.getCurrentBox())
  hoverable: if (typeof currentIdx !== "undefined") {
    if (programMachine.current.state === "running" && gt.get(currentIdx)!.type !== GateType.IN_TERM) {
      break hoverable
    }
    if (programMachine.current.state === "selected" && programMachine.current.data.idx === currentIdx) {
      break hoverable
    }
    const g = gt.get(currentIdx) as Gate
    if (typeof invalidGates !== "undefined" && invalidGates.has(currentIdx)) {
      const [actual, expected] = invalidGates.get(currentIdx)!
      gb.drawAt(g.coord, drawErrorHover(expected - actual))
    } else {
      gb.drawAt(g.coord, drawHover)
    }
  }

  if (programMachine.current.state === "adding" && typeof currentIdx === "undefined") {
    const { type } = programMachine.current.data
    gb.drawUnderCurrentBox((ctx, coord) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ;(GateDrawer.get(type) as Drawer)(ctx, coord)
      ctx.restore()
    })
  }

  if (programMachine.current.state === "selected") {
    const g = gt.get(programMachine.current.data.idx) as Gate
    gb.drawAt(g.coord, (typeof invalidGates !== "undefined" && invalidGates.has(programMachine.current.data.idx)) ? drawErrorSelected : drawSelected)
  }

  drawConnections(connTable, ([from, to], ctx) => {
    if (programMachine.current.state === "running") {
      const s = !!programMachine.current.data.solution.get(from)
      const color = s ? colors.black800 : colors.black400
      const dash = s ? [10, 10] : []
      const offset = time / 100
      ctx.setLineDash(dash)
      ctx.lineDashOffset = -offset
      ctx.strokeStyle = color
      return
    }

    if (to === currentIdx && programMachine.current.state === "selected" && programMachine.current.data.idx === from) {
      ctx.strokeStyle = colors.red100
      return
    }

    ctx.strokeStyle = colors.black800
  })

  if (programMachine.current.state === "running") {
    drawGateTable(gt, programMachine.current.data.solution)
  } else {
    drawGateTable(gt)
  }

  if (typeof currentIdx !== "undefined" &&
      programMachine.current.state === "selected" &&
      canPreviewConnection(programMachine.current.data.idx, currentIdx as number)) {
    previewConnection(programMachine.current.data.idx as number, currentIdx)
  }
}

requestAnimationFrame(frame)

export const deselectGate = () => programMachine.trigger("deselect_gate", undefined)

const filterGate = (table: GateTable, type: GateType): number[] => {
  return [...table]
  .filter(([_, t]) => t.type === type)
  .map(([idx, _]) => idx)
}

const deleteGate = (idx: number): boolean => {
  if (!gt.has(idx)) return false

  gateMap.remove((gt.get(idx) as Gate).coord)
  gt.delete(idx)
  connTable.deleteAll(idx)

  return true
}
