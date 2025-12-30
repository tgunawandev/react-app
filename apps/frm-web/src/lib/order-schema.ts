/**
 * Sales Order Form Validation Schema
 * Zod schema for order creation and update forms
 * Reference: specs/001-sfa-app-build/tasks.md Phase 1 (Sales Order CRUD)
 */

import { z } from 'zod'

/**
 * Order item schema for items table
 */
export const orderItemSchema = z.object({
  item_code: z
    .string()
    .min(1, 'Item code is required'),

  item_name: z
    .string()
    .optional(),

  description: z
    .string()
    .optional()
    .nullable(),

  qty: z
    .number()
    .min(0.01, 'Quantity must be greater than 0')
    .positive('Quantity must be positive'),

  uom: z
    .string()
    .min(1, 'Unit of measure is required'),

  rate: z
    .number()
    .min(0, 'Rate must be non-negative')
    .optional()
    .nullable(),

  amount: z
    .number()
    .optional(),

  warehouse: z
    .string()
    .optional()
    .nullable(),

  delivery_date: z
    .string()
    .optional()
    .nullable(),

  pricing_rules: z
    .string()
    .optional()
    .nullable(),
})

/**
 * Sales Order form validation schema
 * Used for both create and edit modes
 */
export const orderFormSchema = z.object({
  // Customer Information
  customer: z
    .string()
    .min(1, 'Customer is required'),

  customer_name: z
    .string()
    .optional(),

  // Visit Information (required for create, readonly for edit)
  sales_visit: z
    .string()
    .optional()
    .nullable(),

  // Order Details
  transaction_date: z
    .string()
    .min(1, 'Transaction date is required'),

  delivery_date: z
    .string()
    .min(1, 'Delivery date is required'),

  // Order Items (minimum 1 item required)
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required'),

  // Optional Fields
  order_notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  territory: z
    .string()
    .optional()
    .nullable(),

  // Calculated Fields (readonly)
  total: z
    .number()
    .optional(),

  grand_total: z
    .number()
    .optional(),

  status: z
    .string()
    .optional(),

  docstatus: z
    .number()
    .optional(),
})

/**
 * TypeScript type inference from schema
 */
export type OrderFormData = z.infer<typeof orderFormSchema>
export type OrderItemData = z.infer<typeof orderItemSchema>

/**
 * Schema for order creation (during visit)
 * Requires sales_visit field
 */
export const orderCreateSchema = orderFormSchema.extend({
  sales_visit: z
    .string()
    .min(1, 'Sales visit is required for order creation'),
})

/**
 * Schema for order editing (draft orders only)
 * sales_visit is optional/readonly
 */
export const orderEditSchema = orderFormSchema

/**
 * Default values for new order form
 */
export const orderFormDefaultValues: Partial<OrderFormData> = {
  transaction_date: new Date().toISOString().split('T')[0],
  delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  items: [],
  order_notes: '',
  total: 0,
  grand_total: 0,
}

/**
 * Default values for new order item
 */
export const orderItemDefaultValues: Partial<OrderItemData> = {
  qty: 1,
}
