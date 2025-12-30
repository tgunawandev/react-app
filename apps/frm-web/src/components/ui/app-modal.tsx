/**
 * AppModal Component
 * Standardized centered modal with consistent width, rounding, and spacing
 *
 * Width Standards:
 * - sm: max-w-sm (384px) - Confirmations, alerts
 * - md: max-w-md (448px) - Standard forms (DEFAULT)
 * - lg: max-w-lg (512px) - Camera/scanner, galleries
 * - xl: max-w-xl (576px) - Reports, complex forms
 *
 * Rounding: rounded (4px) on all corners
 * Max Height: max-h-[85vh]
 */

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AppModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Modal size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Modal title */
  title: string
  /** Optional description below title */
  description?: string
  /** Modal content */
  children: React.ReactNode
  /** Optional footer content */
  footer?: React.ReactNode
  /** Optional className for the modal container */
  className?: string
  /** Whether to show close button in header */
  showCloseButton?: boolean
  /** Whether clicking backdrop closes the modal */
  closeOnBackdropClick?: boolean
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',   // 384px - Confirmations, alerts
  md: 'max-w-md',   // 448px - Standard forms
  lg: 'max-w-lg',   // 512px - Camera/scanner, galleries
  xl: 'max-w-xl',   // 576px - Reports, complex forms
}

export function AppModal({
  open,
  onOpenChange,
  size = 'md',
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
  closeOnBackdropClick = true,
}: AppModalProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={() => closeOnBackdropClick && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative bg-background rounded shadow-2xl w-full flex flex-col overflow-hidden max-h-[85vh]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          SIZE_CLASSES[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 id="modal-title" className="text-lg font-semibold leading-tight">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * AppModalFooter - Helper component for consistent footer layout
 */
interface AppModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function AppModalFooter({ children, className }: AppModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {children}
    </div>
  )
}
