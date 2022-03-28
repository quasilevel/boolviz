import Coord from './packages/coord.js'
import { GateDrawer, GateTable, GateType } from './packages/gates.js'
import Grid, { Drawer } from './packages/grid.js'
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


type Gate = {
  type: GateType
  coord: Coord
}
const gateMap = new SpatialMap<number>()
const addGate = ((m: SpatialMap<number>, t: GateTable) => (g: Gate) => {
  t.push(g)
  m.set(g.coord, t.length - 1)
})(gateMap, gt)

addGate({
  type: GateType.IN_TERM,
  coord: new Coord(3, 3)
})

addGate({
  type: GateType.OUT_TERM,
  coord: new Coord(4, 3)
})

addGate({
  type: GateType.NOR,
  coord: new Coord(5, 4)
})

const drawGateTable = ((g: Grid) => (table: GateTable) => (
  table.forEach(it => g.drawAt(it.coord, GateDrawer.get(it.type) as Drawer))
))(gb)

window.addEventListener('grid_click', ((ev: CustomEvent<Gate>) => {
  addGate({
    type: ev.detail.type,
    coord: ev.detail.coord,
  })
}) as EventListener)

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  gateMap.has(gb.getCurrentBox()) || gb.drawUnderCurrentBox((ctx, {x, y}) => {
    ctx.beginPath()
    ctx.fillStyle = "black"
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  })

  drawGateTable(gt)
}

requestAnimationFrame(frame)
