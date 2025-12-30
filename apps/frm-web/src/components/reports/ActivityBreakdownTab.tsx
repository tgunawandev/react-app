/**
 * Activity Breakdown Tab Component
 * Aggregated table showing activity type metrics
 * Reference: specs/001-sfa-app-build/tasks.md REPORTS-004
 */

import { useActivityBreakdown } from '@/hooks/useVisitReports'
import { useFrappeAuth } from 'frappe-react-sdk'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRangeValue } from './DateRangeFilter'

interface ActivityBreakdownTabProps {
  dateRange: DateRangeValue
}

export default function ActivityBreakdownTab({ dateRange }: ActivityBreakdownTabProps) {
  const { currentUser } = useFrappeAuth()
  const startDate = format(dateRange.from, 'yyyy-MM-dd')
  const endDate = format(dateRange.to, 'yyyy-MM-dd')

  const { breakdown, isLoading, error } = useActivityBreakdown(
    (currentUser as any)?.email || '',
    startDate,
    endDate
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load activity breakdown</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No activities found</p>
        <p className="text-sm">Complete some visits to see activity breakdown</p>
      </div>
    )
  }

  // Calculate totals for footer
  const totalCount = breakdown.reduce((sum, item) => sum + item.total_count, 0)
  const avgCompletionRate =
    breakdown.reduce((sum, item) => sum + item.completion_rate, 0) / breakdown.length
  const avgDuration =
    breakdown.reduce((sum, item) => sum + item.avg_duration * item.total_count, 0) / totalCount

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-primary'
    if (rate >= 60) return 'text-secondary-foreground'
    return 'text-destructive'
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity Type</TableHead>
              <TableHead className="text-right">Total Count</TableHead>
              <TableHead className="text-right">Completion Rate</TableHead>
              <TableHead className="text-right">Avg Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.activity_type}</TableCell>
                <TableCell className="text-right">{item.total_count}</TableCell>
                <TableCell className="text-right">
                  <span className={`font-medium ${getCompletionColor(item.completion_rate)}`}>
                    {Math.round(item.completion_rate * 100)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">{formatDuration(item.avg_duration)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Summary</TableCell>
              <TableCell className="text-right font-bold">{totalCount}</TableCell>
              <TableCell className="text-right font-bold">
                <span className={getCompletionColor(avgCompletionRate)}>
                  {Math.round(avgCompletionRate * 100)}%
                </span>
              </TableCell>
              <TableCell className="text-right font-bold">{formatDuration(avgDuration)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total Activities</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
          <p className={`text-2xl font-bold ${getCompletionColor(avgCompletionRate)}`}>
            {Math.round(avgCompletionRate * 100)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Avg Duration</p>
          <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
        </div>
      </div>
    </div>
  )
}
