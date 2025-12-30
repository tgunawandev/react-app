/**
 * useOrder Hook
 * Handles order creation, pricing, inventory checks, and order fetching
 * Uses custom SFA doctypes (refactored from ERPNext)
 * Reference: specs/001-sfa-app-build/tasks.md US5-010
 */

import { useState } from 'react'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'
import type { SalesOrder } from '@/types/frm/SalesOrder'

export interface OrderItem {
  item_code: string
  qty: number
  rate?: number
  discount?: number  // Discount percentage (0-100)
}

export interface CreateOrderParams {
  customer: string  // Customer code (custom Customer doctype)
  sales_visit: string
  items: OrderItem[]
  commitment_date?: string  // Changed from delivery_date
  order_notes?: string
  warehouse?: string  // Odoo warehouse name
}

export interface CreateOrderResponse {
  sales_order_id: string
  status: string
  total_qty: number  // Changed from total
  amount_untaxed: number
  amount_tax: number
  amount_total: number  // Changed from grand_total
}

export interface InventoryCheckItem {
  item_code: string
  qty: number
}

export interface InventoryCheckResponse {
  availability: Array<{
    item_code: string
    requested_qty: number
    available_qty: number
    total_qty: number  // Added: total stock
    reserved_qty: number  // Added: reserved stock
    is_available: boolean
    shortfall: number
  }>
  all_available: boolean
}

export interface PricingItem {
  item_code: string
  qty: number
}

export interface PricingResponse {
  pricing: Array<{
    item_code: string
    item_name: string
    qty: number
    list_price: number  // Changed from standard_rate
    cost_price: number  // Added
    applied_rate: number
    discount_percentage: number
    discount_amount: number
    line_total: number
  }>
  total: number
  total_discount: number
}

// Extended SalesOrder type with calculated field and Odoo data
export interface OrderWithStats extends Omit<SalesOrder, 'odoo_id' | 'odoo_name' | 'state'> {
  item_count?: number  // Calculated by API
  odoo_state?: string | null  // Odoo order state: draft/sale/done/cancel
  odoo_id?: number
  odoo_name?: string | null
  state?: "draft" | "sent" | "sale" | "done" | "cancel"
}

// Alias for backward compatibility with Pages
export type Order = OrderWithStats

export interface OrdersResponse {
  orders: OrderWithStats[]
  total_count: number
  page_size: number
  offset: number
}

export function useOrder() {
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<Error | null>(null)

  // Create order
  const { call: createOrderCall } = useFrappePostCall<{ message: CreateOrderResponse }>(
    'frm.api.order.create'
  )

  const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse | null> => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await createOrderCall(params)
      setIsCreating(false)
      return response?.message || null
    } catch (error) {
      setIsCreating(false)
      setCreateError(error as Error)
      throw error
    }
  }

  // Check inventory
  const { call: checkInventoryCall } = useFrappePostCall<{ message: InventoryCheckResponse }>(
    'frm.api.order.check_inventory'
  )

  const checkInventory = async (items: InventoryCheckItem[], warehouse?: string): Promise<InventoryCheckResponse | null> => {
    try {
      const response = await checkInventoryCall({ items, warehouse })
      return response?.message || null
    } catch (error) {
      console.error('Inventory check failed:', error)
      throw error
    }
  }

  // Get pricing
  const { call: getPricingCall } = useFrappePostCall<{ message: PricingResponse }>(
    'frm.api.order.get_pricing'
  )

  const getPricing = async (customer: string, items: PricingItem[], apply_schemes: boolean = true): Promise<PricingResponse | null> => {
    try {
      const response = await getPricingCall({ customer, items, apply_schemes })
      return response?.message || null
    } catch (error) {
      console.error('Pricing calculation failed:', error)
      throw error
    }
  }

  return {
    createOrder,
    isCreating,
    createError,
    checkInventory,
    getPricing
  }
}

export interface UseOrdersParams {
  date_from?: string
  date_to?: string
  status?: string
  customer?: string
  sales_visit?: string
  search?: string
  limit?: number
  offset?: number
}

