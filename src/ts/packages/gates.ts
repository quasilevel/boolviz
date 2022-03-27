import Coord from './coord.js'
import { Drawer } from './grid.js'

export enum GateType {
  IN_TERM = 'input terminal',
  OUT_TERM = 'output terminal',
  AND = 'and',
  OR = 'or',
  XOR = 'xor',
  NOT = 'not',
  NAND = 'nand',
  NOR = 'nor',
}

const drawer: (_: string) => Drawer = (color: string) => (ctx, {x, y}) => {
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.arc(x, y, 20, 0, 2 * Math.PI)
  ctx.fill()
  ctx.closePath()
}

export const GateDrawer = new Map([
  [GateType.IN_TERM, drawer("pink")],
  [GateType.OUT_TERM, drawer("pink")],
  [GateType.AND, drawer("pink")],
  [GateType.OR, drawer("pink")],
  [GateType.XOR, drawer("pink")],
  [GateType.NOT, drawer("pink")],
  [GateType.NAND, drawer("pink")],
  [GateType.NOR, drawer("pink")],
])

type Gate = {
  type: GateType
  coord: Coord
}

export type GateTable = Gate[]
