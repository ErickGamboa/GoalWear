#!/usr/bin/env node
// Re-processes images from ./backup-originales/ applying EXIF auto-rotation,
// fixing photos that ended up sideways after the first compression run.
//
// Usage:
//   node --env-file=.env.local scripts/fix-image-orientation.mjs --dry-run
//   node --env-file=.env.local scripts/fix-image-orientation.mjs
//
// Reads from local backups (NOT from the bucket — bucket already has the broken versions).
// Uploads the corrected versions back to Supabase Storage, overwriting.

import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { mkdir, writeFile, readFile, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

const BUCKET = "product-images"
const BACKUP_DIR = "./backup-originales"
const PREVIEW_DIR = "./preview-fix"
const PROGRESS_FILE = "./fix-orientation-progress.json"

const args = process.argv.slice(2)
const isDryRun = args.includes("--dry-run")
const concurrency = parseInt(args.find(a => a.startsWith("--concurrency="))?.split("=")[1] ?? "3", 10)
const maxWidth = parseInt(args.find(a => a.startsWith("--max-width="))?.split("=")[1] ?? "1200", 10)
const quality = parseInt(args.find(a => a.startsWith("--quality="))?.split("=")[1] ?? "75", 10)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.")
  process.exit(1)
}

if (!existsSync(BACKUP_DIR)) {
  console.error(`Backup directory not found: ${BACKUP_DIR}`)
  console.error("This script needs the originals from the first compression run.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

function pickEncoder(ext) {
  const e = ext.toLowerCase().replace(".", "")
  if (e === "jpg" || e === "jpeg") return { fmt: "jpeg", opts: { quality, mozjpeg: true }, mime: "image/jpeg" }
  if (e === "png") return { fmt: "png", opts: { quality, compressionLevel: 9, palette: true }, mime: "image/png" }
  if (e === "webp") return { fmt: "webp", opts: { quality: Math.min(quality + 5, 90) }, mime: "image/webp" }
  return null
}

async function processBuffer(buffer, ext) {
  const encoder = pickEncoder(ext)
  if (!encoder) return null
  // .rotate() auto-orients from EXIF and strips the tag.
  let pipeline = sharp(buffer, { failOn: "none" }).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
  })
  pipeline = pipeline[encoder.fmt](encoder.opts)
  const out = await pipeline.toBuffer()
  return { buffer: out, mime: encoder.mime }
}

async function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return { done: [] }
  try { return JSON.parse(await readFile(PROGRESS_FILE, "utf8")) } catch { return { done: [] } }
}
async function saveProgress(progress) {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function processFile(name, { dryRun }) {
  const ext = path.extname(name)
  if (!pickEncoder(ext)) return { name, status: "skipped", reason: `unsupported ext ${ext}` }

  const localPath = path.join(BACKUP_DIR, name)
  const original = await readFile(localPath)

  // Check EXIF orientation. If the original was already correctly oriented
  // (orientation 1 or missing), the current bucket version is fine.
  const meta = await sharp(original, { failOn: "none" }).metadata()
  const needsRotation = meta.orientation && meta.orientation !== 1
  if (!needsRotation && !dryRun) {
    return { name, status: "skipped", reason: "no rotation needed (already correct in bucket)" }
  }

  const result = await processBuffer(original, ext)
  if (!result) return { name, status: "skipped", reason: "encoder returned null" }

  if (dryRun) {
    await mkdir(PREVIEW_DIR, { recursive: true })
    await writeFile(path.join(PREVIEW_DIR, `original-${name}`), original)
    await writeFile(path.join(PREVIEW_DIR, `fixed-${name}`), result.buffer)
    return {
      name,
      status: "preview",
      original: original.length,
      compressed: result.buffer.length,
      orientation: meta.orientation ?? "none",
    }
  }

  const { error: upError } = await supabase.storage.from(BUCKET).upload(name, result.buffer, {
    contentType: result.mime,
    upsert: true,
    cacheControl: "31536000",
  })
  if (upError) return { name, status: "error", reason: `upload: ${upError.message}` }

  return { name, status: "ok", original: original.length, compressed: result.buffer.length }
}

async function runChunked(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    await Promise.all(chunk.map(fn))
  }
}

