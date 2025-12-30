/**
 * Route Progress Hook
 * Fetch today's route plan and calculate completion progress
 * Reference: specs/001-sfa-app-build/tasks.md HOME-007
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

export interface RouteProgressData {
  visitedCount: number
  totalCount: number
  progress: number
  estimatedRemainingTime: string
  routePlanName: string | null
  isLoading: boolean
  error: Error | undefined
}

/**
 * Hook to fetch today's route plan and calculate progress
 */
export function useRouteProgress(): RouteProgressData {
  // Fetch today's route plan using the route progress API
  const { data, isLoading, error } = useFrappeGetCall<{
    route_plan: string
    total_customers: number
    visited_customers: number
    in_progress_customers: number
    pending_customers: number
    completion_percentage: number
    estimated_remaining_time_minutes: number
    actual_duration_minutes: number
  }>(
    'frm.api.route.get_route_progress',
    {
      // Note: This expects route_plan parameter, but we need to fetch today's route first
      // For now, we'll fetch the route plan separately
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      shouldRetryOnError: false,
    }
  )

  // Calculate estimated remaining time
  const estimatedMinutes = data?.estimated_remaining_time_minutes || 0
  const hours = Math.floor(estimatedMinutes / 60)
  const minutes = estimatedMinutes % 60
  const estimatedRemainingTime =
    hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`

  return {
    visitedCount: data?.visited_customers || 0,
    totalCount: data?.total_customers || 0,
    progress: data?.completion_percentage || 0,
    estimatedRemainingTime: estimatedMinutes > 0 ? estimatedRemainingTime : 'No estimate',
    routePlanName: data?.route_plan || null,
    isLoading,
    error: error as any,
  }
}

/**
 * Route stop interface from Route doctype
 */
interface RouteStop {
  idx: number
  sequence: number
  stop_type: string
  stop_name: string
  customer?: string
  status: string
  actual_arrival?: string
  actual_departure?: string
}

/**
 * Route document interface from Route doctype
 */
interface RouteDocument {
  name: string
  route_date: string
  assigned_user: string
  user_role: string
  status: string
  operating_unit?: string
  total_stops?: number
  completed_stops?: number
  progress_percentage?: number
  start_time?: string
  end_time?: string
  stops: RouteStop[]
}

/**
 * Hook to fetch today's route using get_todays_route API
 * This queries the Route doctype (daily execution instance)
 */
export function useTodayRoute() {
  // Fetch today's route using get_todays_route API
  const { data, isLoading, error } = useFrappeGetCall<{
    message: RouteDocument | { route: null; message: string }
  }>(
    'frm.api.route.get_todays_route',
    undefined,
    'today-route',
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 30000
    }
  )

  // Handle case where no route exists for today
  const routeData = data?.message
  const route = routeData && 'stops' in routeData ? routeData : null

  if (!route) {
    return {
      visitedCount: 0,
      totalCount: 0,
      progress: 0,
      estimatedRemainingTime: 'No route planned',
      routePlanName: null,
      isLoading,
      error: error as Error | undefined,
    }
  }

  // Calculate progress from stops
  const totalStops = route.stops?.length || 0
  const completedStops = route.stops?.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length || 0

  // Calculate estimated remaining time (30 minutes per stop average)
  const remainingStops = totalStops - completedStops
  const estimatedMinutes = remainingStops * 30
  const hours = Math.floor(estimatedMinutes / 60)
  const minutes = estimatedMinutes % 60
  const estimatedRemainingTime =
    hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`

  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0

  return {
    visitedCount: completedStops,
    totalCount: totalStops,
    progress: Math.round(progress),
    estimatedRemainingTime: remainingStops > 0 ? estimatedRemainingTime : 'Route complete',
    routePlanName: route.name,
    routeStatus: route.status,
    isLoading,
    error: error as Error | undefined,
  }
}

/**
 * Hook to fetch today's full route data for hero card display
 * Returns the complete Route document with all stops
 */
export function useTodayRouteData() {
  // Fetch today's route using get_todays_route API
  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: RouteDocument | { route: null; message: string }
  }>(
    'frm.api.route.get_todays_route',
    undefined,
    'today-route-full',
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 5000,  // Reduced from 30s to 5s for faster updates
      refreshInterval: 10000   // Auto-refresh every 10 seconds
    }
  )

  // Handle case where no route exists for today
  const routeData = data?.message
  const route = routeData && 'stops' in routeData ? routeData : null

  return {
    route,
    isLoading,
    error: error as Error | undefined,
    mutate  // Expose mutate for manual refresh
  }
}
