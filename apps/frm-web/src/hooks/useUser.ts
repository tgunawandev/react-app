/**
 * User Hook
 * Fetch and manage current user's profile and role
 * Reference: specs/001-sfa-app-build/tasks.md HOME-007
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

// User Role types for field operations
export type UserRole = 'Sales Rep' | 'Delivery Driver' | 'Hub Driver' | 'Sales Admin' | 'Delivery Admin'

// User profile returned from API
export interface UserProfile {
  name?: string
  user_name?: string
  full_name?: string
  email?: string
  sfa_role?: UserRole  // Backend DB field is still called sfa_role
  operating_unit?: string
  default_warehouse?: string
  vehicle?: string
  mobile_number?: string
  is_sfa_user: boolean  // Backend DB field is still called is_sfa_user
}

/**
 * Hook to fetch current user's profile
 */
export function useUser() {
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: UserProfile | null }>(
    'frm.api.user.get_current_sfa_user',  // Backend API endpoint unchanged
    undefined,
    'current-user',
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  return {
    user: data?.message || null,
    isLoading,
    error,
    mutate
  }
}

/**
 * Check if user has a sales-related role
 */
export function isSalesRole(role?: UserRole | null): boolean {
  return role === 'Sales Rep' || role === 'Sales Admin'
}

/**
 * Check if user has a delivery-related role
 */
export function isDeliveryRole(role?: UserRole | null): boolean {
  return role === 'Delivery Driver' || role === 'Hub Driver' || role === 'Delivery Admin'
}

/**
 * Check if user is a Hub Driver specifically
 */
export function isHubDriver(role?: UserRole | null): boolean {
  return role === 'Hub Driver'
}

/**
 * Check if user has an admin role
 */
export function isAdminRole(role?: UserRole | null): boolean {
  return role === 'Sales Admin' || role === 'Delivery Admin'
}

/**
 * Dashboard stats hook - fetches role-appropriate stats
 */
export function useDashboardStats() {
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: Record<string, any> }>(
    'frm.api.user.get_user_dashboard_stats',
    undefined,
    'user-dashboard-stats',
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute
    }
  )

  return {
    stats: data?.message || null,
    isLoading,
    error,
    mutate
  }
}
