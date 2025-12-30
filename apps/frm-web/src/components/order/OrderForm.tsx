/**
 * Order Form Component
 * Shared form for creating, editing, and viewing sales orders
 * Reference: specs/001-sfa-app-build/tasks.md Phase 1 (Sales Order CRUD)
 */

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X, Loader2, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomerSelect } from '@/components/customer/CustomerSelect'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {  orderCreateSchema,
  orderEditSchema,  type OrderFormData,
  type OrderItemData,
} from '@/lib/order-schema'
import { useProductCatalog } from '@/hooks/useProductCatalog'
import { useOrder } from '@/hooks/useOrder'
import { toast } from 'sonner'

export interface OrderFormProps {
  /** Form mode */
  mode: 'create' | 'edit' | 'view'
  /** Initial form values */
  initialValues?: Partial<OrderFormData>
  /** Submit handler */
  onSubmit?: (data: OrderFormData) => Promise<void> | void
  /** Cancel handler */
  onCancel?: () => void
  /** Loading state */
  isLoading?: boolean
}

export function OrderForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrderFormProps) {
  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Controlled date states
  const [transactionDate, setTransactionDate] = useState(initialValues?.transaction_date || '')
  const [deliveryDate, setDeliveryDate] = useState(initialValues?.delivery_date || '')

  // Select schema based on mode
  const schema = mode === 'create' ? orderCreateSchema : orderEditSchema

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedValues = watch()
  const isViewMode = mode === 'view'

  // Hooks for product catalog and pricing
  const { products } = useProductCatalog({
    limit: 200,
    search: productSearch
  })
  const { getPricing } = useOrder()

  // Sync date states with initialValues
  useEffect(() => {
    if (initialValues?.transaction_date) {
      setTransactionDate(initialValues.transaction_date)
    }
    if (initialValues?.delivery_date) {
      setDeliveryDate(initialValues.delivery_date)
    }
  }, [initialValues])

  // Calculate totals (no discount)
  const calculateItemAmount = (item: Partial<OrderItemData>) => {
    const qty = item.qty || 0
    const rate = item.rate || 0
    return qty * rate
  }

  const total = React.useMemo(() => {
    return watchedValues.items?.reduce((sum, item) => {
      return sum + calculateItemAmount(item)
    }, 0) || 0
  }, [watchedValues.items])

  const grandTotal = total // Simplified - no taxes in this version

  // Add product to order with pricing from API
  const handleAddProduct = async () => {
    if (!selectedItem) {
      toast.error('Please select a product')
      return
    }

    if (!watchedValues.customer) {
      toast.error('Please select a customer first')
      return
    }

    const product = products.find(p => p.item_code === selectedItem)
    if (!product) return

    try {
      // Get customer-specific pricing
      const pricingData = await getPricing(
        watchedValues.customer,
        [{ item_code: selectedItem, qty: quantity }],
        true // apply_schemes
      )

      if (pricingData && pricingData.pricing.length > 0) {
        const itemPricing = pricingData.pricing[0]

        // Check if item already in cart
        const existingIndex = fields.findIndex(f => watchedValues.items?.[fields.indexOf(f)]?.item_code === selectedItem)

        if (existingIndex >= 0) {
          // Update quantity
          const currentQty = watchedValues.items?.[existingIndex]?.qty || 0
          setValue(`items.${existingIndex}.qty`, currentQty + quantity)
          toast.success('Updated quantity')
        } else {
          // Add new item
          append({
            item_code: product.item_code,
            item_name: product.item_name,
            qty: quantity,
            uom: product.uom || 'Unit',
            rate: itemPricing.applied_rate, // Customer-specific price
            amount: itemPricing.line_total,
          } as OrderItemData)
          toast.success('Product added to order')
        }

        // Reset selection
        setSelectedItem('')
        setQuantity(1)
        setProductSearch('')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to get pricing')
    }
  }

  return (
    <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6">
      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
          <CardDescription>Basic order details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              Customer <span className="text-destructive">*</span>
            </Label>
            {mode === 'create' ? (
              <CustomerSelect
                value={watchedValues.customer || ''}
                onValueChange={(id, name) => {
                  setValue('customer', id)
                  setValue('customer_name', name || '')
                }}
                placeholder="Search customers..."
                disabled={isLoading}
                error={!!errors.customer}
              />
            ) : (
              <>
                <Input
                  id="customer"
                  value={watchedValues.customer || ''}
                  disabled={true}
                  className="bg-muted"
                />
                {watchedValues.customer_name && (
                  <p className="text-sm text-muted-foreground">{watchedValues.customer_name}</p>
                )}
              </>
            )}
            {errors.customer && (
              <p className="text-sm text-destructive">{errors.customer.message}</p>
            )}
          </div>

          {/* Sales Visit (readonly in edit mode) */}
          {mode !== 'view' && (
            <div className="space-y-2">
              <Label htmlFor="sales_visit">
                Sales Visit {mode === 'create' && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="sales_visit"
                {...register('sales_visit')}
                placeholder="Visit ID"
                disabled={isViewMode || isLoading || mode === 'edit'}
                className={mode === 'edit' ? 'bg-muted' : ''}
              />
              {errors.sales_visit && (
                <p className="text-sm text-destructive">{errors.sales_visit.message}</p>
              )}
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">Sales visit cannot be changed after creation</p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">
                Transaction Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={transactionDate}
                onChange={(e) => {
                  setTransactionDate(e.target.value)
                  setValue('transaction_date', e.target.value)
                }}
                disabled={isViewMode || isLoading}
              />
              {errors.transaction_date && (
                <p className="text-sm text-destructive">{errors.transaction_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">
                Delivery Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="delivery_date"
                type="date"
                value={deliveryDate}
                onChange={(e) => {
                  setDeliveryDate(e.target.value)
                  setValue('delivery_date', e.target.value)
                }}
                disabled={isViewMode || isLoading}
              />
              {errors.delivery_date && (
                <p className="text-sm text-destructive">{errors.delivery_date.message}</p>
              )}
            </div>
          </div>

          {/* Territory (readonly) */}
          {watchedValues.territory && (
            <div className="space-y-2">
              <Label htmlFor="territory">Territory</Label>
              <Input
                id="territory"
                value={watchedValues.territory}
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {/* Order Notes */}
          <div className="space-y-2">
            <Label htmlFor="order_notes">Order Notes</Label>
            <Textarea
              id="order_notes"
              {...register('order_notes')}
              placeholder="Additional notes or instructions..."
              rows={3}
              disabled={isViewMode || isLoading}
            />
            {errors.order_notes && (
              <p className="text-sm text-destructive">{errors.order_notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Products in this order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Selection (Not in view mode and customer selected) */}
          {!isViewMode && watchedValues.customer && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="productSearch">Search Products</Label>
                <Input
                  id="productSearch"
                  placeholder="Type to search..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Select Product</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                    {products.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {productSearch ? 'No products found' : 'Type to search products'}
                      </div>
                    ) : (
                      products.map(product => (
                        <SelectItem key={product.item_code} value={product.item_code}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-sm line-clamp-1">{product.item_name}</span>
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="truncate">{product.item_code}</span>
                              <span className="font-semibold text-foreground shrink-0">
                                {product.list_price ? `Rp ${product.list_price.toLocaleString()}` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedItem || isLoading}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No items added yet</p>
              {!isViewMode && watchedValues.customer && (
                <p className="text-sm mt-2">Use the product search above to add items</p>
              )}
              {!isViewMode && !watchedValues.customer && (
                <p className="text-sm mt-2 text-destructive">Please select a customer first</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (md and up) */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Product *</TableHead>
                      <TableHead className="w-[100px]">Qty *</TableHead>
                      <TableHead className="w-[100px]">UOM</TableHead>
                      <TableHead className="w-[120px]">Price</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      {!isViewMode && <TableHead className="w-[80px]">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = watchedValues.items?.[index] || {}
                      const itemAmount = calculateItemAmount(item)
                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{item.item_name || item.item_code}</span>
                              <span className="text-xs text-muted-foreground">{item.item_code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.qty`, { valueAsNumber: true })}
                              placeholder="0"
                              disabled={isViewMode || isLoading}
                              className="min-w-[80px]"
                            />
                            {errors.items?.[index]?.qty && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.items[index]?.qty?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{item.uom || 'Unit'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">Rp {item.rate?.toLocaleString() || '0'}</span>
                          </TableCell>
                          <TableCell className="font-medium">
                            Rp {itemAmount.toLocaleString()}
                          </TableCell>
                          {!isViewMode && (
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={isLoading}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View (below md) */}
              <div className="md:hidden space-y-3">
                {fields.map((field, index) => {
                  const item = watchedValues.items?.[index] || {}
                  const itemAmount = calculateItemAmount(item)
                  return (
                    <Card key={field.id} className="border-2">
                      <CardContent className="pt-4 space-y-3">
                        {/* Item Header with Remove Button */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b">
                          <div>
                            <div className="font-medium text-sm">{item.item_name || item.item_code}</div>
                            <div className="text-xs text-muted-foreground">{item.item_code}</div>
                          </div>
                          {!isViewMode && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={isLoading}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Quantity <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.qty`, { valueAsNumber: true })}
                            placeholder="0"
                            disabled={isViewMode || isLoading}
                          />
                          {errors.items?.[index]?.qty && (
                            <p className="text-xs text-destructive">
                              {errors.items[index]?.qty?.message}
                            </p>
                          )}
                        </div>

                        {/* UOM and Price (readonly) */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">UOM</Label>
                            <div className="text-sm py-2">{item.uom || 'Unit'}</div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Price</Label>
                            <div className="text-sm py-2">Rp {item.rate?.toLocaleString() || '0'}</div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Amount</span>
                            <span className="text-base font-bold">Rp {itemAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
          {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
            <p className="text-sm text-destructive mt-2">{errors.items.message as string}</p>
          )}
        </CardContent>
      </Card>

      {/* Order Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Order Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">Rp {total.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Grand Total</span>
            <span>Rp {grandTotal.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions (not shown in view mode) */}
      {!isViewMode && (
        <div className="flex gap-3 pb-24 md:pb-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Create Order' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
