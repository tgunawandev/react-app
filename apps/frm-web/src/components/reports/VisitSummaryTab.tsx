/**
 * Visit Summary Tab Component
 * Modern card-based layout showing visit details
 * Reference: specs/001-sfa-app-build/tasks.md REPORTS-003
 */

import { useState } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import type { DateRangeValue } from './DateRangeFilter'

interface VisitSummaryTabProps {
  dateRange: DateRangeValue
}

export default function VisitSummaryTab({ dateRange }: VisitSummaryTabProps) {
  const [page, setPage] = useState(1)
  const limit = 20

  const startDate = format(dateRange.from, 'yyyy-MM-dd')
  const endDate = format(dateRange.to, 'yyyy-MM-dd')

  // Use our whitelisted method with correct pagination parameters
  const { data: visits, isLoading, error } = useFrappeGetCall<{message: any[]}>(
    'frm.api.reports.get_visits_for_reports',
    {
      start_date: startDate,
      end_date: endDate,
      limit: 100  // Fixed: backend expects 'limit' parameter
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  )

  // Client-side pagination - extract data from API response format
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const visitData = Array.isArray(visits?.message) ? visits.message : (Array.isArray(visits) ? visits : [])
  const visitList = visitData.slice(startIndex, endIndex)
  const totalCount = visitData.length

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
        <p>Failed to load visit data</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (!visitList || visitList.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No visits found</p>
        <p className="text-sm">Try adjusting the date range or create your first visit</p>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Completed':
        return {
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-primary text-primary-foreground hover:bg-primary/10'
        }
      case 'In Progress':
        return {
          variant: 'secondary' as const,
          icon: AlertCircle,
          className: 'bg-muted text-foreground hover:bg-primary/10'
        }
      case 'Cancelled':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-destructive/10 text-destructive hover:bg-destructive/10'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          className: ''
        }
    }
  }

  return (
    <div className="space-y-4">
      {/* Visit Cards Grid */}
      <div className="grid gap-3">
        {visitList.map((visit: any) => {
          const statusConfig = getStatusConfig(visit.status)
          const StatusIcon = statusConfig.icon

          return (
            <Card key={visit.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section - Main Info */}
                  <div className="flex-1 space-y-2">
                    {/* Customer Name */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-base">
                        {visit.customer || 'Unknown Customer'}
                      </span>
                    </div>

                    {/* Date and Time Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {/* Date */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {visit.visit_date ? format(new Date(visit.visit_date), 'MMM dd, yyyy') : '-'}
                        </span>
                      </div>

                      {/* Check-in Time */}
                      {visit.check_in_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-primary font-medium">
                            {format(new Date(visit.check_in_time), 'HH:mm')}
                          </span>
                        </div>
                      )}

                      {/* Check-out Time */}
                      {visit.check_out_time && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="text-foreground font-medium">
                              {format(new Date(visit.check_out_time), 'HH:mm')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Territory (if available) */}
                    {visit.territory && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{visit.territory}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Status Badge */}
                  <div className="shrink-0">
                    <Badge className={`flex items-center gap-1.5 ${statusConfig.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {visit.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      <Card className="border-t">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span>-
              <span className="font-medium text-foreground">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="font-medium text-foreground">{totalCount}</span> visits
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-sm bg-muted/50">
                <span className="text-muted-foreground">Page</span>
                <span className="font-semibold">{page}</span>
                <span className="text-muted-foreground">of</span>
                <span className="font-semibold">{Math.ceil(totalCount / limit)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= totalCount}
                className="gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
