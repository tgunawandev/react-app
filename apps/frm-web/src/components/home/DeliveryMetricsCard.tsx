/**
 * Delivery Metrics Card Component
 * Display delivery statistics for drivers
 * Reference: specs/001-sfa-app-build/tasks.md HOME-009
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Truck, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DeliveryMetricsCard() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  // Today's deliveries
  const { data: todayData, isLoading: todayLoading } = useFrappeGetCall<{ message: { total_count: number } }>(
    'frm.api.delivery.get_delivery_orders',
    {
      from_date: today,
      to_date: today,
      limit: 0,
      offset: 0
    },
    'home-today-deliveries',
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000
    }
  )

  // Completed deliveries today
  const { data: completedData, isLoading: completedLoading } = useFrappeGetCall<{ message: { total_count: number } }>(
    'frm.api.delivery.get_delivery_orders',
    {
      from_date: today,
      to_date: today,
      state: 'done',
      limit: 0,
      offset: 0
    },
    'home-completed-deliveries',
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000
    }
  )

  // Pending deliveries
  const { data: pendingData, isLoading: pendingLoading } = useFrappeGetCall<{ message: { total_count: number } }>(
    'frm.api.delivery.get_delivery_orders',
    {
      state: 'pending',
      limit: 0,
      offset: 0
    },
    'home-pending-deliveries',
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000
    }
  )

  const isLoading = todayLoading || completedLoading || pendingLoading

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const todayCount = todayData?.message?.total_count || 0
  const completedCount = completedData?.message?.total_count || 0
  const pendingCount = pendingData?.message?.total_count || 0

  const metrics = [
    {
      title: "Today's Deliveries",
      value: todayCount,
      icon: Truck,
      color: 'text-primary',
      bgColor: 'bg-muted',
      route: '/routes/deliveries/today'
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      route: '/routes/deliveries/history'
    },
    {
      title: 'Pending',
      value: pendingCount,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      route: '/routes/deliveries/pending'
    }
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Delivery Overview</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/driver')}
        >
          View Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.title}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => navigate(metric.route)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`${metric.bgColor} p-1.5 rounded-sm`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
