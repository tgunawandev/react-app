/**
 * Deliveries Page
 * Browse and manage delivery orders
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Truck, Calendar, Package, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { Badge } from '@/components/ui/badge'
import { useFrappeGetCall } from 'frappe-react-sdk'

interface Delivery {
  name: string
  customer: string
  customer_name: string
  delivery_date: string
  odoo_state: string  // Odoo state (read-only)
  sfa_state: string   // SFA workflow state
  sales_order?: string
  odoo_name?: string
  item_count?: number
}

export default function Deliveries() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useFrappeGetCall<{ message: { deliveries: Delivery[], total_count: number } }>(
    'frm.api.delivery.get_delivery_orders',
    {
      state: stateFilter === 'all' ? undefined : stateFilter,
      limit: 50,
      offset: 0
    },
    'delivery-list',
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const deliveries = data?.message?.deliveries || []
  const totalCount = data?.message?.total_count || 0

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedDelivery && !showModal) {
      // Create minimal delivery object to trigger detail fetch
      setSelectedDelivery({
        name: id,
        customer: '',
        customer_name: '',
        delivery_date: '',
        odoo_state: '',
        sfa_state: ''
      })
      setShowModal(true)
      // Clean up URL immediately after triggering open
      setTimeout(() => setSearchParams({}), 100)
    }
  }, [searchParams, setSearchParams, selectedDelivery, showModal])

  // Filter locally by customer name/delivery ID
  const filteredDeliveries = searchTerm
    ? deliveries.filter(delivery =>
        delivery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (delivery.odoo_name && delivery.odoo_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : deliveries

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleDeliveryClick = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedDelivery(null)
  }

  // Fetch delivery detail when selected
  const { data: deliveryData, isLoading: isLoadingDelivery } = useFrappeGetCall<{ message: any }>(
    'frm.api.delivery.get_delivery_detail',
    { delivery_id: selectedDelivery?.name },
    selectedDelivery ? undefined : null,
    { revalidateOnFocus: false }
  )

  const deliveryDetail = deliveryData?.message

  // SFA State helpers (primary - controls workflow)
  const getSfaStateVariant = (state: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (state?.toLowerCase()) {
      case 'waiting_transfer':
        return 'secondary'
      case 'pending':
        return 'outline'
      case 'assigned':
        return 'secondary'
      case 'loading':
        return 'secondary'
      case 'in_transit':
        return 'default'
      case 'arrived':
        return 'default'
      case 'delivering':
        return 'default'
      case 'completed':
        return 'default'
      case 'partial':
        return 'secondary'
      case 'returned':
        return 'destructive'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatSfaState = (state: string | undefined) => {
    switch (state?.toLowerCase()) {
      case 'waiting_transfer':
        return 'Waiting Transfer'
      case 'pending':
        return 'Pending'
      case 'assigned':
        return 'Assigned'
      case 'loading':
        return 'Loading'
      case 'in_transit':
        return 'In Transit'
      case 'arrived':
        return 'Arrived'
      case 'delivering':
        return 'Delivering'
      case 'completed':
        return 'Completed'
      case 'partial':
        return 'Partial'
      case 'returned':
        return 'Returned'
      case 'cancelled':
        return 'Cancelled'
      default:
        return state || 'Pending'
    }
  }

  // Odoo State helpers (secondary - informational)
  const formatOdooState = (state: string | undefined) => {
    switch (state?.toLowerCase()) {
      case 'draft':
        return 'Draft'
      case 'waiting':
        return 'Waiting'
      case 'confirmed':
        return 'Confirmed'
      case 'assigned':
        return 'Assigned'
      case 'done':
        return 'Done'
      case 'cancel':
        return 'Cancelled'
      default:
        return state || 'Unknown'
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Delivery Orders
          </h1>
          <p className='text-muted-foreground'>
            Track and manage delivery orders
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search deliveries...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: State filter */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All States</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All States</SelectItem>
                <SelectItem value='waiting_transfer'>Waiting Transfer</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='assigned'>Assigned</SelectItem>
                <SelectItem value='loading'>Loading</SelectItem>
                <SelectItem value='in_transit'>In Transit</SelectItem>
                <SelectItem value='arrived'>Arrived</SelectItem>
                <SelectItem value='delivering'>Delivering</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='partial'>Partial</SelectItem>
                <SelectItem value='returned'>Returned</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && filteredDeliveries.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : filteredDeliveries.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No deliveries found
            </li>
          ) : (
            filteredDeliveries.map((delivery) => (
              <li
                key={delivery.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleDeliveryClick(delivery)}
              >
                {/* Header: Delivery ID + Customer + Status */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{delivery.name}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{delivery.customer_name}</p>
                  <div className='flex items-center gap-1 mt-1.5 flex-wrap'>
                    <Badge variant={getSfaStateVariant(delivery.sfa_state)} className='text-[10px] h-4 px-1.5'>
                      {formatSfaState(delivery.sfa_state)}
                    </Badge>
                  </div>
                </div>

                {/* Odoo Integration */}
                {(delivery.odoo_name || delivery.odoo_state) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {delivery.odoo_name && <span className='truncate text-[11px]'>{delivery.odoo_name}</span>}
                    {delivery.odoo_state && <Badge variant='outline' className='text-[10px] h-4 px-1.5'>{formatOdooState(delivery.odoo_state)}</Badge>}
                  </div>
                )}

                {/* Delivery Details - Compact */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      Delivery Date:
                    </span>
                    <span className='font-medium text-[11px]'>
                      {new Date(delivery.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                  {delivery.sales_order && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                        <Package className='h-3.5 w-3.5' />
                        SO:
                      </span>
                      <span className='font-medium text-[11px] truncate'>{delivery.sales_order}</span>
                    </div>
                  )}
                  {delivery.item_count !== undefined && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                        <Truck className='h-3.5 w-3.5' />
                        Items:
                      </span>
                      <span className='font-medium text-[11px]'>{delivery.item_count}</span>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {filteredDeliveries.length} of {totalCount} deliveries
          </div>
        )}
      </Main>

      {/* Delivery Detail Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDelivery?.name || 'Delivery Order'}</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6 overflow-y-auto px-0.5">
              {/* SECTION: Delivery Information */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold">Delivery Information</h3>
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <p className="text-sm">{selectedDelivery.customer_name}</p>
                </div>

                {/* Status and Delivery Date - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSfaStateVariant(selectedDelivery.sfa_state)}>
                        {formatSfaState(selectedDelivery.sfa_state)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Date</Label>
                    <p className="text-sm">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Sales Order and Items - Side by Side (if both exist) */}
                {(selectedDelivery.sales_order || selectedDelivery.item_count !== undefined) && (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDelivery.sales_order && (
                      <div className="space-y-2">
                        <Label>Sales Order</Label>
                        <p className="text-sm font-mono">{selectedDelivery.sales_order}</p>
                      </div>
                    )}

                    {selectedDelivery.item_count !== undefined && (
                      <div className="space-y-2">
                        <Label>Items</Label>
                        <p className="text-sm">{selectedDelivery.item_count} items</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION: Odoo Integration */}
              {(selectedDelivery.odoo_name || selectedDelivery.odoo_state) && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Odoo Integration</h3>
                  </div>

                  {/* Odoo Reference and Odoo State - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedDelivery.odoo_name && (
                      <div className="space-y-2">
                        <Label>Odoo Reference</Label>
                        <p className="text-sm font-mono">{selectedDelivery.odoo_name}</p>
                      </div>
                    )}

                    {selectedDelivery.odoo_state && (
                      <div className="space-y-2">
                        <Label>Odoo State</Label>
                        <Badge variant="outline">{formatOdooState(selectedDelivery.odoo_state)}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Delivery Items */}
              {isLoadingDelivery ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading delivery items...
                </div>
              ) : deliveryDetail?.items && deliveryDetail.items.length > 0 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Delivery Items</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {deliveryDetail.items.length} {deliveryDetail.items.length === 1 ? 'item' : 'items'} in this delivery
                    </p>
                  </div>

                  <div className="space-y-2">
                    {deliveryDetail.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg border space-y-2">
                        {/* Row 1: Item number and Product name */}
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">
                            #{index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {item.product_name || item.description || item.product || item.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.product_code || item.product || item.item_code}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Quantity info */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-muted-foreground">
                            Qty: <span className="font-medium text-foreground">{item.quantity_done || 0}</span>
                            {item.uom && <span className="ml-1">{item.uom}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
