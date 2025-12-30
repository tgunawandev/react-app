/**
 * Delivery Schedules Page
 * Shows recurring delivery route templates and schedules
 * Part of the Delivery Routes section
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  ChevronRight,
  Plus,
  CalendarDays,
  Repeat
} from 'lucide-react'
import { useFrappeGetCall } from 'frappe-react-sdk'

interface DeliverySchedule {
  name: string
  schedule_name: string
  route_name?: string
  frequency: string
  day_of_week?: string
  active: boolean
  customer_count: number
  last_run?: string
  next_run?: string
}

export default function DeliverySchedules() {
  const navigate = useNavigate()

  // For now, display placeholder since Delivery Schedule DocType may not exist yet
  // In future, this would fetch from a Delivery Schedule DocType
  const { data, isLoading, error } = useFrappeGetCall<{ message: DeliverySchedule[] }>(
    'frappe.client.get_list',
    {
      doctype: 'Route Plan',
      fields: ['name', 'route_name', 'territory', 'day_of_week', 'enabled', 'creation'],
      filters: {},
      limit_page_length: 50
    },
    'delivery-schedules',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Transform Route Plans to schedule format
  const schedules: DeliverySchedule[] = (data?.message || []).map((plan: any) => ({
    name: plan.name,
    schedule_name: plan.route_name || plan.name,
    route_name: plan.route_name,
    frequency: 'Weekly',
    day_of_week: plan.day_of_week || 'Monday',
    active: plan.enabled === 1,
    customer_count: 0,
    last_run: undefined,
    next_run: undefined
  }))

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'daily':
        return <Badge variant="default">Daily</Badge>
      case 'weekly':
        return <Badge variant="secondary">Weekly</Badge>
      case 'biweekly':
        return <Badge variant="outline">Bi-Weekly</Badge>
      case 'monthly':
        return <Badge variant="outline">Monthly</Badge>
      default:
        return <Badge variant="outline">{frequency}</Badge>
    }
  }

  const getDayOfWeek = (day?: string) => {
    if (!day) return 'Not set'
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Delivery Schedules
            </h1>
            <p className="text-muted-foreground">
              Recurring delivery route templates
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Repeat className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Recurring Routes</h3>
                <p className="text-sm text-muted-foreground">
                  Delivery schedules automatically generate delivery assignments based on predefined routes and frequencies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Schedules</h3>
              <p className="text-muted-foreground text-center">
                Failed to load delivery schedules. Please try again.
              </p>
            </CardContent>
          </Card>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Delivery Schedules</h3>
              <p className="text-muted-foreground text-center mb-4">
                No recurring delivery schedules have been configured yet.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Schedules can be created from Route Plans in the admin panel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <Card
                key={schedule.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !schedule.active ? 'opacity-60' : ''
                }`}
                onClick={() => navigate(`/routes/plan`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{schedule.schedule_name}</span>
                        {!schedule.active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {getFrequencyBadge(schedule.frequency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {getDayOfWeek(schedule.day_of_week)}
                        </span>
                        {schedule.customer_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {schedule.customer_count} stops
                          </span>
                        )}
                      </div>

                      {schedule.next_run && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Next run: {new Date(schedule.next_run).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/routes/plan')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <MapPin className="h-5 w-5 mr-2" />
            View Route Plans
          </Button>
        </div>
      </Main>
    </>
  )
}
