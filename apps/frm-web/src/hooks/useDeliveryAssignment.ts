/**
 * useDeliveryAssignment Hook
 * Handles delivery assignment operations for drivers
 * Reference: Delivery Tracking System Phase 1
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'

// Types for delivery assignments
export interface DeliveryAssignment {
  name: string
  delivery_order: string
  driver: string
  driver_name?: string
  assignment_type: 'original' | 'handoff' | 'reassign'
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected' | 'handed_off'
  sequence_number?: number
  estimated_arrival_time?: string
  actual_arrival_time?: string
  start_time?: string
  end_time?: string
  start_latitude?: number
  start_longitude?: number
  end_latitude?: number
  end_longitude?: number
  rejection_reason?: string
  handoff_from_assignment?: string
  handoff_to_hub?: string
  handoff_notes?: string
  assigned_by?: string
  assigned_at?: string
  creation?: string
  modified?: string
}

export interface DeliveryForAssignment {
  name: string
  customer: string
  customer_name: string
  delivery_date: string
  state: string
  current_driver?: string
  current_driver_name?: string
  current_assignment?: string
  estimated_delivery_time?: string
  tracking_enabled?: boolean
  odoo_name?: string
  location_id?: string
  pod_required?: boolean
  pod_status?: string
  item_count?: number
  status?: string
  sequence_number?: number
}

export interface DeliveriesResponse {
  deliveries: DeliveryForAssignment[]
  total_count: number
}

export interface TransitHub {
  name: string
  hub_name: string
  hub_code: string
  hub_type: 'warehouse' | 'cross_dock' | 'transit_point'
  gps_latitude?: number
  gps_longitude?: number
  geofence_radius?: number
  address?: string
  city?: string
  contact_person?: string
  contact_phone?: string
  distance_km?: number
}

// Hook params
export interface UsePendingDeliveriesParams {
  driver?: string
  date?: string
  status?: string
  limit?: number
  offset?: number
}

export interface UseAvailableDeliveriesParams {
  date?: string
  limit?: number
  offset?: number
}

/**
 * Hook for getting pending deliveries assigned to a driver
 */
