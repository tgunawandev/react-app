/**
 * Recent Visits Hook
 * Fetch last 3 completed sales visits for current user
 * Reference: specs/001-sfa-app-build/tasks.md HOME-008
 */

import { useFrappeGetDocList } from 'frappe-react-sdk'

export interface RecentVisit {
  name: string
  customer: string
  customer_name?: string
  completion_time?: string
  status: string
  compliance_score?: number
  activities_completed_count?: string
}

export interface RecentVisitsData {
  visits: RecentVisit[]
  isLoading: boolean
  error: Error | undefined
}

/**
 * Hook to fetch last 3 completed sales visits
 */
export function useRecentVisits(): RecentVisitsData {
  const { data, isLoading, error } = useFrappeGetDocList<any>(
    'Sales Visit',
    {
      fields: [
        'name',
        'customer',
        'check_out_time',
        'status',
      ] as any,
      filters: [
        ['docstatus', '=', 1], // Only submitted visits
        ['status', '=', 'Completed'],
      ],
      orderBy: {
        field: 'check_out_time',
        order: 'desc',
      },
      limit: 3,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  )

  return {
    visits: (data || []).map((visit: any) => ({
      name: visit.name,
      customer: visit.customer,
      customer_name: visit.customer_name || visit.customer,
      completion_time: visit.check_out_time || visit.completion_time || '',
      status: visit.status,
      compliance_score: visit.compliance_score || 0,
      activities_completed_count: visit.activities_completed_count || '0/0',
    })),
    isLoading,
    error: error as any,
  }
}

/**
 * Utility function to format completion time as relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Utility function to get compliance indicator color
 */
export function getComplianceColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}
