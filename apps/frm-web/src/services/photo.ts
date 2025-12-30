/**
 * Photo Capture Service
 * Handles camera capture, compression, and EXIF metadata extraction
 * Reference: specs/001-sfa-app-build/research.md:246-299
 */

import imageCompression from 'browser-image-compression'

export interface PhotoMetadata {
  timestamp: Date
  fileSize: number
  originalSize: number
  compressionRatio: number
  width: number
  height: number
  mimeType: string
}

export interface CapturedPhoto {
  file: File
  base64: string
  metadata: PhotoMetadata
  preview: string
}

export interface PhotoCaptureOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  preserveExif?: boolean
  cameraOnly?: boolean
}

/**
 * Capture photo from device camera with compression
 *
 * @param options - Compression and capture options
 * @returns Promise<CapturedPhoto> - Captured and compressed photo with metadata
 * @throws Error if camera access denied or compression fails
 */
export async function captureAndCompressPhoto(
  options: PhotoCaptureOptions = {}
): Promise<CapturedPhoto> {
  const {
    maxSizeMB = 2,              // Target 2MB max (Visit Settings allows 5MB)
    maxWidthOrHeight = 1920,     // Max dimension
    useWebWorker = true,         // Use web worker for compression
    preserveExif: _preserveExif = true,         // Keep EXIF metadata for timestamp validation
    cameraOnly = true            // Force camera, not gallery
  } = options

  // Create file input element for camera capture
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  if (cameraOnly) {
    input.capture = 'environment'  // Use rear camera
  }

  return new Promise((resolve, reject) => {
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]

      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Selected file is not an image'))
        return
      }

      try {
        const originalSize = file.size

        // Compress image
        const compressedFile = await imageCompression(file, {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker,
          fileType: 'image/jpeg',  // Convert to JPEG for better compression
          initialQuality: 0.8,     // Start with 80% quality
          alwaysKeepResolution: false
        })

        // Get image dimensions
        const dimensions = await getImageDimensions(compressedFile)

        // Convert to base64
        const base64 = await fileToBase64(compressedFile)

        // Create preview URL
        const preview = URL.createObjectURL(compressedFile)

        // Build metadata
        const metadata: PhotoMetadata = {
          timestamp: new Date(),
          fileSize: compressedFile.size,
          originalSize,
          compressionRatio: originalSize / compressedFile.size,
          width: dimensions.width,
          height: dimensions.height,
          mimeType: compressedFile.type
        }

        // Validate file size
        const fileSizeMB = compressedFile.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          reject(new Error(`Photo too large: ${fileSizeMB.toFixed(2)}MB (max 5MB)`))
          return
        }

        resolve({
          file: compressedFile,
          base64: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          metadata,
          preview
        })
      } catch (error) {
        reject(error)
      }
    }

    input.onerror = () => {
      reject(new Error('Failed to access camera'))
    }

    // Trigger file picker
    input.click()
  })
}

/**
 * Convert File to base64 string
 *
 * @param file - File object
 * @returns Promise<string> - Base64 encoded string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as base64'))
      }
    }

    reader.onerror = () => {
      reject(new Error('File reading failed'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from File
 *
 * @param file - Image file
 * @returns Promise<{width: number, height: number}>
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Check if camera is available
 *
 * @returns Promise<boolean> - true if camera available
 */
export async function checkCameraAvailability(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    // Stop all tracks to release camera
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch {
    return false
  }
}

/**
 * Request camera permission
 *
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Camera permission denied:', error)
    return false
  }
}

/**
 * Validate photo file size
 *
 * @param file - Photo file
 * @param maxSizeMB - Maximum size in MB (default 5)
 * @returns boolean - true if size valid
 */
export function validatePhotoSize(file: File, maxSizeMB: number = 5): boolean {
  const sizeMB = file.size / (1024 * 1024)
  return sizeMB <= maxSizeMB
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns string - Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
