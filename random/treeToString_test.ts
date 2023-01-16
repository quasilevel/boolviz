import { treeToString, type Node } from "./lib.ts"
import { assertEquals } from "https://deno.land/std@0.166.0/testing/asserts.ts"

const root: Node = {
  value: "or",
  right: {
    value: "C",
    left: null,
    right: null,
  },
  left: {
    value: "and",
    left: {
      value: "A",
      left: null,
      right: null,
    },
    right: {
      value: "B",
      left: null,
      right: null,
    }
  }
}

Deno.test("tree is strigyfied correctly", () => {
  const output = treeToString(root)
  assertEquals(output, "((A and B) or C)")
})
