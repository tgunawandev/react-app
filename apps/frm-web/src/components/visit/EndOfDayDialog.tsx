/**
 * EndOfDayDialog Component
 * Dialog for collecting unvisited customer reasons at end of day
 * Reference: spec.md lines 149-152
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

interface RoutePlanItem {
  name: string
  customer: string
  sequence: number
  skip_reason?: string
  skip_notes?: string
}

interface EndOfDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unvisitedCustomers: RoutePlanItem[]
  onSubmit: (reasons: Map<string, { reason: string; notes: string }>) => Promise<void>
}

const skipReasonSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  notes: z.string().optional()
})

export function EndOfDayDialog({
  open,
  onOpenChange,
  unvisitedCustomers,
  onSubmit
}: EndOfDayDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reasons, setReasons] = useState<Map<string, { reason: string; notes: string }>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentCustomer = unvisitedCustomers[currentIndex]
  const isLastCustomer = currentIndex === unvisitedCustomers.length - 1

  const form = useForm<z.infer<typeof skipReasonSchema>>({
    resolver: zodResolver(skipReasonSchema),
    defaultValues: {
      reason: reasons.get(currentCustomer?.name)?.reason || '',
      notes: reasons.get(currentCustomer?.name)?.notes || ''
    }
  })

  const handleNext = async (values: z.infer<typeof skipReasonSchema>) => {
    // Save reason for current customer
    const newReasons = new Map(reasons)
    newReasons.set(currentCustomer.name, {
      reason: values.reason,
      notes: values.notes || ''
    })
    setReasons(newReasons)

    if (isLastCustomer) {
      // Submit all reasons
      setIsSubmitting(true)
      setError(null)
      try {
        await onSubmit(newReasons)
        onOpenChange(false)
        // Reset state
        setCurrentIndex(0)
        setReasons(new Map())
        form.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to end session')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Move to next customer
      setCurrentIndex(currentIndex + 1)
      // Reset form with next customer's saved data (if any)
      const nextCustomer = unvisitedCustomers[currentIndex + 1]
      form.reset({
        reason: reasons.get(nextCustomer.name)?.reason || '',
        notes: reasons.get(nextCustomer.name)?.notes || ''
      })
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      const prevCustomer = unvisitedCustomers[currentIndex - 1]
      form.reset({
        reason: reasons.get(prevCustomer.name)?.reason || '',
        notes: reasons.get(prevCustomer.name)?.notes || ''
      })
    }
  }

  if (!currentCustomer) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>End of Day - Unvisited Customers</DialogTitle>
          <DialogDescription>
            Please provide reasons for unvisited customers ({currentIndex + 1} of {unvisitedCustomers.length})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Customer {currentIndex + 1}</span>
              <span className="text-muted-foreground">{unvisitedCustomers.length} unvisited</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / unvisitedCustomers.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current customer info */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{currentCustomer.customer}</p>
                <p className="text-sm text-muted-foreground">Sequence #{currentCustomer.sequence}</p>
              </div>
            </div>
          </div>

          {/* Reason form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for not visiting *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Customer Closed">Customer Closed</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                        <SelectItem value="Customer Refused">Customer Refused</SelectItem>
                        <SelectItem value="Time Constraint">Time Constraint</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                {currentIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ending Session...
                    </>
                  ) : isLastCustomer ? (
                    'End Session'
                  ) : (
                    'Next Customer'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
