/**
 * Dashboard Page - Manager Performance Overview
 * Shows team metrics, compliance, and performance analytics
 * Reference: specs/001-sfa-app-build/tasks.md US2-005
 */

import { useState } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, ShoppingCart, Target, Award, MapPin } from 'lucide-react'
import { TeamPerformance } from '@/components/dashboard/TeamPerformance'
import { ComplianceReport } from '@/components/dashboard/ComplianceReport'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [dateRange] = useState({
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  })

  // Fetch team metrics
  const { data: metricsData, isLoading } = useFrappeGetCall<{ message: any }>(
    'frm.api.dashboard.get_team_metrics',
    {
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
      group_by: 'day'
    },
    'team-metrics',
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )

  const metrics = metricsData?.message?.summary

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.full_name || user?.name || 'User'}!
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Last 30 days performance overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_visits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.visit_completion_rate?.toFixed(1) || 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.order_conversion_rate?.toFixed(1) || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.total_order_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(metrics?.avg_order_value || 0).toFixed(2)} avg order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_compliance_score?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.compliance_rate?.toFixed(1) || 0}% visits compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="team" className="mt-6 space-y-4">
        <TabsList>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Performance
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <TeamPerformance dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceReport dateRange={dateRange} />
        </TabsContent>
      </Tabs>

      {/* Quick Actions (if no data) */}
      {!isLoading && (!metrics || metrics.total_visits === 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              No visit data found for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Welcome to SFA - Sales Force Automation. Here's what you can do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Record customer visits with GPS verification</li>
              <li>Manage customer information and relationships</li>
              <li>Create and track orders</li>
              <li>Plan and optimize your routes</li>
              <li>Monitor stock levels</li>
              <li>View analytics and reports</li>
            </ul>
          </CardContent>
        </Card>
      )}
      </Main>
    </>
  )
}
