import Coord from './coord.js'

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

type Gate = {
  type: GateType
  coord: Coord
}

export type GateTable = Gate[]
