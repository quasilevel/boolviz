import { Gate, GateDrawer, GateTable, GateType } from './packages/gates.js'
import Grid, { Drawer, GridClickEvent } from './packages/grid.js'
import Mouse from './packages/mouse.js'
import SpatialMap from './packages/spatialmap.js'
const $ = document

const canvas = $.querySelector('canvas#boolviz') as HTMLCanvasElement

if (canvas === null) {
  throw new Error("Cannot find <canvas id='boolviz'></canvas>")
}

canvas.width = innerWidth
canvas.height = innerHeight

const mouse = new Mouse()
mouse.attach(canvas)

const gb = new Grid({
  ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
  mouse: mouse,
  boxSize: 100,
})

const gt: GateTable = []

const gateMap = new SpatialMap<number>()
const addGate = ((m: SpatialMap<number>, t: GateTable) => (g: Gate) => {
  t.push(g)
  m.set(g.coord, t.length - 1)
})(gateMap, gt)

const drawGateTable = ((g: Grid) => (table: GateTable) => (
  table.forEach(it => g.drawAt(it.coord, GateDrawer.get(it.type) as Drawer))
))(gb)

type ProgramState = {
  gateAdditionRequest: {
    type: GateType
    cancel: () => void
  } | null
}

const state: ProgramState = {
  gateAdditionRequest: null
}

const frame = (_: number) => {
  requestAnimationFrame(frame)
  gb.ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (state.gateAdditionRequest !== null && !gateMap.has(gb.getCurrentBox())) {
    gb.drawUnderCurrentBox((ctx, {x, y}) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.fillStyle = "black"
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.fill()
      ctx.closePath()
      ctx.restore()
    })
  }

  drawGateTable(gt)
}

requestAnimationFrame(frame)

export const enum AdditionResult {
  Added, Cancelled
}
export const requestGateAddition = (t: GateType): Promise<AdditionResult> => {
  if (state.gateAdditionRequest !== null) {
    state.gateAdditionRequest.cancel()
  }

  let cleanUp: () => void
  const listener = (res: any) => (ev: CustomEvent<GridClickEvent>) => {
    addGate({
      type: t,
      coord: ev.detail.coord,
    })
    res(AdditionResult.Added)

    cleanUp()
  }

  return new Promise<AdditionResult>(res => {
    const l = listener(res)
    cleanUp = () => {
      removeEventListener("grid_click", l as EventListener)
      state.gateAdditionRequest = null
    }

    state.gateAdditionRequest = {
      type: t, cancel: () => {
        res(AdditionResult.Cancelled)
        cleanUp()
      }
    }

    addEventListener("grid_click", l as EventListener)
  })
}

