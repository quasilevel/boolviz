export default class Coord {
  x: number = 0
  y: number = 0

  constructor(x: number, y: number) {
    this.x = x, this.y = y
  }

  scale(val: number): Coord {
    return new Coord(
      this.x * val, this.y * val
    )
  }

  add(c: Coord): Coord {
    return new Coord(
      this.x + c.x, this.y + c.y
    )
  }

  mutScale(val: number) {
    this.x *= val
    this.y *= val
  }

  mutAdd(x: number, y: number) {
    this.x += x, this.y += y
  }
}
