/**
 * useDocTypeList Hook - Fetch record counts for DocType categories
 * Used for displaying badge numbers in CategoryCard headers
 * Reference: specs/001-sfa-app-build/tasks.md ENT-006
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

export interface DocTypeCount {
  doctype: string
  count: number
  label: string
}

export interface DocTypeCategoryCounts {
  customers: number
  products: number
  sales_orders: number
  delivery_orders: number
  invoices: number
  payment_entries: number
  delivery_returns: number
  route_plans: number
  activity_templates: number
  total_transactions: number
  total_planning: number
}

/**
 * Hook for fetching DocType record counts
 */
export function useDocTypeList() {
  // Fetch Customer count (territory-aware via get_my_customers)
  const { data: customerData } = useFrappeGetCall<{ message: { total_count: number } }>(
    'frm.api.customer.get_my_customers',
    { limit: 0, offset: 0 }, // Only fetch count, not actual records
    'customer-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000 // Cache for 1 minute
    }
  )

  // Fetch Item count (Products) - using SFA Item doctype fields
  const { data: itemData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    {
      doctype: 'Item',
      filters: { active: 1, sale_ok: 1 }
    },
    'item-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Sales Order count
  const { data: salesOrderData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Sales Order' },
    'sales-order-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Delivery Order count
  const { data: deliveryOrderData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Delivery Order' },
    'delivery-order-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Invoice count
  const { data: invoiceData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Invoice', filters: { state: 'Posted' } },
    'invoice-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Payment Entry count
  const { data: paymentData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Payment Entry' },
    'payment-entry-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Delivery Return count
  const { data: deliveryReturnData} = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Delivery Return' },
    'delivery-return-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Route Plan count
  const { data: routePlanData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Route Plan' },
    'route-plan-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Fetch Visit Activity Template count
  const { data: activityTemplateData } = useFrappeGetCall<{ message: number }>(
    'frappe.client.get_count',
    { doctype: 'Visit Activity Template' },
    'activity-template-count',
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  const customers = customerData?.message?.total_count || 0
  const products = itemData?.message || 0
  const salesOrders = salesOrderData?.message || 0
  const deliveryOrders = deliveryOrderData?.message || 0
  const invoices = invoiceData?.message || 0
  const paymentEntries = paymentData?.message || 0
  const deliveryReturns = deliveryReturnData?.message || 0
  const routePlans = routePlanData?.message || 0
  const activityTemplates = activityTemplateData?.message || 0

  const counts: DocTypeCategoryCounts = {
    customers,
    products,
    sales_orders: salesOrders,
    delivery_orders: deliveryOrders,
    invoices,
    payment_entries: paymentEntries,
    delivery_returns: deliveryReturns,
    route_plans: routePlans,
    activity_templates: activityTemplates,
    total_transactions: salesOrders + deliveryOrders + invoices + paymentEntries + deliveryReturns,
    total_planning: routePlans + activityTemplates
  }

  return {
    counts,
    isLoading: !customerData || !itemData || !salesOrderData || !deliveryOrderData || !invoiceData || !paymentData || !deliveryReturnData || !routePlanData || !activityTemplateData
  }
}
