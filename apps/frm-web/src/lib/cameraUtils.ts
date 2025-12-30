/**
 * Camera Utilities
 * Helper functions for camera access and management
 * Reference: specs/001-sfa-app-build/tasks.md SCAN-007
 */

export interface CameraPermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
}

/**
 * Request camera permission from the user
 * Returns permission state
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  try {
    // Check if permissions API is available
    if (!navigator.permissions) {
      return { granted: false, denied: false, prompt: true }
    }

    const result = await navigator.permissions.query({ name: 'camera' as PermissionName })

    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt'
    }
  } catch (error) {
    console.error('Error checking camera permission:', error)
    return { granted: false, denied: false, prompt: true }
  }
}

/**
 * Check if camera is available on this device
 */
export async function checkCameraAvailability(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    const cameras = devices.filter(device => device.kind === 'videoinput')

    return cameras.length > 0
  } catch (error) {
    console.error('Error checking camera availability:', error)
    return false
  }
}

/**
 * Get camera stream with specified constraints
 */
export async function getCameraStream(
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> {
  // Check if MediaDevices API is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Camera API not available. Please use HTTPS or update your browser.'
    )
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })

    return stream
  } catch (error) {
    console.error('Error getting camera stream:', error)

    // Provide more specific error messages
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied. Please allow camera access.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found on this device.')
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.')
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Camera does not meet the requirements.')
      } else if (error.name === 'SecurityError') {
        throw new Error('Camera access requires HTTPS connection.')
      }
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to access camera. Please check permissions.'
    )
  }
}

/**
 * Deactivate camera stream and release resources
 */
export function deactivateCameraStream(stream: MediaStream | null): void {
  if (!stream) return

  try {
    stream.getTracks().forEach(track => {
      track.stop()
    })
  } catch (error) {
    console.error('Error deactivating camera stream:', error)
  }
}

/**
 * Capture frame from video element as base64 data URL
 */
export function captureVideoFrame(videoElement: HTMLVideoElement): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error capturing video frame:', error)
    return null
  }
}
