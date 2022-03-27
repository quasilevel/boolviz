interface GridBoxConfig {
  canvas: HTMLCanvasElement
}
export default class GridBox {
  constructor({ canvas }: GridBoxConfig) {
    console.log(canvas)
  }
}
