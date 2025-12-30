/**
 * Delivery Returns Page
 * Modal-based view with Sheet pattern (create still uses separate page)
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RotateCcw, Calendar, AlertTriangle, ExternalLink, PlusCircle, User, Package } from 'lucide-react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DeliveryReturnSheet } from '@/components/delivery/DeliveryReturnSheet'

interface DeliveryReturn {
  name: string
  customer: string
  customer_name: string
  return_date: string
  state: string
  delivery_order?: string
  reason?: string
  notes?: string
  item_count?: number
  items?: Array<{ product: string; product_name?: string; quantity: number; uom?: string }>
  photos?: Array<{ name: string; photo: string; caption?: string }>
  odoo_id?: number
  odoo_name?: string
  odoo_state?: string
  odoo_sync_status?: string
}

export default function DeliveryReturns() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedReturnId) {
      setSelectedReturnId(id)
      // Clean up URL after opening modal
      setSearchParams({})
    }
  }, [searchParams, setSearchParams, selectedReturnId])

  const { data, isLoading, mutate } = useFrappeGetCall<{ message: { returns: DeliveryReturn[], total_count: number } }>(
    'frm.api.delivery.get_delivery_returns',
    {
      state: stateFilter === 'all' ? undefined : stateFilter,
      limit: 50,
      offset: 0
    },
    'delivery-return-list',
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const returns = data?.message?.returns || []
  const totalCount = data?.message?.total_count || 0

  // Filter locally by customer name/return ID
  const filteredReturns = searchTerm
    ? returns.filter(ret =>
        ret.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : returns

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleReturnClick = (ret: DeliveryReturn) => {
    setSelectedReturnId(ret.name)
  }

  const handleNewReturn = () => {
    setShowReturnModal(true)
  }

  const handleCloseDetailModal = () => {
    setSelectedReturnId(null)
  }

  const handleCloseCreateModal = () => {
    setShowReturnModal(false)
  }

  // Fetch delivery return detail when selected
  const { data: returnData, isLoading: isLoadingReturn } = useFrappeGetCall<{ message: DeliveryReturn }>(
    'frm.api.delivery.get_delivery_return_detail',
    { return_id: selectedReturnId },
    selectedReturnId ? `delivery-return-detail-${selectedReturnId}` : null,
    { revalidateOnFocus: false }
  )

  const deliveryReturn = returnData?.message

  const getStateVariant = (state: string) => {
    switch (state.toLowerCase()) {
      case 'draft':
        return 'outline'
      case 'submitted':
        return 'secondary'
      case 'in transit':
        return 'default'
      case 'received':
        return 'default'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatState = (state: string) => {
    return state.charAt(0).toUpperCase() + state.slice(1)
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Delivery Returns
          </h1>
          <p className='text-muted-foreground'>
            Manage product returns from customers
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search returns...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: State filter + New Button */}
          <div className='flex items-center gap-3'>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All States</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All States</SelectItem>
                <SelectItem value='Draft'>Draft</SelectItem>
                <SelectItem value='Submitted'>Submitted</SelectItem>
                <SelectItem value='In Transit'>In Transit</SelectItem>
                <SelectItem value='Received'>Received</SelectItem>
                <SelectItem value='Cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleNewReturn} className='shrink-0'>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Return
            </Button>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && filteredReturns.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : filteredReturns.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No returns found
            </li>
          ) : (
            filteredReturns.map((ret) => (
              <li
                key={ret.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleReturnClick(ret)}
              >
                {/* Header: ID + Customer + State */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{ret.name}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{ret.customer_name}</p>
                  <div className='flex items-center gap-1 mt-1.5'>
                    <Badge variant={getStateVariant(ret.state)} className='text-[10px] h-4 px-1.5'>
                      {formatState(ret.state)}
                    </Badge>
                  </div>
                </div>

                {/* Odoo Integration */}
                {(ret.odoo_name || ret.odoo_state) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {ret.odoo_name && <span className='truncate text-[11px]'>{ret.odoo_name}</span>}
                    {ret.odoo_state && <Badge variant='outline' className='text-[10px] h-4 px-1.5 shrink-0'>{ret.odoo_state}</Badge>}
                  </div>
                )}

                {/* Return Details - Compact */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      Return Date:
                    </span>
                    <span className='font-medium text-[11px]'>
                      {new Date(ret.return_date).toLocaleDateString()}
                    </span>
                  </div>
                  {ret.delivery_order && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                        <RotateCcw className='h-3.5 w-3.5' />
                        Delivery:
                      </span>
                      <span className='font-medium text-[11px] truncate max-w-[60%]'>{ret.delivery_order}</span>
                    </div>
                  )}
                  {ret.reason && (
                    <div className='flex items-center gap-1 text-[10px] text-muted-foreground mt-1'>
                      <AlertTriangle className='h-3 w-3 shrink-0' />
                      <span className='truncate'>{ret.reason}</span>
                    </div>
                  )}
                  {ret.item_count !== undefined && (
                    <div className='text-[10px] text-muted-foreground mt-1 pt-1 border-t'>
                      {ret.item_count} item{ret.item_count !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {filteredReturns.length} of {totalCount} returns
          </div>
        )}
      </Main>

      {/* Detail View Modal (Read-Only) */}
      <Dialog open={!!selectedReturnId} onOpenChange={(open) => !open && handleCloseDetailModal()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{deliveryReturn?.name || 'Delivery Return'}</DialogTitle>
            <DialogDescription>
              {deliveryReturn?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {isLoadingReturn ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : deliveryReturn && (
            <div className="space-y-6 overflow-y-auto px-0.5">
              {/* Return Information */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={getStateVariant(deliveryReturn.state)}>
                      {formatState(deliveryReturn.state)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Return Date</div>
                      <div className="font-medium">{new Date(deliveryReturn.return_date).toLocaleDateString()}</div>
                    </div>
                    {deliveryReturn.delivery_order && (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Original Delivery</div>
                        <div className="font-medium">{deliveryReturn.delivery_order}</div>
                      </div>
                    )}
                    {deliveryReturn.reason && (
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">Reason</div>
                        <div className="font-medium">{deliveryReturn.reason}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Items */}
                {deliveryReturn.items && deliveryReturn.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Return Items</h3>
                    <div className="space-y-2">
                      {deliveryReturn.items.map((item, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-muted/20">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {item.description || item.product_name || item.product}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.product}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground shrink-0">
                              {item.quantity} {item.uom || 'Kg'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Photos */}
                {deliveryReturn.photos && deliveryReturn.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Evidence Photos</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {deliveryReturn.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition"
                          onClick={() => window.open(photo.photo, '_blank')}>
                          <img
                            src={photo.photo}
                            alt={photo.caption || `Evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {deliveryReturn.notes && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Notes</h3>
                    <div className="text-sm p-3 bg-muted/20 rounded-lg border">
                      {deliveryReturn.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Return Modal */}
      <DeliveryReturnSheet
        open={showReturnModal}
        onOpenChange={handleCloseCreateModal}
        onComplete={() => {
          mutate()
          handleCloseCreateModal()
        }}
      />
    </>
  )
}
