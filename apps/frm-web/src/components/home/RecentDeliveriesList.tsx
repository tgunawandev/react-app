/**
 * Recent Deliveries List Component
 * Display last 5 recent deliveries for drivers
 * Reference: specs/001-sfa-app-build/tasks.md HOME-010
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Truck, ArrowRight, Package, CheckCircle, Clock } from 'lucide-react'

interface DeliveryOrder {
  name: string
  customer_name: string
  customer: string
  state: string
  posting_date: string
  grand_total: number
}

export default function RecentDeliveriesList() {
  const navigate = useNavigate()

  const { data, isLoading, error } = useFrappeGetCall<{ message: { orders: DeliveryOrder[], total_count: number } }>(
    'frm.api.delivery.get_delivery_orders',
    {
      limit: 5,
      offset: 0
    },
    'home-recent-deliveries',
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000
    }
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recent Deliveries
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load recent deliveries
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const deliveries = data?.message?.orders || []

  // No deliveries yet
  if (!deliveries || deliveries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Recent Deliveries
              </CardTitle>
              <CardDescription>Your latest delivery activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/deliveries')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No deliveries assigned yet</p>
            <Button
              variant="link"
              onClick={() => navigate('/routes/deliveries/today')}
              className="mt-2"
            >
              Check today's deliveries
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-primary" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <Truck className="h-4 w-4 text-primary" />
    }
  }

  const getStateBadge = (state: string) => {
    const stateConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      assigned: { variant: 'outline', label: 'Assigned' },
      loading: { variant: 'outline', label: 'Loading' },
      in_transit: { variant: 'default', label: 'In Transit' },
      arrived: { variant: 'default', label: 'Arrived' },
      done: { variant: 'default', label: 'Delivered' },
      cancelled: { variant: 'destructive', label: 'Cancelled' }
    }
    const config = stateConfig[state] || { variant: 'secondary', label: state }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Recent Deliveries
            </CardTitle>
            <CardDescription>Your latest delivery activities</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/deliveries')}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.name}
              className="flex items-center justify-between p-3 border rounded-sm hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/deliveries/${delivery.name}`)}
            >
              <div className="flex items-center gap-3 flex-1">
                {getStateIcon(delivery.state)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{delivery.customer_name || delivery.customer}</p>
                    <span className="text-xs text-muted-foreground">
                      {delivery.posting_date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStateBadge(delivery.state)}
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(delivery.grand_total || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
