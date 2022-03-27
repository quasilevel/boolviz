import Coord from './coord.js'

export default class Mouse {
  coord: Coord = new Coord(0, 0)
  attach(el: HTMLElement) {
    el.onmousemove = (ev) => {
      this.coord.x = ev.x, this.coord.y = ev.y
    }
  }
}
