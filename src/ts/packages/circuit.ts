import { Connections } from "./connections.js"
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
		this.gates = new Map(gates)
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
