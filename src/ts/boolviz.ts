import { Connections, drawConnections as dc } from './packages/connections.js'
import { Gate, GateDrawer, GateTable, GateType } from './packages/gates.js'
import Grid, { Drawer, GridClickEvent } from './packages/grid.js'
import Mouse from './packages/mouse.js'
import SpatialMap from './packages/spatialmap.js'
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

const drawConnections = dc(gb)(gt)

const connTable = new Connections()
const solution = new Map()

const drawSolution = ((grid: Grid) => (sol: Map<number, boolean>) => {
  ;[...sol]
  .filter(([_, val]) => val)
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

type ProgramState = {
  gateAdditionRequest: {
    type: GateType
    cancel: () => void
  } | null
}

const state: ProgramState = {
  gateAdditionRequest: null
}

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  gb.ctx.lineWidth = 2
  gb.ctx.strokeStyle = "pink"
  const { gateAdditionRequest: gar } = state
  if (gar !== null && !gateMap.has(gb.getCurrentBox())) {
    gb.drawUnderCurrentBox((ctx, coord) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ;(GateDrawer.get(gar.type) as Drawer)(ctx, coord)
      ctx.restore()
    })
  }

  drawGateTable(gt)
  drawConnections(connTable)
  drawSolution(solution)
}

requestAnimationFrame(frame)

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

