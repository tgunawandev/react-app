/**
 * useCustomers Hook
 * Provides customer data access with search and pagination
 * Uses custom Customer doctype (no territory filtering - removed in refactoring)
 * Reference: specs/001-sfa-app-build/tasks.md US4-004
 */

import { useFrappeGetCall } from 'frappe-react-sdk'
import type { Customer } from '@/types/frm/Customer'

// Extended Customer type with calculated fields from API
export interface CustomerWithStats extends Customer {
  // Calculated by API from Sales Visit records
  last_visit_date?: string
  days_since_last_visit?: number | null
  total_visits?: number
  completed_visits?: number
  // Contact fields that might be missing from base type
  phone?: string | null
  mobile?: string | null
  customer_id?: string // Alias for customer_code
  customer_code?: string
  // Additional fields used in UI
  customer_type?: string
  status?: string
  address_line1?: string
  street?: string
  city?: string
  // Odoo integration fields
  odoo_id?: number
  odoo_name?: string
  odoo_state?: string
  odoo_sync_status?: string
  // Fields from Customer DocType
  operating_unit?: string
  sales_team?: string
  // GPS coordinates
  gps_latitude?: number | null
  gps_longitude?: number | null
}

export interface CustomersResponse {
  customers: CustomerWithStats[]
  total_count: number
  limit: number
  offset: number
}

export interface UseCustomersParams {
  search?: string
  operating_unit?: string
  territory?: string
  limit?: number
  offset?: number
}

export function useCustomers({
  search,
  operating_unit,
  territory,
  limit = 50,
  offset = 0
}: UseCustomersParams = {}) {
  // Build cache key with params including operating_unit and territory
  const cacheKey = `customers-${search || 'none'}-${operating_unit || 'none'}-${territory || 'none'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: CustomersResponse }>(
    'frm.api.customer.get_my_customers',
    {
      search,
      operating_unit,
      territory,
      limit,
      offset
    },
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 300000, // 5 minutes - customers don't change frequently
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const customers = data?.message?.customers || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    customers,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}

export interface UseCustomerParams {
  customerId: string
}

/**
 * Hook to get a single customer's details
 * Uses frm.api.customer.get_customer_detail for enriched data with address_details
 */
export function useCustomer({ customerId }: UseCustomerParams) {
  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: any }>(
    'frm.api.customer.get_customer_detail',
    {
      customer_id: customerId
    },
    customerId ? `customer-detail-${customerId}` : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 300000,
    }
  )

  return {
    customer: data?.message,
    isLoading,
    error: error || null,
    mutate
  }
}
