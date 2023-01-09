import { generateRandomCircuit } from "./lib.ts";

console.log(generateRandomCircuit({
	depth: 2,
	operators: {
		"and": 2,
		"or": 1
	},
	operands: ["A", "B"]
}))
