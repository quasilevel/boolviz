import { Connections, drawConnection as dc, drawConnections as dcs, getCoordMappers } from './packages/connections.js'
import { Gate, GateDrawer, GateTable, GateType } from './packages/gates.js'
import Grid, { Drawer, GridClickEvent } from './packages/grid.js'
import Mouse from './packages/mouse.js'
import SpatialMap from './packages/spatialmap.js'
import Coord from './packages/coord.js'
import { circuitSolver, listInvalidGates } from './packages/solver.js'
const $ = document

const canvas = $.querySelector('canvas#boolviz') as HTMLCanvasElement

if (canvas === null) {
  throw new Error("Cannot find <canvas id='boolviz'></canvas>")
}

canvas.width = innerWidth
canvas.height = innerHeight

const mouse = new Mouse()
mouse.attach(canvas)

const gb = new Grid({
  ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
  mouse: mouse,
  boxSize: 100,
})

const gt: GateTable = []

const gateMap = new SpatialMap<number>()
const addGate = ((m: SpatialMap<number>, t: GateTable) => (g: Gate) => {
  t.push(g)
  m.set(g.coord, t.length - 1)
})(gateMap, gt)

const drawGateTable = ((g: Grid) => (table: GateTable) => (
  table.forEach(it => g.drawAt(it.coord, GateDrawer.get(it.type) as Drawer))
))(gb)

const drawConnections = dcs(gb)(gt)

const connTable = new Connections()
const solution = new Map()

type ProgramState = {
  gateAdditionRequest: {
    type: GateType
    cancel: () => void
  } | null
  selected: number | null
  connectionPending: {
    idx: number
  } | null
}

const state: ProgramState = {
  gateAdditionRequest: null,
  selected: null,
  connectionPending: null,
}

const drawSolution = ((grid: Grid) => (sol: Map<number, boolean>) => {
  ;[...sol]
  .filter(([idx, val]) => val && (idx !== state.selected))
  .map(([idx, _]) => (gt[idx].coord))
  .map(c => grid.drawAt(c, (ctx, {x, y}) => {
    ctx.beginPath()
    ctx.strokeStyle = "deeppink"
    ctx.lineWidth = 2
    ctx.arc(x, y, 35, 0, Math.PI * 2)
    ctx.stroke()
    ctx.closePath()
  }))
})(gb)

const drawSelected: Drawer = (ctx, {x, y}) => {
  ctx.beginPath()
  ctx.strokeStyle = "pink"
  ctx.lineWidth = 2
  ctx.arc(x, y, 35, 0, Math.PI * 2)
  ctx.stroke()
  ctx.closePath()
}

export interface GateClickEvent {
  index: number
  gate: Gate
}

addEventListener("grid_click", (({ detail }: CustomEvent<GridClickEvent>) => {
  const gateIndex = gateMap.get(detail.coord)
  if (typeof gateIndex === "undefined") {
    dispatchEvent(new CustomEvent<GateClickEvent>("gate_click"))
    return
  }

  dispatchEvent(new CustomEvent<GateClickEvent>("gate_click", {
    detail: {
      index: gateIndex as number,
      gate: gt[gateIndex] as Gate,
    }
  }))
}) as EventListener)

const isValidConnection = (from: Coord, to: Coord): boolean => {
  return from.x < to.x
}


const [fmapper, tmapper] = getCoordMappers(gb)(gt)
const drawConnection = dc(gb.ctx)(fmapper, tmapper)

const previewConnection = ((ctx: CanvasRenderingContext2D) => (fidx: number, tidx: number) => {
  ctx.save()
  if (connTable.has(fidx, tidx)) {
    ctx.strokeStyle = "deeppink"
  } else {
    ctx.globalAlpha = 0.4
  }
  drawConnection(fidx, tidx)
  ctx.restore()
})(gb.ctx)

const canPreviewConnection = (fidx: number, tidx: number): boolean => {
  return isValidConnection(
    gt[fidx].coord, gt[tidx].coord
  )
}

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  gb.ctx.lineWidth = 2
  gb.ctx.strokeStyle = "pink"
  const { gateAdditionRequest: gar } = state
  const currentIdx = gateMap.get(gb.getCurrentBox())
  if (gar !== null && typeof currentIdx === "undefined") {
    gb.drawUnderCurrentBox((ctx, coord) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ;(GateDrawer.get(gar.type) as Drawer)(ctx, coord)
      ctx.restore()
    })
  }

  if (state.selected !== null) {
    const g = gt[state.selected] as Gate
    gb.drawAt(g.coord, drawSelected)
  }

  drawGateTable(gt)
  drawConnections(connTable)
  drawSolution(solution)

  if (typeof currentIdx !== "undefined" &&
      state.connectionPending !== null &&
      canPreviewConnection(state.connectionPending.idx as number, currentIdx as number)) {
    previewConnection(state.connectionPending.idx as number, currentIdx)
  }
}

