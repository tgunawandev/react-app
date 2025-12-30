/**
 * useVisitFlow Hook
 * State management for 7-step visit flow
 * Reference: New visit flow architecture - replaces auto-capture with manual steps
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall } from 'frappe-react-sdk'

export type VisitStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface StepData {
  step: VisitStep
  name: string
  status: StepStatus
  isMandatory: boolean
}

export interface VisitFlowState {
  currentStep: VisitStep
  visitId: string | null
  customerId: string | null
  steps: StepData[]
  canProceed: boolean
  isProcessing: boolean
  error: string | null
}

interface CheckInData {
  customer: string
  gps_latitude: number
  gps_longitude: number
  gps_accuracy: number
}

interface PhotoData {
  photo_base64: string
}

interface ActivityData {
  activity_template: string
  form_data: Record<string, any>
  start_time?: string
  end_time?: string
  outcome_notes?: string
}

interface CheckOutData {
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  no_order_reason?: string
}

interface UseVisitFlowReturn extends VisitFlowState {
  // Navigation
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: VisitStep) => void

  // Step Actions
  checkIn: (data: CheckInData) => Promise<string> // Returns visit_id
  savePhoto: (data: PhotoData) => Promise<void>
  addActivity: (data: ActivityData) => Promise<void>
  checkOut: (data: CheckOutData) => Promise<void>
  completeVisit: () => Promise<void>

  // Utilities
  canNavigateToStep: (step: VisitStep) => boolean
  isStepCompleted: (step: VisitStep) => boolean
  reset: () => void
}

const INITIAL_STEPS: StepData[] = [
  { step: 1, name: 'Check-In', status: 'in_progress', isMandatory: true },
  { step: 2, name: 'Take Photo', status: 'pending', isMandatory: true },
  { step: 3, name: 'Stock Opname', status: 'pending', isMandatory: true },
  { step: 4, name: 'Invoice Payment', status: 'pending', isMandatory: false },
  { step: 5, name: 'Sales Order', status: 'pending', isMandatory: false },
  { step: 6, name: 'Competitor Survey', status: 'pending', isMandatory: false },
  { step: 7, name: 'Check-Out', status: 'pending', isMandatory: true },
]

/**
 * Hook for managing visit flow state and transitions
 */
