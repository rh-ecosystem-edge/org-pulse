const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const BUNDLE_PATHS = [
  '/app/data/releases-bundle.json.gz',
  './data/releases-bundle.json.gz'
]

try {
  const bundlePath = BUNDLE_PATHS.find(p => fs.existsSync(p))
  if (!bundlePath) {
    console.log('[decompress-bundle] No releases-bundle.json.gz found, skipping')
  } else {
    const start = Date.now()
    const compressed = fs.readFileSync(bundlePath)
    const raw = zlib.gunzipSync(compressed)
    const bundle = JSON.parse(raw.toString())

    let count = 0
    for (const [key, data] of Object.entries(bundle)) {
      var outPath = path.join('./data', key)

      const dir = path.dirname(outPath)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
      count++
    }

    const elapsed = Date.now() - start
    console.log(`[decompress-bundle] Extracted ${count} files from ${bundlePath} in ${elapsed}ms`)
  }
} catch (err) {
  console.error('[decompress-bundle] Failed to decompress bundle:', err.message)
}
