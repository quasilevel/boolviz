import Mouse from './mouse.js'
import Coord from './coord.js'

interface GridBoxConfig {
  canvas: HTMLCanvasElement
  boxSize?: number
}

export default class GridBox {
  ctx: CanvasRenderingContext2D
  boxSize: number
  mouse = new Mouse()

  constructor({ canvas, boxSize = 75 }: GridBoxConfig) {
    this.mouse.attach(canvas)
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    this.boxSize = boxSize

    const frame = (_: number) => {
      requestAnimationFrame(frame)
      this.ctx.clearRect(0, 0, canvas.width, canvas.height)
      this.drawGrid(this.boxSize)
      this.markCurrentBox()
    }
    frame(0)
  }

  getCurrentBox(): Coord {
    const { boxSize, mouse: { coord } } = this
    return new Coord(
      Math.floor(coord.x / boxSize), Math.floor(coord.y / boxSize)
    )
  }

  markCurrentBox() {
    const cur = this.getCurrentBox()
    console.log(cur)
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
