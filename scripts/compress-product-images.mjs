#!/usr/bin/env node
// Compresses every image in the `product-images` Supabase Storage bucket.
//
// Usage:
//   node --env-file=.env.local scripts/compress-product-images.mjs --dry-run
//   node --env-file=.env.local scripts/compress-product-images.mjs
//
// Env vars required (in .env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (Settings → API → service_role secret)
//
// Flags:
//   --dry-run         Compress 10 random files into ./preview/ for visual QA. Bucket untouched.
//   --concurrency=N   Files processed in parallel (default 3).
//   --max-width=N     Resize to this width if larger (default 1200).
//   --quality=N       Output quality 1-100 (default 75).

import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { mkdir, writeFile, readFile, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

const BUCKET = "product-images"
const BACKUP_DIR = "./backup-originales"
const PREVIEW_DIR = "./preview"
const PROGRESS_FILE = "./compress-progress.json"

const args = process.argv.slice(2)
const isDryRun = args.includes("--dry-run")
const concurrency = parseInt(args.find(a => a.startsWith("--concurrency="))?.split("=")[1] ?? "3", 10)
const maxWidth = parseInt(args.find(a => a.startsWith("--max-width="))?.split("=")[1] ?? "1200", 10)
const quality = parseInt(args.find(a => a.startsWith("--quality="))?.split("=")[1] ?? "75", 10)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.")
  console.error("Run with: node --env-file=.env.local scripts/compress-product-images.mjs")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function listAllFiles() {
  const files = []
  let offset = 0
  const pageSize = 100
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    })
    if (error) throw error
    if (!data || data.length === 0) break
    files.push(...data.filter(f => f.name && !f.name.endsWith("/")))
    if (data.length < pageSize) break
    offset += pageSize
  }
  return files
}

function pickEncoder(ext) {
  const e = ext.toLowerCase().replace(".", "")
  if (e === "jpg" || e === "jpeg") return { fmt: "jpeg", opts: { quality, mozjpeg: true } }
  if (e === "png") return { fmt: "png", opts: { quality, compressionLevel: 9, palette: true } }
  if (e === "webp") return { fmt: "webp", opts: { quality: Math.min(quality + 5, 90) } }
  return null
}

async function compressBuffer(buffer, ext) {
  const encoder = pickEncoder(ext)
  if (!encoder) return null
  // .rotate() auto-orients based on EXIF then strips the EXIF orientation tag,
  // so the pixels end up in the visually-correct orientation.
  let pipeline = sharp(buffer, { failOn: "none" }).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
  })
  pipeline = pipeline[encoder.fmt](encoder.opts)
  return pipeline.toBuffer()
}

async function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return { done: [] }
  try {
    return JSON.parse(await readFile(PROGRESS_FILE, "utf8"))
  } catch {
    return { done: [] }
  }
}

async function saveProgress(progress) {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function processFile(file, { dryRun }) {
  const name = file.name
  const ext = path.extname(name)
  if (!pickEncoder(ext)) {
    return { name, status: "skipped", reason: `unsupported ext ${ext}` }
  }

  const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(name)
  if (dlError) return { name, status: "error", reason: `download: ${dlError.message}` }
  const original = Buffer.from(await blob.arrayBuffer())

  const compressed = await compressBuffer(original, ext)
  if (!compressed) return { name, status: "skipped", reason: "encoder returned null" }

  if (compressed.length >= original.length) {
    return { name, status: "skipped-already-small", original: original.length, compressed: compressed.length }
  }

  if (dryRun) {
    await mkdir(PREVIEW_DIR, { recursive: true })
    await writeFile(path.join(PREVIEW_DIR, `original-${name}`), original)
    await writeFile(path.join(PREVIEW_DIR, `compressed-${name}`), compressed)
    return { name, status: "preview", original: original.length, compressed: compressed.length }
  }

  await mkdir(BACKUP_DIR, { recursive: true })
  const backupPath = path.join(BACKUP_DIR, name)
  if (!existsSync(backupPath)) {
    await writeFile(backupPath, original)
  }

  const contentType = file.metadata?.mimetype
    || (ext.toLowerCase() === ".png" ? "image/png"
      : ext.toLowerCase() === ".webp" ? "image/webp"
      : "image/jpeg")

  const { error: upError } = await supabase.storage.from(BUCKET).upload(name, compressed, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  })
  if (upError) return { name, status: "error", reason: `upload: ${upError.message}` }

  return { name, status: "ok", original: original.length, compressed: compressed.length }
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
  console.log("Listing files in bucket...")
  const all = await listAllFiles()
  console.log(`Found ${all.length} files.`)

  const progress = isDryRun ? { done: [] } : await loadProgress()
  const doneSet = new Set(progress.done)
  const pending = all.filter(f => !doneSet.has(f.name))
  console.log(`Already processed: ${doneSet.size}. Pending: ${pending.length}.`)

  let queue = pending
  if (isDryRun) {
    queue = [...pending].sort(() => Math.random() - 0.5).slice(0, 10)
    console.log(`Dry run: picking ${queue.length} random files for preview at ${PREVIEW_DIR}/`)
  }

  let okCount = 0
  let skipCount = 0
  let errCount = 0
  let totalOriginal = 0
  let totalCompressed = 0
  let processed = 0

  await runChunked(queue, concurrency, async (file) => {
    const result = await processFile(file, { dryRun: isDryRun })
    processed++
    if (result.status === "ok" || result.status === "preview") {
      okCount++
      totalOriginal += result.original
      totalCompressed += result.compressed
      const savings = ((1 - result.compressed / result.original) * 100).toFixed(1)
      console.log(`[${processed}/${queue.length}] ${result.name}: ${formatBytes(result.original)} -> ${formatBytes(result.compressed)} (-${savings}%)`)
      if (!isDryRun) {
        progress.done.push(result.name)
        if (progress.done.length % 20 === 0) await saveProgress(progress)
      }
    } else if (result.status === "error") {
      errCount++
      console.log(`[${processed}/${queue.length}] ${result.name}: ERROR - ${result.reason}`)
    } else {
      skipCount++
      console.log(`[${processed}/${queue.length}] ${result.name}: skipped (${result.reason ?? "already small"})`)
      if (!isDryRun && result.status === "skipped-already-small") {
        progress.done.push(result.name)
      }
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
    console.log(`Open ${PREVIEW_DIR}/ to compare originals vs compressed.`)
    console.log("If they look good, run again WITHOUT --dry-run.")
  } else {
    console.log("")
    console.log(`Backups saved at ${BACKUP_DIR}/`)
    console.log(`Progress log at ${PROGRESS_FILE} (delete it to reprocess from scratch).`)
  }
}

main().catch(err => {
  console.error("Fatal error:", err)
  process.exit(1)
})
