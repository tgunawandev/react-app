/**
 * VisitActivitySheet Component
 * Centered dialog wrapper for visit activity overlays
 * Used for complex forms (Stock, Payment, Order) during visit execution
 */

import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisitActivitySheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Sheet title */
  title: string
  /** Sheet description (optional) */
  description?: string
  /** Sheet content */
  children: ReactNode
  /** Primary action label */
  submitLabel?: string
  /** Primary action callback */
  onSubmit?: () => void
  /** Whether submit is in progress */
  isSubmitting?: boolean
  /** Whether submit button is disabled */
  submitDisabled?: boolean
  /** Cancel label (default: "Cancel") */
  cancelLabel?: string
  /** Additional footer content (e.g., skip button) */
  footerExtra?: ReactNode
  /** Custom className for content area */
  contentClassName?: string
  /** When true, only show Close button (view-only mode) */
  readOnly?: boolean
}

export function VisitActivitySheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Submit',
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  cancelLabel = 'Cancel',
  footerExtra,
  contentClassName,
  readOnly = false,
}: VisitActivitySheetProps) {
  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => {
          // Prevent autofocus in read-only mode to avoid keyboard popup on mobile
          if (readOnly) e.preventDefault()
        }}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Scrollable Content */}
        <div className={cn('flex-1 overflow-y-auto py-2 pb-6', contentClassName)}>
          {children}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row justify-end gap-2 pt-4 border-t px-0">
          {readOnly ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          ) : (
            <>
              {footerExtra}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
              {onSubmit && (
                <Button
                  size="sm"
                  onClick={onSubmit}
                  disabled={submitDisabled || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