export function useOrders({
  date_from,
  date_to,
  status,
  customer,
  sales_visit,
  search,
  limit = 20,
  offset = 0
}: UseOrdersParams = {}) {
  // Build cache key
  const cacheKey = `orders-${date_from || 'all'}-${date_to || 'all'}-${status || 'all'}-${customer || 'all'}-${sales_visit || 'all'}-${search || 'all'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: OrdersResponse }>(
    'frm.api.order.get_my_orders',
    {
      date_from,
      date_to,
      status,
      customer,
      sales_visit,
      search,
      limit,
      offset
    },
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 60000, // 1 minute - orders change more frequently
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const orders = data?.message?.orders || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    orders,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Order Detail Types
 */
export interface OrderDetailItem {
  item_code: string
  item_name: string
  qty: number
  uom: string
  rate: number
  discount: number  // Discount percentage from API
  amount: number
  secondary_qty?: number  // Quantity in secondary UOM (e.g., CTN)
  secondary_uom?: string  // Secondary UOM name (e.g., "CTN", "Box", "Pack")
}

export interface OrderDetailCustomer {
  customer_id: string
  customer_name: string
}

export interface OrderDetailVisit {
  name: string
  visit_date: string
  status: string
  sales_rep: string
}

export interface OrderDetail {
  order_id: string
  customer: OrderDetailCustomer
  sales_visit: OrderDetailVisit | null
  order_date: string              // API returns order_date
  commitment_date: string | null  // API returns commitment_date (can be null)
  validity_date: string | null
  status: string
  docstatus: number
  warehouse: string | null
  operating_unit?: string | null  // Added: Operating unit field
  sales_team?: string | null      // Added: Sales team field
  items: OrderDetailItem[]
  total_qty: number
  amount_untaxed: number          // API returns amount_untaxed
  amount_tax: number              // API returns amount_tax
  amount_total: number            // API returns amount_total
  odoo_sync_status: string | null
  odoo_id: number | null
  odoo_name: string | null
  odoo_state: string | null       // Odoo order state: draft/sale/done/cancel
  created_by: string
  creation: string
  modified: string
}

export interface UpdateOrderParams {
  order_id: string
  items?: OrderItem[]
  delivery_date?: string
  order_notes?: string
}

export interface CancelOrderParams {
  order_id: string
  reason: string
}

export interface CancelOrderResponse {
  success: boolean
  order_id: string
  status: string
  reason: string
}

/**
 * Hook for getting order detail
 */
export function useOrderDetail(orderId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: OrderDetail }>(
    'frm.api.order.get_order_detail',
    {
      order_id: orderId
    },
    orderId ? undefined : null,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 0, // Disable deduping to allow immediate refetch
    }
  )

  return {
    order: data?.message || null,
    isLoading,
    error: error || null,
    mutate
  }
}

/**
 * Hook for order mutations (update, cancel)
 */
export function useOrderMutations() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [updateError, setUpdateError] = useState<Error | null>(null)
  const [cancelError, setCancelError] = useState<Error | null>(null)

  // Update order
  const { call: updateOrderCall } = useFrappePostCall<{ message: OrderDetail }>(
    'frm.api.order.update_order'
  )

  const updateOrder = async (params: UpdateOrderParams): Promise<OrderDetail | null> => {
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await updateOrderCall(params)
      setIsUpdating(false)
      return response?.message || null
    } catch (error) {
      setIsUpdating(false)
      setUpdateError(error as Error)
      throw error
    }
  }

  // Cancel order
  const { call: cancelOrderCall } = useFrappePostCall<{ message: CancelOrderResponse }>(
    'frm.api.order.cancel_order'
  )

  const cancelOrder = async (params: CancelOrderParams): Promise<CancelOrderResponse | null> => {
    setIsCancelling(true)
    setCancelError(null)

    try {
      const response = await cancelOrderCall(params)
      setIsCancelling(false)
      return response?.message || null
    } catch (error) {
      setIsCancelling(false)
      setCancelError(error as Error)
      throw error
    }
  }

  return {
    updateOrder,
    isUpdating,
    updateError,
    cancelOrder,
    isCancelling,
    cancelError
  }
}
