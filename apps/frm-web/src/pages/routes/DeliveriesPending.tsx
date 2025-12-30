/**
 * Pending Deliveries Page
 * Shows all pending deliveries awaiting dispatch
 * Part of the Delivery Routes section (Driver/Shipper role)
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
  Package,
  Clock,
  MapPin,
  AlertCircle,
  ChevronRight,
  Calendar,
  Filter
} from 'lucide-react'
import { useFrappeGetCall } from 'frappe-react-sdk'

interface DeliveryOrder {
  name: string
  order_number: string
  customer_name: string
  customer_id: string
  delivery_date: string
  state: string
  total_qty: number
  total_amount: number
  address?: string
}

interface DeliveryResponse {
  orders: DeliveryOrder[]
  total_count: number
}

export default function DeliveriesPending() {
  const navigate = useNavigate()

  // Fetch pending deliveries
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: DeliveryResponse }>(
    'frm.api.delivery.get_delivery_orders',
    {
      state: 'pending',
      limit: 100,
      offset: 0
    },
    'pending-deliveries-list',
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000
    }
  )

  const deliveries = data?.message?.orders || []
  const totalCount = data?.message?.total_count || 0

  // Group deliveries by date
  const groupedByDate = deliveries.reduce((groups, delivery) => {
    const date = delivery.delivery_date || 'No Date'
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(delivery)
    return groups
  }, {} as Record<string, DeliveryOrder[]>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'No Date') return 'No Date Assigned'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  const handleDeliveryClick = (delivery: DeliveryOrder) => {
    navigate(`/deliveries/${delivery.name}`)
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Pending Deliveries
          </h1>
          <p className="text-muted-foreground">
            Deliveries awaiting dispatch
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-sm">
                  <Clock className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalCount}</div>
                  <div className="text-sm text-muted-foreground">Total Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Deliveries</h3>
              <p className="text-muted-foreground text-center">
                Failed to load pending deliveries. Please try again.
              </p>
              <Button onClick={() => mutate()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : deliveries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Deliveries</h3>
              <p className="text-muted-foreground text-center">
                All deliveries have been dispatched or completed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => {
                if (a === 'No Date') return 1
                if (b === 'No Date') return -1
                return new Date(a).getTime() - new Date(b).getTime()
              })
              .map(([date, dateDeliveries]) => (
                <div key={date} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(date)}
                    <Badge variant="secondary" className="ml-auto">
                      {dateDeliveries.length}
                    </Badge>
                  </div>

                  {/* Deliveries for this date */}
                  {dateDeliveries.map((delivery) => (
                    <Card
                      key={delivery.name}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => handleDeliveryClick(delivery)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{delivery.customer_name}</span>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {delivery.order_number}
                            </div>

                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {delivery.total_qty} items
                              </span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(delivery.total_amount)}
                              </span>
                            </div>

                            {delivery.address && (
                              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="line-clamp-1">{delivery.address}</span>
                              </div>
                            )}
                          </div>

                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
          </div>
        )}
      </Main>
    </>
  )
}
