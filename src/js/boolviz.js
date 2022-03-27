import GridBox from './packages/gridbox.js'
const $ = document

const canvas = $.querySelector('canvas#boolviz')

canvas.width = innerWidth
canvas.height = innerHeight

const gb = new GridBox({
  canvas: canvas,
})

console.log(gb)
