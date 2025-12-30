/**
 * DeliveryChecklist Component
 * Modern, mobile-first delivery item verification UI
 * Features:
 * - Manual tap-to-verify mode
 * - QR Code scanner mode (configurable)
 * - Visual progress tracking
 * - Issue reporting (damage/missing)
 */

import { useState, useCallback, useEffect } from 'react'
import {
  Check,
  CheckCircle2,
  Circle,
  AlertTriangle,
  XCircle,
  QrCode,
  List,
  Camera,
  Loader2,
  ChevronRight,
  Package,
  Minus,
  Plus,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  useDeliveryChecklist,
  useChecklistMutations,
  type ChecklistItem,
  type CheckType
} from '@/hooks/useDeliveryChecklist'

interface DeliveryChecklistProps {
  deliveryOrder: string
  checkType?: CheckType
  onComplete?: () => void
  readOnly?: boolean
  qrScannerEnabled?: boolean
}

type VerificationMode = 'manual' | 'scanner'
type IssueType = 'damage' | 'missing' | null

export default function DeliveryChecklist({
  deliveryOrder,
  checkType = 'loading',
  onComplete,
  readOnly = false,
  qrScannerEnabled = false
}: DeliveryChecklistProps) {
  const [mode, setMode] = useState<VerificationMode>('manual')
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null)
  const [issueType, setIssueType] = useState<IssueType>(null)
  const [issueQty, setIssueQty] = useState('')
  const [issueNotes, setIssueNotes] = useState('')
  const [verifyingProduct, setVerifyingProduct] = useState<string | null>(null)

  const { items, progress, isLoading, refresh } = useDeliveryChecklist(deliveryOrder, checkType)
  const {
    verifyItem,
    isVerifying,
    reportDamage,
    isReportingDamage,
    reportMissing,
    isReportingMissing,
    completeChecklist,
    isCompleting
  } = useChecklistMutations()

  // Sort items: pending first, then verified
  const sortedItems = [...items].sort((a, b) => {
    if (a.check_status === 'pending' && b.check_status !== 'pending') return -1
    if (a.check_status !== 'pending' && b.check_status === 'pending') return 1
    return 0
  })

  const pendingItems = items.filter(i => i.check_status === 'pending')
  const verifiedItems = items.filter(i => i.check_status === 'verified')
  const issueItems = items.filter(i => ['damaged', 'missing', 'partial'].includes(i.check_status))

  // Handle single item verification
  const handleVerify = useCallback(async (item: ChecklistItem) => {
    if (readOnly || isVerifying) return

    setVerifyingProduct(item.product)
    try {
      await verifyItem(deliveryOrder, item.product, checkType)
      toast.success(`${item.product_name} verified`)
      refresh()
    } catch {
      toast.error('Failed to verify item')
    } finally {
      setVerifyingProduct(null)
    }
  }, [deliveryOrder, checkType, verifyItem, refresh, readOnly, isVerifying])

  // Handle verify all
  const handleVerifyAll = useCallback(async () => {
    if (readOnly || isCompleting) return

    try {
      const result = await completeChecklist(deliveryOrder, checkType)
      if (result) {
        toast.success(result.message)
        refresh()
        onComplete?.()
      }
    } catch {
      toast.error('Failed to complete checklist')
    }
  }, [deliveryOrder, checkType, completeChecklist, refresh, onComplete, readOnly, isCompleting])

  // Handle issue report
  const handleReportIssue = useCallback(async () => {
    if (!selectedItem || !issueType) return

    const qty = parseFloat(issueQty) || 0
    if (qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    try {
      if (issueType === 'damage') {
        await reportDamage(
          deliveryOrder,
          selectedItem.product,
          qty,
          selectedItem.expected_qty - qty,
          issueNotes,
          undefined,
          checkType
        )
        toast.success('Damage reported')
      } else {
        await reportMissing(
          deliveryOrder,
          selectedItem.product,
          qty,
          selectedItem.expected_qty - qty,
          issueNotes,
          checkType
        )
        toast.success('Missing item reported')
      }

      setSelectedItem(null)
      setIssueType(null)
      setIssueQty('')
      setIssueNotes('')
      refresh()
    } catch {
      toast.error('Failed to report issue')
    }
  }, [selectedItem, issueType, issueQty, issueNotes, deliveryOrder, checkType, reportDamage, reportMissing, refresh])

  // QR Scanner placeholder - would integrate with actual scanner library
  const handleQRScan = useCallback((scannedCode: string) => {
    const item = items.find(i =>
      i.product === scannedCode ||
      i.product_name.toLowerCase().includes(scannedCode.toLowerCase())
    )

    if (item) {
      if (item.check_status === 'pending') {
        handleVerify(item)
      } else {
        toast.info(`${item.product_name} already verified`)
      }
    } else {
      toast.error('Product not found in this delivery')
    }
  }, [items, handleVerify])

  // Get status icon for item
  const getStatusIcon = (status: string, size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'

    switch (status) {
      case 'verified':
        return <CheckCircle2 className={cn(iconSize, 'text-primary')} />
      case 'damaged':
        return <AlertTriangle className={cn(iconSize, 'text-secondary-foreground')} />
      case 'missing':
        return <XCircle className={cn(iconSize, 'text-destructive')} />
      case 'partial':
        return <AlertTriangle className={cn(iconSize, 'text-secondary-foreground')} />
      default:
        return <Circle className={cn(iconSize, 'text-muted-foreground/30')} />
    }
  }

  // Get status color classes
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-primary/5 border-primary/20'
      case 'damaged':
        return 'bg-secondary/5 border-secondary/20'
      case 'missing':
        return 'bg-destructive/5 border-destructive/20'
      case 'partial':
        return 'bg-secondary/5 border-secondary/20'
      default:
        return 'bg-background border-muted'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading checklist...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-lg font-medium text-slate-600">No items to verify</p>
        <p className="text-sm text-muted-foreground">This delivery has no items</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Header - Standardized Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {checkType === 'loading' ? 'Loading Check' :
                 checkType === 'delivery' ? 'Delivery Check' : 'Return Check'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {progress.verified} of {progress.total} items verified
              </p>
            </div>

            {/* Progress Badge */}
            <Badge variant={progress.percentage === 100 ? 'default' : 'secondary'} className="text-sm">
              {progress.percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border rounded-lg py-2">
              <div className="text-lg font-bold text-foreground">{pendingItems.length}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="border rounded-lg py-2">
              <div className="text-lg font-bold text-primary">{verifiedItems.length}</div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
            <div className="border rounded-lg py-2">
              <div className="text-lg font-bold text-secondary-foreground">{issueItems.length}</div>
              <div className="text-xs text-muted-foreground">Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle (if QR enabled) */}
      {qrScannerEnabled && !readOnly && (
        <div className="flex gap-2">
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('manual')}
            className="flex-1"
          >
            <List className="h-4 w-4 mr-1" />
            Manual
          </Button>
          <Button
            variant={mode === 'scanner' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('scanner')}
            className="flex-1"
          >
            <QrCode className="h-4 w-4 mr-1" />
            Scan QR
          </Button>
        </div>
      )}

      {/* Scanner Mode */}
      {mode === 'scanner' && qrScannerEnabled && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">QR Scanner</p>
              <p className="text-sm text-muted-foreground mt-1">
                Point camera at product QR code
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                (Camera integration coming soon)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Mode - Item List */}
      {mode === 'manual' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({items.length})
              </CardTitle>
              {/* Verify All Button */}
              {!readOnly && pendingItems.length > 0 && (
                <Button
                  onClick={handleVerifyAll}
                  disabled={isCompleting}
                  size="sm"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Verify All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Items List */}
            <div className="space-y-2">
              {sortedItems.map((item) => {
                const isPending = item.check_status === 'pending'
                const isCurrentlyVerifying = verifyingProduct === item.product

                return (
                  <div
                    key={item.product}
                    className={cn(
                      'border rounded-lg p-3 transition-all',
                      item.check_status === 'verified' && 'bg-primary/5 border-primary/20',
                      item.check_status === 'damaged' && 'bg-secondary/5 border-secondary/20',
                      item.check_status === 'missing' && 'bg-destructive/5 border-destructive/20',
                      isPending && !readOnly && 'hover:border-primary cursor-pointer'
                    )}
                    onClick={() => isPending && !readOnly && !isCurrentlyVerifying && handleVerify(item)}
                  >
                    {/* Product name and qty */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isCurrentlyVerifying ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            getStatusIcon(item.check_status)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-2">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.product}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-sm">
                          {item.expected_qty} {item.uom}
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <Badge
                        variant={
                          item.check_status === 'verified' ? 'default' :
                          item.check_status === 'pending' ? 'outline' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {item.check_status === 'verified' && <Check className="h-3 w-3 mr-1" />}
                        {item.check_status.charAt(0).toUpperCase() + item.check_status.slice(1)}
                      </Badge>

                      {/* Report Issue Button */}
                      {isPending && !readOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItem(item)
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Report Issue
                        </button>
                      )}

                      {/* Tap hint for pending items */}
                      {isPending && !readOnly && !isCurrentlyVerifying && (
                        <span className="text-xs text-muted-foreground">Tap to verify</span>
                      )}
                    </div>

                    {/* Issue Details */}
                    {(item.damaged_qty > 0 || item.missing_qty > 0) && (
                      <div className="mt-2 flex gap-2 text-xs">
                        {item.damaged_qty > 0 && (
                          <span className="text-secondary-foreground">Damaged: {item.damaged_qty}</span>
                        )}
                        {item.missing_qty > 0 && (
                          <span className="text-destructive">Missing: {item.missing_qty}</span>
                        )}
                      </div>
                    )}

                    {item.damage_description && (
                      <p className="mt-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                        {item.damage_description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issue Report Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom" className="rounded-t">
          <SheetHeader className="text-left">
            <SheetTitle>Report Issue</SheetTitle>
            <SheetDescription>
              {selectedItem?.product_name} - {selectedItem?.expected_qty} {selectedItem?.uom}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Issue Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIssueType('damage')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  issueType === 'damage'
                    ? 'border-secondary bg-secondary/5'
                    : 'border-slate-200 hover:border-amber-300'
                )}
              >
                <AlertTriangle className={cn(
                  'h-8 w-8',
                  issueType === 'damage' ? 'text-secondary-foreground' : 'text-muted-foreground'
                )} />
                <span className="font-medium">Damaged</span>
              </button>
              <button
                onClick={() => setIssueType('missing')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  issueType === 'missing'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-slate-200 hover:border-destructive/30'
                )}
              >
                <XCircle className={cn(
                  'h-8 w-8',
                  issueType === 'missing' ? 'text-destructive' : 'text-muted-foreground'
                )} />
                <span className="font-medium">Missing</span>
              </button>
            </div>

            {issueType && (
              <>
                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label>
                    {issueType === 'damage' ? 'Damaged Quantity' : 'Missing Quantity'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl"
                      onClick={() => setIssueQty(prev => Math.max(0, (parseFloat(prev) || 0) - 1).toString())}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max={selectedItem?.expected_qty}
                      step="0.001"
                      value={issueQty}
                      onChange={(e) => setIssueQty(e.target.value)}
                      className="text-center text-xl font-semibold h-12"
                      placeholder="0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl"
                      onClick={() => setIssueQty(prev => Math.min(
                        selectedItem?.expected_qty || 0,
                        (parseFloat(prev) || 0) + 1
                      ).toString())}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Max: {selectedItem?.expected_qty} {selectedItem?.uom}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>
                    {issueType === 'damage' ? 'Damage Description' : 'Notes'} (optional)
                  </Label>
                  <Textarea
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder={
                      issueType === 'damage'
                        ? 'Describe the damage...'
                        : 'Add notes about missing items...'
                    }
                    rows={3}
                  />
                </div>

                {/* Photo Button (placeholder) */}
                {issueType === 'damage' && (
                  <Button variant="outline" className="w-full" disabled>
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photo (Coming Soon)
                  </Button>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleReportIssue}
                  disabled={isReportingDamage || isReportingMissing || !issueQty}
                  className={cn(
                    'w-full h-12 text-base font-medium',
                    issueType === 'damage'
                      ? 'bg-secondary hover:bg-secondary/90'
                      : 'bg-destructive/50 hover:bg-destructive/90'
                  )}
                >
                  {(isReportingDamage || isReportingMissing) ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  Report {issueType === 'damage' ? 'Damage' : 'Missing'}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
