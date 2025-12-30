/**
 * useRouteExecution Hook
 * Route-First Architecture - State management for route execution
 * One person + one day = one Route
 */

import { useCallback, useMemo } from 'react'
import { useFrappeGetCall, useFrappePostCall, useSWRConfig } from 'frappe-react-sdk'
import type { Route, RouteStop, ActivityType } from '@/types/frm'

// Stop status types
export type StopStatus = 'pending' | 'arrived' | 'in_progress' | 'completed' | 'skipped' | 'partial' | 'failed'

// Route status types
export type RouteStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

// Stop type
export type StopType = 'Sales Visit' | 'Delivery' | 'Stock Transfer' | 'Pickup' | 'Break'

// API Response types
interface RouteExecutionResponse {
  route: Route | null
  message?: string
}

interface StopUpdateResponse {
  success: boolean
  message: string
  route?: Route
}

interface ActivityTypesResponse {
  activity_types: ActivityType[]
}

// Unplanned stop options
interface UnplannedStopOptions {
  stop_type: StopType
  customer?: string
  warehouse?: string
  location_name?: string
  latitude?: number
  longitude?: number
  insert_after_idx?: number
  notes?: string
}

interface UseRouteExecutionReturn {
  // Data
  route: Route | null
  stops: RouteStop[]
  currentStop: RouteStop | null
  activityTypes: ActivityType[]

  // State
  isLoading: boolean
  isProcessing: boolean
  error: Error | null

  // Computed
  progress: number
  completedStops: number
  totalStops: number
  canStart: boolean
  canEnd: boolean

  // Actions
  refreshRoute: () => void
  startRoute: (latitude?: number, longitude?: number) => Promise<Route>
  endRoute: (latitude?: number, longitude?: number, notes?: string) => Promise<Route>
  updateStopStatus: (stopIdx: number, status: StopStatus, latitude?: number, longitude?: number) => Promise<Route>
  updateStopPOD: (stopIdx: number, options: {
    pod_photo?: string
    pod_signature?: string
    pod_receiver_name?: string
    pod_gps_verified?: boolean
  }) => Promise<Route>
  skipStop: (stopIdx: number, reason: string, notes?: string) => Promise<Route>
  arriveAtStop: (stopIdx: number, latitude: number, longitude: number) => Promise<Route>
  completeStop: (stopIdx: number) => Promise<Route>
  addUnplannedStop: (options: UnplannedStopOptions) => Promise<Route>
  removeUnplannedStop: (stopIdx: number) => Promise<Route>
  reorderStops: (stopOrder: number[]) => Promise<Route>
}

/**
 * Hook for managing route execution state and actions
 */
