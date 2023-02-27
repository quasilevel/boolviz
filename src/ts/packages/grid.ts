import Mouse from './mouse.js'
import Coord from './coord.js'

interface GridConfig {
  boxSize?: number
  ctx: CanvasRenderingContext2D
  mouse: Mouse
}

export class GridClickEvent {
  coord: Coord
  constructor(c: Coord) {
    this.coord = c
  }
}

export type GridRect = {
  x: number
  y: number
  w: number
  h: number
}

export type Drawer = (ctx: CanvasRenderingContext2D, coord: Coord) => void
export const drawAll = (...drawers: Drawer[]): Drawer => (ctx, coord) => {
  drawers.forEach(draw => draw(ctx, coord))
}

type Transform = [number, number, number, number, number, number]

export default class Grid {
  ctx: CanvasRenderingContext2D
  boxSize: number
  mouse: Mouse
  #scale: number = 1
  #translate: Coord = new Coord(0, 0)

  constructor({ ctx, mouse, boxSize = 75 }: GridConfig) {
    this.ctx = ctx
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
    this.#translate.mutAdd(ctx.canvas.width / 2, ctx.canvas.height / 2)
    this.mouse = mouse
    this.boxSize = boxSize

    this._addClickListener()
    this._addScrollListner()
  }

  getTransform(): Transform {
    const mat = this.ctx.getTransform()
    return [mat.a, mat.b, mat.c, mat.d, mat.e, mat.f]
  }

  getScale(): number {
    return this.#scale
  }

  getTranslate(): Coord {
    const { e, f } = this.ctx.getTransform()
    return new Coord(e, f)
  }

  getCurrentBox(): Coord {
    const { mouse: { coord }, ctx, boxSize } = this
    const { e: dx, f: dy } = ctx.getTransform()
    const absCoord = coord.add(new Coord(-dx, -dy))
    const size = boxSize * this.getScale()
    absCoord.mutScale(1 / size)
    return new Coord(
      Math.floor(absCoord.x), Math.floor(absCoord.y)
    )
  }

  getTransformedCoord(c: Coord): Coord {
    const { x, y } = this.ctx.getTransform().transformPoint(new DOMPoint(c.x, c.y))
    return new Coord(x, y)
  }

  _addClickListener() {
    this.ctx.canvas.addEventListener('click', () => {
      const ev = new CustomEvent<GridClickEvent>("grid_click", {
        detail: new GridClickEvent(this.getCurrentBox())
      })
      window.dispatchEvent(ev)
    })
  }

  private scale(ds: number) {
    const MAX = 2.5
    const MIN = 0.25
    const DAMP = 1000

    const { mouse: { coord: { x, y } } } = this

   // update the scale
    const previousScale = this.#scale
    const newScale = Math.max(MIN, Math.min(MAX, this.#scale + (ds / DAMP)))
    const k = newScale / previousScale

    this.#scale = newScale


    const transform = this.ctx.getTransform()
    const inverselyTranformedMouseCoord = transform.inverse().transformPoint(new DOMPoint(x, y))

    this.ctx.setTransform(
      transform.scale3d(k, inverselyTranformedMouseCoord.x, inverselyTranformedMouseCoord.y)
    )
  }

  _addScrollListner() {
    const grid = this
    this.ctx.canvas.addEventListener("wheel", ev => {
      ev.preventDefault()
      const inv = -1
      
      if (ev.ctrlKey) {
        this.scale(inv * ev.deltaY)
        dispatchEvent(new CustomEvent("zooming"))
        return
      }

      const dx = ev.deltaX * inv / 10 * (1 / this.#scale)
      const dy = ev.deltaY * inv / 10 * (1 / this.#scale)
      grid.ctx.translate(dx, dy)
      grid.#translate.mutAdd(dx, dy)

      dispatchEvent(new CustomEvent("panning"))
    })
  }

  getBoundingBox(gridCoord: Coord): DOMRect {
    const coord = gridCoord.clone()
    coord.mutScale(this.boxSize)
    return new DOMRect(coord.x, coord.y, this.boxSize, this.boxSize)
  }

  getTransformedBoundingBox(gridCoord: Coord): DOMRect {
    const coord = gridCoord.clone()
    coord.mutScale(this.boxSize)
    const size = this.boxSize * this.getScale()

    const { x, y } = this.ctx.getTransform().transformPoint(new DOMPoint(coord.x, coord.y))
    return new DOMRect(x, y, size, size)
  }

  drawAt(c: Coord, d: Drawer) {
    const coord = this.absBoxCoord(c)
    this.ctx.save()
    d(this.ctx, coord)
    this.ctx.restore()
  }

  relBoxCoord(coord: Coord): Coord {
    const { boxSize } = this
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

  getGridRect(c: Coord): GridRect {
    const pos = c.clone()
    pos.mutScale(this.boxSize)
    return {
      x: pos.x, y: pos.y,
      w: this.boxSize, h: this.boxSize
    }
  }

  drawUnderCurrentBox(drawer: Drawer) {
    const cur = this.absBoxCoord(this.getCurrentBox())
    this.ctx.save()
    drawer(this.ctx, cur)
    this.ctx.restore()
  }

  drawGrid() {
    const { ctx } = this
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = "black"
    ctx.setLineDash([5, 5])
    this._drawGridX(this.boxSize)
    this._drawGridY(this.boxSize)
    ctx.closePath()
    ctx.restore()
  }

  private _drawGridX(size: number) {
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

  private _drawGridY(size: number) {
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
