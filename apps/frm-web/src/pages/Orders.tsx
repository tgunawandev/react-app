/**
 * Orders Page
 * Modal-based CRUD with EntitySheet pattern
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlusCircle, ShoppingCart, Calendar, ExternalLink, Search } from 'lucide-react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Button } from '@/components/ui/button'
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
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { useOrders, type Order } from '@/hooks/useOrder'
import { Badge } from '@/components/ui/badge'
import { useEntitySheet } from '@/components/entity/useEntitySheet'
import { SalesOrderSheet } from '@/components/visit/SalesOrderSheet'
import { useCustomers, type CustomerWithStats } from '@/hooks/useCustomers'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Customer selection for new orders
  const [showCustomerSelector, setShowCustomerSelector] = useState(false)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null)
  const [showOrderSheet, setShowOrderSheet] = useState(false)

  const debouncedCustomerSearch = useDebounce(customerSearchTerm, 300)
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { orders, totalCount, isLoading, mutate } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: 50,
    offset: 0
  })

  // Fetch customers for selection
  const { customers, isLoading: isLoadingCustomers } = useCustomers({
    search: debouncedCustomerSearch,
    limit: 20,
    offset: 0
  })

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Entity sheet state management
  const {
    selectedEntity,
    handleOpen,
    handleClose,
  } = useEntitySheet({
    entityType: 'Order'
  })

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedEntity) {
      // Directly open the modal - the detail fetch will load the data
      handleOpen(id, 'view')
      // Clean up URL immediately after triggering open
      setTimeout(() => setSearchParams({}), 100)
    }
  }, [searchParams, setSearchParams, selectedEntity, handleOpen])

  // Fetch order detail when selected
  const { data: orderData, isLoading: isLoadingOrder } = useFrappeGetCall<{ message: any }>(
    'frm.api.order.get_order_detail',
    { order_id: selectedEntity?.id },
    selectedEntity ? undefined : null,
    { revalidateOnFocus: false }
  )

  const order = orderData?.message

  // Handle view order completion (close and refresh)
  const handleViewOrderClose = async () => {
    await mutate()
    handleClose()
  }

  const handleOrderClick = (order: Order) => {
    handleOpen(order.name, 'view')
  }

  const handleCreateOrder = () => {
    setShowCustomerSelector(true)
  }

  const handleCustomerSelect = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer)
    setShowCustomerSelector(false)
    setShowOrderSheet(true)
  }

  const handleOrderSheetClose = () => {
    setShowOrderSheet(false)
    setSelectedCustomer(null)
    setCustomerSearchTerm('')
  }

  const handleOrderComplete = async (orderId: string) => {
    await mutate()
    handleOrderSheetClose()
    if (orderId) {
      toast.success(`Order ${orderId} created successfully`)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'outline'
      case 'sale':
        return 'secondary'
      case 'done':
        return 'default'
      case 'cancel':
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
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
            Sales Orders
          </h1>
          <p className='text-muted-foreground'>
            Browse and manage your sales orders
          </p>
        </div>
        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search orders...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: Status filter and Create Order button */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All Status</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='draft'>draft</SelectItem>
                <SelectItem value='sale'>sale</SelectItem>
                <SelectItem value='done'>done</SelectItem>
                <SelectItem value='cancel'>cancel</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleCreateOrder} className='shrink-0'>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>
        </div>
        <Separator className='shadow-sm' />
        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && orders.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : orders.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No orders found
            </li>
          ) : (
            orders.map((order) => (
              <li
                key={order.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleOrderClick(order)}
              >
                {/* Header: Order ID + Customer + Status */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{order.name}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{order.customer_name}</p>
                  <div className='flex items-center gap-1 mt-1.5 flex-wrap'>
                    {order.status && (
                      <Badge variant={getStatusVariant(order.status)} className='text-[10px] h-4 px-1.5'>
                        {order.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Odoo Integration */}
                {(order.odoo_name || order.odoo_state) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {order.odoo_name && <span className='truncate text-[11px]'>{order.odoo_name}</span>}
                    {order.odoo_state && <Badge variant='outline' className='text-[10px] h-4 px-1.5'>{order.odoo_state}</Badge>}
                  </div>
                )}

                {/* Order Details - Compact */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      Order Date:
                    </span>
                    <span className='font-medium text-[11px]'>
                      {new Date(order.order_date).toLocaleDateString()}
                    </span>
                  </div>
                  {order.commitment_date && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                        <Calendar className='h-3.5 w-3.5' />
                        Delivery:
                      </span>
                      <span className='font-medium text-[11px]'>
                        {new Date(order.commitment_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <ShoppingCart className='h-3.5 w-3.5' />
                      Items:
                    </span>
                    <span className='font-medium text-[11px]'>{order.item_count}</span>
                  </div>
                  <Separator className='my-1.5' />
                  <div className='flex items-center justify-between font-semibold'>
                    <span className='text-xs'>Total:</span>
                    <span className='text-sm'>
                      Rp {(order.amount_total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {orders.length} of {totalCount} orders
          </div>
        )}
      </Main>

      {/* Customer Selector Dialog */}
      <Dialog open={showCustomerSelector} onOpenChange={setShowCustomerSelector}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Choose a customer to create a new order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Customer List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoadingCustomers && customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customers found
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.name}
                    className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="font-semibold">{customer.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.city || customer.street || 'No address'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Order Sheet - After customer selection */}
      {showOrderSheet && selectedCustomer && (
        <SalesOrderSheet
          open={showOrderSheet}
          onOpenChange={handleOrderSheetClose}
          customerId={selectedCustomer.name}
          customerName={selectedCustomer.customer_name}
          onComplete={handleOrderComplete}
          readOnly={false}
        />
      )}

      {/* View Order Sheet - Existing orders */}
      {selectedEntity && selectedEntity.mode === 'view' && (
        <SalesOrderSheet
          open={!!selectedEntity}
          onOpenChange={(open) => !open && handleClose()}
          customerId={order?.partner_id || ''}
          customerName={order?.customer_name || ''}
          existingOrderId={selectedEntity.id}
          onComplete={handleViewOrderClose}
          readOnly={true}
        />
      )}
    </>
  )
}
