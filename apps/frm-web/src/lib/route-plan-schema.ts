/**
 * Route Plan Form Schema
 * Zod validation schemas for route plan forms
 * Reference: specs/001-sfa-app-build/tasks.md PHASE 3 (Route Plan CRUD)
 */

import { z } from 'zod'

/**
 * Route Plan Customer Item Schema
 */
export const routePlanCustomerSchema = z.object({
  customer: z.string().min(1, 'Customer is required'),
  sequence: z.number().min(1, 'Sequence must be at least 1'),
})

export type RoutePlanCustomerData = z.infer<typeof routePlanCustomerSchema>

/**
 * Route Plan Form Schema
 */
export const routePlanFormSchema = z.object({
  plan_date: z.string().min(1, 'Plan date is required'),
  customers: z.array(routePlanCustomerSchema).min(1, 'At least one customer is required'),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
})

export type RoutePlanFormData = z.infer<typeof routePlanFormSchema>

/**
 * Default form values
 */
export const routePlanFormDefaultValues: Partial<RoutePlanFormData> = {
  plan_date: '',
  customers: [],
  status: 'Draft',
}

/**
 * Status options
 */
export const routePlanStatusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Confirmed' },
] as const

/**
 * All status options (for filtering)
 */
export const allRoutePlanStatusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const
