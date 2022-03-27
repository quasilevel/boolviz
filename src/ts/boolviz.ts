import Coord from './packages/coord.js'
import { GateTable, GateType } from './packages/gates.js'
import Grid from './packages/grid.js'
import Mouse from './packages/mouse.js'
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
})

const gt: GateTable = []
gt[0] = {
  type: GateType.IN_TERM,
  coord: new Coord(3, 3)
}

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  gb.drawUnderCurrentBox((ctx, {x, y}) => {
    ctx.beginPath()
    ctx.fillStyle = "black"
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  })

  gt.forEach(it => {
    const {x, y} = gb.absBoxCoord(it.coord)
    const { ctx } = gb
    ctx.beginPath()
    ctx.fillStyle = "pink"
    ctx.arc(x, y, 20, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
  })
}

requestAnimationFrame(frame)
