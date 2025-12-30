/**
 * UnplannedVisitSheet Component
 * Bottom sheet for adding unplanned visits to customers not on route
 */

import { useState, useEffect } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { VisitActivitySheet } from './VisitActivitySheet'
import { CustomerSelect } from '@/components/customer/CustomerSelect'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UnplannedVisitReason {
  name: string
  reason: string
  description?: string
}

export interface UnplannedVisitSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when unplanned visit is created */
  onComplete: (customerId: string, customerName: string, reason: string) => void
  /** List of customer IDs already in the route (to prevent duplicates) */
  existingCustomers?: string[]
}

export function UnplannedVisitSheet({
  open,
  onOpenChange,
  onComplete,
  existingCustomers = [],
}: UnplannedVisitSheetProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('')
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isDuplicateWarning, setIsDuplicateWarning] = useState(false)

  // Fetch active reasons from backend
  const { data: reasonsData, isLoading: reasonsLoading } = useFrappeGetCall<{
    message: { reasons: UnplannedVisitReason[] }
  }>(
    'frm.api.unplanned_visit.get_active_reasons',
    undefined,
    'unplanned-visit-reasons',
    { revalidateOnFocus: false }
  )

  const reasons = reasonsData?.message?.reasons || []
  const showCustomReasonField = selectedReason === 'Other'

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setSelectedCustomerId('')
      setSelectedCustomerName('')
      setSelectedReason('')
      setCustomReason('')
      setIsDuplicateWarning(false)
    }
  }, [open])

  const handleCustomerChange = (customerId: string, customerName?: string) => {
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customerName || customerId)

    // Check if this customer is already in the route
    if (existingCustomers.includes(customerId)) {
      setIsDuplicateWarning(true)
    } else {
      setIsDuplicateWarning(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedCustomerId) return

    // Use custom reason if "Other" is selected, otherwise use dropdown selection
    const finalReason = showCustomReasonField
      ? customReason.trim()
      : selectedReason

    // Reason is now mandatory
    if (!finalReason) return

    onComplete(
      selectedCustomerId,
      selectedCustomerName,
      finalReason
    )
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  // Check if form is complete and customer is not a duplicate
  const isFormValid = selectedCustomerId && !isDuplicateWarning && (
    selectedReason && (
      selectedReason !== 'Other' || (selectedReason === 'Other' && customReason.trim())
    )
  )

  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Unplanned Visit"
      description="Visit a customer not on today's route"
      submitLabel="Start Visit"
      onSubmit={handleSubmit}
      submitDisabled={!isFormValid}
      onCancel={handleCancel}
    >
      <div className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Unplanned visits are for customers not on your scheduled route.
            They will be tracked separately from your route performance.
          </AlertDescription>
        </Alert>

        {/* Customer Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Customer <span className="text-destructive">*</span>
          </Label>
          <CustomerSelect
            value={selectedCustomerId}
            onValueChange={handleCustomerChange}
            placeholder="Search and select customer..."
            showCode={true}
          />
          {selectedCustomerId && !isDuplicateWarning && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              Selected: {selectedCustomerName}
            </Badge>
          )}
          {isDuplicateWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>{selectedCustomerName}</strong> is already in this route. Each customer can only appear once per route.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Reason Dropdown */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Reason <span className="text-destructive">*</span>
          </Label>
          {reasonsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for visit..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.name} value={reason.reason}>
                    <div className="flex flex-col">
                      <span>{reason.reason}</span>
                      {reason.description && (
                        <span className="text-xs text-muted-foreground">
                          {reason.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Custom Reason Field (shown when "Other" is selected) */}
        {showCustomReasonField && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Specify Reason</Label>
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify the reason for this visit..."
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {customReason.length}/200
            </div>
          </div>
        )}
      </div>
    </VisitActivitySheet>
  )
}