requestAnimationFrame(frame)

export const selectGate = (idx: number) => {
  if (typeof gt[idx] === "undefined") {
    return false
  }

  state.selected = idx
  return true
}

export const deselectGate = () => {
  if (state.selected === null) {
    return false
  }

  state.selected = null
  return true
}

export const enum ConnectionResult {
  Connected, Disconnected, Cancelled, Rejected
}
export const requestNewConnection = (idx: number): Promise<ConnectionResult> => {
  let cleanUp: () => void
  const listener = (res: any) => (ev: CustomEvent<GridClickEvent>) => {
    const toIndex = gateMap.get(ev.detail.coord)
    if (typeof toIndex === "undefined") {
      res(ConnectionResult.Cancelled)
      cleanUp()
      return
    }

    const fromGate = gt[idx] as Gate
    if (!isValidConnection(fromGate.coord, ev.detail.coord)) {
      res(ConnectionResult.Rejected)
      cleanUp()
      return
    }

    if (connTable.has(idx, toIndex)) {
      res(ConnectionResult.Disconnected)
      connTable.delete(idx, toIndex)
      cleanUp()
      return
    }

    connTable.add(idx, toIndex)
    res(ConnectionResult.Connected)
    cleanUp()
    return
  }

  return new Promise(res => {
    const l = listener(res) as EventListener
    cleanUp = () => {
      removeEventListener("grid_click", l)
      state.connectionPending = null
    }
    if (gt[idx] === undefined) {
      res(ConnectionResult.Rejected)
      return
    }

    state.connectionPending = { idx: idx }

    addEventListener("grid_click", l) 
  })
}

export const enum AdditionResult {
  Added, Cancelled
}
export const requestGateAddition = (t: GateType): Promise<AdditionResult> => {
  if (state.gateAdditionRequest !== null) {
    state.gateAdditionRequest.cancel()
  }

  let cleanUp: () => void
  const listener = (res: any) => (ev: CustomEvent<GridClickEvent>) => {
    addGate({
      type: t,
      coord: ev.detail.coord,
    })
    res(AdditionResult.Added)

    cleanUp()
  }

  return new Promise<AdditionResult>(res => {
    const l = listener(res)
    cleanUp = () => {
      removeEventListener("grid_click", l as EventListener)
      state.gateAdditionRequest = null
    }

    state.gateAdditionRequest = {
      type: t, cancel: () => {
        res(AdditionResult.Cancelled)
        cleanUp()
      }
    }

    addEventListener("grid_click", l as EventListener)
  })
}

const filterGate = (table: GateTable, type: GateType): number[] => {
  return table
  .map((it, idx): [number, GateType] => [idx, it.type])
  .filter(([_, t]) => t === type)
  .map(([idx, _]) => idx)
}

export const validateCircuit = async () => {
  return listInvalidGates(gt, connTable)
}

export const requestCircuitEval = async () => {
  const inputs = filterGate(gt, GateType.IN_TERM)
  const outputs = filterGate(gt, GateType.OUT_TERM)

  solution.clear()

  inputs.map(it => solution.set(it, false))
  
  const [solveFor, updateFor] = circuitSolver(gt, connTable)(solution)
  outputs.map(solveFor)

  return updateFor
}

// test data
(() => {
  ;([
    [GateType.IN_TERM, 3, 2],
    [GateType.IN_TERM, 5, 3],
    [GateType.NOT, 5, 2],
    [GateType.AND, 7, 2],
    [GateType.XOR, 7, 3],
    [GateType.OUT_TERM, 9, 2],
    [GateType.OUT_TERM, 9, 3],
  ] as [GateType, number, number][]).map(([t, x, y]) => addGate({
    type: t, coord: new Coord(x, y)
  }))

  ;[
    [0, 2],
    [2, 3],
    [1, 4],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 6],
  ].map(([f, t]) => connTable.add(f, t))

  solution.set(0, false).set(1, true)

  const [solveFor, _] = circuitSolver(gt, connTable)(solution)
  ;[5, 6].map(solveFor)
})
