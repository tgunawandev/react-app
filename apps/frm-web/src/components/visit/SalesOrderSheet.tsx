/**
 * SalesOrderSheet Component
 * Full-screen bottom sheet for creating sales orders during visit
 * Compact version with product search and line item management
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { VisitActivitySheet } from './VisitActivitySheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Loader2,
  Package,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/useDebounce'

interface Product {
  item_code: string
  item_name: string
  barcode?: string
  category?: string
  category_display_name?: string
  uom: string
  secondary_uom?: string
  secondary_uom_factor?: number
  list_price: number
  secondary_uom_price?: number
  qty_available: number
  available_stock: number
  in_stock: boolean
  image_url?: string
}

interface OrderItem {
  item_code: string
  item_name: string
  uom: string
  secondary_uom?: string
  secondary_uom_factor?: number
  qty: number
  rate: number
  amount: number
}

interface SalesOrderSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Customer ID */
  customerId: string
  /** Customer name for display */
  customerName?: string
  /** Visit ID for linking order */
  visitId?: string
  /** Existing order ID (if viewing/editing existing order) */
  existingOrderId?: string
  /** Callback when order is complete */
  onComplete: (orderId: string) => void
  /** When true, only view data (no edit) */
  readOnly?: boolean
}

export function SalesOrderSheet({
  open,
  onOpenChange,
  customerId,
  customerName,
  visitId,
  existingOrderId,
  onComplete,
  readOnly = false,
}: SalesOrderSheetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSearch, setShowSearch] = useState(true)
  const [includeTax, setIncludeTax] = useState(true)
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null)
  const [loadedCustomerName, setLoadedCustomerName] = useState<string>('')
  // Order date defaults to today for new orders
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [pricelist, setPricelist] = useState<string>('')

  // Tax rate (PPN 11%)
  const TAX_RATE = 0.11

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch product catalog
  const {
    data: catalogData,
    isLoading: isLoadingProducts,
  } = useFrappeGetCall<{
    message: { products: Product[]; total_count: number }
  }>(
    open && showSearch ? 'frm.api.order.get_product_catalog' : null,
    open && showSearch ? {
      search: debouncedSearch,
      customer_id: customerId,
      limit: 20,
    } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Fetch order ID from visit if no existingOrderId provided
  const { data: visitOrderData } = useFrappeGetCall<{
    message: {
      order_id: string | null
    }
  }>(
    open && visitId && !existingOrderId ? 'frm.api.order.get_visit_order' : null,
    open && visitId && !existingOrderId ? { sales_visit: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Use visitOrderData.message.order_id as existingOrderId if available
  const effectiveOrderId = existingOrderId || visitOrderData?.message?.order_id || null

  // Fetch customer data to get default pricelist
  const { data: customerData, error: customerError } = useFrappeGetCall<{
    message: {
      name: string
      customer_name: string
      default_price_list?: string
    }
  }>(
    open && !effectiveOrderId && customerId ? 'frappe.client.get' : null,
    open && !effectiveOrderId && customerId ? {
      doctype: 'Customer',
      name: customerId,
      fields: ['name', 'customer_name', 'default_price_list']
    } : undefined,
    undefined,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  )

  // Debug customer data fetch
  useEffect(() => {
    if (open && !effectiveOrderId && customerId) {
      console.log('=== CUSTOMER DATA FETCH ===')
      console.log('Customer ID:', customerId)
      console.log('Customer Data:', customerData)
      console.log('Customer Error:', customerError)
    }
  }, [open, effectiveOrderId, customerId, customerData, customerError])

  // Fetch existing order details if effectiveOrderId available
  const { data: existingOrderData, isLoading: isLoadingOrder } = useFrappeGetCall<{
    message: {
      order_id: string
      customer?: {
        customer_id: string
        customer_name: string
      }
      order_date?: string
      pricelist?: string
      items: Array<{
        item_code: string
        item_name: string
        qty: number
        uom: string
        secondary_qty?: number
        secondary_uom?: string
        rate: number
        amount: number
      }>
      amount_untaxed: number
      amount_tax: number
      amount_total: number
      commitment_date?: string
      status: string
      include_tax?: number
    }
  }>(
    open && effectiveOrderId ? 'frm.api.order.get_order_detail' : null,
    effectiveOrderId ? { order_id: effectiveOrderId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Create order API
  const { call: createOrder } = useFrappePostCall('frm.api.order.create')
  // Update order API
  const { call: updateOrder } = useFrappePostCall('frm.api.order.update_order')

  const products = catalogData?.message?.products || []
  const isEditMode = !!effectiveOrderId && !!loadedOrderId

  // Calculate totals
  const { totalItems, subtotal, taxAmount, totalAmount } = useMemo(() => {
    const totalItems = orderItems.reduce((sum, item) => sum + item.qty, 0)
    const subtotal = orderItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = includeTax ? Math.round(subtotal * TAX_RATE) : 0
    const totalAmount = subtotal + taxAmount
    return { totalItems, subtotal, taxAmount, totalAmount }
  }, [orderItems, includeTax, TAX_RATE])

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      // If we have an existing order, load it for editing
      if (effectiveOrderId) {
        setShowSearch(false) // Start with cart view for editing
      } else {
        // New order mode - reset everything
        setSearchQuery('')
        setOrderItems([])
        setDeliveryDate(getDefaultDeliveryDate())
        setNotes('')
        setShowSearch(true)
        setIncludeTax(true)
        setLoadedOrderId(null)
      }
    }
  }, [open, effectiveOrderId])

  // Load existing order data when available
  useEffect(() => {
    if (existingOrderData?.message && effectiveOrderId && loadedOrderId !== effectiveOrderId) {
      const order = existingOrderData.message

      // Map order items to local format
      const items: OrderItem[] = order.items.map((item) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        uom: item.uom,
        secondary_uom: item.secondary_uom,
        qty: item.secondary_qty || item.qty,
        rate: item.rate,
        amount: item.amount,
      }))

      setOrderItems(items)
      setDeliveryDate(order.commitment_date || getDefaultDeliveryDate())
      setIncludeTax(order.include_tax === 1 || order.amount_tax > 0)
      setLoadedCustomerName(order.customer?.customer_name || '')
      setOrderDate(order.order_date || '')
      setPricelist(order.pricelist || '')
      setLoadedOrderId(effectiveOrderId)
      setShowSearch(false)
    }
  }, [existingOrderData, effectiveOrderId, loadedOrderId])

  // Load customer pricelist for new orders
  useEffect(() => {
    if (customerData?.message && !effectiveOrderId) {
      console.log('Customer data received:', customerData.message)
      console.log('Setting pricelist to:', customerData.message.default_price_list)
      setPricelist(customerData.message.default_price_list || '')
    }
  }, [customerData, effectiveOrderId])

  // Get default delivery date (7 days from today)
  function getDefaultDeliveryDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Add product to order
  const addProduct = useCallback((product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.item_code === product.item_code)

      if (existing) {
        // Increment quantity
        return prev.map((item) =>
          item.item_code === product.item_code
            ? {
                ...item,
                qty: item.qty + 1,
                amount: (item.qty + 1) * item.rate,
              }
            : item
        )
      } else {
        // Add new item
        // Use secondary UOM price if available
        const rate = product.secondary_uom_price || product.list_price
        const newItem: OrderItem = {
          item_code: product.item_code,
          item_name: product.item_name,
          uom: product.uom,
          secondary_uom: product.secondary_uom,
          secondary_uom_factor: product.secondary_uom_factor,
          qty: 1,
          rate,
          amount: rate,
        }
        return [...prev, newItem]
      }
    })

    toast.success(`Added ${product.item_name}`)
  }, [])

  // Update item quantity by delta
  const updateQuantity = useCallback((itemCode: string, delta: number) => {
    setOrderItems((prev) => {
      return prev
        .map((item) => {
          if (item.item_code === itemCode) {
            const newQty = Math.max(0, item.qty + delta)
            if (newQty === 0) return null
            return {
              ...item,
              qty: newQty,
              amount: newQty * item.rate,
            }
          }
          return item
        })
        .filter((item): item is OrderItem => item !== null)
    })
  }, [])

  // Set item quantity directly
  const setQuantity = useCallback((itemCode: string, qty: number) => {
    setOrderItems((prev) => {
      return prev
        .map((item) => {
          if (item.item_code === itemCode) {
            const newQty = Math.max(0, qty)
            if (newQty === 0) return null
            return {
              ...item,
              qty: newQty,
              amount: newQty * item.rate,
            }
          }
          return item
        })
        .filter((item): item is OrderItem => item !== null)
    })
  }, [])

  // Remove item
  const removeItem = useCallback((itemCode: string) => {
    setOrderItems((prev) => prev.filter((item) => item.item_code !== itemCode))
  }, [])

  // Handle submit (create or update)
  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item to the order')
      return
    }

    setIsSubmitting(true)

    try {
      // Build items array for API
      const items = orderItems.map((item) => ({
        item_code: item.item_code,
        qty: item.qty,
        rate: item.rate,
      }))

      if (isEditMode && effectiveOrderId) {
        // Update existing order
        const result = await updateOrder({
          order_id: effectiveOrderId,
          items: items,
          delivery_date: deliveryDate,
          order_notes: notes,
        })

        if (result?.message?.order_id) {
          toast.success(`Order ${effectiveOrderId} updated`)
          onComplete(effectiveOrderId)
          onOpenChange(false)
        } else {
          toast.error('Failed to update order')
        }
      } else {
        // Create new order
        const result = await createOrder({
          customer: customerId,
          sales_visit: visitId,
          items: items,
          commitment_date: deliveryDate,
          order_notes: notes,
          include_tax: includeTax,
          pricelist: pricelist,
        })

        if (result?.message?.sales_order_id) {
          toast.success(`Order ${result.message.sales_order_id} created`)
          onComplete(result.message.sales_order_id)
          onOpenChange(false)
        } else {
          toast.error('Failed to create order')
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : isEditMode ? 'Failed to update order' : 'Failed to create order'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle skip
  const handleSkip = () => {
    toast.info('Order creation skipped')
    onComplete('')
  }

  // Determine title and labels based on mode
  const sheetTitle = readOnly
    ? effectiveOrderId || 'View Order'
    : isEditMode
    ? `Edit Order ${effectiveOrderId}`
    : 'Create Order'

  const sheetDescription = readOnly
    ? (loadedCustomerName || customerName || 'Order details for customer')
    : isEditMode
    ? `Edit order for ${customerName || 'customer'}`
    : customerName
      ? `New order for ${customerName}`
      : 'Create a new sales order'

  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={sheetTitle}
      description={sheetDescription}
      submitLabel={
        isSubmitting
          ? (isEditMode ? 'Updating...' : 'Creating...')
          : (isEditMode ? `Update Order (${orderItems.length} items)` : `Place Order (${orderItems.length} items)`)
      }
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={orderItems.length === 0}
      readOnly={readOnly}
      footerExtra={
        !readOnly && !isEditMode ? (
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <ShoppingCart className="h-3 w-3" />
            {orderItems.length} Item{orderItems.length !== 1 ? 's' : ''}
          </Badge>
          {totalAmount > 0 && (
            <Badge className="gap-1 ml-auto">
              Total: {formatCurrency(totalAmount)}
            </Badge>
          )}
        </div>

        {/* Loading state for existing order */}
        {isEditMode && isLoadingOrder && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Toggle between search and order items - hide in readOnly */}
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant={showSearch ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSearch(true)}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-1" />
              Search Products
            </Button>
            <Button
              variant={!showSearch ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowSearch(false)}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Cart ({orderItems.length})
            </Button>
          </div>
        )}

        {showSearch && !readOnly ? (
          /* Product Search Section */
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Product List */}
            {isLoadingProducts ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {searchQuery ? 'No products found' : 'Search for products to add'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {products.map((product) => {
                  const inCart = orderItems.some((i) => i.item_code === product.item_code)
                  const cartQty = orderItems.find((i) => i.item_code === product.item_code)?.qty || 0
                  const displayPrice = product.secondary_uom_price || product.list_price
                  const displayUom = product.secondary_uom || product.uom

                  return (
                    <div
                      key={product.item_code}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        inCart ? 'border-primary bg-primary/5' : 'border-border'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {product.item_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.item_code}
                          {product.category_display_name && ` • ${product.category_display_name}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold">
                            {formatCurrency(displayPrice)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{displayUom}
                          </span>
                          {!product.in_stock && (
                            <Badge variant="destructive" className="text-xs h-5 px-1">
                              Out of stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.item_code, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={cartQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              if (val > 0) {
                                setQuantity(product.item_code, val)
                              }
                            }}
                            className="h-8 w-14 text-center text-sm font-medium"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.item_code, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addProduct(product)}
                          disabled={!product.in_stock}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Order Items Section */
          <div className="space-y-3">
            {orderItems.length === 0 && !isLoadingOrder ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{readOnly ? 'No items in order' : 'Cart is empty'}</p>
                {!readOnly && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowSearch(true)}
                  >
                    Search products to add
                  </Button>
                )}
              </div>
            ) : orderItems.length === 0 ? null : (
              <>
                {/* Cart items list */}
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {orderItems.map((item) => {
                    const displayUom = item.secondary_uom || item.uom

                    return (
                      <div
                        key={item.item_code}
                        className="p-3 rounded-lg border space-y-2"
                      >
                        {/* Row 1: Product name + price + remove */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.item_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.item_code}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {formatCurrency(item.rate)}/{displayUom}
                          </div>
                          {!readOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => removeItem(item.item_code)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Row 2: Quantity controls + total */}
                        <div className="flex items-center justify-between">
                          {readOnly ? (
                            <div className="text-sm text-muted-foreground">
                              Qty: <span className="font-medium text-foreground">{item.qty}</span> {displayUom}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.item_code, -1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  if (val > 0) {
                                    setQuantity(item.item_code, val)
                                  }
                                }}
                                className="h-8 w-14 text-center text-sm font-medium"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.item_code, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="font-semibold">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Order Details */}
                <div className="space-y-3 pt-2 border-t">
                  {/* Order Date and Delivery Date - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Order Date (always readonly) */}
                    <div className="space-y-1.5">
                      <Label className="text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Order Date
                      </Label>
                      <Input
                        type="date"
                        value={orderDate}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>

                    {/* Delivery Date */}
                    <div className="space-y-1.5">
                      <Label className="text-sm flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Delivery Date
                      </Label>
                      <Input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={readOnly}
                        className={readOnly ? "bg-muted/50" : ""}
                      />
                    </div>
                  </div>

                  {/* Pricelist (always show) */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Pricelist</Label>
                    <Input
                      type="text"
                      value={pricelist || 'No pricelist'}
                      disabled
                      className="bg-muted/50 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Notes (Optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special instructions..."
                      className="min-h-[60px]"
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span>{totalItems} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {/* Tax Toggle */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="include-tax"
                        checked={includeTax}
                        onCheckedChange={(checked) => setIncludeTax(checked === true)}
                        disabled={readOnly}
                      />
                      <label htmlFor="include-tax" className={cn("text-muted-foreground", !readOnly && "cursor-pointer")}>
                        PPN (11%)
                      </label>
                    </div>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total:</span>
                    <span className="text-lg">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </VisitActivitySheet>
  )
}
