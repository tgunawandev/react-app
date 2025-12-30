/**
 * usePOD Hook
 * Handles Proof of Delivery operations
 * Reference: Delivery Tracking System Phase 4
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall, useFrappeGetCall, useFrappeFileUpload } from 'frappe-react-sdk'

// Types for POD
export interface PODRecord {
  name: string
  delivery_order: string
  delivery_assignment?: string
  customer: string
  customer_name: string
  pod_status: 'pending' | 'photo_captured' | 'signature_captured' | 'completed' | 'rejected'
  delivery_outcome: 'delivered' | 'partial_delivery' | 'rejected' | 'customer_absent' | 'wrong_address' | 'other'
  captured_by?: string
  captured_at?: string
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  address_captured?: string
  receiver_name?: string
  receiver_phone?: string
  receiver_relationship?: string
  delivery_photo?: string
  additional_photos?: string
  signature_required?: boolean
  signature_image?: string
  signature_captured_at?: string
  delivery_notes?: string
  rejection_reason?: string
  partial_delivery_notes?: string
}

export type DeliveryOutcome =
  | 'delivered'
  | 'partial_delivery'
  | 'rejected'
  | 'customer_absent'
  | 'wrong_address'
  | 'other'

export type ReceiverRelationship =
  | 'Customer'
  | 'Employee'
  | 'Family Member'
  | 'Security'
  | 'Receptionist'
  | 'Other'

/**
 * Hook for getting POD record
 */
export function usePOD(deliveryOrder?: string) {
  const shouldFetch = !!deliveryOrder
  const cacheKey = shouldFetch ? `pod-${deliveryOrder}` : null

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: PODRecord | null }>(
    'frm.api.delivery_tracking.get_pod',
    shouldFetch ? { delivery_order: deliveryOrder } : undefined,
    cacheKey,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 5000,
      shouldRetryOnError: true,
      errorRetryCount: 2
    }
  )

  return {
    pod: data?.message || null,
    isLoading: shouldFetch ? isLoading : false,
    error: error || null,
    refresh: mutate
  }
}

/**
 * Hook for POD mutations
 */
