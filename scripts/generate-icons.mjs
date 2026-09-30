/**
 * Растрирует public/icon.svg во все размеры для PWA и браузеров.
 * Запуск: node scripts/generate-icons.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = resolve(root, 'public/icon.svg')
const outDir = resolve(root, 'public/icons')

const source = await readFile(srcPath, 'utf8')

/** Символ монограммы без подложки — его переиспользуют варианты иконки. */
const mark = source.match(/<!--mark-->([\s\S]*?)<!--\/mark-->/)?.[1]
if (!mark) throw new Error('В public/icon.svg нет блока <!--mark-->…<!--/mark-->')

const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${body}</svg>`

/** Квадрат без скруглений: iOS и Android скругляют сами. */
const squareSvg = wrap(`<rect width="512" height="512" fill="#1A1A17"/>${mark}`)

/** Maskable: символ уезжает в safe zone 80%, подложка во весь квадрат. */
const maskableSvg = wrap(
  `<rect width="512" height="512" fill="#1A1A17"/>` +
    `<g transform="translate(256 256) scale(0.8) translate(-256 -256)">${mark}</g>`,
)

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toBuffer()

/** Многоразмерный ICO: контейнер из PNG-кадров. */
function buildIco(frames) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(frames.length, 4)

  let offset = 6 + frames.length * 16
  const entries = frames.map(({ size, data }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2) // палитра не используется
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4) // плоскости
    e.writeUInt16LE(32, 6) // бит на пиксель
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)])
}

await mkdir(outDir, { recursive: true })

const write = async (name, data) => {
  await writeFile(resolve(outDir, name), data)
  console.log(`${name} — ${(data.length / 1024).toFixed(1)} КБ`)
}

await write('favicon.svg', Buffer.from(source))
await write('icon-192.png', await png(source, 192))
await write('icon-512.png', await png(source, 512))
await write('icon-maskable-512.png', await png(maskableSvg, 512))
await write('apple-touch-icon.png', await png(squareSvg, 180))

const icoSizes = [16, 32, 48]
await write(
  'favicon.ico',
  buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(source, size) })))),
)
