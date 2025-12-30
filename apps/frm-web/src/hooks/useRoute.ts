/**
 * Route Management Hook
 * Manages Route Plan CRUD operations using frappe-react-sdk
 * Reference: specs/001-sfa-app-build/tasks.md US3-004
 */

import React from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import type { CustomerLocation, OptimizedCustomer } from '@/services/route-optimizer'

interface RouteFilters {
  date?: string
  date_from?: string
  date_to?: string
  status?: 'Draft' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  limit?: number
  offset?: number
}

interface RouteResponse {
  routes: RoutePlan[]
  total_count: number
  page_size: number
  offset: number
}

interface RoutePlan {
  name: string
  plan_date: string
  sales_representative: string
  status: string
  visits_planned: number
  visits_completed: number
  total_distance_km: number
  estimated_duration_hours: number
  optimization_algorithm: string
  customers?: RouteCustomer[]
}

interface RouteCustomer {
  customer: string
  sequence: number
  visit_status: string
  estimated_arrival_time: string
  actual_check_in_time?: string
  distance_from_previous_km: number
}

interface OptimizeRouteParams {
  customer_ids: string[]
  plan_date: string
  algorithm?: 'nearest_neighbor' | 'tsp_heuristic'
  start_location?: { latitude: number; longitude: number }
  create_route_plan?: boolean
}

interface OptimizeRouteResponse {
  route_plan_id: string | null
  optimized_sequence: OptimizedCustomer[]
  total_distance_km: number
  estimated_duration_hours: number
  algorithm_used: string
  computation_time_ms: number
  distance_saved_km: number
}

/**
 * Hook for fetching user's route plans
 */
export function useMyRoutes(filters?: RouteFilters) {
  const params = new URLSearchParams()

  if (filters?.date) params.append('date', filters.date)
  if (filters?.date_from) params.append('date_from', filters.date_from)
  if (filters?.date_to) params.append('date_to', filters.date_to)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.offset) params.append('offset', filters.offset.toString())

  const { data, error, isLoading, mutate } = useFrappeGetCall<RouteResponse>(
    'frm.api.route.get_my_routes',
    params.toString() ? { ...Object.fromEntries(params) } : undefined,
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    routes: data?.routes || [],
    totalCount: data?.total_count || 0,
    pageSize: data?.page_size || 20,
    offset: data?.offset || 0,
    isLoading,
    error,
    mutate
  }
}

/**
 * Hook for optimizing a route
 */
export function useOptimizeRoute() {
  const { call, loading, error } = useFrappePostCall<OptimizeRouteResponse>(
    'frm.api.route.optimize'
  )

  const optimizeRoute = async (params: OptimizeRouteParams) => {
    return await call({
      customer_ids: params.customer_ids,
      plan_date: params.plan_date,
      algorithm: params.algorithm || 'nearest_neighbor',
      start_location: params.start_location,
      create_route_plan: params.create_route_plan || false
    })
  }

  return {
    optimizeRoute,
    loading,
    error
  }
}

/**
 * Hook for getting nearby customers
 */
export function useNearbyCustomers(
  latitude?: number,
  longitude?: number,
  radius_km: number = 5.0,
  limit: number = 20
) {
  const shouldFetch = latitude !== undefined && longitude !== undefined

  const { data, error, isLoading } = useFrappeGetCall<{
    customers: CustomerLocation[]
    total_count: number
  }>(
    'frm.api.route.get_nearby_customers',
    shouldFetch
      ? {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius_km: radius_km.toString(),
          limit: limit.toString()
        }
      : undefined,
    shouldFetch ? `nearby-customers-${latitude}-${longitude}` : null,
    {
      revalidateOnFocus: false
    }
  )

  return {
    customers: data?.customers || [],
    totalCount: data?.total_count || 0,
    isLoading,
    error
  }
}

/**
 * Hook for getting route progress
 */
export function useRouteProgress(routePlanId?: string) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{
    route_plan: string
    status: string
    progress: {
      visits_planned: number
      visits_completed: number
      visits_pending: number
      completion_percentage: number
    }
    timing: {
      estimated_duration_hours: number
      actual_duration_hours: number | null
      time_saved_hours: number | null
    }
    distance: {
      planned_distance_km: number
      actual_distance_km: number | null
    }
    customers: RouteCustomer[]
  }>(
    'frm.api.route.get_route_progress',
    routePlanId ? { route_plan: routePlanId } : undefined,
    routePlanId ? `route-progress-${routePlanId}` : null,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  )

  return {
    routePlan: data?.route_plan,
    status: data?.status,
    progress: data?.progress,
    timing: data?.timing,
    distance: data?.distance,
    customers: data?.customers || [],
    isLoading,
    error,
    mutate
  }
}

/**
 * Route Plan Detail Interface
 */
export interface RoutePlanDetail {
  route_plan_id: string
  plan_date: string
  sales_representative: string
  status: string
  optimization_algorithm: string
  visits_planned: number
  visits_completed: number
  completion_percentage: number
  total_distance_km: number
  estimated_duration_hours: number
  actual_distance_km: number | null
  customers: RoutePlanDetailCustomer[]
  created_by: string
  creation: string
  modified_by: string
  modified: string
}

export interface RoutePlanDetailCustomer {
  customer: string
  customer_name: string
  sequence: number
  visit_status: string
  estimated_arrival_time: string | null
  actual_check_in_time: string | null
  distance_from_previous_km: number
  sales_visit: string | null
}

/**
 * Hook for fetching route plan detail
 */
export function useRouteDetail(routePlanId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: RoutePlanDetail }>(
    'frm.api.route.get_route_detail',
    routePlanId ? { route_plan_id: routePlanId } : undefined,
    routePlanId ? undefined : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true
    }
  )

  return {
    routePlan: data?.message || null,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Create Route Manual Parameters
 */
export interface CreateRouteManualParams {
  plan_date: string
  customers: { customer: string; sequence: number }[]
  status?: 'Draft' | 'Confirmed'
}

/**
 * Update Route Parameters
 */
export interface UpdateRouteParams {
  route_plan_id: string
  customers?: { customer: string; sequence: number }[]
  status?: 'Draft' | 'Confirmed'
}

/**
 * Hook for route plan mutations (create, update, delete)
 */
export function useRouteMutations() {
  const { call: createCall } = useFrappePostCall<{ message: RoutePlanDetail }>(
    'frm.api.route.create_route_manual'
  )

  const { call: updateCall } = useFrappePostCall<{ message: RoutePlanDetail }>(
    'frm.api.route.update_route'
  )

  const { call: deleteCall } = useFrappePostCall<{ message: { success: boolean; message: string } }>(
    'frm.api.route.delete_route'
  )

  const [isCreating, setIsCreating] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const createRoute = async (params: CreateRouteManualParams) => {
    setIsCreating(true)
    try {
      const response = await createCall({
        plan_date: params.plan_date,
        customers: params.customers,
        status: params.status || 'Draft'
      })
      return response?.message || null
    } finally {
      setIsCreating(false)
    }
  }

  const updateRoute = async (params: UpdateRouteParams) => {
    setIsUpdating(true)
    try {
      const response = await updateCall({
        route_plan_id: params.route_plan_id,
        customers: params.customers,
        status: params.status
      })
      return response?.message || null
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteRoute = async (routePlanId: string) => {
    setIsDeleting(true)
    try {
      const response = await deleteCall({ route_plan_id: routePlanId })
      return response?.message || null
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    createRoute,
    isCreating,
    updateRoute,
    isUpdating,
    deleteRoute,
    isDeleting
  }
}
