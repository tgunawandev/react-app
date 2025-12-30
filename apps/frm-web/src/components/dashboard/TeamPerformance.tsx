/**
 * TeamPerformance Component
 * Shows per-SR performance metrics with sortable table
 * Reference: specs/001-sfa-app-build/tasks.md US2-006
 */

import { useState, useMemo } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

interface TeamPerformanceProps {
  dateRange: {
    date_from: string
    date_to: string
  }
}

type SortField = 'full_name' | 'total_visits' | 'total_orders' | 'total_order_value' | 'avg_compliance_score' | 'order_conversion_rate'
type SortDirection = 'asc' | 'desc'

interface SRPerformance {
  sales_representative: string
  full_name: string
  total_visits: number
  completed_visits: number
  total_orders: number
  total_order_value: number
  order_conversion_rate: number
  avg_compliance_score: number
  compliance_rate: number
}

export function TeamPerformance({ dateRange }: TeamPerformanceProps) {
  const [sortField, setSortField] = useState<SortField>('total_visits')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedSR, setSelectedSR] = useState<string | null>(null)

  // Fetch team metrics
  const { data: metricsData, isLoading } = useFrappeGetCall<{ message: any }>(
    'frm.api.dashboard.get_team_metrics',
    {
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
      group_by: 'day'
    },
    'team-performance-metrics',
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )

  const performanceData = metricsData?.message?.by_sales_representative || []

  // Sort data based on current sort settings
  const sortedData = useMemo(() => {
    if (!performanceData.length) return []

    return [...performanceData].sort((a: SRPerformance, b: SRPerformance) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle string comparison for names
      if (sortField === 'full_name') {
        aValue = (aValue || '').toString().toLowerCase()
        bValue = (bValue || '').toString().toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [performanceData, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Loading performance data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!performanceData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>No performance data available for the selected period</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>
          Individual sales representative metrics for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="full_name">Sales Representative</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="total_visits">Visits</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="total_orders">Orders</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="order_conversion_rate">Conversion</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="total_order_value">Revenue</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="avg_compliance_score">Compliance</SortButton>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((sr: SRPerformance) => (
              <TableRow
                key={sr.sales_representative}
                className="cursor-pointer"
                onClick={() => setSelectedSR(sr.sales_representative === selectedSR ? null : sr.sales_representative)}
              >
                <TableCell className="font-medium">
                  <div>
                    <div>{sr.full_name}</div>
                    <div className="text-xs text-muted-foreground">{sr.sales_representative}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{sr.total_visits}</span>
                    <span className="text-xs text-muted-foreground">
                      {sr.completed_visits} completed
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {sr.total_orders}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {sr.order_conversion_rate >= 50 ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                    )}
                    <span>{sr.order_conversion_rate.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${sr.total_order_value.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    sr.avg_compliance_score >= 80
                      ? 'bg-primary text-primary-foreground'
                      : sr.avg_compliance_score >= 60
                      ? 'bg-orange-500 text-white'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {sr.avg_compliance_score.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      selectedSR === sr.sales_representative ? 'rotate-90' : ''
                    }`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Expanded detail view */}
        {selectedSR && (
          <div className="mt-4 p-4 border rounded-sm bg-muted/50">
            <h4 className="font-medium mb-2">Detailed Metrics</h4>
            {(() => {
              const sr = sortedData.find((s: SRPerformance) => s.sales_representative === selectedSR)
              if (!sr) return null

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Visits</div>
                    <div className="text-lg font-semibold">{sr.total_visits}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Completed Visits</div>
                    <div className="text-lg font-semibold">{sr.completed_visits}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Orders Created</div>
                    <div className="text-lg font-semibold">{sr.total_orders}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Revenue</div>
                    <div className="text-lg font-semibold">${sr.total_order_value.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Conversion Rate</div>
                    <div className="text-lg font-semibold">{sr.order_conversion_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Compliance</div>
                    <div className="text-lg font-semibold">{sr.avg_compliance_score.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Compliance Rate</div>
                    <div className="text-lg font-semibold">{sr.compliance_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Order Value</div>
                    <div className="text-lg font-semibold">
                      ${sr.total_orders > 0 ? (sr.total_order_value / sr.total_orders).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
