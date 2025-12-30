/**
 * Invoice Detail Page
 * Read-only view of invoice synced from Odoo
 * Used for payment allocation reference
 */

import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  User,
  Package,
  DollarSign,
  FileText,
  RefreshCw,
  CreditCard
} from 'lucide-react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { useFrappeGetCall } from 'frappe-react-sdk'

interface InvoiceItem {
  product: string
  product_name?: string
  description?: string
  quantity: number
  price_unit: number
  price_subtotal: number
  uom?: string
}

interface Invoice {
  name: string
  invoice_number: string
  customer: string
  customer_name?: string
  invoice_date: string
  due_date: string
  state: string
  payment_state: string
  amount_untaxed: number
  amount_tax: number
  amount_total: number
  amount_residual: number
  odoo_id?: number
  odoo_name?: string
  odoo_state?: string
  odoo_sync_status?: string
  last_sync_timestamp?: string
  sales_team?: string
  operating_unit?: string
  items?: InvoiceItem[]
}

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  // Decode the invoice ID (it was URL encoded to handle slashes)
  const decodedInvoiceId = invoiceId ? decodeURIComponent(invoiceId) : invoiceId

  
    if (!invoiceId) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No invoice ID provided
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

  const { data, isLoading, error } = useFrappeGetCall<{ message: Invoice }>(
    'frm.api.invoice.get_invoice_detail',
    { invoice_id: decodedInvoiceId },
    `invoice-detail-${invoiceId}`,
    {
      revalidateOnFocus: false,
    }
  )

  const invoice = data?.message

  
  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </Main>
      </>
    )
  }

  if (error || !invoice) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load invoice details for "{decodedInvoiceId}". {error?.message || 'Invoice not found.'}
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

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

  const handleCreatePayment = () => {
    navigate(`/payments/new?customer=${invoice.customer}&invoice=${invoice.name}`)
  }

  return (
    <>
      <StandardHeader />

      <Main className="pb-32 md:pb-32 space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-xl font-bold">{invoice.invoice_number}</h1>
              {invoice.odoo_id && (
                <p className="text-xs text-muted-foreground mt-0.5">Odoo ID: {invoice.odoo_id}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={getPaymentStateVariant(invoice.payment_state)}>
                  {formatPaymentState(invoice.payment_state)}
                </Badge>
                {isOverdue(invoice.due_date, invoice.payment_state) && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
                {invoice.odoo_sync_status && (
                  <Badge variant="outline" className="text-xs text-primary">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {invoice.odoo_sync_status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Button - Create Payment for unpaid invoices */}
            {invoice.amount_residual > 0 && (
              <Button onClick={handleCreatePayment} className="w-full sm:w-auto">
                <CreditCard className="mr-2 h-4 w-4" />
                Create Payment
              </Button>
            )}
          </div>
        </div>

        {/* Odoo Integration Card - Compact format */}
        {invoice.odoo_id && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Odoo Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">#{invoice.odoo_id}</span>
                {invoice.odoo_name && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{invoice.odoo_name}</span>
                  </>
                )}
                {invoice.odoo_state && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Badge variant={invoice.odoo_state === 'posted' ? 'default' : 'secondary'}>
                      {invoice.odoo_state}
                    </Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Customer */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Customer</div>
                <div className="font-medium text-sm leading-tight">{invoice.customer_name || invoice.customer}</div>
                {invoice.customer && invoice.customer_name && (
                  <div className="text-xs text-muted-foreground">{invoice.customer}</div>
                )}
              </div>
            </div>

            {/* Dates - Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Invoice Date</div>
                  <div className="font-medium text-sm">
                    {new Date(invoice.invoice_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Due Date</div>
                  <div className={`font-medium text-sm ${isOverdue(invoice.due_date, invoice.payment_state) ? 'text-destructive' : ''}`}>
                    {new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Team and Operating Unit */}
            {(invoice.sales_team || invoice.operating_unit) && (
              <div className="grid grid-cols-2 gap-2">
                {invoice.sales_team && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">Sales Team</div>
                      <div className="font-medium text-sm truncate">{invoice.sales_team}</div>
                    </div>
                  </div>
                )}

                {invoice.operating_unit && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">Operating Unit</div>
                      <div className="font-medium text-sm truncate">{invoice.operating_unit}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Invoice Items ({invoice.items?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.items && invoice.items.length > 0 ? (
              <div className="space-y-2">
                {invoice.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    {/* Product name */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{item.product_name || item.product}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</div>
                        )}
                      </div>
                    </div>
                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity} {item.uom || 'Unit'} x Rp {item.price_unit?.toLocaleString() || 0}
                      </span>
                      <span className="font-semibold">
                        Rp {item.price_subtotal?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No items in this invoice
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Invoice Totals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {invoice.amount_untaxed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>Rp {invoice.amount_tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="text-lg">Rp {invoice.amount_total.toLocaleString()}</span>
            </div>
            {invoice.amount_residual > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between font-semibold text-destructive">
                  <span>Amount Due</span>
                  <span className="text-lg">Rp {invoice.amount_residual.toLocaleString()}</span>
                </div>
              </>
            )}
            {invoice.payment_state?.toLowerCase() === 'paid' && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-primary">
                  <span className="font-medium">Amount Due</span>
                  <span className="font-semibold">Rp 0 (Paid)</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sync Info */}
        {invoice.last_sync_timestamp && (
          <div className="text-center text-xs text-muted-foreground">
            Last synced: {new Date(invoice.last_sync_timestamp).toLocaleString('id-ID')}
          </div>
        )}
      </Main>
    </>
  )
}
