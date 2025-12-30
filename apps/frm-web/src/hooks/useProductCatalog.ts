/**
 * useProductCatalog Hook
 * Provides product catalog access with filtering and search
 * Uses custom Item doctype (refactored from ERPNext)
 * Reference: specs/001-sfa-app-build/tasks.md US5-009
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

// Product interface matching API response from get_product_catalog
export interface Product {
  // Basic fields
  item_code: string  // Aliased from 'name' in API
  item_name: string
  barcode: string | null
  category: string | null  // Aliased from 'product_category' in API (internal name like CAT-350)
  category_display_name: string | null  // Display name from Product Category (e.g., "ECO CUP")
  uom: string | null
  secondary_uom: string | null  // Secondary unit of measure (e.g., CTN, BOX)
  secondary_uom_factor: number | null  // Conversion factor (e.g., 24 = 1 CTN contains 24 primary units)

  // Pricing fields
  list_price: number  // Price per primary unit (e.g., per piece)
  secondary_uom_price: number | null  // Price per secondary unit (e.g., per carton)
  standard_price: number
  customer_specific_rate: number | null  // Customer-specific pricing (if customer_id provided)
  has_active_schemes: boolean  // Whether customer has active promotional pricing

  // Stock fields
  qty_available: number
  virtual_available: number
  secondary_qty_available: number | null  // Stock quantity in secondary UoM
  available_stock: number  // Calculated by API
  forecast_stock: number  // Calculated by API
  in_stock: boolean  // Calculated by API

  // Physical properties
  weight: number | null
  volume: number | null

  // Description and image fields
  description: string | null
  description_sale: string | null
  image_url: string | null

  // SFA classification fields
  sfa_classification: 'Fast Moving' | 'Slow Moving' | 'New Launch' | 'Promotional' | null
  field_priority: 'High' | 'Medium' | 'Low' | null
  promotional_eligible: number  // 0 or 1 (checkbox)

  // Odoo sync
  odoo_id: number | null
}

// Alias for backward compatibility with additional fields for legacy code
export interface ProductWithStock extends Product {
  // Legacy field mappings for backward compatibility
  image?: string | null // Alias for image_url
  product_category?: string | null // Alias for category
  stock_uom?: string | null // Alias for uom
  standard_rate?: number // Alias for standard_price
}

export interface ProductCatalogResponse {
  products: ProductWithStock[]
  total_count: number
  page_size: number
  offset: number
}

export interface UseProductCatalogParams {
  search?: string  // Search by item_name, item_code, barcode
  category?: string  // Product category filter
  customer_id?: string  // Customer ID for customer-specific pricing
  limit?: number
  offset?: number
}

export function useProductCatalog({
  search,
  category,
  customer_id,
  limit = 50,
  offset = 0
}: UseProductCatalogParams = {}) {
  // Build cache key including customer_id for proper caching of customer-specific pricing
  const cacheKey = `product-catalog-${category || 'all'}-${search || 'none'}-${customer_id || 'none'}-${limit}-${offset}`

  const { data, error, isLoading, mutate } = useFrappeGetCall<{ message: ProductCatalogResponse }>(
    'frm.api.order.get_product_catalog',
    {
      search,
      category,
      customer_id,
      limit,
      offset
    },
    cacheKey,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 300000, // 5 minutes
      shouldRetryOnError: true,
      errorRetryCount: 3
    }
  )

  const products = data?.message?.products || []
  const totalCount = data?.message?.total_count || 0
  const hasMore = totalCount > offset + limit

  return {
    products,
    totalCount,
    hasMore,
    isLoading,
    error: error || null,
    mutate
  }
}
