import imageCompression from "browser-image-compression"

const MAX_WIDTH = 1200
const QUALITY = 0.75
const MAX_SIZE_MB = 0.5

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  try {
    const blob = await imageCompression(file, {
      maxSizeMB: MAX_SIZE_MB,
      maxWidthOrHeight: MAX_WIDTH,
      initialQuality: QUALITY,
      useWebWorker: true,
    })
    if (blob.size >= file.size) return file
    return new File([blob], file.name, { type: blob.type || file.type })
  } catch (err) {
    console.warn("Image compression failed, uploading original:", err)
    return file
  }
}
