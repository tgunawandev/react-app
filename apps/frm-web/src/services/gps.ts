/**
 * GPS Capture Service
 * Uses Geolocation API for high-accuracy positioning
 * Reference: specs/001-sfa-app-build/research.md:145-186
 */

export interface GPSPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface GPSError {
  code: number
  message: string
}

/**
 * Get current GPS position with high accuracy
 *
 * @param minAccuracy - Minimum required accuracy in meters (default: 50)
 * @returns Promise<GPSPosition> - GPS coordinates with accuracy and timestamp
 * @throws GPSError - If position cannot be obtained or accuracy is insufficient
 */
export async function getCurrentPosition(minAccuracy: number = 50): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      } as GPSError)
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,  // Request GPS hardware for best accuracy
      timeout: 10000,            // 10 second timeout
      maximumAge: 0              // Don't use cached positions
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        // Check if accuracy meets minimum requirement
        if (accuracy > minAccuracy) {
          reject({
            code: 1,
            message: `GPS accuracy too low: ${accuracy.toFixed(1)}m (required: <${minAccuracy}m). Please wait for better signal.`
          } as GPSError)
          return
        }

        resolve({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        // Map GeolocationPositionError to GPSError
        const errorMessages: Record<number, string> = {
          1: 'Location permission denied. Please enable location access in your browser settings.',
          2: 'Location information is unavailable. Please check your device settings.',
          3: 'Location request timed out. Please try again.'
        }

        reject({
          code: error.code,
          message: errorMessages[error.code] || error.message
        } as GPSError)
      },
      options
    )
  })
}

/**
 * Watch GPS position with continuous updates
 * Useful for real-time tracking or route planning
 *
 * @param callback - Called on each position update
 * @param errorCallback - Called on errors
 * @param minAccuracy - Minimum required accuracy in meters
 * @returns watchId - Can be used to stop watching with clearWatch()
 */
export function watchPosition(
  callback: (position: GPSPosition) => void,
  errorCallback: (error: GPSError) => void,
  minAccuracy: number = 50
): number {
  if (!navigator.geolocation) {
    errorCallback({
      code: 0,
      message: 'Geolocation is not supported by this browser'
    })
    return -1
  }

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords

      if (accuracy <= minAccuracy) {
        callback({
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        })
      }
    },
    (error) => {
      const errorMessages: Record<number, string> = {
        1: 'Location permission denied',
        2: 'Location unavailable',
        3: 'Location timeout'
      }

      errorCallback({
        code: error.code,
        message: errorMessages[error.code] || error.message
      })
    },
    options
  )
}

/**
 * Stop watching GPS position
 *
 * @param watchId - The ID returned by watchPosition()
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation && watchId >= 0) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Check if geolocation is available and user has granted permission
 *
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function checkPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false
  }

  // Check if Permissions API is available
  if (!navigator.permissions) {
    // Fallback: try to get position
    try {
      await getCurrentPosition(1000) // Very lenient accuracy for permission check
      return true
    } catch {
      return false
    }
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state === 'granted'
  } catch {
    return false
  }
}
