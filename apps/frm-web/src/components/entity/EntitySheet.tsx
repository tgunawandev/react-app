/**
 * EntitySheet Component
 * Generic modal wrapper for entity CRUD operations
 * Supports view/edit/create modes with form integration
 * Reference: apps/frm/frontend/src/components/visit/VisitActivitySheet.tsx
 */

import { useState, useEffect, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Save, Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnsavedChangesDialogProps } from './UnsavedChangesDialog'

// Dynamic import for UnsavedChangesDialog to avoid circular dependencies
const UnsavedChangesDialog = ({ open, onOpenChange, onDiscard }: UnsavedChangesDialogProps) => {
  // Placeholder - will be replaced by actual component
  return null
}

export interface EntitySheetProps<T = any> {
  // Modal state (pure React state - no URL sync)
  open: boolean
  onOpenChange: (open: boolean) => void

  // Entity mode
  mode: 'view' | 'edit' | 'create'
  onModeChange?: (mode: 'view' | 'edit') => void

  // Entity metadata
  entityType: string // For logging, analytics
  title: string
  description?: string

  // Form integration
  FormComponent: React.ComponentType<any>
  formProps?: Record<string, any>
  initialValues?: Partial<T>

  // Actions
  onSubmit?: (data: T) => Promise<void>
  onDelete?: () => Promise<void>

  // Permissions
  canEdit?: boolean
  canDelete?: boolean

  // State
  isLoading?: boolean
  isSubmitting?: boolean

  // Customization
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  // Extra content
  headerActions?: ReactNode
  footerExtra?: ReactNode

  // Unsaved changes
  hasUnsavedChanges?: boolean
  onUnsavedChangesChange?: (hasChanges: boolean) => void
}

export function EntitySheet<T = any>({
  open,
  onOpenChange,
  mode: externalMode,
  onModeChange,
  entityType,
  title,
  description,
  FormComponent,
  formProps = {},
  initialValues,
  onSubmit,
  onDelete,
  canEdit = true,
  canDelete = false,
  isLoading = false,
  isSubmitting = false,
  size = 'lg',
  headerActions,
  footerExtra,
  hasUnsavedChanges: externalHasUnsavedChanges,
  onUnsavedChangesChange,
}: EntitySheetProps<T>) {
  const [currentMode, setCurrentMode] = useState(externalMode)
  const [internalHasUnsavedChanges, setInternalHasUnsavedChanges] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)

  const hasUnsavedChanges = externalHasUnsavedChanges ?? internalHasUnsavedChanges

  // Sync external mode changes
  useEffect(() => {
    setCurrentMode(externalMode)
  }, [externalMode])

  // Handle mode toggle (view ↔ edit)
  const handleToggleEdit = () => {
    const newMode = currentMode === 'view' ? 'edit' : 'view'
    setCurrentMode(newMode)
    onModeChange?.(newMode)
    setInternalHasUnsavedChanges(false) // Reset on mode change
  }

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges && currentMode !== 'view') {
      setShowCloseWarning(true)
    } else {
      onOpenChange(false)
      setInternalHasUnsavedChanges(false)
    }
  }

  // Handle confirmed close (discard changes)
  const handleConfirmClose = () => {
    setShowCloseWarning(false)
    setInternalHasUnsavedChanges(false)
    onOpenChange(false)
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, hasUnsavedChanges, currentMode])

  // Size class mapping
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={cn('max-h-[85vh] flex flex-col', sizeClasses[size])}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            handleClose()
          }}
        >
          {/* Header */}
          <DialogHeader className="text-start">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex-1 space-y-1.5">
                <DialogTitle className="text-lg font-semibold leading-tight tracking-tight break-words">
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className="text-sm text-muted-foreground">
                    {description}
                  </DialogDescription>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 pt-0.5 shrink-0">
                {/* Edit toggle button (view mode only) */}
                {currentMode === 'view' && canEdit && !isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleEdit}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}

                {headerActions}
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Form Area - shadcn-admin pattern */}
          <div className="h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <FormComponent
                mode={currentMode}
                initialValues={initialValues}
                onSubmit={onSubmit}
                onValuesChange={(changed: boolean) => {
                  setInternalHasUnsavedChanges(changed)
                  onUnsavedChangesChange?.(changed)
                }}
                {...formProps}
              />
            )}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
            {footerExtra && <div className="w-full mb-2">{footerExtra}</div>}

            <div className="flex gap-2 ml-auto">
              {currentMode === 'view' ? (
                // View mode: Just close button
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                >
                  Close
                </Button>
              ) : (
                // Edit/Create mode: Cancel + Save + Delete
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>

                  {onSubmit && (
                    <Button
                      type="submit"
                      form={`${entityType.toLowerCase()}-form`}
                      size="sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}

                  {canDelete && onDelete && currentMode === 'edit' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={onDelete}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning - Placeholder for now */}
      {showCloseWarning && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Unsaved Changes</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseWarning(false)}
              >
                Continue Editing
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmClose}
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
