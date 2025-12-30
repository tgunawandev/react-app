/**
 * useDriverLocation Hook
 * Handles GPS tracking for delivery drivers
 * Reference: Delivery Tracking System Phase 1
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'

// Types for GPS tracking
export interface GPSLogEntry {
  gps_latitude: number
  gps_longitude: number
  gps_accuracy?: number
  speed?: number
  bearing?: number
  event_type: 'started' | 'tracking' | 'ended' | 'geofence_enter' | 'geofence_exit'
  timestamp: string
}

export interface DriverLocation {
  tracking_enabled: boolean
  driver_name?: string
  latitude?: number
  longitude?: number
  last_update?: string
  state?: string
  estimated_arrival?: string
  message?: string
}

export interface GeofenceStatus {
  within_geofence: boolean | null
  distance_meters?: number
  geofence_radius?: number
  customer_latitude?: number
  customer_longitude?: number
  message?: string
}

export interface TrackingOptions {
  /** Update interval in milliseconds (default: 10000 = 10 seconds) */
  updateInterval?: number
  /** High accuracy GPS (uses more battery) */
  highAccuracy?: boolean
  /** Maximum age of cached GPS data in ms */
  maxAge?: number
  /** GPS timeout in ms */
  timeout?: number
  /** Auto-stop when battery is low */
  stopOnLowBattery?: boolean
  /** Low battery threshold percentage */
  lowBatteryThreshold?: number
}

/**
 * Hook for real-time GPS tracking (driver's own location)
 * Sends location updates to server at specified interval
 */
export function useDriverTracking(
  deliveryOrder?: string,
  options: TrackingOptions = {}
) {
  const {
    updateInterval = 10000,
    highAccuracy = true,
    maxAge = 0,
    timeout = 30000,
    stopOnLowBattery = true,
    lowBatteryThreshold = 15
  } = options

  const [isTracking, setIsTracking] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | Error | null>(null)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isSending, setIsSending] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const lastSentRef = useRef<number>(0)

  // API calls
  const { call: updateLocationCall } = useFrappePostCall<{ message: GPSLogEntry }>(
    'frm.api.delivery_tracking.update_gps_location'
  )

  const { call: stopTrackingCall } = useFrappePostCall<{ message: unknown }>(
    'frm.api.delivery_tracking.stop_tracking'
  )

  // Get battery level if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number; addEventListener: (e: string, cb: () => void) => void }> })
        .getBattery()
        .then((battery) => {
          setBatteryLevel(Math.round(battery.level * 100))
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100))
          })
        })
        .catch(() => {
          // Battery API not available
        })
    }
  }, [])

  // Send location to server
  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    if (!deliveryOrder || isSending) return

    // Throttle updates
    const now = Date.now()
    if (now - lastSentRef.current < updateInterval * 0.8) return
    lastSentRef.current = now

    setIsSending(true)
    try {
      await updateLocationCall({
        delivery_order: deliveryOrder,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : null, // m/s to km/h
        bearing: position.coords.heading,
        battery_level: batteryLevel
      })
    } catch (err) {
      console.error('Failed to send location:', err)
      setError(err as Error)
    } finally {
      setIsSending(false)
    }
  }, [deliveryOrder, updateLocationCall, batteryLevel, isSending, updateInterval])

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported'))
      return
    }

    if (!deliveryOrder) {
      setError(new Error('Delivery order is required'))
      return
    }

    setIsTracking(true)
    setError(null)

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position)
        setError(null)

        // Check battery level
        if (stopOnLowBattery && batteryLevel !== null && batteryLevel < lowBatteryThreshold) {
          stopTracking()
          setError(new Error(`Battery low (${batteryLevel}%). Tracking stopped.`))
          return
        }

        // Send to server
        sendLocation(position)
      },
      (err) => {
        setError(err)
        console.error('GPS error:', err)
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: maxAge,
        timeout
      }
    )

    // Also send at regular intervals (backup)
    intervalIdRef.current = setInterval(() => {
      if (currentPosition) {
        sendLocation(currentPosition)
      }
    }, updateInterval)
  }, [
    deliveryOrder,
    highAccuracy,
    maxAge,
    timeout,
    updateInterval,
    sendLocation,
    stopOnLowBattery,
    batteryLevel,
    lowBatteryThreshold,
    currentPosition
  ])

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }

    setIsTracking(false)

    // Notify server
    if (deliveryOrder) {
      try {
        await stopTrackingCall({ delivery_order: deliveryOrder })
      } catch (err) {
        console.error('Failed to stop tracking on server:', err)
      }
    }
  }, [deliveryOrder, stopTrackingCall])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current)
      }
    }
  }, [])

  return {
    isTracking,
    currentPosition,
    latitude: currentPosition?.coords.latitude,
    longitude: currentPosition?.coords.longitude,
    accuracy: currentPosition?.coords.accuracy,
    speed: currentPosition?.coords.speed ? Math.round(currentPosition.coords.speed * 3.6) : null,
    bearing: currentPosition?.coords.heading,
    batteryLevel,
    error,
    isSending,
    startTracking,
    stopTracking
  }
}

