/**
 * Reports Page
 * Two-tab layout with Visit Summary and Activity Breakdown
 * Reference: specs/001-sfa-app-build/tasks.md REPORTS-002
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DateRangeFilter, { type DateRangeValue } from '@/components/reports/DateRangeFilter'
import VisitSummaryTab from '@/components/reports/VisitSummaryTab'
import ActivityBreakdownTab from '@/components/reports/ActivityBreakdownTab'
import { FileText, BarChart3 } from 'lucide-react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

export default function Reports() {
  // Initialize with Last 7 Days as default
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  const last7Days = new Date(today)
  last7Days.setDate(today.getDate() - 6)
  last7Days.setHours(0, 0, 0, 0) // Start of 6 days ago

  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: last7Days,
    to: today,
  })

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            View visit summaries and activity analytics
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Filter by Date Range</CardTitle>
            <CardDescription>Select a preset or choose custom dates</CardDescription>
          </CardHeader>
          <CardContent>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="visits" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Visit Summary
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Activity Breakdown
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visits" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Visit Summary</CardTitle>
                <CardDescription>
                  Detailed list of all visits in the selected date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VisitSummaryTab dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
                <CardDescription>
                  Aggregated metrics by activity type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityBreakdownTab dateRange={dateRange} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
