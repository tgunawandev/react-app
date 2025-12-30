/**
 * useEntitySheet Hook
 * Shared state management logic for entity modals
 * Pure React state - no URL synchronization (simpler implementation)
 */

import { useState } from 'react'
import { toast } from 'sonner'

export interface UseEntitySheetOptions<T> {
  entityType: string
  onSubmit?: (data: T) => Promise<void>
  onDelete?: () => Promise<void>
}

export interface SelectedEntity {
  id: string
  mode: 'view' | 'edit' | 'create'
}

export function useEntitySheet<T = any>({
  entityType,
  onSubmit,
  onDelete,
}: UseEntitySheetOptions<T>) {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Open modal in view or edit mode
   * @param id - Entity ID (or 'new' for create mode)
   * @param mode - 'view' | 'edit' | 'create'
   */
  const handleOpen = (id: string, mode: 'view' | 'edit' | 'create' = 'view') => {
    setSelectedEntity({ id, mode })
  }

  /**
   * Close modal and reset state
   */
  const handleClose = () => {
    setSelectedEntity(null)
    setIsSubmitting(false)
  }

  /**
   * Switch between view and edit modes
   * @param mode - 'view' | 'edit'
   */
  const handleModeChange = (mode: 'view' | 'edit') => {
    if (selectedEntity) {
      setSelectedEntity({ ...selectedEntity, mode })
    }
  }

  /**
   * Submit entity (create or update)
   * Shows toast notifications and handles errors
   */
  const handleSubmit = async (data: T) => {
    if (!onSubmit) {
      console.warn(`No onSubmit handler provided for ${entityType}`)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success(`${entityType} saved successfully`)
      handleClose()
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to save ${entityType}: ${errorMessage}`)
      console.error(`Error saving ${entityType}:`, error)
      // Don't close on error - let user retry
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Delete entity
   * Shows toast notifications and handles errors
   */
  const handleDelete = async () => {
    if (!onDelete) {
      console.warn(`No onDelete handler provided for ${entityType}`)
      return
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete this ${entityType}?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      await onDelete()
      toast.success(`${entityType} deleted successfully`)
      handleClose()
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to delete ${entityType}: ${errorMessage}`)
      console.error(`Error deleting ${entityType}:`, error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedEntity,
    isSubmitting,
    handleOpen,
    handleClose,
    handleModeChange,
    handleSubmit,
    handleDelete,
  }
}
