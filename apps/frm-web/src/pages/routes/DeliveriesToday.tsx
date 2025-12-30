/**
 * Today's Deliveries Page
 * Shows delivery orders assigned for today
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
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Phone,
  Navigation
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
  contact_phone?: string
}

interface DeliveryResponse {
  orders: DeliveryOrder[]
  total_count: number
}

export default function DeliveriesToday() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's deliveries
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: DeliveryResponse }>(
    'frm.api.delivery.get_delivery_orders',
    {
      from_date: today,
      to_date: today,
      limit: 100,
      offset: 0
    },
    'todays-deliveries',
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000
    }
  )

  const deliveries = data?.message?.orders || []
  const totalCount = data?.message?.total_count || 0

  // Calculate summary stats
  const completedCount = deliveries.filter(d => d.state === 'completed').length
  const pendingCount = deliveries.filter(d => d.state === 'pending').length
  const inTransitCount = deliveries.filter(d => d.state === 'in_transit').length

  const getStateBadge = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground hover:bg-primary/10">Completed</Badge>
      case 'in_transit':
        return <Badge className="bg-muted text-foreground hover:bg-muted">In Transit</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'partial':
        return <Badge className="bg-orange-500 text-white hover:bg-secondary/10">Partial</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleDeliveryClick = (delivery: DeliveryOrder) => {
    navigate(`/deliveries/${delivery.name}`)
  }

  const handleStartDelivery = (e: React.MouseEvent, delivery: DeliveryOrder) => {
    e.stopPropagation()
    // Navigate to delivery execution page
    navigate(`/deliveries/${delivery.name}`)
  }

  const handleCallCustomer = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation()
    window.location.href = `tel:${phone}`
  }

  const handleNavigate = (e: React.MouseEvent, address: string) => {
    e.stopPropagation()
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank')
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Today's Deliveries
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Progress Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{inTransitCount}</div>
                <div className="text-xs text-muted-foreground">In Transit</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
            {totalCount > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completedCount} / {totalCount}</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Deliveries</h3>
              <p className="text-muted-foreground text-center">
                Failed to load today's deliveries. Please try again.
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
              <h3 className="text-lg font-semibold mb-2">No Deliveries Today</h3>
              <p className="text-muted-foreground text-center">
                You have no deliveries scheduled for today.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
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
                        {getStateBadge(delivery.state)}
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
                          <span className="line-clamp-2">{delivery.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      {delivery.state === 'pending' && (
                        <Button
                          size="sm"
                          onClick={(e) => handleStartDelivery(e, delivery)}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {delivery.contact_phone && (
                    <div className="mt-3 pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleCallCustomer(e, delivery.contact_phone!)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      {delivery.address && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleNavigate(e, delivery.address!)}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {deliveries.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Deliveries</span>
                <span className="font-semibold">{totalCount}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
