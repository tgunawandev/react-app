/**
 * useVisit Hook
 * React hook for visit workflow management (check-in, activities, completion)
 * Reference: specs/001-sfa-app-build/tasks.md US1-019
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'

interface VisitActivity {
  activity_template: string
  form_data: Record<string, any>
  start_time?: string
  end_time?: string
  outcome_notes?: string
}

interface CheckInParams {
  customer: string
  gps_latitude: number
  gps_longitude: number
  gps_accuracy: number
  photo_base64: string
  qr_code?: string
}

interface CheckInResponse {
  visit_id: string
  status: string
  validations: {
    gps: { is_valid: boolean; distance_meters: number }
    photo: { is_valid: boolean; timestamp: string }
  }
}

interface AddActivityResponse {
  activity_id: string
  status: string
}

interface CompleteVisitResponse {
  visit_id: string
  status: string
  compliance_score: number
}

interface UseVisitState {
  currentVisit: CheckInResponse | null
  activities: VisitActivity[]
  isCheckingIn: boolean
  isAddingActivity: boolean
  isCompleting: boolean
  error: string | null
  complianceScore: number | null
}

interface UseVisitReturn extends UseVisitState {
  checkIn: (params: CheckInParams) => Promise<CheckInResponse>
  addActivity: (activity: VisitActivity) => Promise<AddActivityResponse>
  completeVisit: () => Promise<CompleteVisitResponse>
  reset: () => void
  getMyVisits: (filters?: Record<string, any>) => any
  getVisitDetails: (visitId: string) => any
}

/**
 * Hook for visit workflow state management
 *
 * @returns UseVisitReturn - Visit state and control functions
 *
 * @example
 * ```tsx
 * const { currentVisit, checkIn, addActivity, completeVisit } = useVisit()
 *
 * // Step 1: Check in
 * const visit = await checkIn({
 *   customer: 'CUST-001',
 *   gps_latitude: -6.2088,
 *   gps_longitude: 106.8456,
 *   gps_accuracy: 25,
 *   photo_base64: '...'
 * })
 *
 * // Step 2: Add activities
 * await addActivity({
 *   activity_template: 'ACT-001',
 *   form_data: { notes: 'Sample data' }
 * })
 *
 * // Step 3: Complete visit
 * const result = await completeVisit()
 * console.log('Compliance score:', result.compliance_score)
 * ```
 */
