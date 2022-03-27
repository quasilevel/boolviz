interface GridBoxConfig {
  canvas: HTMLCanvasElement
}

const gridSize = 75

export default class GridBox {
  ctx: CanvasRenderingContext2D
  constructor({ canvas }: GridBoxConfig) {
    console.log(canvas)
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    this.drawGrid(gridSize)
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
