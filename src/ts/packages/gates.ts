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

export const GateArgCount = new Map([
  [GateType.IN_TERM, 0],
  [GateType.OUT_TERM, 1],
  [GateType.AND, 2],
  [GateType.OR, 2],
  [GateType.XOR, 2],
  [GateType.NOT, 1],
  [GateType.NAND, 2],
  [GateType.NOR, 2],
])

export const GateSolver = new Map([
  [GateType.AND, ([a, b]: boolean[]): boolean => a && b],
  [GateType.OR, ([a, b]: boolean[]): boolean => a || b],
  [GateType.XOR, ([a, b]: boolean[]): boolean => a !== b],
  [GateType.NOT, ([a]: boolean[]): boolean => !a],
  [GateType.NAND, ([a, b]: boolean[]): boolean => !(a && b)],
  [GateType.NOR, ([a, b]: boolean[]): boolean => !(a || b)],
])

export type Gate = {
  type: GateType
  coord: Coord
}

export type GateTable = Gate[]
