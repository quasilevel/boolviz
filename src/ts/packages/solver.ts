import { Gate, GateArgCount, GateSolver, GateTable } from "./gates.js"
import { Connections } from "./connections.js"

export const listInvalidGates = (gt: GateTable, conns: Connections): Map<number, [number, number]> => {
  const invt = conns.invert().table()
  const bad = [...invt.entries()]
  .map(([to, froms]): [number, [number, number]] => [to, [froms.size, GateArgCount.get((gt.get(to) as Gate).type) as number]])
  .filter(([_, [actual, expexted]]) => actual !== expexted)
  return new Map(bad)
}

export const circuitSolver = 
(gt: GateTable, output: Connections) => 
(solution: Map<number, boolean>): [(_i: number) => boolean, (_i: number, _b: boolean) => void] => {
  const outmap = output.table()
  const inputmap = output.invert().table()
  const solveIndex = (index: number): boolean => {
    const inputs = inputmap.get(index) as Set<number>
    const invals = [...inputs].map(it => solveFor(it))
    const val = GateSolver.get((gt.get(index) as Gate).type)?.(invals)
    if (typeof val === "undefined") {
      throw new Error(`Invalid index in input: ${index}`)
    }
    return val
  }

  const solveFor = (index: number): boolean => {
    if (!solution.has(index)) {
      const val = solveIndex(index)
      solution.set(index, val)
      return val
    }

    return solution.get(index) as boolean
  }

  const updateFor = (index: number, newval: boolean) => {
    solution.set(index, newval)

    if (!outmap.has(index)) {
      return
    }

    const outs = [...(outmap.get(index) as Set<number>)]
    .map((idx): [number, boolean] => [idx, solveIndex(idx)])
    .filter(([idx, nv]) => solution.get(idx) !== nv)

    outs.map(([idx, nv]) => updateFor(idx, nv))
  }

  return [solveFor, updateFor]
}
