/**
 * Customer Form Validation Schema
 * Zod schema for customer creation and update forms
 * FIXED: Aligned with actual SFA Customer doctype fields
 * Reference: apps/sfa/sfa/doctype/customer/customer.json
 */

import { z } from 'zod'

/**
 * Customer form validation schema
 * Used for both create and edit modes
 *
 * IMPORTANT: Field names MUST match Customer doctype exactly:
 * - customer_name (not customer_display_name)
 * - mobile (not mobile_no)
 * - email (not email_id)
 * - street (not address_line1)
 */
export const customerFormSchema = z.object({
  // Basic Information
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(140, 'Customer name must not exceed 140 characters'),

  // Contact Information
  street: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  street2: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  city: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  state: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  zip: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  country: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  mobile: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  // GPS Coordinates
  gps_latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional()
    .nullable(),

  gps_longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional()
    .nullable(),

  // Store Photos (array of file URLs)
  store_photos: z
    .array(z.string())
    .optional()
    .default([]),
})

/**
 * Type inference from schema
 */
export type CustomerFormData = z.infer<typeof customerFormSchema>

/**
 * Schema for create mode (same as base)
 */
export const customerCreateSchema = customerFormSchema

/**
 * Schema for edit mode (same as base)
 */
export const customerEditSchema = customerFormSchema

/**
 * Default form values
 */
export const customerFormDefaults: Partial<CustomerFormData> = {
  customer_name: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  phone: '',
  mobile: '',
  email: '',
  gps_latitude: undefined,
  gps_longitude: undefined,
  store_photos: [],
}
