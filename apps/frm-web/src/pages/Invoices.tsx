/**
 * Invoices Page
 * Browse and view invoices (read-only, synced from Odoo)
 */

import { type ChangeEvent, useState } from 'react'
import { FileText, Calendar, DollarSign, AlertCircle, ExternalLink, Package } from 'lucide-react'
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

interface Invoice {
  name: string
  invoice_number: string
  customer: string
  customer_name?: string
  invoice_date: string
  due_date: string
  state: string
  payment_state: string
  amount_total: number
  amount_residual: number
  odoo_id?: number
  odoo_name?: string
  odoo_state?: string
  odoo_sync_status?: string
  item_count?: number
}

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStateFilter, setPaymentStateFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useFrappeGetCall<{ message: { invoices: Invoice[], total_count: number } }>(
    'frm.api.invoice.get_invoices',
    {
      payment_state: paymentStateFilter === 'all' ? undefined : paymentStateFilter,
      state: 'Posted', // Only show posted invoices
      limit: 50,
      offset: 0
    },
    'invoice-list',
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  )

  const invoices = data?.message?.invoices || []
  const totalCount = data?.message?.total_count || 0

  // Filter locally by invoice number/customer name
  const filteredInvoices = searchTerm
    ? invoices.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer_name && invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : invoices

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedInvoice(null)
  }

  // Fetch invoice detail when selected
  const { data: invoiceData, isLoading: isLoadingInvoice } = useFrappeGetCall<{ message: any }>(
    'frm.api.invoice.get_invoice_detail',
    { invoice_id: selectedInvoice?.name },
    selectedInvoice ? undefined : null,
    { revalidateOnFocus: false }
  )

  const invoiceDetail = invoiceData?.message

  const getPaymentStateVariant = (state: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (state?.toLowerCase()) {
      case 'paid':
        return 'default'
      case 'partial':
        return 'secondary'
      case 'not paid':
        return 'destructive'
      case 'in payment':
        return 'secondary'
      case 'reversed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatPaymentState = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'paid':
        return 'Paid'
      case 'partial':
        return 'Partial'
      case 'not paid':
        return 'Not Paid'
      case 'in payment':
        return 'In Payment'
      case 'reversed':
        return 'Reversed'
      default:
        return state || 'Unknown'
    }
  }

  const isOverdue = (dueDate: string, paymentState: string) => {
    if (paymentState?.toLowerCase() === 'paid') return false
    const today = new Date()
    const due = new Date(dueDate)
    return due < today
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Invoices
          </h1>
          <p className='text-muted-foreground'>
            View customer invoices synced from Odoo
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search invoices...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: Payment state filter */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={paymentStateFilter} onValueChange={setPaymentStateFilter}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All Status</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='Not Paid'>Not Paid</SelectItem>
                <SelectItem value='Partial'>Partial</SelectItem>
                <SelectItem value='In Payment'>In Payment</SelectItem>
                <SelectItem value='Paid'>Paid</SelectItem>
                <SelectItem value='Reversed'>Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && filteredInvoices.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : filteredInvoices.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No invoices found
            </li>
          ) : (
            filteredInvoices.map((invoice) => (
              <li
                key={invoice.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleInvoiceClick(invoice)}
              >
                {/* Header: Invoice Number + Customer + Status */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{invoice.invoice_number}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{invoice.customer_name || invoice.customer}</p>
                  <div className='flex items-center gap-1 mt-1.5 flex-wrap'>
                    <Badge variant={getPaymentStateVariant(invoice.payment_state)} className='text-[10px] h-4 px-1.5'>
                      {formatPaymentState(invoice.payment_state)}
                    </Badge>
                    {isOverdue(invoice.due_date, invoice.payment_state) && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-[10px] h-4 px-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Odoo Integration */}
                {(invoice.odoo_name || invoice.odoo_state) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {invoice.odoo_name && <span className='truncate text-[11px]'>{invoice.odoo_name}</span>}
                    {invoice.odoo_state && <Badge variant='outline' className='text-[10px] h-4 px-1.5'>{invoice.odoo_state}</Badge>}
                  </div>
                )}

                {/* Invoice Details - Compact */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      Invoice Date:
                    </span>
                    <span className='font-medium text-[11px]'>
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <FileText className='h-3.5 w-3.5' />
                      Due Date:
                    </span>
                    <span className={`font-medium text-[11px] ${isOverdue(invoice.due_date, invoice.payment_state) ? 'text-destructive' : ''}`}>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  {invoice.item_count !== undefined && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                        <Package className='h-3.5 w-3.5' />
                        Items:
                      </span>
                      <span className='font-medium text-[11px]'>{invoice.item_count}</span>
                    </div>
                  )}
                  <Separator className='my-1.5' />
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px] flex items-center gap-1'>
                      <DollarSign className='h-3.5 w-3.5' />
                      Total:
                    </span>
                    <span className='font-medium text-[11px]'>
                      Rp {invoice.amount_total.toLocaleString()}
                    </span>
                  </div>
                  {invoice.amount_residual > 0 && (
                    <div className='flex items-center justify-between font-semibold text-destructive'>
                      <span className='text-xs'>Outstanding:</span>
                      <span className='text-sm'>
                        Rp {invoice.amount_residual.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {filteredInvoices.length} of {totalCount} invoices
          </div>
        )}
      </Main>

      {/* Invoice Detail Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedInvoice?.invoice_number || 'Invoice'}</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.customer_name || selectedInvoice?.customer}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 overflow-y-auto px-0.5">
              {/* SECTION: Invoice Information */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-semibold">Invoice Information</h3>
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <p className="text-sm">{selectedInvoice.customer_name || selectedInvoice.customer}</p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPaymentStateVariant(selectedInvoice.payment_state)}>
                      {formatPaymentState(selectedInvoice.payment_state)}
                    </Badge>
                    {isOverdue(selectedInvoice.due_date, selectedInvoice.payment_state) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Invoice Date and Due Date - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <p className="text-sm">
                      {new Date(selectedInvoice.invoice_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <p className={`text-sm ${isOverdue(selectedInvoice.due_date, selectedInvoice.payment_state) ? 'text-destructive font-semibold' : ''}`}>
                      {new Date(selectedInvoice.due_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Total Amount and Outstanding Amount - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <p className="text-sm font-semibold">Rp {selectedInvoice.amount_total.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className={selectedInvoice.amount_residual > 0 ? "text-destructive" : ""}>Outstanding Amount</Label>
                    <p className={`text-sm font-bold ${selectedInvoice.amount_residual > 0 ? 'text-destructive' : ''}`}>
                      Rp {selectedInvoice.amount_residual.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION: Odoo Integration */}
              {(selectedInvoice.odoo_name || selectedInvoice.odoo_state) && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Odoo Integration</h3>
                  </div>

                  {selectedInvoice.odoo_name && (
                    <div className="space-y-2">
                      <Label>Odoo Reference</Label>
                      <p className="text-sm font-mono">{selectedInvoice.odoo_name}</p>
                    </div>
                  )}

                  {selectedInvoice.odoo_state && (
                    <div className="space-y-2">
                      <Label>Odoo State</Label>
                      <Badge variant="outline">{selectedInvoice.odoo_state}</Badge>
                    </div>
                  )}

                  {selectedInvoice.odoo_id && (
                    <div className="space-y-2">
                      <Label>Odoo ID</Label>
                      <p className="text-sm font-mono">{selectedInvoice.odoo_id}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Invoice Items */}
              {isLoadingInvoice ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading invoice items...
                </div>
              ) : invoiceDetail?.items && invoiceDetail.items.length > 0 && (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-sm font-semibold">Invoice Items</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {invoiceDetail.items.length} {invoiceDetail.items.length === 1 ? 'item' : 'items'} in this invoice
                    </p>
                  </div>

                  <div className="space-y-2">
                    {invoiceDetail.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 rounded-lg border space-y-2">
                        {/* Row 1: Product name + code */}
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.product_name || item.description || item.product || item.name}
                            </div>
                            {item.product && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                {item.product}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Quantity and pricing */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-muted-foreground">
                            Qty: <span className="font-medium text-foreground">{item.quantity || 0}</span>
                            {item.uom && <span className="ml-1">{item.uom}</span>}
                            {item.price_unit && (
                              <span className="ml-2">@ Rp {item.price_unit.toLocaleString()}</span>
                            )}
                          </div>
                          {item.price_subtotal !== undefined && (
                            <div className="font-semibold">
                              Rp {item.price_subtotal.toLocaleString()}
                            </div>
                          )}
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
