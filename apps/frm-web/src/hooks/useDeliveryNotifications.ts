/**
 * Delivery Notifications Hook
 * Provides WhatsApp notification functions for delivery tracking
 * Reference: Delivery Tracking System Phase 3
 */

import { useState, useCallback } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'

// Types
export interface NotificationResult {
  success: boolean
  message: string
  sent?: number
  failed?: number
  total?: number
}

export interface NotificationLog {
  name: string
  subject: string
  content: string
  creation: string
  sent_or_received: string
}

export interface WhatsAppStatus {
  success: boolean
  message: string
  phone_id?: string
  version?: string
}

// Hook for notification mutations
export function useDeliveryNotificationMutations() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { call: postCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_assigned'
  )

  const { call: inTransitCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_in_transit'
  )

  const { call: arrivingCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_arriving'
  )

  const { call: completedCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_completed'
  )

  const { call: failedCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_failed'
  )

  const { call: rescheduledCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_delivery_rescheduled'
  )

  const { call: driverAssignmentCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_driver_assignment'
  )

  const { call: handoffCall } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_handoff'
  )

  // Notify customer about delivery assignment
  const notifyDeliveryAssigned = useCallback(async (
    deliveryOrder: string,
    driver?: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await postCall({ delivery_order: deliveryOrder, driver })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [postCall])

  // Notify customer that delivery is in transit
  const notifyInTransit = useCallback(async (
    deliveryOrder: string,
    etaMinutes?: number
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await inTransitCall({ delivery_order: deliveryOrder, eta_minutes: etaMinutes })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [inTransitCall])

  // Notify customer that driver is arriving
  const notifyArriving = useCallback(async (
    deliveryOrder: string,
    distanceMeters?: number
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await arrivingCall({ delivery_order: deliveryOrder, distance_meters: distanceMeters })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [arrivingCall])

  // Notify customer that delivery is completed
  const notifyCompleted = useCallback(async (
    deliveryOrder: string,
    receiverName?: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await completedCall({ delivery_order: deliveryOrder, receiver_name: receiverName })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [completedCall])

  // Notify customer that delivery failed
  const notifyFailed = useCallback(async (
    deliveryOrder: string,
    reason?: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await failedCall({ delivery_order: deliveryOrder, reason })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [failedCall])

  // Notify customer that delivery is rescheduled
  const notifyRescheduled = useCallback(async (
    deliveryOrder: string,
    newDate: string,
    newTime?: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await rescheduledCall({
        delivery_order: deliveryOrder,
        new_date: newDate,
        new_time: newTime
      })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [rescheduledCall])

  // Notify driver about new assignment
  const notifyDriverAssignment = useCallback(async (
    deliveryOrder: string,
    driver: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await driverAssignmentCall({ delivery_order: deliveryOrder, driver })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [driverAssignmentCall])

  // Notify about delivery handoff
  const notifyHandoff = useCallback(async (
    deliveryOrder: string,
    fromDriver: string,
    toDriver: string,
    hubName?: string
  ): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await handoffCall({
        delivery_order: deliveryOrder,
        from_driver: fromDriver,
        to_driver: toDriver,
        hub_name: hubName
      })
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [handoffCall])

  return {
    notifyDeliveryAssigned,
    notifyInTransit,
    notifyArriving,
    notifyCompleted,
    notifyFailed,
    notifyRescheduled,
    notifyDriverAssignment,
    notifyHandoff,
    isLoading,
    error
  }
}

// Hook for notification history
export function useNotificationHistory(deliveryOrder: string) {
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: NotificationLog[] }>(
    'frm.api.delivery_notifications.get_notification_status',
    { delivery_order: deliveryOrder },
    deliveryOrder ? `notification-history-${deliveryOrder}` : undefined,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    notifications: data?.message || [],
    isLoading,
    error,
    refresh: mutate
  }
}

// Hook for WhatsApp status check
export function useWhatsAppStatus() {
  const { data, isLoading, error, mutate } = useFrappeGetCall<{ message: WhatsAppStatus }>(
    'frm.api.delivery_notifications.test_whatsapp_connection',
    {},
    'whatsapp-status',
    {
      revalidateOnFocus: false,
      revalidateOnMount: true
    }
  )

  return {
    status: data?.message,
    isEnabled: data?.message?.success === true,
    isLoading,
    error,
    refresh: mutate
  }
}

// Hook for batch notifications
export function useBatchNotifications() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { call } = useFrappePostCall<NotificationResult>(
    'frm.api.delivery_notifications.notify_all_pending_deliveries'
  )

  const notifyAllPending = useCallback(async (): Promise<NotificationResult | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await call({})
      return result?.message || result
    } catch (err) {
      setError(err as Error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [call])

  return {
    notifyAllPending,
    isLoading,
    error
  }
}
