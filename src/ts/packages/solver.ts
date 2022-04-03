import { GateArgCount, GateSolver, GateTable } from "./gates.js"
import { Connections } from "./connections.js"

export const listInvalidGates = (gt: GateTable, conns: Connections): Map<number, [number, number]> => {
  const invt = conns.table()
  const bad = [...invt.entries()]
  .map(([to, froms]): [number, [number, number]] => [to, [froms.size, GateArgCount.get(gt[to].type) as number]])
  .filter(([_, [actual, expexted]]) => actual !== expexted)
  return new Map(bad)
}

export const circuitSolver = (gt: GateTable, conns: Connections) => {
  const inputmap = conns.table()
  const solveFor = (index: number, solution: Map<number, boolean>): boolean => {
    if (!solution.has(index)) {
      const inputs = inputmap.get(index) as Set<number>
      const invals = [...inputs].map(it => solveFor(it, solution))
      const val = GateSolver.get(gt[index].type)?.(invals)

      if (typeof val === "undefined") {
        throw new Error(`Invalid index in input: ${index}`)
      }

      solution.set(index, val)
      return val
    }

    return solution.get(index) as boolean
  }

  return solveFor
}
