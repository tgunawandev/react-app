/**
 * Visit Reports Hooks
 * Data fetching hooks for Reports screen
 * Reference: specs/001-sfa-app-build/tasks.md REPORTS-006
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

export interface ActivityBreakdownItem {
  activity_type: string
  total_count: number
  completion_rate: number
  avg_duration: number
}

export interface ActivityBreakdownData {
  breakdown: ActivityBreakdownItem[]
  isLoading: boolean
  error: Error | undefined
}

/**
 * Hook to fetch activity breakdown for a date range
 */
export function useActivityBreakdown(
  salesRep: string,
  startDate: string,
  endDate: string
): ActivityBreakdownData {
  const { data, isLoading, error } = useFrappeGetCall<{
    breakdown: ActivityBreakdownItem[]
    total_activities: number
    total_completed: number
    overall_completion_rate: number
  }>(
    'frm.api.reports.get_activity_breakdown',
    {
      sales_representative: salesRep,
      start_date: startDate,
      end_date: endDate,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  )

  // Convert completion_rate from percentage (0-100) to decimal (0-1) for frontend compatibility
  const breakdown = data?.breakdown?.map(item => ({
    ...item,
    completion_rate: item.completion_rate / 100.0
  })) || []

  return {
    breakdown,
    isLoading,
    error: error as any,
  }
}
