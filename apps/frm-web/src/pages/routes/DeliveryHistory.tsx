/**
 * Delivery History Page
 * Shows past deliveries and POD records
 * Part of the Delivery Routes section (Driver/Shipper role)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  History,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  XCircle
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
  completed_at?: string
}

interface DeliveryResponse {
  orders: DeliveryOrder[]
  total_count: number
}

export default function DeliveryHistory() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Calculate date range for last 30 days
  const toDate = new Date().toISOString().split('T')[0]
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Fetch completed/cancelled deliveries (history)
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: DeliveryResponse }>(
    'frm.api.delivery.get_delivery_orders',
    {
      from_date: fromDate,
      to_date: toDate,
      limit: limit,
      offset: offset
    },
    `delivery-history-${offset}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Filter to show only completed/cancelled (history items)
  const allDeliveries = data?.message?.orders || []
  const deliveries = allDeliveries.filter(d =>
    d.state === 'completed' || d.state === 'partial' || d.state === 'cancelled'
  )
  const totalCount = data?.message?.total_count || 0

  // Filter by search query
  const filteredDeliveries = searchQuery
    ? deliveries.filter(d =>
        d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : deliveries

  // Group deliveries by date
  const groupedByDate = filteredDeliveries.reduce((groups, delivery) => {
    const date = delivery.delivery_date || 'No Date'
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(delivery)
    return groups
  }, {} as Record<string, DeliveryOrder[]>)

  const getStateBadge = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-primary text-primary-foreground hover:bg-primary/10">Completed</Badge>
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

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'No Date') return 'No Date'
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  const handleDeliveryClick = (delivery: DeliveryOrder) => {
    navigate(`/deliveries/${delivery.name}`)
  }

  // Calculate stats
  const completedCount = deliveries.filter(d => d.state === 'completed').length
  const partialCount = deliveries.filter(d => d.state === 'partial').length
  const cancelledCount = deliveries.filter(d => d.state === 'cancelled').length

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6" />
            Delivery History
          </h1>
          <p className="text-muted-foreground">
            Past deliveries and POD records (last 30 days)
          </p>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-foreground">{partialCount}</div>
                <div className="text-xs text-muted-foreground">Partial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{cancelledCount}</div>
                <div className="text-xs text-muted-foreground">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

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
              <h3 className="text-lg font-semibold mb-2">Error Loading History</h3>
              <p className="text-muted-foreground text-center">
                Failed to load delivery history. Please try again.
              </p>
              <Button onClick={() => mutate()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredDeliveries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No Results Found' : 'No Delivery History'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? `No deliveries match "${searchQuery}"`
                  : 'No completed deliveries in the last 30 days.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => {
                if (a === 'No Date') return 1
                if (b === 'No Date') return -1
                return new Date(b).getTime() - new Date(a).getTime()
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

            {/* Load More */}
            {filteredDeliveries.length >= limit && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOffset(prev => prev + limit)}
              >
                Load More
              </Button>
            )}
          </div>
        )}
      </Main>
    </>
  )
}