/**
 * Hook for viewing driver location (for customers/managers)
 * Polls server for location updates
 */
export function useDriverLocationView(
  deliveryOrder?: string,
  pollInterval: number = 15000
) {
  const shouldFetch = !!deliveryOrder
  const cacheKey = shouldFetch ? `driver-location-${deliveryOrder}` : null

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: DriverLocation }>(
    'frm.api.delivery_tracking.get_driver_location',
    shouldFetch ? { delivery_order: deliveryOrder } : undefined,
    cacheKey,
    {
      revalidateOnFocus: true,
      refreshInterval: shouldFetch ? pollInterval : undefined,
      dedupingInterval: 5000,
      shouldRetryOnError: true,
      errorRetryCount: 2
    }
  )

  return {
    location: data?.message || null,
    isTracking: data?.message?.tracking_enabled || false,
    latitude: data?.message?.latitude,
    longitude: data?.message?.longitude,
    lastUpdate: data?.message?.last_update,
    driverName: data?.message?.driver_name,
    estimatedArrival: data?.message?.estimated_arrival,
    state: data?.message?.state,
    isLoading,
    error: error || null,
    refresh: mutate
  }
}

/**
 * Hook for getting GPS trail for a delivery
 */
export function useDeliveryGPSTrail(
  deliveryOrder?: string,
  limit: number = 100
) {
  const shouldFetch = !!deliveryOrder
  const cacheKey = shouldFetch ? `gps-trail-${deliveryOrder}-${limit}` : null

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: GPSLogEntry[] }>(
    'frm.api.delivery_tracking.get_delivery_gps_trail',
    shouldFetch ? { delivery_order: deliveryOrder, limit } : undefined,
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 30000,
      shouldRetryOnError: true,
      errorRetryCount: 2
    }
  )

  return {
    trail: data?.message || [],
    isLoading,
    error: error || null,
    refresh: mutate
  }
}

/**
 * Hook for checking geofence status
 */
export function useGeofenceCheck() {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { call: checkGeofenceCall } = useFrappePostCall<{ message: GeofenceStatus }>(
    'frm.api.delivery_tracking.check_geofence'
  )

  const checkGeofence = useCallback(async (
    deliveryOrder: string,
    latitude: number,
    longitude: number
  ): Promise<GeofenceStatus | null> => {
    setIsChecking(true)
    setError(null)

    try {
      const response = await checkGeofenceCall({
        delivery_order: deliveryOrder,
        latitude,
        longitude
      })
      setIsChecking(false)
      return response?.message || null
    } catch (err) {
      setIsChecking(false)
      setError(err as Error)
      throw err
    }
  }, [checkGeofenceCall])

  return {
    checkGeofence,
    isChecking,
    error
  }
}

/**
 * Hook for one-time GPS capture (simpler than tracking)
 * Useful for handoff location, etc.
 */
export function useGPSCapture() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)

  const capture = useCallback(async (
    options: PositionOptions = { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
  ): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported') as unknown as GeolocationPositionError
        setError(err)
        reject(err)
        return
      }

      setIsCapturing(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(pos)
          setIsCapturing(false)
          resolve(pos)
        },
        (err) => {
          setError(err)
          setIsCapturing(false)
          reject(err)
        },
        options
      )
    })
  }, [])

  const reset = useCallback(() => {
    setPosition(null)
    setError(null)
    setIsCapturing(false)
  }, [])

  return {
    capture,
    isCapturing,
    position,
    latitude: position?.coords.latitude,
    longitude: position?.coords.longitude,
    accuracy: position?.coords.accuracy,
    error,
    reset
  }
}