export function usePendingDeliveries({
  driver,
  date,
  status,
  limit = 50,
  offset = 0
}: UsePendingDeliveriesParams = {}) {
  const cacheKey = `pending-deliveries-${driver || 'me'}-${date || 'today'}-${status || 'all'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: DeliveriesResponse }>(
    'frm.api.delivery_tracking.get_pending_deliveries',
    { driver, date, status, limit, offset },
    cacheKey,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 30000, // 30 seconds
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const deliveries = data?.message?.deliveries || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    deliveries,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for getting available deliveries (unassigned)
 */
export function useAvailableDeliveries({
  date,
  limit = 50,
  offset = 0
}: UseAvailableDeliveriesParams = {}) {
  const cacheKey = `available-deliveries-${date || 'all'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: DeliveriesResponse }>(
    'frm.api.delivery_tracking.get_available_deliveries',
    { date, limit, offset },
    cacheKey,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 30000,
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const deliveries = data?.message?.deliveries || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    deliveries,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for assignment mutations (assign, accept, reject, handoff, start)
 */
export function useDeliveryAssignmentMutations() {
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isHandingOff, setIsHandingOff] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Assign delivery to driver
  const { call: assignCall } = useFrappePostCall<{ message: DeliveryAssignment }>(
    'frm.api.delivery_tracking.assign_delivery'
  )

  const assignDelivery = useCallback(async (
    deliveryOrder: string,
    driver: string,
    estimatedArrival?: string,
    sequenceNumber?: number
  ): Promise<DeliveryAssignment | null> => {
    setIsAssigning(true)
    setError(null)

    try {
      const response = await assignCall({
        delivery_order: deliveryOrder,
        driver,
        estimated_arrival: estimatedArrival,
        sequence_number: sequenceNumber || 1
      })
      setIsAssigning(false)
      return response?.message || null
    } catch (err) {
      setIsAssigning(false)
      setError(err as Error)
      throw err
    }
  }, [assignCall])

  // Accept assignment
  const { call: acceptCall } = useFrappePostCall<{ message: DeliveryAssignment }>(
    'frm.api.delivery_tracking.accept_assignment'
  )

  const acceptAssignment = useCallback(async (
    assignmentId: string
  ): Promise<DeliveryAssignment | null> => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await acceptCall({ assignment_id: assignmentId })
      setIsAccepting(false)
      return response?.message || null
    } catch (err) {
      setIsAccepting(false)
      setError(err as Error)
      throw err
    }
  }, [acceptCall])

  // Reject assignment
  const { call: rejectCall } = useFrappePostCall<{ message: DeliveryAssignment }>(
    'frm.api.delivery_tracking.reject_assignment'
  )

  const rejectAssignment = useCallback(async (
    assignmentId: string,
    reason?: string
  ): Promise<DeliveryAssignment | null> => {
    setIsRejecting(true)
    setError(null)

    try {
      const response = await rejectCall({
        assignment_id: assignmentId,
        reason
      })
      setIsRejecting(false)
      return response?.message || null
    } catch (err) {
      setIsRejecting(false)
      setError(err as Error)
      throw err
    }
  }, [rejectCall])

  // Handoff to another driver
  const { call: handoffCall } = useFrappePostCall<{ message: DeliveryAssignment }>(
    'frm.api.delivery_tracking.handoff_delivery'
  )

  const handoffDelivery = useCallback(async (
    assignmentId: string,
    newDriver: string,
    hubId?: string,
    notes?: string,
    gpsLatitude?: number,
    gpsLongitude?: number
  ): Promise<DeliveryAssignment | null> => {
    setIsHandingOff(true)
    setError(null)

    try {
      const response = await handoffCall({
        assignment_id: assignmentId,
        new_driver: newDriver,
        hub_id: hubId,
        notes,
        gps_latitude: gpsLatitude,
        gps_longitude: gpsLongitude
      })
      setIsHandingOff(false)
      return response?.message || null
    } catch (err) {
      setIsHandingOff(false)
      setError(err as Error)
      throw err
    }
  }, [handoffCall])

  // Start delivery
  const { call: startCall } = useFrappePostCall<{ message: DeliveryAssignment }>(
    'frm.api.delivery_tracking.start_delivery'
  )

  const startDelivery = useCallback(async (
    assignmentId: string,
    gpsLatitude?: number,
    gpsLongitude?: number,
    gpsAccuracy?: number
  ): Promise<DeliveryAssignment | null> => {
    setIsStarting(true)
    setError(null)

    try {
      const response = await startCall({
        assignment_id: assignmentId,
        gps_latitude: gpsLatitude,
        gps_longitude: gpsLongitude,
        gps_accuracy: gpsAccuracy
      })
      setIsStarting(false)
      return response?.message || null
    } catch (err) {
      setIsStarting(false)
      setError(err as Error)
      throw err
    }
  }, [startCall])

  return {
    assignDelivery,
    isAssigning,
    acceptAssignment,
    isAccepting,
    rejectAssignment,
    isRejecting,
    handoffDelivery,
    isHandingOff,
    startDelivery,
    isStarting,
    error
  }
}

/**
 * Hook for getting transit hubs
 */
export function useTransitHubs(hubType?: string, activeOnly: boolean = true) {
  const cacheKey = `transit-hubs-${hubType || 'all'}-${activeOnly}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: TransitHub[] }>(
    'frm.api.delivery_tracking.get_transit_hubs',
    { hub_type: hubType, active_only: activeOnly },
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 300000, // 5 minutes - hubs don't change often
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  return {
    hubs: data?.message || [],
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for getting nearby transit hubs
 */
export function useNearbyHubs(
  latitude?: number,
  longitude?: number,
  radiusKm: number = 10
) {
  const shouldFetch = latitude !== undefined && longitude !== undefined
  const cacheKey = shouldFetch
    ? `nearby-hubs-${latitude}-${longitude}-${radiusKm}`
    : null

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: TransitHub[] }>(
    'frm.api.delivery_tracking.get_nearby_hubs',
    shouldFetch ? { latitude, longitude, radius_km: radiusKm } : undefined,
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
      shouldRetryOnError: true,
      errorRetryCount: 2
    }
  )

  return {
    hubs: data?.message || [],
    isLoading: shouldFetch ? isLoading : false,
    error: error || null,
    mutate
  }
}
