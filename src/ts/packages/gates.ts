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

const drawer = (id: string): Drawer => {
  const paths = [...document.querySelectorAll(`#${id} path`)]
  .map(it => it.attributes.getNamedItem("d")?.value)
  .filter(it => it !== undefined)
  .map(it => new Path2D(it as string))

  return (ctx, {x, y}) => {
    ctx.translate(x - 30, y - 30)
    paths.map(it => ctx.stroke(it))
  }
}

export const GateDrawer = new Map([
  [GateType.IN_TERM, drawer("in")],
  [GateType.OUT_TERM, drawer("out")],
  [GateType.AND, drawer("and")],
  [GateType.OR, drawer("or")],
  [GateType.XOR, drawer("xor")],
  [GateType.NOT, drawer("not")],
  [GateType.NAND, drawer("nand")],
  [GateType.NOR, drawer("nor")],
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
  [GateType.OUT_TERM, ([a]: boolean[]): boolean => a],
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

export type GateTable = Map<number, Gate>
