/**
 * useGPS Hook
 * React hook for GPS position capture with state management
 * Reference: specs/001-sfa-app-build/tasks.md US1-020
 */

import { useState, useCallback } from 'react'
import { getCurrentPosition, checkPermission, type GPSPosition, type GPSError } from '@/services/gps'

interface UseGPSState {
  position: GPSPosition | null
  isLoading: boolean
  error: GPSError | null
  hasPermission: boolean | null
}

interface UseGPSReturn extends UseGPSState {
  capture: (minAccuracy?: number) => Promise<GPSPosition>
  checkPermission: () => Promise<boolean>
  reset: () => void
}

/**
 * Hook for GPS position capture with real-time accuracy display
 *
 * @returns UseGPSReturn - GPS state and control functions
 *
 * @example
 * ```tsx
 * const { position, isLoading, error, capture } = useGPS()
 *
 * const handleCapture = async () => {
 *   try {
 *     const pos = await capture(50) // Require <50m accuracy
 *     console.log('GPS captured:', pos)
 *   } catch (err) {
 *     console.error('GPS error:', err)
 *   }
 * }
 * ```
 */
export function useGPS(): UseGPSReturn {
  const [state, setState] = useState<UseGPSState>({
    position: null,
    isLoading: false,
    error: null,
    hasPermission: null
  })

  /**
   * Capture current GPS position
   *
   * @param minAccuracy - Minimum required accuracy in meters (default: 50)
   * @returns Promise<GPSPosition> - Captured position
   */
  const capture = useCallback(async (minAccuracy: number = 50): Promise<GPSPosition> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const position = await getCurrentPosition(minAccuracy)

      setState(prev => ({
        ...prev,
        position,
        isLoading: false,
        error: null,
        hasPermission: true
      }))

      return position
    } catch (error) {
      const gpsError = error as GPSError

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: gpsError,
        hasPermission: gpsError.code === 1 ? false : prev.hasPermission
      }))

      throw gpsError
    }
  }, [])

  /**
   * Check GPS permission status
   *
   * @returns Promise<boolean> - true if permission granted
   */
  const checkGPSPermission = useCallback(async (): Promise<boolean> => {
    const hasPermission = await checkPermission()

    setState(prev => ({
      ...prev,
      hasPermission
    }))

    return hasPermission
  }, [])

  /**
   * Reset GPS state
   */
  const reset = useCallback(() => {
    setState({
      position: null,
      isLoading: false,
      error: null,
      hasPermission: null
    })
  }, [])

  return {
    ...state,
    capture,
    checkPermission: checkGPSPermission,
    reset
  }
}
