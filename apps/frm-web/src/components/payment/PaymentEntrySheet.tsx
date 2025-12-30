/**
 * PaymentEntrySheet Component
 * Standalone payment creation using VisitActivitySheet pattern
 * Two-step: 1) Select Customer, 2) Collect Payment
 * Reference: PaymentCollectionSheet from visit flow
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk'
import { VisitActivitySheet } from '@/components/visit/VisitActivitySheet'
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
  AlertCircle,
  CheckCircle2,
  Banknote,
  Search,
  ArrowLeft,
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

interface Customer {
  name: string
  customer_name: string
}

interface PaymentEntrySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'Bank Transfer', label: 'Bank Transfer', icon: CreditCard },
  { value: 'Check', label: 'Check', icon: FileText },
]

export function PaymentEntrySheet({
  open,
  onOpenChange,
  onComplete,
}: PaymentEntrySheetProps) {
  // Step management
  const [step, setStep] = useState<'customer' | 'payment'>('customer')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Payment form state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload } = useFrappeFileUpload()

  // Fetch customers for selection with server-side search
  const { data: customerData, isLoading: isLoadingCustomers } = useFrappeGetCall<{
    message: { customers: Customer[] }
  }>(
    open && step === 'customer' ? 'frm.api.customer.get_my_customers' : null,
    open && step === 'customer' ? {
      search: searchTerm || undefined,  // Server-side search parameter
      limit: 1000  // Increased limit to allow searching through more customers
    } : undefined,
    open && step === 'customer' ? `customer-list-payment-${searchTerm}` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000  // Cache search results for 2 seconds
    }
  )

  const customers = customerData?.message?.customers || []

  // No need for client-side filtering - API handles search

  // Fetch outstanding invoices for selected customer
  const {
    data: invoiceData,
    isLoading: isLoadingInvoices,
  } = useFrappeGetCall<{
    message: { invoices: Invoice[] }
  }>(
    open && step === 'payment' && selectedCustomer ? 'frm.api.payment.get_outstanding_invoices' : null,
    open && step === 'payment' && selectedCustomer ? { customer_id: selectedCustomer.name } : undefined,
    open && selectedCustomer ? `invoices-${selectedCustomer.name}` : null,
    { revalidateOnFocus: false }
  )

  const invoices = invoiceData?.message?.invoices || []

  // Create payment API
  const { call: createPayment } = useFrappePostCall('frm.api.payment.create_payment_entry')

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
      setStep('customer')
      setSearchTerm('')
      setSelectedCustomer(null)
      setSelectedInvoices(new Set())
      setPaymentMethod('Cash')
      setAmount('')
      setNotes('')
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }, [open])

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

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setStep('payment')
  }

  // Handle back to customer selection
  const handleBack = () => {
    setSelectedCustomer(null)
    setSelectedInvoices(new Set())
    setAmount('')
    setNotes('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setStep('customer')
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
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }

    const paymentAmount = parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    if (selectedInvoices.size === 0) {
      toast.error('Please select at least one invoice')
      return
    }

    setIsSubmitting(true)

    try {
      let photoUrls: string[] = []
      if (photoFile) {
        const result = await upload(photoFile, { isPrivate: false })
        photoUrls = [result.file_url]
      }

      const invoiceAllocations = invoices
        .filter((inv) => selectedInvoices.has(inv.invoice_id))
        .map((inv) => ({
          invoice: inv.invoice_id,
          allocated_amount: inv.outstanding_amount,
        }))

      const result = await createPayment({
        customer_id: selectedCustomer.name,
        amount: paymentAmount,
        payment_method: paymentMethod,
        invoice_allocations: JSON.stringify(invoiceAllocations),
        payment_photos: JSON.stringify(photoUrls),
        notes: notes,
        submit_to_odoo: true,
      })

      if (result?.message?.success) {
        toast.success('Payment recorded successfully')
        onComplete()
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

  // Customer Selection Step
  if (step === 'customer') {
    return (
      <VisitActivitySheet
        open={open}
        onOpenChange={onOpenChange}
        title="Select Customer"
        description="Choose a customer to record payment"
        submitLabel="Continue"
        onSubmit={() => {}}
        submitDisabled={true}
        hideSubmit={true}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

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
      </VisitActivitySheet>
    )
  }

  // Payment Entry Step (same as PaymentCollectionSheet)
  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title="Collect Payment"
      description={selectedCustomer ? `Record payment from ${selectedCustomer.customer_name}` : 'Record customer payment'}
      submitLabel={isSubmitting ? 'Processing...' : 'Submit Payment'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitDisabled={selectedInvoices.size === 0 || !amount || parseFloat(amount) <= 0}
    >
      <div className="space-y-4">
        {/* Customer Section */}
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

        {/* Outstanding Invoices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Outstanding Invoices</Label>
            {invoices.length > 0 && (
              <Button variant="link" size="sm" className="h-auto p-0" onClick={toggleAll}>
                {selectedInvoices.size === invoices.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {isLoadingInvoices ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border rounded-lg">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No outstanding invoices</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto px-0.5">
              {invoices.map((invoice) => {
                const isSelected = selectedInvoices.has(invoice.invoice_id)
                return (
                  <div
                    key={invoice.invoice_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    )}
                    onClick={() => toggleInvoice(invoice.invoice_id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleInvoice(invoice.invoice_id)}
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
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                const rawValue = e.target.value.replace(/,/g, '')
                if (rawValue === '' || /^\d+$/.test(rawValue)) {
                  setAmount(rawValue)
                }
              }}
              placeholder="Enter payment amount"
            />
          </div>

          {/* Photo Evidence */}
          <div className="space-y-1.5">
            <Label className="text-sm">Payment Evidence (Optional)</Label>
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
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={removePhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
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
            />
          </div>
        </div>

        {/* Total Summary */}
        {selectedInvoices.size > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1 mb-4">
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