export function useVisit(): UseVisitReturn {
  const [state, setState] = useState<UseVisitState>({
    currentVisit: null,
    activities: [],
    isCheckingIn: false,
    isAddingActivity: false,
    isCompleting: false,
    error: null,
    complianceScore: null
  })

  // Frappe API calls
  const { call: checkInAPI } = useFrappePostCall<{ message: CheckInResponse }>('frm.api.visit.check_in')
  const { call: addActivityAPI } = useFrappePostCall<{ message: AddActivityResponse }>(
    'frm.api.visit.add_activity'
  )
  const { call: completeVisitAPI } = useFrappePostCall<{ message: CompleteVisitResponse }>(
    'frm.api.visit.complete'
  )
  const { call: getVisitDetailsAPI } = useFrappePostCall<{ message: any }>('frm.api.visit.get_visit_details')

  /**
   * Check in to create a new visit
   *
   * @param params - Check-in parameters
   * @returns Promise<CheckInResponse> - Created visit info
   */
  const checkIn = useCallback(
    async (params: CheckInParams): Promise<CheckInResponse> => {
      setState(prev => ({
        ...prev,
        isCheckingIn: true,
        error: null
      }))

      try {
        const response = await checkInAPI(params)

        if (!response?.message) {
          throw new Error('Invalid check-in response')
        }

        const visitData = response.message

        setState(prev => ({
          ...prev,
          currentVisit: visitData,
          activities: [],
          isCheckingIn: false,
          error: null
        }))

        return visitData
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Check-in failed'

        setState(prev => ({
          ...prev,
          isCheckingIn: false,
          error: errorMessage
        }))

        throw error
      }
    },
    [checkInAPI]
  )

  /**
   * Add activity to current visit
   *
   * @param activity - Activity data
   * @returns Promise<AddActivityResponse> - Added activity info
   */
  const addActivity = useCallback(
    async (activity: VisitActivity): Promise<AddActivityResponse> => {
      if (!state.currentVisit) {
        throw new Error('No active visit. Please check in first.')
      }

      setState(prev => ({
        ...prev,
        isAddingActivity: true,
        error: null
      }))

      try {
        const response = await addActivityAPI({
          sales_visit: state.currentVisit.visit_id,
          activity_template: activity.activity_template,
          form_data: activity.form_data,
          start_time: activity.start_time,
          end_time: activity.end_time,
          outcome_notes: activity.outcome_notes
        })

        if (!response?.message) {
          throw new Error('Invalid add activity response')
        }

        const activityData = response.message

        setState(prev => ({
          ...prev,
          activities: [...prev.activities, activity],
          isAddingActivity: false,
          error: null
        }))

        return activityData
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add activity'

        setState(prev => ({
          ...prev,
          isAddingActivity: false,
          error: errorMessage
        }))

        throw error
      }
    },
    [state.currentVisit, addActivityAPI]
  )

  /**
   * Complete current visit
   *
   * @returns Promise<CompleteVisitResponse> - Completion result with compliance score
   */
  const completeVisit = useCallback(async (): Promise<CompleteVisitResponse> => {
    if (!state.currentVisit) {
      throw new Error('No active visit to complete')
    }

    setState(prev => ({
      ...prev,
      isCompleting: true,
      error: null
    }))

    try {
      const response = await completeVisitAPI({
        sales_visit: state.currentVisit.visit_id
      })

      if (!response?.message) {
        throw new Error('Invalid complete visit response')
      }

      const completionData = response.message

      setState(prev => ({
        ...prev,
        isCompleting: false,
        complianceScore: completionData.compliance_score,
        error: null
      }))

      return completionData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete visit'

      setState(prev => ({
        ...prev,
        isCompleting: false,
        error: errorMessage
      }))

      throw error
    }
  }, [state.currentVisit, completeVisitAPI])

  /**
   * Get my visits list (wrapper around useFrappeGetCall)
   *
   * @param filters - Filter parameters
   * @returns SWR response
   */
  const getMyVisits = useCallback((filters: Record<string, any> = {}) => {
    // This returns an SWR response object that components can use
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useFrappeGetCall('frm.api.visit.get_my_visits', filters, undefined, {
      revalidateOnFocus: false
    })
  }, [])

  /**
   * Get visit details by ID
   *
   * @param visitId - Visit document name
   * @returns Promise with visit details
   */
  const getVisitDetails = useCallback(
    (visitId: string) => {
      return getVisitDetailsAPI({ sales_visit: visitId })
    },
    [getVisitDetailsAPI]
  )

  /**
   * Reset visit state
   */
  const reset = useCallback(() => {
    setState({
      currentVisit: null,
      activities: [],
      isCheckingIn: false,
      isAddingActivity: false,
      isCompleting: false,
      error: null,
      complianceScore: null
    })
  }, [])

  return {
    ...state,
    checkIn,
    addActivity,
    completeVisit,
    reset,
    getMyVisits,
    getVisitDetails
  }
}

/**
 * Update Visit Parameters
 */
export interface UpdateVisitParams {
  sales_visit: string
  notes?: string
}

/**
 * Cancel Visit Parameters
 */
export interface CancelVisitParams {
  sales_visit: string
  reason: string
}

/**
 * Hook for visit mutations (update, cancel)
 * Reference: specs/001-sfa-app-build/tasks.md PHASE 4 (Sales Visit CRUD)
 */
export function useVisitMutations() {
  const { call: updateCall } = useFrappePostCall<{ message: any }>('frm.api.visit.update_visit')
  const { call: cancelCall } = useFrappePostCall<{
    message: { visit_id: string; status: string; message: string }
  }>('frm.api.visit.cancel_visit')

  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const updateVisit = async (params: UpdateVisitParams) => {
    setIsUpdating(true)
    try {
      const response = await updateCall({
        sales_visit: params.sales_visit,
        notes: params.notes
      })
      return response?.message || null
    } finally {
      setIsUpdating(false)
    }
  }

  const cancelVisit = async (params: CancelVisitParams) => {
    setIsCancelling(true)
    try {
      const response = await cancelCall({
        sales_visit: params.sales_visit,
        reason: params.reason
      })
      return response?.message || null
    } finally {
      setIsCancelling(false)
    }
  }

  return {
    updateVisit,
    isUpdating,
    cancelVisit,
    isCancelling
  }
}

/**
 * Hook for fetching visit detail
 * Reference: specs/001-sfa-app-build/tasks.md PHASE 4 (Sales Visit CRUD)
 */
export function useVisitDetail(visitId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: any }>(
    'frm.api.visit.get_visit_details',
    visitId ? { sales_visit: visitId } : undefined,
    visitId ? undefined : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true
    }
  )

  return {
    visit: data?.message || null,
    isLoading,
    error: error || null,
    mutate
  }
}
