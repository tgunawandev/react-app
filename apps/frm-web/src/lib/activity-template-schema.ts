/**
 * Activity Template Form Validation Schema
 * Zod schema for activity template creation and editing
 * Reference: specs/001-sfa-app-build/tasks.md Phase 2 (Activity Template CRUD)
 */

import { z } from 'zod'

/**
 * Activity Template form validation schema
 * Used for both create and edit modes
 */
export const activityTemplateFormSchema = z.object({
  // Template Information
  template_name: z
    .string()
    .min(1, 'Template name is required')
    .max(140, 'Template name must be less than 140 characters'),

  activity_type: z
    .enum(['Checklist', 'Photo', 'Stock Check', 'Competitor Tracking'], {
      required_error: 'Activity type is required',
    } as any),

  // Flags
  is_mandatory: z
    .boolean()
    .default(false)
    .optional(),

  photo_required: z
    .boolean()
    .default(false)
    .optional(),

  status: z
    .enum(['Active', 'Inactive'], {
      required_error: 'Status is required',
    } as any)
    .default('Active')
    .optional(),

  // Optional Fields
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
})

/**
 * TypeScript type inference from schema
 */
export type ActivityTemplateFormData = z.infer<typeof activityTemplateFormSchema>

/**
 * Default values for new activity template form
 */
export const activityTemplateFormDefaultValues: Partial<ActivityTemplateFormData> = {
  template_name: '',
  activity_type: 'Checklist',
  is_mandatory: false,
  photo_required: false,
  status: 'Active',
  description: '',
}

/**
 * Activity type options for select dropdown
 */
export const activityTypeOptions = [
  { value: 'Checklist', label: 'Checklist' },
  { value: 'Photo', label: 'Photo' },
  { value: 'Stock Check', label: 'Stock Check' },
  { value: 'Competitor Tracking', label: 'Competitor Tracking' },
] as const

/**
 * Status options for select dropdown
 */
export const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
] as const
