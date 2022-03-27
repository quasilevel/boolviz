const $ = document

const canvas = $.querySelector('canvas#boolviz')

canvas.width = innerWidth
canvas.height = innerHeight

console.table({width: canvas.width, height: canvas.height})
