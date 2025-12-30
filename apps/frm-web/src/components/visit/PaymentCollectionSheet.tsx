/**
 * PaymentCollectionSheet Component
 * Full-screen bottom sheet for collecting payments during visit
 * Compact version of PaymentPage optimized for mobile visit flow
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk'
import { VisitActivitySheet } from './VisitActivitySheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  FileText,
  Camera,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Invoice {
  invoice_id: string
  invoice_number: string
  invoice_date: string
  grand_total: number
  outstanding_amount: number
  payment_state?: string
}

interface PaymentCollectionSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Customer ID */
  customerId: string
  /** Customer name for display */
  customerName?: string
  /** Visit ID for linking payment */
  visitId?: string
  /** Callback when payment is complete */
  onComplete: (paymentId: string) => void
  /** When true, only view data (no edit) */
  readOnly?: boolean
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'Bank Transfer', label: 'Bank Transfer', icon: CreditCard },
  { value: 'Check', label: 'Check', icon: FileText },
]

export function PaymentCollectionSheet({
  open,
  onOpenChange,
  customerId,
  customerName,
  visitId,
  onComplete,
  readOnly = false,
}: PaymentCollectionSheetProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload } = useFrappeFileUpload()

  // Fetch outstanding invoices (only in edit mode)
  const {
    data: invoiceData,
    isLoading,
  } = useFrappeGetCall<{
    message: { invoices: Invoice[] }
  }>(
    open && customerId && !readOnly ? 'frm.api.payment.get_outstanding_invoices' : null,
    open && customerId && !readOnly ? { customer_id: customerId } : undefined,
    open && customerId && !readOnly ? `payment-invoices-${customerId}` : null,
    { revalidateOnFocus: false }
  )

  // Fetch payment details if visit has a payment (both edit and read-only mode)
  const {
    data: paymentData,
    isLoading: isLoadingPayment,
  } = useFrappeGetCall<{
    message: {
      payment_id: string
      amount: number
      payment_method: string
      notes: string
      photo_urls: string[]
      allocated_invoices: Array<{
        invoice_number: string
        invoice_date: string
        allocated_amount: number
      }>
    }
  }>(
    open && visitId ? 'frm.api.payment.get_visit_payment' : null,
    open && visitId ? { sales_visit: visitId } : undefined,
    open && visitId ? `visit-payment-${visitId}` : null,
    { revalidateOnFocus: false }
  )

  // Create payment API
  const { call: createPayment } = useFrappePostCall('frm.api.payment.create_payment_entry')

  // Use allocated invoices if payment exists, outstanding invoices otherwise
  const invoices = paymentData?.message?.payment_id && paymentData?.message?.allocated_invoices
    ? paymentData.message.allocated_invoices.map(inv => ({
        invoice_id: inv.invoice_number,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        grand_total: inv.allocated_amount,
        outstanding_amount: inv.allocated_amount,
        payment_state: readOnly ? 'Paid' : 'Allocated'
      }))
    : (invoiceData?.message?.invoices || [])

  // Calculate total selected amount
  const totalSelected = useMemo(() => {
    return invoices
      .filter((inv) => selectedInvoices.has(inv.invoice_id))
      .reduce((sum, inv) => sum + inv.outstanding_amount, 0)
  }, [invoices, selectedInvoices])

  // Auto-fill amount when selection changes
  useEffect(() => {
    if (totalSelected > 0) {
      setAmount(Math.round(totalSelected).toString())
    }
  }, [totalSelected])

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (open) {
      // Check if existing payment data exists
      if (paymentData?.message && paymentData.message.payment_id) {
        // Populate fields with existing payment data (view or edit mode)
        const data = paymentData.message
        setPaymentMethod(data.payment_method || 'Cash')
        setAmount(data.amount.toString())
        setNotes(data.notes || '')

        // Select allocated invoices
        if (data.allocated_invoices && data.allocated_invoices.length > 0) {
          const invoiceIds = data.allocated_invoices.map(inv => inv.invoice_number)
          setSelectedInvoices(new Set(invoiceIds))
        } else {
          setSelectedInvoices(new Set())
        }

        // Set photo preview if exists
        if (data.photo_urls && data.photo_urls.length > 0) {
          setPhotoPreview(data.photo_urls[0])
        } else {
          setPhotoPreview(null)
        }
        setPhotoFile(null)
      } else if (!readOnly) {
        // Reset for new payment entry (no existing payment)
        setSelectedInvoices(new Set())
        setPaymentMethod('Cash')
        setAmount('')
        setNotes('')
        setPhotoFile(null)
        setPhotoPreview(null)
      }
    }
  }, [open, readOnly, paymentData])

  // Toggle invoice selection
  const toggleInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) => {
      const next = new Set(prev)
      if (next.has(invoiceId)) {
        next.delete(invoiceId)
      } else {
        next.add(invoiceId)
      }
      return next
    })
  }

  // Select/deselect all
  const toggleAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(invoices.map((inv) => inv.invoice_id)))
    }
  }

  // Handle photo capture
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))

    // Reset input
    if (e.target) e.target.value = ''
  }

  // Remove photo
  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoFile(null)
    setPhotoPreview(null)
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

  // Handle submit
  const handleSubmit = async () => {
    // Validation
    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (selectedInvoices.size === 0) {
      toast.error('Please select at least one invoice')
      return
    }

    // Photo required only for new payments (not when editing existing)
    if (!photoFile && !paymentData?.message?.payment_id) {
      toast.error('Payment evidence photo is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photo if present
      let photoUrls: string[] = []
      if (photoFile) {
        const result = await upload(photoFile, { isPrivate: false })
        photoUrls = [result.file_url]
      }

      // Build invoice allocations (full amount per selected invoice)
      const invoiceAllocations = invoices
        .filter((inv) => selectedInvoices.has(inv.invoice_id))
        .map((inv) => ({
          invoice: inv.invoice_id,
          allocated_amount: inv.outstanding_amount,
        }))

      // Create payment (DO NOT sync to Odoo yet - only on visit completion)
      const result = await createPayment({
        customer_id: customerId,
        amount: paymentAmount,
        payment_method: paymentMethod,
        invoice_allocations: JSON.stringify(invoiceAllocations),
        payment_photos: JSON.stringify(photoUrls),
        sales_visit: visitId,
        notes: notes,
        submit_to_odoo: false,  // Only sync when visit is completed
      })

      if (result?.message?.success) {
        toast.success('Payment recorded successfully')
        onComplete(result.message.payment_id)
        onOpenChange(false)
      } else {
        toast.error(result?.message?.message || 'Failed to create payment')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle skip
  const handleSkip = () => {
    toast.info('Payment collection skipped')
    onComplete('')
  }

  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={readOnly ? 'View Payment' : paymentData?.message?.payment_id ? 'Edit Payment' : 'Collect Payment'}
      description={
        readOnly
          ? `Payment recorded for ${customerName || 'customer'}`
          : paymentData?.message?.payment_id
            ? `Update payment for ${customerName || 'customer'}`
            : customerName ? `Record payment from ${customerName}` : 'Record customer payment'
      }
      submitLabel={isSubmitting ? 'Processing...' : paymentData?.message?.payment_id ? 'Update Payment' : 'Submit Payment'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={
        selectedInvoices.size === 0 ||
        !amount ||
        parseFloat(amount) <= 0 ||
        (!photoFile && !paymentData?.message?.payment_id)  // Photo required only for new payments
      }
      readOnly={readOnly}
      footerExtra={
        !readOnly && (
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {invoices.length} Invoice{invoices.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {selectedInvoices.size} Selected
          </Badge>
          {totalSelected > 0 && (
            <Badge className="gap-1 ml-auto">
              Total: {formatCurrency(totalSelected)}
            </Badge>
          )}
        </div>

        {/* Invoice List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {readOnly
                ? 'Paid Invoices'
                : paymentData?.message?.payment_id
                  ? 'Allocated Invoices'
                  : 'Outstanding Invoices'}
            </Label>
            {invoices.length > 0 && !readOnly && (
              <Button variant="link" size="sm" className="h-auto p-0" onClick={toggleAll}>
                {selectedInvoices.size === invoices.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {(isLoading || isLoadingPayment) ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {readOnly ? 'No invoices paid' : 'No outstanding invoices'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {invoices.map((invoice) => {
                const isSelected = selectedInvoices.has(invoice.invoice_id)
                return (
                  <div
                    key={invoice.invoice_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      !readOnly && 'cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    )}
                    onClick={() => !readOnly && toggleInvoice(invoice.invoice_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="pointer-events-none"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.invoice_date}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">
                        {formatCurrency(invoice.outstanding_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        of {formatCurrency(invoice.grand_total)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="space-y-3 pt-2 border-t">
          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={readOnly}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <method.icon className="h-4 w-4" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment Amount</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={amount ? new Intl.NumberFormat('en-US').format(parseFloat(amount) || 0) : ''}
              onChange={(e) => {
                // Remove thousand separators (commas) and keep only digits
                const rawValue = e.target.value.replace(/,/g, '')
                if (rawValue === '' || /^\d+$/.test(rawValue)) {
                  setAmount(rawValue)
                }
              }}
              placeholder="Enter payment amount"
              readOnly={readOnly}
              autoFocus={!readOnly}
            />
          </div>

          {/* Photo Evidence */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Payment Evidence {paymentData?.message?.payment_id ? '(Optional)' : <span className="text-destructive">*</span>}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative w-full">
                <img
                  src={photoPreview}
                  alt="Payment evidence"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                {!readOnly && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removePhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : !readOnly ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">No photo attached</span>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="min-h-[60px]"
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Total Summary */}
        {selectedInvoices.size > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Invoices:</span>
              <span>{selectedInvoices.size}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span className="text-lg">{formatCurrency(totalSelected)}</span>
            </div>
          </div>
        )}
      </div>
    </VisitActivitySheet>
  )
}