async function main() {
  console.log(`Mode: ${isDryRun ? "DRY RUN (preview only, bucket untouched)" : "FULL RUN (will overwrite bucket files)"}`)
  console.log(`Settings: maxWidth=${maxWidth}px quality=${quality} concurrency=${concurrency}`)
  console.log(`Reading from: ${BACKUP_DIR}`)

  const all = (await readdir(BACKUP_DIR)).filter(n => !n.startsWith("."))
  console.log(`Found ${all.length} backup files.`)

  const progress = isDryRun ? { done: [] } : await loadProgress()
  const doneSet = new Set(progress.done)
  const pending = all.filter(n => !doneSet.has(n))
  console.log(`Already fixed: ${doneSet.size}. Pending: ${pending.length}.`)

  let queue = pending
  if (isDryRun) {
    console.log(`Scanning EXIF orientation of ${pending.length} files to find rotated ones...`)
    const affected = []
    let scanned = 0
    for (const name of pending) {
      scanned++
      if (scanned % 200 === 0) console.log(`  scanned ${scanned}/${pending.length}...`)
      try {
        const buf = await readFile(path.join(BACKUP_DIR, name))
        const m = await sharp(buf, { failOn: "none" }).metadata()
        if (m.orientation && m.orientation !== 1) {
          affected.push({ name, orientation: m.orientation })
          if (affected.length >= 30) break
        }
      } catch {}
    }
    console.log(`Found ${affected.length} files with EXIF rotation (scanned ${scanned}).`)
    queue = affected.sort(() => Math.random() - 0.5).slice(0, 10).map(a => a.name)
    if (queue.length === 0) {
      console.log("No rotated files found in backups — your bucket is already correctly oriented.")
      console.log("Nothing to fix. You can skip the full run.")
      return
    }
    console.log(`Dry run: picking ${queue.length} affected files for preview at ${PREVIEW_DIR}/`)
  }

  let okCount = 0
  let skipCount = 0
  let errCount = 0
  let totalOriginal = 0
  let totalCompressed = 0
  let processed = 0

  await runChunked(queue, concurrency, async (name) => {
    const result = await processFile(name, { dryRun: isDryRun })
    processed++
    if (result.status === "ok" || result.status === "preview") {
      okCount++
      totalOriginal += result.original
      totalCompressed += result.compressed
      const savings = ((1 - result.compressed / result.original) * 100).toFixed(1)
      const orient = result.orientation !== undefined ? ` [exif:${result.orientation}]` : ""
      console.log(`[${processed}/${queue.length}] ${name}: ${formatBytes(result.original)} -> ${formatBytes(result.compressed)} (-${savings}%)${orient}`)
      if (!isDryRun) {
        progress.done.push(name)
        if (progress.done.length % 20 === 0) await saveProgress(progress)
      }
    } else if (result.status === "error") {
      errCount++
      console.log(`[${processed}/${queue.length}] ${name}: ERROR - ${result.reason}`)
    } else {
      skipCount++
      console.log(`[${processed}/${queue.length}] ${name}: skipped (${result.reason})`)
    }
  })

  if (!isDryRun) await saveProgress(progress)

  console.log("")
  console.log("=== Summary ===")
  console.log(`Processed: ${okCount}`)
  console.log(`Skipped:   ${skipCount}`)
  console.log(`Errors:    ${errCount}`)
  if (totalOriginal > 0) {
    const totalSavings = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1)
    console.log(`Total before: ${formatBytes(totalOriginal)}`)
    console.log(`Total after:  ${formatBytes(totalCompressed)}`)
    console.log(`Savings:      ${totalSavings}%`)
  }
  if (isDryRun) {
    console.log("")
    console.log(`Open ${PREVIEW_DIR}/ to confirm fixed images are correctly rotated.`)
  }
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