export function useRouteExecution(): UseRouteExecutionReturn {
  const { mutate } = useSWRConfig()

  // Fetch today's route
  const {
    data: routeData,
    error: routeError,
    isLoading: routeLoading,
    mutate: mutateRoute,
  } = useFrappeGetCall<RouteExecutionResponse>('frm.api.route.get_todays_route', undefined, undefined, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  // Fetch activity types
  const {
    data: activityData,
    error: activityError,
    isLoading: activityLoading,
  } = useFrappeGetCall<ActivityTypesResponse>('frm.api.route.get_activity_types', undefined, undefined, {
    revalidateOnFocus: false,
  })

  // API calls
  const { call: startRouteAPI, loading: startingRoute } = useFrappePostCall<{ message: Route }>('frm.api.route.start_route_execution')
  const { call: endRouteAPI, loading: endingRoute } = useFrappePostCall<{ message: Route }>('frm.api.route.end_route_execution')
  const { call: updateStopAPI, loading: updatingStop } = useFrappePostCall<{ message: Route }>('frm.api.route.update_route_stop_status')
  const { call: updatePODAPI, loading: updatingPOD } = useFrappePostCall<{ message: Route }>('frm.api.route.update_route_stop_pod')
  const { call: addUnplannedStopAPI, loading: addingStop } = useFrappePostCall<{ message: { route: Route } }>('frm.api.route.add_unplanned_stop')
  const { call: removeUnplannedStopAPI, loading: removingStop } = useFrappePostCall<{ message: { route: Route } }>('frm.api.route.remove_unplanned_stop')
  const { call: reorderStopsAPI, loading: reorderingStops } = useFrappePostCall<{ message: { route: Route } }>('frm.api.route.reorder_stops')

  // Extract route data
  // API returns: when route exists -> {message: <route_doc>} where route_doc has 'stops' array
  // API returns: when no route -> {message: {route: null, message: "..."}}
  const routeMessage = routeData?.message as Route | { route: null; message: string } | undefined
  const route = routeMessage && typeof routeMessage === 'object' && 'stops' in routeMessage
    ? (routeMessage as Route)
    : null
  const stops = route?.stops || []
  const activityTypes = activityData?.message?.activity_types || activityData?.activity_types || []

  // Computed values
  const progress = useMemo(() => {
    if (!route || stops.length === 0) return 0
    const completed = stops.filter(s => s.status === 'completed' || s.status === 'skipped').length
    return Math.round((completed / stops.length) * 100)
  }, [route, stops])

  const completedStops = useMemo(() => {
    return stops.filter(s => s.status === 'completed' || s.status === 'skipped').length
  }, [stops])

  const totalStops = stops.length

  const currentStop = useMemo(() => {
    // Find first non-completed stop
    return stops.find(s => s.status !== 'completed' && s.status !== 'skipped') || null
  }, [stops])

  const canStart = useMemo(() => {
    return route !== null && (route.status === 'not_started' || !route.status)
  }, [route])

  const canEnd = useMemo(() => {
    return route !== null && route.status === 'in_progress'
  }, [route])

  const isProcessing = startingRoute || endingRoute || updatingStop || updatingPOD || addingStop || removingStop || reorderingStops

  // Actions
  const refreshRoute = useCallback(() => {
    mutateRoute()
  }, [mutateRoute])

  const startRoute = useCallback(async (latitude?: number, longitude?: number): Promise<Route> => {
    if (!route) throw new Error('No route to start')

    const response = await startRouteAPI({
      route_name: route.name,
      latitude,
      longitude,
    })

    const updatedRoute = response?.message || response
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, startRouteAPI, mutateRoute])

  const endRoute = useCallback(async (latitude?: number, longitude?: number, notes?: string): Promise<Route> => {
    if (!route) throw new Error('No route to end')

    const response = await endRouteAPI({
      route_name: route.name,
      latitude,
      longitude,
      notes,
    })

    const updatedRoute = response?.message || response
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, endRouteAPI, mutateRoute])

  const updateStopStatus = useCallback(async (
    stopIdx: number,
    status: StopStatus,
    latitude?: number,
    longitude?: number
  ): Promise<Route> => {
    if (!route) throw new Error('No route available')

    const response = await updateStopAPI({
      route_name: route.name,
      stop_idx: stopIdx,
      status,
      latitude,
      longitude,
    })

    const updatedRoute = response?.message || response
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, updateStopAPI, mutateRoute])

  const updateStopPOD = useCallback(async (
    stopIdx: number,
    options: {
      pod_photo?: string
      pod_signature?: string
      pod_receiver_name?: string
      pod_gps_verified?: boolean
    }
  ): Promise<Route> => {
    if (!route) throw new Error('No route available')

    const response = await updatePODAPI({
      route_name: route.name,
      stop_idx: stopIdx,
      ...options,
    })

    const updatedRoute = response?.message || response
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, updatePODAPI, mutateRoute])

  const skipStop = useCallback(async (
    stopIdx: number,
    reason: string,
    notes?: string
  ): Promise<Route> => {
    return updateStopStatus(stopIdx, 'skipped')
  }, [updateStopStatus])

  const arriveAtStop = useCallback(async (
    stopIdx: number,
    latitude: number,
    longitude: number
  ): Promise<Route> => {
    return updateStopStatus(stopIdx, 'arrived', latitude, longitude)
  }, [updateStopStatus])

  const completeStop = useCallback(async (stopIdx: number): Promise<Route> => {
    return updateStopStatus(stopIdx, 'completed')
  }, [updateStopStatus])

  const addUnplannedStop = useCallback(async (options: UnplannedStopOptions): Promise<Route> => {
    if (!route) throw new Error('No route available')

    const response = await addUnplannedStopAPI({
      route_name: route.name,
      ...options,
    })

    const updatedRoute = response?.message?.route || response?.route
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, addUnplannedStopAPI, mutateRoute])

  const removeUnplannedStop = useCallback(async (stopIdx: number): Promise<Route> => {
    if (!route) throw new Error('No route available')

    const response = await removeUnplannedStopAPI({
      route_name: route.name,
      stop_idx: stopIdx,
    })

    const updatedRoute = response?.message?.route || response?.route
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, removeUnplannedStopAPI, mutateRoute])

  const reorderStops = useCallback(async (stopOrder: number[]): Promise<Route> => {
    if (!route) throw new Error('No route available')

    const response = await reorderStopsAPI({
      route_name: route.name,
      stop_order: stopOrder,
    })

    const updatedRoute = response?.message?.route || response?.route
    mutateRoute({ message: updatedRoute }, false)
    return updatedRoute
  }, [route, reorderStopsAPI, mutateRoute])

  return {
    // Data
    route,
    stops,
    currentStop,
    activityTypes,

    // State
    isLoading: routeLoading || activityLoading,
    isProcessing,
    error: routeError || activityError || null,

    // Computed
    progress,
    completedStops,
    totalStops,
    canStart,
    canEnd,

    // Actions
    refreshRoute,
    startRoute,
    endRoute,
    updateStopStatus,
    updateStopPOD,
    skipStop,
    arriveAtStop,
    completeStop,
    addUnplannedStop,
    removeUnplannedStop,
    reorderStops,
  }
}

/**
 * Hook for fetching a specific route by name
 */
export function useRoute(routeName: string | null) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useFrappeGetCall<RouteExecutionResponse>(
    routeName ? 'frm.api.route.get_route_execution' : null,
    routeName ? { route_name: routeName } : undefined,
    undefined,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    route: data?.message?.route || data?.route || null,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook for fetching activity types filtered by role or stop type
 */
export function useActivityTypes(role?: string, stopType?: StopType) {
  const params: Record<string, any> = {}
  if (role) params.role = role
  if (stopType) params.stop_type = stopType

  const {
    data,
    error,
    isLoading,
  } = useFrappeGetCall<ActivityTypesResponse>(
    'frm.api.route.get_activity_types',
    Object.keys(params).length > 0 ? params : undefined,
    undefined,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    activityTypes: data?.message?.activity_types || data?.activity_types || [],
    error,
    isLoading,
  }
}
