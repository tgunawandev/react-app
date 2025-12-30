/**
 * Error Dialog Component
 * Modal dialog for displaying detailed error information with copy-to-clipboard
 * Reference: specs/001-sfa-app-build/tasks.md
 */

import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface ErrorDialogProps {
  /** Error object from Frappe API */
  error: any
  /** Dialog open state */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Optional custom title */
  title?: string
}

export function ErrorDialog({
  error,
  open,
  onClose,
  title = 'Operation Failed',
}: ErrorDialogProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!error) return null

  // Extract user-friendly message
  const getUserMessage = (): string => {
    if (error.message) return error.message
    if (error.exception) {
      // Parse exception string to get the actual error message
      const match = error.exception.match(/:\s*(.+)/)
      if (match) return match[1]
      return error.exception
    }
    if (error.httpStatusText) return error.httpStatusText
    return 'An unexpected error occurred'
  }

  // Extract error type (ValidationError, PermissionError, etc.)
  const getErrorType = (): string | null => {
    if (error.exc_type) return error.exc_type
    if (error.exception) {
      const match = error.exception.match(/^([^:]+)/)
      if (match) return match[1]
    }
    return null
  }

  // Format technical details for display
  const getTechnicalDetails = (): string => {
    const details: Record<string, any> = {}

    if (error.httpStatus) details['HTTP Status'] = error.httpStatus
    if (error.httpStatusText) details['Status Text'] = error.httpStatusText
    if (error.exc_type) details['Exception Type'] = error.exc_type
    if (error.exception) details['Exception'] = error.exception
    if (error.exc) details['Stack Trace'] = error.exc
    if (error._server_messages) {
      try {
        const messages = JSON.parse(error._server_messages)
        details['Server Messages'] = messages
      } catch {
        details['Server Messages'] = error._server_messages
      }
    }

    return JSON.stringify(details, null, 2)
  }

  // Copy error details to clipboard
  const handleCopyToClipboard = () => {
    const errorData = {
      title,
      message: getUserMessage(),
      errorType: getErrorType(),
      timestamp: new Date().toISOString(),
      technicalDetails: getTechnicalDetails(),
      fullError: error,
    }

    const textToCopy = JSON.stringify(errorData, null, 2)

    // Use fallback method for broader compatibility
    // Modern clipboard API requires HTTPS, which may not be available in dev
    try {
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.width = '2em'
      textarea.style.height = '2em'
      textarea.style.padding = '0'
      textarea.style.border = 'none'
      textarea.style.outline = 'none'
      textarea.style.boxShadow = 'none'
      textarea.style.background = 'transparent'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        throw new Error('Copy command was unsuccessful')
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Last resort - try modern API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          })
          .catch(() => {
            alert('Could not copy to clipboard. Please copy the text manually.')
          })
      } else {
        alert('Could not copy to clipboard. Please copy the text manually.')
      }
    }
  }

  const userMessage = getUserMessage()
  const errorType = getErrorType()
  const technicalDetails = getTechnicalDetails()

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="break-words">{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-xs sm:text-sm">
            Please review the error details below. You can copy this information to share with support.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* User-friendly error message */}
          <Alert variant="destructive">
            <AlertDescription className="text-xs sm:text-sm">
              {errorType && (
                <div className="font-semibold mb-1 break-words">
                  {errorType}
                </div>
              )}
              <div className="break-words">{userMessage}</div>
            </AlertDescription>
          </Alert>

          {/* Technical Details (Collapsible) */}
          <div className="border rounded-sm">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xs sm:text-sm font-medium">Technical Details</span>
              {showTechnicalDetails ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="p-3 pt-0 sm:p-4 sm:pt-0">
                <pre className="text-[10px] sm:text-xs bg-muted p-2 sm:p-3 rounded overflow-x-auto max-h-[40vh] overflow-y-auto">
                  <code className="break-all whitespace-pre-wrap">{technicalDetails}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Copy to Clipboard Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyToClipboard}
            className="w-full text-xs sm:text-sm"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Copy Error Details
              </>
            )}
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
