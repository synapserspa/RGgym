// Genera los iconos PNG de la PWA sin dependencias (rasterizador mínimo + zlib).
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

function icon(size, maskable) {
  const px = Buffer.alloc(size * size * 4)
  const bg = [10, 10, 10], green = [57, 255, 20]
  const s = size / 512
  // Zona segura: maskable usa ~60% centrado; "any" usa 80%
  const k = maskable ? 0.62 : 0.8
  const rects = [ // mancuerna (coordenadas sobre 512)
    [150, 236, 362, 276], // barra
    [112, 190, 150, 322], // disco izq interior
    [362, 190, 400, 322], // disco der interior
    [78, 214, 112, 298],  // disco izq exterior
    [400, 214, 434, 298], // disco der exterior
  ]
  const inRR = (x, y, r, rad) => {
    const [x0, y0, x1, y1] = r
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    const cx = Math.min(Math.max(x, x0 + rad), x1 - rad), cy = Math.min(Math.max(y, y0 + rad), y1 - rad)
    return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = x / s, ny = y / s
    let col = bg
    if (!maskable && !inRR(nx, ny, [0, 0, 512, 512], 96)) { col = null }
    // transformar al espacio de la mancuerna (escala k respecto al centro)
    const ux = (nx - 256) / k + 256, uy = (ny - 256) / k + 256
    if (col && rects.some((r) => inRR(ux, uy, r, 12))) col = green
    const i = (y * size + x) * 4
    if (!col) { px[i + 3] = 0; continue }
    px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255
  }
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', icon(192, false))
writeFileSync('public/icons/icon-512.png', icon(512, false))
writeFileSync('public/icons/icon-maskable-512.png', icon(512, true))
console.log('Iconos generados')