export function usePODMutations() {
  const [isCreating, setIsCreating] = useState(false)
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false)
  const [isCapturingSignature, setIsCapturingSignature] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // File upload
  const { upload } = useFrappeFileUpload()

  // Create POD
  const { call: createCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.create_pod'
  )

  const createPOD = useCallback(async (
    deliveryOrder: string,
    outcome: DeliveryOutcome = 'delivered',
    receiverName?: string,
    receiverPhone?: string,
    notes?: string
  ): Promise<PODRecord | null> => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await createCall({
        delivery_order: deliveryOrder,
        delivery_outcome: outcome,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        notes
      })
      setIsCreating(false)
      return response?.message || null
    } catch (err) {
      setIsCreating(false)
      setError(err as Error)
      throw err
    }
  }, [createCall])

  // Capture photo
  const { call: photoCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.capture_pod_photo'
  )

  const capturePhoto = useCallback(async (
    deliveryOrder: string,
    photoFile: File,
    latitude?: number,
    longitude?: number,
    accuracy?: number,
    isAdditional: boolean = false
  ): Promise<PODRecord | null> => {
    setIsCapturingPhoto(true)
    setError(null)

    try {
      // Upload file first
      const uploadResult = await upload(photoFile, {
        doctype: 'Delivery POD',
        fieldname: isAdditional ? 'additional_photos' : 'delivery_photo',
        isPrivate: false
      })

      if (!uploadResult?.file_url) {
        throw new Error('Failed to upload photo')
      }

      // Then capture in POD
      const response = await photoCall({
        delivery_order: deliveryOrder,
        photo_file: uploadResult.file_url,
        latitude,
        longitude,
        accuracy,
        is_additional: isAdditional
      })
      setIsCapturingPhoto(false)
      return response?.message || null
    } catch (err) {
      setIsCapturingPhoto(false)
      setError(err as Error)
      throw err
    }
  }, [photoCall, upload])

  // Capture photo from base64 (for camera capture)
  const capturePhotoBase64 = useCallback(async (
    deliveryOrder: string,
    base64Data: string,
    latitude?: number,
    longitude?: number,
    accuracy?: number,
    isAdditional: boolean = false
  ): Promise<PODRecord | null> => {
    setIsCapturingPhoto(true)
    setError(null)

    try {
      // Convert base64 to File
      const response = await fetch(base64Data)
      const blob = await response.blob()
      const file = new File([blob], `pod_${deliveryOrder}_${Date.now()}.jpg`, { type: 'image/jpeg' })

      return await capturePhoto(deliveryOrder, file, latitude, longitude, accuracy, isAdditional)
    } catch (err) {
      setIsCapturingPhoto(false)
      setError(err as Error)
      throw err
    }
  }, [capturePhoto])

  // Capture signature
  const { call: signatureCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.capture_pod_signature'
  )

  const captureSignature = useCallback(async (
    deliveryOrder: string,
    signatureBase64: string
  ): Promise<PODRecord | null> => {
    setIsCapturingSignature(true)
    setError(null)

    try {
      // Convert base64 to File and upload
      const response = await fetch(signatureBase64)
      const blob = await response.blob()
      const file = new File([blob], `signature_${deliveryOrder}_${Date.now()}.png`, { type: 'image/png' })

      const uploadResult = await upload(file, {
        doctype: 'Delivery POD',
        fieldname: 'signature_image',
        isPrivate: false
      })

      if (!uploadResult?.file_url) {
        throw new Error('Failed to upload signature')
      }

      const result = await signatureCall({
        delivery_order: deliveryOrder,
        signature_file: uploadResult.file_url
      })
      setIsCapturingSignature(false)
      return result?.message || null
    } catch (err) {
      setIsCapturingSignature(false)
      setError(err as Error)
      throw err
    }
  }, [signatureCall, upload])

  // Complete POD
  const { call: completeCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.complete_pod'
  )

  const completePOD = useCallback(async (
    deliveryOrder: string,
    receiverName?: string,
    receiverPhone?: string,
    receiverRelationship?: ReceiverRelationship,
    notes?: string
  ): Promise<PODRecord | null> => {
    setIsCompleting(true)
    setError(null)

    try {
      const response = await completeCall({
        delivery_order: deliveryOrder,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_relationship: receiverRelationship,
        notes
      })
      setIsCompleting(false)
      return response?.message || null
    } catch (err) {
      setIsCompleting(false)
      setError(err as Error)
      throw err
    }
  }, [completeCall])

  // Reject delivery
  const { call: rejectCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.reject_pod'
  )

  const rejectDelivery = useCallback(async (
    deliveryOrder: string,
    reason: string,
    notes?: string
  ): Promise<PODRecord | null> => {
    setIsRejecting(true)
    setError(null)

    try {
      const response = await rejectCall({
        delivery_order: deliveryOrder,
        reason,
        notes
      })
      setIsRejecting(false)
      return response?.message || null
    } catch (err) {
      setIsRejecting(false)
      setError(err as Error)
      throw err
    }
  }, [rejectCall])

  // Save draft (receiver info without completing)
  const { call: draftCall } = useFrappePostCall<{ message: PODRecord }>(
    'frm.api.delivery_tracking.update_pod_draft'
  )

  const saveDraft = useCallback(async (
    deliveryOrder: string,
    receiverName?: string,
    receiverPhone?: string,
    receiverRelationship?: ReceiverRelationship,
    notes?: string
  ): Promise<PODRecord | null> => {
    setError(null)

    try {
      const response = await draftCall({
        delivery_order: deliveryOrder,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_relationship: receiverRelationship,
        notes
      })
      return response?.message || null
    } catch (err) {
      setError(err as Error)
      // Don't throw - draft save failure shouldn't block user
      console.warn('Draft save failed:', err)
      return null
    }
  }, [draftCall])

  return {
    createPOD,
    isCreating,
    capturePhoto,
    capturePhotoBase64,
    isCapturingPhoto,
    captureSignature,
    isCapturingSignature,
    completePOD,
    isCompleting,
    rejectDelivery,
    isRejecting,
    saveDraft,
    error
  }
}
