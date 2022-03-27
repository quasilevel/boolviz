import Coord from './coord.js'

export default class SpatialMap<T> {
  private m: Map<number, Map<number, T>>

  constructor() {
    this.m = new Map()
  }

  has(c: Coord): boolean {
    return this.m.get(c.x)?.has(c.y) === true
  }

  set(c: Coord, val: T): this {
    if (!this.m.has(c.x)) {
      this.m.set(c.x, new Map([[c.y, val]]))
      return this
    }

    this.m.get(c.x).set(c.y, val)
    return this
  }

  get(c: Coord): T {
    return this.m.get(c.x)?.get(c.y)
  }
}
