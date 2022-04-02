import Coord from "./coord.js"
import { GateTable } from "./gates.js"
import Grid from "./grid.js"

const CONNECTION_JOIN_GAP = 15 // px

export class Connections {
  private c: Map<number, Set<number>> = new Map()

  add(from: number, to: number) {
    if (!this.c.has(from)) {
      this.c.set(from, new Set())
    }
    this.c.get(from)?.add(to)
  }

  delete(from: number, to: number) {
    this.c.get(from)?.delete(to)
  }

  deleteAll(from: number) {
    this.c.delete(from)
    this.c.forEach(tos => tos.delete(from))
  }

  forEach(callback: (from: number, to: number) => void) {
    this.c.forEach((tos, from) => tos.forEach(to => callback(from, to)))
  }
}

const getCoord = (adjuster: (c: Coord) => Coord) => (gt: GateTable) => (index: number): Coord => {
  const { coord } = gt[index]
  return adjuster(coord)
}

const getAdjustedCoord = (left: boolean) => (g: Grid) => getCoord(c => {
  const rect = g.getGridRect(c)
  return new Coord(
    (left) ? (rect.x + CONNECTION_JOIN_GAP) : (rect.x + rect.w - CONNECTION_JOIN_GAP),
    rect.y + (rect.h / 2)
  )
})

const getFromCoord = getAdjustedCoord(false)
const getToCoord = getAdjustedCoord(true)

export type IndexCoordMapper = (index: number) => Coord

export const getCoordMappers = (g: Grid) => (gt: GateTable) => [getFromCoord(g)(gt), getToCoord(g)(gt)]

export const drawConnection = (
  (ctx: CanvasRenderingContext2D) =>
  (fromCoordMap: IndexCoordMapper, toCoordMap: IndexCoordMapper) =>
  (from: number, to: number) => {
    const [fcoord, tcoord] = [fromCoordMap(from), toCoordMap(to)]
    ctx.beginPath()
    ctx.moveTo(fcoord.x, fcoord.y)
    ctx.bezierCurveTo(fcoord.x, fcoord.y, tcoord.x, tcoord.y, tcoord.x, tcoord.y)
    ctx.stroke()
    ctx.closePath()
  }
)

export const drawConnections = (g: Grid) => (gt: GateTable) => (c: Connections) => {
  const { ctx } = g
  const [gfcoord, gtcoord] = getCoordMappers(g)(gt)
  ctx.save()
  ctx.lineWidth = 2
  ctx.strokeStyle = "pink"
  c.forEach(drawConnection(ctx)(gfcoord, gtcoord))
  ctx.restore()
}
