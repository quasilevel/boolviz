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
  [GateType.OUT_TERM, drawer("deeppink")],
  [GateType.AND, drawer("#ba2fce")],
  [GateType.OR, drawer("#6552e3")],
  [GateType.XOR, drawer("#d5a840")],
  [GateType.NOT, drawer("#d55c40")],
  [GateType.NAND, drawer("#41e187")],
  [GateType.NOR, drawer("#3accee")],
])

export type Gate = {
  type: GateType
  coord: Coord
}

export type GateTable = Gate[]
