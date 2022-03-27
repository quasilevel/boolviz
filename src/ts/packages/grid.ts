import Mouse from './mouse.js'
import Coord from './coord.js'

interface GridConfig {
  boxSize?: number
  ctx: CanvasRenderingContext2D
  mouse: Mouse
}

export type Drawer = (ctx: CanvasRenderingContext2D, coord: Coord) => void

export default class Grid {
  ctx: CanvasRenderingContext2D
  boxSize: number
  mouse: Mouse

  constructor({ ctx, mouse, boxSize = 75 }: GridConfig) {
    this.ctx = ctx
    this.mouse = mouse
    this.boxSize = boxSize
  }

  drawAt(c: Coord, d: Drawer) {
    const coord = this.absBoxCoord(c)
    this.ctx.save()
    d(this.ctx, coord)
    this.ctx.restore()
  }

  getCurrentBox(): Coord {
    const { boxSize, mouse: { coord } } = this
    return new Coord(
      Math.floor(coord.x / boxSize), Math.floor(coord.y / boxSize)
    )
  }

  absBoxCoord(c: Coord): Coord {
    const n = c.clone()
    n.mutScale(this.boxSize)
    n.mutAdd(this.boxSize / 2, this.boxSize / 2)
    return n
  }

  drawUnderCurrentBox(drawer: Drawer) {
    const cur = this.absBoxCoord(this.getCurrentBox())
    this.ctx.save()
    drawer(this.ctx, cur)
    this.ctx.restore()
  }

  drawGrid(size: number) {
    const { ctx } = this
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "black"
    ctx.setLineDash([5, 5])
    this._drawGridX(size)
    this._drawGridY(size)
    ctx.closePath()
    ctx.restore()
  }

  _drawGridX(size: number) {
    const { ctx } = this
    const xlen = ctx.canvas.width
    const y = ctx.canvas.height
    const count = Math.floor(xlen / size)

    for (let i = 1; i <= count; i++) {
      const x = i * size
      ctx.moveTo(x, 0)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  _drawGridY(size: number) {
    const { ctx } = this
    const ylen = ctx.canvas.height
    const x = ctx.canvas.width
    const count = Math.floor(ylen / size)

    for (let i = 1; i <= count; i++) {
      const y = i * size
      ctx.moveTo(0, y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }
}
