/**
 * ItemChecklist Component
 * Interactive checklist for verifying delivery items at loading/delivery
 * Reference: Delivery Tracking System Phase 2
 */

import { useState } from 'react'
import {
  Package,
  Check,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Loader2,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// Removed Collapsible imports - using custom expand/collapse for better UX
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  useDeliveryChecklist,
  useChecklistMutations,
  type ChecklistItem,
  type CheckType
} from '@/hooks/useDeliveryChecklist'

interface ItemChecklistProps {
  deliveryOrder: string
  checkType?: CheckType
  onComplete?: () => void
  readOnly?: boolean
}

export default function ItemChecklist({
  deliveryOrder,
  checkType = 'loading',
  onComplete,
  readOnly = false
}: ItemChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [issueDialog, setIssueDialog] = useState<{
    open: boolean
    item: ChecklistItem | null
    type: 'damage' | 'missing' | null
  }>({ open: false, item: null, type: null })
  const [issueQty, setIssueQty] = useState('')
  const [issueNotes, setIssueNotes] = useState('')

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

  const toggleExpand = (product: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(product)) {
      newExpanded.delete(product)
    } else {
      newExpanded.add(product)
    }
    setExpandedItems(newExpanded)
  }

  const handleVerify = async (item: ChecklistItem) => {
    try {
      await verifyItem(deliveryOrder, item.product, checkType)
      toast.success(`${item.product_name} verified`)
      refresh()
    } catch {
      toast.error('Failed to verify item')
    }
  }

  const openIssueDialog = (item: ChecklistItem, type: 'damage' | 'missing') => {
    setIssueDialog({ open: true, item, type })
    setIssueQty('')
    setIssueNotes('')
  }

  const handleReportIssue = async () => {
    if (!issueDialog.item || !issueDialog.type) return

    const qty = parseFloat(issueQty) || 0
    if (qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    try {
      if (issueDialog.type === 'damage') {
        await reportDamage(
          deliveryOrder,
          issueDialog.item.product,
          qty,
          issueDialog.item.expected_qty - qty,
          issueNotes,
          undefined,
          checkType
        )
        toast.success('Damage reported')
      } else {
        await reportMissing(
          deliveryOrder,
          issueDialog.item.product,
          qty,
          issueDialog.item.expected_qty - qty,
          issueNotes,
          checkType
        )
        toast.success('Missing item reported')
      }
      setIssueDialog({ open: false, item: null, type: null })
      refresh()
    } catch {
      toast.error('Failed to report issue')
    }
  }

  const handleCompleteAll = async () => {
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
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-primary"><Check className="h-3 w-3 mr-1" />Verified</Badge>
      case 'damaged':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Damaged</Badge>
      case 'missing':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Missing</Badge>
      case 'partial':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getCheckTypeLabel = () => {
    switch (checkType) {
      case 'loading':
        return 'Loading Check'
      case 'delivery':
        return 'Delivery Check'
      case 'return':
        return 'Return Check'
      default:
        return 'Item Check'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading checklist...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              {getCheckTypeLabel()}
            </CardTitle>
            {!readOnly && progress.pending > 0 && (
              <Button
                size="sm"
                onClick={handleCompleteAll}
                disabled={isCompleting}
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
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.verified} of {progress.total} items verified</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No items in this delivery
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.product}
                className={`border rounded-lg ${
                  item.check_status === 'verified' ? 'bg-primary/5 border-primary/200' :
                  item.check_status === 'damaged' || item.check_status === 'missing' ? 'bg-destructive/5 border-destructive/20' :
                  ''
                }`}
              >
                {/* Main row - shows item info and Verify button */}
                <div className="flex items-center justify-between p-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                      item.check_status === 'verified' ? 'bg-primary text-white' :
                      item.check_status === 'damaged' || item.check_status === 'missing' ? 'bg-destructive/50 text-white' :
                      'bg-muted'
                    }`}>
                      {item.check_status === 'verified' ? (
                        <Check className="h-4 w-4" />
                      ) : item.check_status === 'damaged' || item.check_status === 'missing' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.expected_qty} {item.uom}
                      </div>
                    </div>
                  </div>

                  {/* Status badge or Verify button - shown directly on row */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!readOnly && item.check_status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVerify(item)
                        }}
                        disabled={isVerifying}
                        className="h-8"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    ) : (
                      getStatusBadge(item.check_status)
                    )}
                    <button
                      onClick={() => toggleExpand(item.product)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {expandedItems.has(item.product) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedItems.has(item.product) && (
                  <div className="px-3 pb-3 pt-1 border-t space-y-3">
                    {/* Quantity breakdown */}
                    {item.check_status !== 'pending' && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-primary/10 rounded">
                          <div className="font-medium text-primary700">{item.verified_qty}</div>
                          <div className="text-xs text-primary600">Verified</div>
                        </div>
                        <div className="text-center p-2 bg-secondary/10 rounded">
                          <div className="font-medium text-secondary-foreground">{item.damaged_qty}</div>
                          <div className="text-xs text-secondary-foreground">Damaged</div>
                        </div>
                        <div className="text-center p-2 bg-destructive/10 rounded">
                          <div className="font-medium text-destructive">{item.missing_qty}</div>
                          <div className="text-xs text-destructive">Missing</div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {(item.notes || item.damage_description) && (
                      <div className="text-sm bg-muted p-2 rounded">
                        {item.damage_description && (
                          <p><strong>Damage:</strong> {item.damage_description}</p>
                        )}
                        {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
                      </div>
                    )}

                    {/* Additional action buttons - only for pending items */}
                    {!readOnly && item.check_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openIssueDialog(item, 'damage')}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Report Damage
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openIssueDialog(item, 'missing')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Report Missing
                        </Button>
                      </div>
                    )}

                    {/* Checked info */}
                    {item.checked_by && (
                      <div className="text-xs text-muted-foreground">
                        Checked by {item.checked_by} at{' '}
                        {item.checked_at && new Date(item.checked_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Issue Report Dialog */}
      <Dialog
        open={issueDialog.open}
        onOpenChange={(open) => !open && setIssueDialog({ open: false, item: null, type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {issueDialog.type === 'damage' ? 'Report Damage' : 'Report Missing'}
            </DialogTitle>
            <DialogDescription>
              {issueDialog.item?.product_name} - Expected: {issueDialog.item?.expected_qty} {issueDialog.item?.uom}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qty">
                {issueDialog.type === 'damage' ? 'Damaged Quantity' : 'Missing Quantity'}
              </Label>
              <Input
                id="qty"
                type="number"
                min="0"
                max={issueDialog.item?.expected_qty}
                step="0.001"
                value={issueQty}
                onChange={(e) => setIssueQty(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {issueDialog.type === 'damage' ? 'Damage Description' : 'Notes'}
              </Label>
              <Textarea
                id="notes"
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                placeholder={issueDialog.type === 'damage' ? 'Describe the damage...' : 'Add notes...'}
                rows={3}
              />
            </div>

            {issueDialog.type === 'damage' && (
              <Button variant="outline" className="w-full" disabled>
                <Camera className="h-4 w-4 mr-2" />
                Add Photo (Coming Soon)
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIssueDialog({ open: false, item: null, type: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportIssue}
              disabled={isReportingDamage || isReportingMissing}
            >
              {(isReportingDamage || isReportingMissing) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Report {issueDialog.type === 'damage' ? 'Damage' : 'Missing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
