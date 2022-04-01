import Coord from './packages/coord.js'
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

addGate({
  type: GateType.IN_TERM, coord: new Coord(4, 3)
})
addGate({
  type: GateType.AND, coord: new Coord(6, 3)
})
addGate({
  type: GateType.OUT_TERM, coord: new Coord(8, 3)
})

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
  const { gateAdditionRequest: gar } = state
  if (gar !== null && !gateMap.has(gb.getCurrentBox())) {
    gb.drawUnderCurrentBox((ctx, coord) => {
      ctx.save()
      ctx.globalAlpha = 0.4
      ;(GateDrawer.get(gar.type) as Drawer)(ctx, coord)
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

