/**
 * DeliveryReturnSheet Component
 * Two-step modal for creating delivery returns outside visit flow
 * Pattern: Matches PaymentEntrySheet exactly
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useEffect, useMemo } from 'react'
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk'
import { VisitActivitySheet } from '@/components/visit/VisitActivitySheet'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Search, AlertCircle, RotateCcw, ArrowLeft, Camera, X, Package, Calendar, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Customer {
  name: string
  customer_name: string
  customer_code?: string
}

interface Delivery {
  name: string
  customer: string
  customer_name: string
  delivery_date: string
  sfa_state: string
  odoo_name?: string
  sales_order?: string
  items?: Array<{ product: string; product_name?: string; quantity: number }>
}

interface DeliveryItem {
  product: string
  product_name?: string
  demand: number
  quantity_done: number
  uom?: string
}

interface ItemReturnDetails {
  returnQty: number
  reason: string
  photoFile: File | null
  photoPreview: string | null
}

interface DeliveryReturnSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const RETURN_REASONS = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Defective', label: 'Defective' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Wrong Product', label: 'Wrong Product' },
  { value: 'Customer Dissatisfaction', label: 'Customer Dissatisfaction' },
  { value: 'Other', label: 'Other' }
]

export function DeliveryReturnSheet({ open, onOpenChange, onComplete }: DeliveryReturnSheetProps) {
  const [step, setStep] = useState<'customer' | 'return'>('customer')

  // Customer selection state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Return creation state
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [itemReturnDetails, setItemReturnDetails] = useState<Map<string, ItemReturnDetails>>(new Map())
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API hooks
  const { data: customerData, isLoading: isLoadingCustomers } = useFrappeGetCall<{
    message: { customers: Customer[] }
  }>(
    open && step === 'customer' ? 'frm.api.customer.get_my_customers' : null,
    {
      search: searchTerm || undefined,
      limit: 1000
    },
    open && step === 'customer' ? `customer-list-return-${searchTerm}` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000
    }
  )

  const { data: deliveryData, isLoading: isLoadingDeliveries } = useFrappeGetCall<{
    message: { deliveries: Delivery[] }
  }>(
    selectedCustomer ? 'frm.api.delivery.get_returnable_deliveries' : null,
    selectedCustomer ? { customer_id: selectedCustomer.name, limit: 100 } : undefined,
    selectedCustomer ? `returnable-deliveries-${selectedCustomer.name}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,  // Always fetch fresh data when component mounts
      dedupingInterval: 0  // Disable deduplication to force fresh fetch
    }
  )

  const { data: deliveryDetailData } = useFrappeGetCall<{ message: Delivery }>(
    selectedDelivery ? 'frm.api.delivery.get_delivery_detail' : null,
    selectedDelivery ? { delivery_id: selectedDelivery.name } : undefined,
    selectedDelivery ? `delivery-detail-${selectedDelivery.name}` : null,
    { revalidateOnFocus: false }
  )

  const { call: createReturn } = useFrappePostCall('frm.api.delivery.create_delivery_return')
  const { upload: uploadPhoto } = useFrappeFileUpload()

  const customers = customerData?.message?.customers || []
  const deliveries = deliveryData?.message?.deliveries || []
  const deliveryDetail = deliveryDetailData?.message
  const deliveryItems: DeliveryItem[] = deliveryDetail?.items || []

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('customer')
      setSearchTerm('')
      setSelectedCustomer(null)
      setSelectedDelivery(null)
      setSelectedItems(new Set())
      setItemReturnDetails(new Map())
      setNotes('')
      setIsSubmitting(false)
    }
  }, [open])

  // Cleanup photo preview URLs when component unmounts
  useEffect(() => {
    return () => {
      itemReturnDetails.forEach((details) => {
        if (details.photoPreview) {
          URL.revokeObjectURL(details.photoPreview)
        }
      })
    }
  }, [itemReturnDetails])

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setStep('return')
  }

  const handleBack = () => {
    setSelectedCustomer(null)
    setSelectedDelivery(null)
    setSelectedItems(new Set())
    setItemReturnDetails(new Map())
    setStep('customer')
  }

  const handleDeliverySelect = (delivery: Delivery) => {
    if (selectedDelivery?.name === delivery.name) {
      setSelectedDelivery(null)
      setSelectedItems(new Set())
      setItemReturnDetails(new Map())
    } else {
      setSelectedDelivery(delivery)
      setSelectedItems(new Set())
      setItemReturnDetails(new Map())
    }
  }

  const toggleItem = (productCode: string, maxQuantity: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(productCode)) {
        next.delete(productCode)
        // Remove item details when deselecting
        setItemReturnDetails(prevDetails => {
          const nextDetails = new Map(prevDetails)
          const details = nextDetails.get(productCode)
          if (details?.photoPreview) {
            URL.revokeObjectURL(details.photoPreview)
          }
          nextDetails.delete(productCode)
          return nextDetails
        })
      } else {
        next.add(productCode)
        // Set default values when selecting
        setItemReturnDetails(prevDetails => {
          const nextDetails = new Map(prevDetails)
          nextDetails.set(productCode, {
            returnQty: maxQuantity,
            reason: 'Damaged',
            photoFile: null,
            photoPreview: null
          })
          return nextDetails
        })
      }
      return next
    })
  }

  const handleQuantityChange = (productCode: string, value: string, maxQuantity: number) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return
    }
    const clampedValue = Math.min(numValue, maxQuantity)
    setItemReturnDetails(prev => {
      const next = new Map(prev)
      const existing = next.get(productCode)
      if (existing) {
        next.set(productCode, { ...existing, returnQty: clampedValue })
      }
      return next
    })
  }

  const handleItemReasonChange = (productCode: string, reason: string) => {
    setItemReturnDetails(prev => {
      const next = new Map(prev)
      const existing = next.get(productCode)
      if (existing) {
        next.set(productCode, { ...existing, reason })
      }
      return next
    })
  }

  const handleItemPhotoChange = (productCode: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setItemReturnDetails(prev => {
      const next = new Map(prev)
      const existing = next.get(productCode)
      if (existing) {
        // Cleanup old preview
        if (existing.photoPreview) {
          URL.revokeObjectURL(existing.photoPreview)
        }
        next.set(productCode, {
          ...existing,
          photoFile: file,
          photoPreview: URL.createObjectURL(file)
        })
      }
      return next
    })
  }

  const handleRemoveItemPhoto = (productCode: string) => {
    setItemReturnDetails(prev => {
      const next = new Map(prev)
      const existing = next.get(productCode)
      if (existing) {
        if (existing.photoPreview) {
          URL.revokeObjectURL(existing.photoPreview)
        }
        next.set(productCode, {
          ...existing,
          photoFile: null,
          photoPreview: null
        })
      }
      return next
    })
  }

  const handleSelectAllItems = () => {
    if (selectedItems.size === deliveryItems.length) {
      setSelectedItems(new Set())
      setItemReturnDetails(new Map())
    } else {
      setSelectedItems(new Set(deliveryItems.map(item => item.product)))
      // Set default details for all items
      const details = new Map<string, ItemReturnDetails>()
      deliveryItems.forEach(item => {
        details.set(item.product, {
          returnQty: item.quantity_done,
          reason: 'Damaged',
          photoFile: null,
          photoPreview: null
        })
      })
      setItemReturnDetails(details)
    }
  }

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }

    if (!selectedDelivery) {
      toast.error('Please select a delivery order')
      return
    }

    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to return')
      return
    }

    // Validate each item has photo evidence
    for (const productCode of selectedItems) {
      const details = itemReturnDetails.get(productCode)
      if (!details?.photoFile) {
        const item = deliveryItems.find(i => i.product === productCode)
        toast.error(`Please upload photo evidence for ${item?.product_name || productCode}`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Upload all photos and prepare return items with per-item details
      const returnItems = await Promise.all(
        Array.from(selectedItems).map(async (productCode) => {
          const details = itemReturnDetails.get(productCode)!
          const item = deliveryItems.find(i => i.product === productCode)!

          // Upload photo for this item
          let photoUrl = ''
          if (details.photoFile) {
            const uploadResult = await uploadPhoto(details.photoFile, {
              isPrivate: false,
              folder: 'Home/Attachments'
            })
            photoUrl = uploadResult.file_url
          }

          return {
            product: productCode,
            quantity: details.returnQty,
            reason: details.reason,
            photo: photoUrl
          }
        })
      )

      // Create delivery return
      const result = await createReturn({
        delivery_id: selectedDelivery.name,
        items: JSON.stringify(returnItems),
        notes: notes || undefined,
        return_type: selectedItems.size === deliveryItems.length ? 'full' : 'partial'
      })

      if (result?.message?.return_id) {
        toast.success('Delivery return created successfully')
        onComplete()
        onOpenChange(false)
      } else {
        toast.error('Failed to create delivery return')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create delivery return'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={step === 'customer' ? 'Select Customer' : 'Create Delivery Return'}
      description={
        step === 'customer'
          ? 'Choose a customer to create delivery return'
          : 'Select delivery order and items to return'
      }
      submitLabel="Create Return"
      onSubmit={step === 'return' ? handleSubmit : undefined}
      hideSubmit={step === 'customer'}
      isSubmitting={isSubmitting}
      submitDisabled={
        step === 'return' && (
          !selectedDelivery ||
          selectedItems.size === 0 ||
          Array.from(selectedItems).some(productCode => {
            const details = itemReturnDetails.get(productCode)
            return !details?.photoFile
          })
        )
      }
    >
      {step === 'customer' ? (
        /* ========== STEP 1: CUSTOMER SELECTION ========== */
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Customer List */}
          {isLoadingCustomers ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {searchTerm ? `No customers found matching "${searchTerm}"` : 'No customers found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.name}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {customer.customer_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {customer.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========== STEP 2: DELIVERY RETURN CREATION ========== */
        <div className="space-y-4">
          {/* Customer Info + Change Button */}
          <div className="pb-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Customer</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Change
              </Button>
            </div>
            <div>
              <div className="font-medium text-sm truncate">{selectedCustomer?.customer_name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{selectedCustomer?.name}</div>
            </div>
          </div>

          {/* Delivery Selection */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Select Delivery Order</div>
            {isLoadingDeliveries ? (
              <Skeleton className="h-20 w-full" />
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No completed deliveries available for this customer
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto px-0.5">
                {deliveries.map((delivery) => {
                  const isSelected = selectedDelivery?.name === delivery.name
                  return (
                    <div
                      key={delivery.name}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/50'
                      )}
                      onClick={() => handleDeliverySelect(delivery)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{delivery.name}</div>
                          {delivery.odoo_name && (
                            <div className="text-xs text-muted-foreground truncate">Odoo: {delivery.odoo_name}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(delivery.delivery_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                          {delivery.sfa_state}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Items to Return (only shown when delivery is selected) */}
          {selectedDelivery && deliveryItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Items to Return</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllItems}
                  className="h-7 text-xs"
                >
                  {selectedItems.size === deliveryItems.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto px-0.5">
                {deliveryItems.map((item) => {
                  const isSelected = selectedItems.has(item.product)
                  const details = itemReturnDetails.get(item.product)
                  const returnQty = details?.returnQty || item.quantity_done
                  const reason = details?.reason || 'Damaged'
                  const photoPreview = details?.photoPreview
                  return (
                    <div
                      key={item.product}
                      className={cn(
                        'p-3 rounded-lg border transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      {/* Header Row: Checkbox + Product Name */}
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleItem(item.product, item.quantity_done)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItem(item.product, item.quantity_done)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {item.product_name || item.product}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Delivered: {item.quantity_done} {item.uom || 'units'}
                          </div>
                        </div>
                      </div>

                      {/* Return Details (shown when selected) */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t space-y-3">
                          {/* Delivered Qty - READONLY with gray background */}
                          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md">
                            <span className="text-xs text-muted-foreground">Delivered Qty:</span>
                            <span className="text-xs font-medium">
                              {item.quantity_done} {item.uom || 'units'}
                            </span>
                          </div>

                          {/* Return Qty - EDITABLE with white background */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Return Qty *</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity_done}
                                step="any"
                                value={returnQty}
                                onChange={(e) => handleQuantityChange(item.product, e.target.value, item.quantity_done)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-10 text-sm font-medium border-input bg-background"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {item.uom || 'units'}
                              </span>
                            </div>
                          </div>

                          {/* Return Reason - EDITABLE with white background */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Return Reason *</label>
                            <Select
                              value={reason}
                              onValueChange={(val) => handleItemReasonChange(item.product, val)}
                            >
                              <SelectTrigger className="h-10 text-sm font-medium bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RETURN_REASONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Photo Evidence - EDITABLE */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Photo Evidence *</label>
                            {photoPreview ? (
                              <div className="relative rounded-md overflow-hidden border">
                                <img
                                  src={photoPreview}
                                  alt="Return evidence"
                                  className="w-full h-32 object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2 h-7 w-7 p-0 shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveItemPhoto(item.product)
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed rounded-md p-4 text-center hover:bg-accent/50 transition-colors cursor-pointer bg-background">
                                <label className="cursor-pointer block">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleItemPhotoChange(item.product, e)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Camera className="h-8 w-8 mx-auto mb-1.5 text-muted-foreground" />
                                  <p className="text-xs font-medium text-foreground">
                                    Click to upload photo
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Max 5MB • JPG, PNG
                                  </p>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Additional Notes (Optional) */}
          {selectedDelivery && selectedItems.size > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes (Optional)</label>
              <Textarea
                placeholder="Add any additional information about this return..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
          )}
        </div>
      )}
    </VisitActivitySheet>
  )
}
