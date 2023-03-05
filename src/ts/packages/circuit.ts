import { Connections } from "./connections.js"
import Coord from "./coord.js"
import { Gate, GateTable } from "./gates.js"

type Index = number

export type CircuitInitArg = {
	gates: [Index, Gate][],
	connections: [Index, Index[]][]
}

export class Circuit {
	gates: GateTable
	connections: Connections
	constructor({ gates, connections }: CircuitInitArg) {
		this.gates = new Map(gates.map(
			([idx, rawGate]) => [idx, {
				...rawGate,
				coord: new Coord(rawGate.coord.x, rawGate.coord.y)
			}]
		))
		this.connections = new Connections(connections)
	}

	static Default(): Circuit {
		return new Circuit({
			gates: [], connections: [] // FIXME make sure that this default matches with Connections's default
		})
	}

	asPlain(): CircuitInitArg {
		return {
			gates: [...this.gates],
			connections: this.connections.asPlain()
		}
	}
}
