/**
 * Payments Page
 * Modal-based view with EntitySheet pattern (create still uses separate page)
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlusCircle, FileText, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { PaymentEntrySheet } from '@/components/payment/PaymentEntrySheet'
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
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { Badge } from '@/components/ui/badge'

interface Payment {
  name: string
  customer: string
  customer_name: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  odoo_sync_status?: string
  odoo_state?: string
  odoo_name?: string
  odoo_id?: number
  notes?: string
  invoices?: Array<{ invoice: string; allocated_amount: number }>
  photos?: Array<{ name: string; photo: string; caption?: string }>
}

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false)

  const { data, isLoading, mutate } = useFrappeGetCall<{ message: { payments: Payment[], total_count: number } }>(
    'frm.api.payment.get_payment_list',
    {
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 50,
      offset: 0
    },
    'payment-list',
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const payments = data?.message?.payments || []
  const totalCount = data?.message?.total_count || 0

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedPayment && !showModal) {
      // Create minimal payment object to trigger detail fetch
      setSelectedPayment({
        name: id,
        customer: '',
        customer_name: '',
        amount: 0,
        payment_date: '',
        payment_method: '',
        status: ''
      })
      setShowModal(true)
      // Clean up URL immediately after triggering open
      setTimeout(() => setSearchParams({}), 100)
    }
  }, [searchParams, setSearchParams, selectedPayment, showModal])

  // Filter locally by customer name/payment ID
  const filteredPayments = searchTerm
    ? payments.filter(payment =>
        payment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : payments

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPayment(null)
  }

  // Fetch payment detail when selected
  const { data: paymentData, isLoading: isLoadingPayment } = useFrappeGetCall<{ message: Payment }>(
    'frm.api.payment.get_payment_detail',
    { payment_id: selectedPayment?.name },
    selectedPayment ? undefined : null,
    { revalidateOnFocus: false }
  )

  const paymentDetail = paymentData?.message

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'outline'
      case 'submitted':
        return 'secondary'
      case 'verified':
        return 'default'
      case 'approved':
        return 'default'
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
            Payment Entries
          </h1>
          <p className='text-muted-foreground'>
            Track and manage customer payments
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search payments...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: Status filter and New Payment button */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All Status</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='Draft'>Draft</SelectItem>
                <SelectItem value='Submitted'>Submitted</SelectItem>
                <SelectItem value='Verified'>Verified</SelectItem>
                <SelectItem value='Approved'>Approved</SelectItem>
                <SelectItem value='Cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowNewPaymentModal(true)} className='shrink-0'>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && filteredPayments.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : filteredPayments.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No payments found
            </li>
          ) : (
            filteredPayments.map((payment) => (
              <li
                key={payment.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handlePaymentClick(payment)}
              >
                {/* Header: Payment ID + Customer + Status */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{payment.name}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{payment.customer_name}</p>
                  <div className='flex items-center gap-1 mt-1.5'>
                    <Badge variant={getStatusVariant(payment.status)} className='text-[10px] h-4 px-1.5'>
                      {payment.status}
                    </Badge>
                  </div>
                </div>

                {/* Odoo Integration */}
                {(payment.odoo_name || payment.odoo_state || (payment.odoo_sync_status && payment.odoo_sync_status !== 'Not Synced')) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {payment.odoo_name && <span className='truncate text-[11px]'>{payment.odoo_name}</span>}
                    {payment.odoo_state ? (
                      <Badge
                        variant={payment.odoo_state === 'posted' ? 'default' : payment.odoo_state === 'cancel' ? 'destructive' : 'secondary'}
                        className="text-[10px] h-4 px-1.5 shrink-0"
                      >
                        {payment.odoo_state === 'posted' ? 'Posted' : payment.odoo_state === 'cancel' ? 'Cancelled' : 'Draft'}
                      </Badge>
                    ) : payment.odoo_sync_status && payment.odoo_sync_status !== 'Not Synced' && (
                      <Badge
                        variant={payment.odoo_sync_status.includes('Error') ? 'destructive' : payment.odoo_sync_status.includes('Pending') ? 'secondary' : 'default'}
                        className="text-[10px] h-4 px-1.5 shrink-0"
                      >
                        {payment.odoo_sync_status}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Payment Details - Compact */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      Payment Date:
                    </span>
                    <span className='font-medium text-[11px]'>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <FileText className='h-3.5 w-3.5' />
                      Method:
                    </span>
                    <span className='font-medium text-[11px]'>{payment.payment_method}</span>
                  </div>
                  <Separator className='my-1.5' />
                  <div className='flex items-center justify-between font-semibold'>
                    <span className='text-xs'>Amount:</span>
                    <span className='text-sm'>
                      Rp {payment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {filteredPayments.length} of {totalCount} payments
          </div>
        )}
      </Main>

      {/* Payment Detail Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedPayment?.name || 'Payment'}</DialogTitle>
            <DialogDescription>
              {selectedPayment?.customer_name}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6 overflow-y-auto px-0.5">
              {/* SECTION: Payment Information */}
              {isLoadingPayment ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading payment details...
                </div>
              ) : paymentDetail && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Payment Information</h3>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <p className="text-sm">{paymentDetail.customer_name}</p>
                  </div>

                  {/* Status and Payment Date - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Badge variant={getStatusVariant(paymentDetail.status)}>
                        {paymentDetail.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <p className="text-sm">
                        {new Date(paymentDetail.payment_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method and Amount - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <p className="text-sm">{paymentDetail.payment_method}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <p className="text-lg font-bold">Rp {paymentDetail.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  {paymentDetail.notes && (
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <p className="text-sm whitespace-pre-wrap">{paymentDetail.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Odoo Integration */}
              {paymentDetail && (paymentDetail.odoo_name || paymentDetail.odoo_state) && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Odoo Integration</h3>
                  </div>

                  {/* Odoo Reference and Odoo State - Side by Side */}
                  <div className="grid grid-cols-2 gap-3">
                    {paymentDetail.odoo_name && (
                      <div className="space-y-2">
                        <Label>Odoo Reference</Label>
                        <p className="text-sm font-mono">{paymentDetail.odoo_name}</p>
                      </div>
                    )}

                    {paymentDetail.odoo_state && (
                      <div className="space-y-2">
                        <Label>Odoo State</Label>
                        <Badge
                          variant={paymentDetail.odoo_state === 'posted' ? 'default' : paymentDetail.odoo_state === 'cancel' ? 'destructive' : 'secondary'}
                        >
                          {paymentDetail.odoo_state === 'posted' ? 'Posted' : paymentDetail.odoo_state === 'cancel' ? 'Cancelled' : 'Draft'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {paymentDetail.odoo_id && (
                    <div className="space-y-2">
                      <Label>Odoo ID</Label>
                      <p className="text-sm font-mono">{paymentDetail.odoo_id}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Invoice Allocations */}
              {paymentDetail?.invoices && paymentDetail.invoices.length > 0 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Invoice Allocations</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {paymentDetail.invoices.length} {paymentDetail.invoices.length === 1 ? 'invoice' : 'invoices'} allocated
                    </p>
                  </div>

                  <div className="space-y-2">
                    {paymentDetail.invoices.map((invoice, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{invoice.invoice}</span>
                          <span className="text-sm font-semibold">
                            Rp {invoice.allocated_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {paymentDetail.invoices.length > 1 && (
                      <>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between px-3">
                          <span className="text-sm font-medium">Total Allocated</span>
                          <span className="font-semibold">
                            Rp {paymentDetail.invoices.reduce((sum, inv) => sum + inv.allocated_amount, 0).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: Payment Evidence Photos */}
              {paymentDetail?.photos && paymentDetail.photos.length > 0 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Payment Evidence</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {paymentDetail.photos.length} {paymentDetail.photos.length === 1 ? 'photo' : 'photos'} attached
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {paymentDetail.photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={photo.photo}
                          alt={photo.caption || `Payment evidence ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(photo.photo, '_blank')}
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                            {photo.caption}
                          </div>
                        )}
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

      {/* New Payment Entry Sheet */}
      <PaymentEntrySheet
        open={showNewPaymentModal}
        onOpenChange={setShowNewPaymentModal}
        onComplete={() => mutate()}
      />
    </>
  )
}