export function useVisitFlow(): UseVisitFlowReturn {
  const [state, setState] = useState<VisitFlowState>({
    currentStep: 1,
    visitId: null,
    customerId: null,
    steps: INITIAL_STEPS,
    canProceed: false,
    isProcessing: false,
    error: null,
  })

  // API hooks
  const { call: checkInAPI } = useFrappePostCall<{ message: any }>('frm.api.visit.check_in')
  const { call: addActivityAPI } = useFrappePostCall<{ message: any }>('frm.api.visit.add_activity')
  const { call: checkOutAPI } = useFrappePostCall<{ message: any }>('frm.api.visit.check_out')
  const { call: completeAPI } = useFrappePostCall<{ message: any }>('frm.api.visit.complete')
  const { call: uploadPhotoAPI } = useFrappePostCall<{ message: any }>('frm.api.photo.upload_visit_photo')

  /**
   * Update step status
   */
  const updateStepStatus = useCallback((step: VisitStep, status: StepStatus) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.step === step ? { ...s, status } : s),
    }))
  }, [])

  /**
   * Check if can navigate to a specific step
   */
  const canNavigateToStep = useCallback(
    (targetStep: VisitStep): boolean => {
      // Can only go to completed or current step
      const targetStepData = state.steps.find(s => s.step === targetStep)
      return (
        targetStepData?.status === 'completed' ||
        targetStepData?.status === 'skipped' ||
        targetStep === state.currentStep
      )
    },
    [state.steps, state.currentStep]
  )

  /**
   * Check if step is completed
   */
  const isStepCompleted = useCallback(
    (step: VisitStep): boolean => {
      const stepData = state.steps.find(s => s.step === step)
      return stepData?.status === 'completed' || stepData?.status === 'skipped'
    },
    [state.steps]
  )

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    if (state.currentStep < 7) {
      const nextStepNum = (state.currentStep + 1) as VisitStep
      setState(prev => ({
        ...prev,
        currentStep: nextStepNum,
        canProceed: false,
      }))
      updateStepStatus(nextStepNum, 'in_progress')
    }
  }, [state.currentStep, updateStepStatus])

  /**
   * Navigate to previous step
   */
  const previousStep = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as VisitStep,
        canProceed: true,
      }))
    }
  }, [state.currentStep])

  /**
   * Go to specific step
   */
  const goToStep = useCallback(
    (step: VisitStep) => {
      if (canNavigateToStep(step)) {
        setState(prev => ({
          ...prev,
          currentStep: step,
        }))
      }
    },
    [canNavigateToStep]
  )

  /**
   * Step 1: Check-In
   */
  const checkIn = useCallback(
    async (data: CheckInData): Promise<string> => {
      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      try {
        const response = await checkInAPI({
          customer: data.customer,
          gps_latitude: data.gps_latitude,
          gps_longitude: data.gps_longitude,
          gps_accuracy: data.gps_accuracy,
          // Don't pass photo_base64 - it's optional and will be added in step 2
        })

        const visitId = (response as any)?.visit_id || response?.message?.visit_id

        if (!visitId) {
          throw new Error('Failed to create visit - no visit ID returned')
        }

        setState(prev => ({
          ...prev,
          visitId,
          customerId: data.customer,
          isProcessing: false,
          canProceed: true,
        }))

        updateStepStatus(1, 'completed')

        return visitId
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Check-in failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
        }))
        throw error
      }
    },
    [checkInAPI, updateStepStatus]
  )

  /**
   * Step 2: Save Photo
   */
  const savePhoto = useCallback(
    async (data: PhotoData): Promise<void> => {
      if (!state.visitId) {
        throw new Error('No active visit - please check in first')
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      try {
        await uploadPhotoAPI({
          base64_data: data.photo_base64,
          sales_visit: state.visitId,
        })

        setState(prev => ({
          ...prev,
          isProcessing: false,
          canProceed: true,
        }))

        updateStepStatus(2, 'completed')
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Photo upload failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
        }))
        throw error
      }
    },
    [state.visitId, uploadPhotoAPI, updateStepStatus]
  )

  /**
   * Steps 3-6: Add Activity
   */
  const addActivity = useCallback(
    async (data: ActivityData): Promise<void> => {
      if (!state.visitId) {
        throw new Error('No active visit')
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      try {
        await addActivityAPI({
          sales_visit: state.visitId,
          ...data,
        })

        setState(prev => ({
          ...prev,
          isProcessing: false,
          canProceed: true,
        }))

        // Mark current step as completed
        updateStepStatus(state.currentStep, 'completed')
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Activity failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
        }))
        throw error
      }
    },
    [state.visitId, state.currentStep, addActivityAPI, updateStepStatus]
  )

  /**
   * Skip current activity (steps 3-6)
   * Marks step as skipped and allows proceeding to next step
   */
  const skipActivity = useCallback(() => {
    // Mark current step as skipped
    updateStepStatus(state.currentStep, 'skipped')

    setState(prev => ({
      ...prev,
      canProceed: true,
    }))
  }, [state.currentStep, updateStepStatus])

  /**
   * Step 7: Check-Out
   */
  const checkOut = useCallback(
    async (data: CheckOutData): Promise<void> => {
      if (!state.visitId) {
        throw new Error('No active visit')
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }))

      try {
        await checkOutAPI({
          sales_visit: state.visitId,
          ...data,
        })

        setState(prev => ({
          ...prev,
          isProcessing: false,
          canProceed: true,
        }))

        updateStepStatus(7, 'completed')
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Check-out failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
        }))
        throw error
      }
    },
    [state.visitId, checkOutAPI, updateStepStatus]
  )

  /**
   * Final: Complete Visit (submit document)
   */
  const completeVisit = useCallback(async (): Promise<void> => {
    if (!state.visitId) {
      throw new Error('No active visit')
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      await completeAPI({
        sales_visit: state.visitId,
      })

      setState(prev => ({
        ...prev,
        isProcessing: false,
      }))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Visit completion failed'
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMsg,
      }))
      throw error
    }
  }, [state.visitId, completeAPI])

  /**
   * Reset flow state
   */
  const reset = useCallback(() => {
    setState({
      currentStep: 1,
      visitId: null,
      customerId: null,
      steps: INITIAL_STEPS,
      canProceed: false,
      isProcessing: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    nextStep,
    previousStep,
    goToStep,
    checkIn,
    savePhoto,
    addActivity,
    skipActivity,
    checkOut,
    completeVisit,
    canNavigateToStep,
    isStepCompleted,
    reset,
  }
}
