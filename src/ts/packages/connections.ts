export class Connections {
  private c: Map<number, Set<number>> = new Map()

  add(from: number, to: number) {
    if (!this.c.has(from)) {
      this.c.set(from, new Set())
    }
    this.c.get(from).add(to)
  }

  delete(from: number, to: number) {
    this.c.get(from)?.delete(to)
  }

  deleteAll(from: number) {
    this.c.delete(from)
    this.c.forEach(tos => tos.delete(from))
  }

  forEach(callback: (from: number, to: number) => void) {
    this.c.forEach((tos, from) => tos.forEach(to => callback(from, to)))
  }
}
