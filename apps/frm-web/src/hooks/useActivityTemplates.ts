/**
 * useActivityTemplates Hook
 * Handles activity template CRUD operations
 * Reference: specs/001-sfa-app-build/tasks.md Phase 2 (Activity Template CRUD)
 */

import { useState } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'

export interface ActivityTemplate {
  template_id: string
  template_name: string
  activity_type: 'Checklist' | 'Photo' | 'Stock Check' | 'Competitor Tracking'
  is_mandatory: number
  photo_required: number
  status: 'Active' | 'Inactive'
  description: string | null
  modified: string
  creation: string
}

export interface ActivityTemplatesResponse {
  templates: ActivityTemplate[]
  total_count: number
  page_size: number
  offset: number
}

export interface ActivityTemplateDetail {
  template_id: string
  template_name: string
  activity_type: 'Checklist' | 'Photo' | 'Stock Check' | 'Competitor Tracking'
  is_mandatory: number
  photo_required: number
  status: 'Active' | 'Inactive'
  description: string | null
  created_by: string
  creation: string
  modified: string
  modified_by: string
}

export interface CreateTemplateParams {
  template_name: string
  activity_type: 'Checklist' | 'Photo' | 'Stock Check' | 'Competitor Tracking'
  is_mandatory?: number
  photo_required?: number
  status?: 'Active' | 'Inactive'
  description?: string
}

export interface UpdateTemplateParams {
  template_id: string
  template_name?: string
  activity_type?: 'Checklist' | 'Photo' | 'Stock Check' | 'Competitor Tracking'
  is_mandatory?: number
  photo_required?: number
  status?: 'Active' | 'Inactive'
  description?: string
}

export interface DeleteTemplateResponse {
  success: boolean
  template_id: string
  template_name: string
  message: string
}

export interface UseActivityTemplatesParams {
  status?: 'Active' | 'Inactive'
  activity_type?: string
  search?: string
  limit?: number
  offset?: number
}

/**
 * Hook for fetching activity templates list
 */
export function useActivityTemplates({
  status,
  activity_type,
  search,
  limit = 20,
  offset = 0
}: UseActivityTemplatesParams = {}) {
  // Build cache key
  const cacheKey = `activity-templates-${status || 'all'}-${activity_type || 'all'}-${search || 'all'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: ActivityTemplatesResponse }>(
    'frm.api.activity_template.get_templates',
    {
      status,
      activity_type,
      search,
      limit,
      offset
    },
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const templates = data?.message?.templates || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    templates,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for getting single template detail
 */
export function useActivityTemplateDetail(templateId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: ActivityTemplateDetail }>(
    'frm.api.activity_template.get_template_detail',
    {
      template_id: templateId
    },
    templateId ? undefined : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  )

  return {
    template: data?.message || null,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for activity template mutations (create, update, delete)
 */
export function useActivityTemplateMutations() {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createError, setCreateError] = useState<Error | null>(null)
  const [updateError, setUpdateError] = useState<Error | null>(null)
  const [deleteError, setDeleteError] = useState<Error | null>(null)

  // Create template
  const { call: createTemplateCall } = useFrappePostCall<{ message: ActivityTemplateDetail }>(
    'frm.api.activity_template.create_template'
  )

  const createTemplate = async (params: CreateTemplateParams): Promise<ActivityTemplateDetail | null> => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await createTemplateCall(params)
      setIsCreating(false)
      return response?.message || null
    } catch (error) {
      setIsCreating(false)
      setCreateError(error as Error)
      throw error
    }
  }

  // Update template
  const { call: updateTemplateCall } = useFrappePostCall<{ message: ActivityTemplateDetail }>(
    'frm.api.activity_template.update_template'
  )

  const updateTemplate = async (params: UpdateTemplateParams): Promise<ActivityTemplateDetail | null> => {
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await updateTemplateCall(params)
      setIsUpdating(false)
      return response?.message || null
    } catch (error) {
      setIsUpdating(false)
      setUpdateError(error as Error)
      throw error
    }
  }

  // Delete template
  const { call: deleteTemplateCall } = useFrappePostCall<{ message: DeleteTemplateResponse }>(
    'frm.api.activity_template.delete_template'
  )

  const deleteTemplate = async (template_id: string): Promise<DeleteTemplateResponse | null> => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await deleteTemplateCall({ template_id })
      setIsDeleting(false)
      return response?.message || null
    } catch (error) {
      setIsDeleting(false)
      setDeleteError(error as Error)
      throw error
    }
  }

  return {
    createTemplate,
    isCreating,
    createError,
    updateTemplate,
    isUpdating,
    updateError,
    deleteTemplate,
    isDeleting,
    deleteError
  }
}
