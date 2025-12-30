/**
 * CheckOutStep Component
 * Step 7: Visit summary and check-out with no-order-reason dialog
 */

import { useState } from 'react'
import { LogOut, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { StepData } from '@/hooks/useVisitFlow'
import { toast } from 'sonner'

interface CheckOutStepProps {
  steps: StepData[]
  visitDuration?: number
  hasSalesOrder: boolean
  onCheckOut: (data: { no_order_reason?: string }) => Promise<void>
  onComplete: () => Promise<void>
  isProcessing: boolean
}

const NO_ORDER_REASONS = [
  'Customer Declined',
  'Stock Unavailable',
  'Budget Constraints',
  'Already Purchased Recently',
  'Competitor Offer Better',
  'Pricing Issues',
  'Delivery Schedule Conflict',
  'Other',
]

export function CheckOutStep({
  steps,
  visitDuration,
  hasSalesOrder,
  onCheckOut,
  onComplete,
  isProcessing,
}: CheckOutStepProps) {
  const [noOrderReason, setNoOrderReason] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const completedSteps = steps.filter(s => s.status === 'completed')
  const skippedSteps = steps.filter(s => s.status === 'skipped')
  const mandatorySteps = steps.filter(s => s.isMandatory)
  const completedMandatory = mandatorySteps.filter(s => s.status === 'completed')

  const canCheckOut = completedMandatory.length === mandatorySteps.length

  const handleCheckOut = async () => {
    // Validate no-order reason if no sales order
    if (!hasSalesOrder && !noOrderReason) {
      toast.error('Reason required', {
        description: 'Please select a reason for not creating a sales order',
      })
      return
    }

    setIsCheckingOut(true)

    try {
      // Check out with reason
      const checkOutData: { no_order_reason?: string } = {}
      if (!hasSalesOrder && noOrderReason) {
        checkOutData.no_order_reason =
          noOrderReason === 'Other' && additionalNotes
            ? `${noOrderReason}: ${additionalNotes}`
            : noOrderReason
      }

      await onCheckOut(checkOutData)

      toast.success('Checked out successfully!')

      // Complete the visit (submit document)
      await onComplete()

      toast.success('Visit completed!', {
        description: 'Your visit has been finalized',
        duration: 5000,
      })
    } catch (error) {
      console.error('Check-out failed:', error)
      toast.error('Check-out failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Visit Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Visit Summary
          </CardTitle>
          <CardDescription>Review your visit before checking out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{completedSteps.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
              <div className="text-2xl font-bold text-secondary-foreground">{skippedSteps.length}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {visitDuration ? Math.round(visitDuration) : 0}
              </div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
          </div>

          {/* Steps Checklist */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Activities Completed:</h4>
            <div className="space-y-1">
              {steps.map(step => (
                <div key={step.step} className="flex items-center justify-between p-2 rounded bg-muted">
                  <div className="flex items-center gap-2">
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted" />
                    )}
                    <span className="text-sm">{step.name}</span>
                  </div>
                  <Badge
                    variant={
                      step.status === 'completed'
                        ? 'default'
                        : step.status === 'skipped'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={
                      step.status === 'completed'
                        ? 'bg-primary text-primary-foreground'
                        : step.status === 'skipped'
                        ? 'bg-orange-500 text-white'
                        : ''
                    }
                  >
                    {step.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Order Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Sales Order:</span>
              <Badge variant={hasSalesOrder ? 'default' : 'secondary'}>
                {hasSalesOrder ? 'Created' : 'Not Created'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Order Reason Card (if no sales order) */}
      {!hasSalesOrder && (
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary-foreground">
              <AlertTriangle className="h-5 w-5" />
              No Sales Order Created
            </CardTitle>
            <CardDescription>Please provide a reason for not creating a sales order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="no-order-reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={noOrderReason} onValueChange={setNoOrderReason}>
                <SelectTrigger id="no-order-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {NO_ORDER_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {noOrderReason === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="additional-notes">Additional Notes</Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Please provide more details..."
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Alert */}
      {!canCheckOut && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete all mandatory steps before checking out:
            {mandatorySteps
              .filter(s => s.status !== 'completed')
              .map(s => ` ${s.name}`)
              .join(',')}
          </AlertDescription>
        </Alert>
      )}

      {/* Check Out Button */}
      <Card className={canCheckOut ? 'border-primary' : 'border-destructive'}>
        <CardContent className="pt-6">
          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckOut}
            disabled={!canCheckOut || isCheckingOut || isProcessing}
          >
            {isCheckingOut || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isCheckingOut ? 'Checking Out...' : 'Completing Visit...'}
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-5 w-5" />
                Check Out & Complete Visit
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            This will finalize your visit and submit all data
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
