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

type ProgramState = {
  gateAdditionRequest: GateType | null
}

const state: ProgramState = {
  gateAdditionRequest: null
}

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (state.gateAdditionRequest !== null && !gateMap.has(gb.getCurrentBox())) {
    gb.drawUnderCurrentBox((ctx, {x, y}) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.fillStyle = "black"
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()
      ctx.restore()
    })
  }

  drawGateTable(gt)
}

requestAnimationFrame(frame)

type RequestCanceler = () => void
export const requestGateAddition = (t: GateType): RequestCanceler => {
  state.gateAdditionRequest = t
  let cancel: RequestCanceler
  const listener = (ev: CustomEvent<GridClickEvent>) => {
    addGate({
      type: t,
      coord: ev.detail.coord,
    })

    cancel()
  }

  cancel = () => {
    removeEventListener("grid_click", listener as EventListener)
    state.gateAdditionRequest = null
  }
  addEventListener("grid_click", listener as EventListener)
  return cancel
}

requestGateAddition(GateType.NOR)
