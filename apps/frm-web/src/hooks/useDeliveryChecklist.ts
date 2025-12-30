/**
 * useDeliveryChecklist Hook
 * Handles item verification checklist for deliveries
 * Reference: Delivery Tracking System Phase 2
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'

// Types for checklist items
export interface ChecklistItem {
  delivery_item: string
  product: string
  product_name: string
  expected_qty: number
  uom: string
  check_id: string | null
  check_status: 'pending' | 'verified' | 'partial' | 'damaged' | 'missing' | 'rejected'
  verified_qty: number
  damaged_qty: number
  missing_qty: number
  notes: string | null
  damage_description: string | null
  checked_by: string | null
  checked_at: string | null
}

export interface ChecklistResponse {
  delivery_order: string
  check_type: string
  items: ChecklistItem[]
  total_items: number
  verified_items: number
  pending_items: number
}

export interface ItemCheckResult {
  name: string
  delivery_order: string
  product: string
  check_status: string
  verified_qty: number
  damaged_qty: number
  missing_qty: number
  checked_by: string
  checked_at: string
}

export type CheckType = 'loading' | 'delivery' | 'return'

/**
 * Hook for getting delivery checklist
 */
export function useDeliveryChecklist(
  deliveryOrder?: string,
  checkType: CheckType = 'loading'
) {
  const shouldFetch = !!deliveryOrder
  const cacheKey = shouldFetch
    ? `delivery-checklist-${deliveryOrder}-${checkType}`
    : null

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: ChecklistResponse }>(
    'frm.api.delivery_tracking.get_delivery_checklist',
    shouldFetch ? { delivery_order: deliveryOrder, check_type: checkType } : undefined,
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 10000,
      shouldRetryOnError: true,
      errorRetryCount: 2
    }
  )

  const checklist = data?.message || null
  const items = checklist?.items || []
  const progress = checklist
    ? {
        total: checklist.total_items,
        verified: checklist.verified_items,
        pending: checklist.pending_items,
        percentage: checklist.total_items > 0
          ? Math.round((checklist.verified_items / checklist.total_items) * 100)
          : 0
      }
    : { total: 0, verified: 0, pending: 0, percentage: 0 }

  return {
    checklist,
    items,
    progress,
    isLoading: shouldFetch ? isLoading : false,
    error: error || null,
    refresh: mutate
  }
}

/**
 * Hook for checklist mutations (verify, damage, missing)
 */
export function useChecklistMutations() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isReportingDamage, setIsReportingDamage] = useState(false)
  const [isReportingMissing, setIsReportingMissing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Verify item
  const { call: verifyCall } = useFrappePostCall<{ message: ItemCheckResult }>(
    'frm.api.delivery_tracking.verify_item'
  )

  const verifyItem = useCallback(async (
    deliveryOrder: string,
    product: string,
    checkType: CheckType = 'loading',
    verifiedQty?: number,
    notes?: string
  ): Promise<ItemCheckResult | null> => {
    setIsVerifying(true)
    setError(null)

    try {
      const response = await verifyCall({
        delivery_order: deliveryOrder,
        product,
        check_type: checkType,
        verified_qty: verifiedQty,
        notes
      })
      setIsVerifying(false)
      return response?.message || null
    } catch (err) {
      setIsVerifying(false)
      setError(err as Error)
      throw err
    }
  }, [verifyCall])

  // Report damage
  const { call: damageCall } = useFrappePostCall<{ message: ItemCheckResult }>(
    'frm.api.delivery_tracking.report_damage'
  )

  const reportDamage = useCallback(async (
    deliveryOrder: string,
    product: string,
    damagedQty: number,
    verifiedQty: number = 0,
    description?: string,
    photo?: string,
    checkType: CheckType = 'loading'
  ): Promise<ItemCheckResult | null> => {
    setIsReportingDamage(true)
    setError(null)

    try {
      const response = await damageCall({
        delivery_order: deliveryOrder,
        product,
        damaged_qty: damagedQty,
        verified_qty: verifiedQty,
        description,
        photo,
        check_type: checkType
      })
      setIsReportingDamage(false)
      return response?.message || null
    } catch (err) {
      setIsReportingDamage(false)
      setError(err as Error)
      throw err
    }
  }, [damageCall])

  // Report missing
  const { call: missingCall } = useFrappePostCall<{ message: ItemCheckResult }>(
    'frm.api.delivery_tracking.report_missing'
  )

  const reportMissing = useCallback(async (
    deliveryOrder: string,
    product: string,
    missingQty: number,
    verifiedQty: number = 0,
    notes?: string,
    checkType: CheckType = 'loading'
  ): Promise<ItemCheckResult | null> => {
    setIsReportingMissing(true)
    setError(null)

    try {
      const response = await missingCall({
        delivery_order: deliveryOrder,
        product,
        missing_qty: missingQty,
        verified_qty: verifiedQty,
        notes,
        check_type: checkType
      })
      setIsReportingMissing(false)
      return response?.message || null
    } catch (err) {
      setIsReportingMissing(false)
      setError(err as Error)
      throw err
    }
  }, [missingCall])

  // Complete all pending items
  const { call: completeCall } = useFrappePostCall<{
    message: { items_verified: number; message: string }
  }>('frm.api.delivery_tracking.complete_checklist')

  const completeChecklist = useCallback(async (
    deliveryOrder: string,
    checkType: CheckType = 'loading'
  ): Promise<{ items_verified: number; message: string } | null> => {
    setIsCompleting(true)
    setError(null)

    try {
      const response = await completeCall({
        delivery_order: deliveryOrder,
        check_type: checkType
      })
      setIsCompleting(false)
      return response?.message || null
    } catch (err) {
      setIsCompleting(false)
      setError(err as Error)
      throw err
    }
  }, [completeCall])

  return {
    verifyItem,
    isVerifying,
    reportDamage,
    isReportingDamage,
    reportMissing,
    isReportingMissing,
    completeChecklist,
    isCompleting,
    error
  }
}
