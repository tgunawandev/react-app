/**
 * Search Configuration
 * Defines searchable fields per DocType
 * Reference: specs/001-sfa-app-build/tasks.md SEARCH-004
 */

export interface SearchFieldConfig {
  doctype: string
  searchFields: string[]
  displayFields: string[]
  highlightFields: string[]
}

/**
 * Search field configurations for each DocType
 */
export const SEARCH_CONFIGS: Record<string, SearchFieldConfig> = {
  'Customer': {
    doctype: 'Customer',
    searchFields: ['customer_name', 'name', 'customer_type', 'territory'],
    displayFields: ['customer_name', 'territory', 'customer_type'],
    highlightFields: ['customer_name', 'name']
  },
  'Sales Visit': {
    doctype: 'Sales Visit',
    searchFields: ['name', 'customer_name', 'status'],
    displayFields: ['name', 'customer_name', 'visit_date', 'status'],
    highlightFields: ['name', 'customer_name']
  },
  'Sales Order': {
    doctype: 'Sales Order',
    searchFields: ['name', 'customer', 'customer_name'],
    displayFields: ['name', 'customer', 'transaction_date', 'grand_total'],
    highlightFields: ['name', 'customer']
  },
  'Item': {
    doctype: 'Item',
    searchFields: ['item_name', 'item_code', 'item_group', 'name'],
    displayFields: ['item_name', 'item_code', 'item_group'],
    highlightFields: ['item_name', 'item_code']
  },
  'Route Plan': {
    doctype: 'Route Plan',
    searchFields: ['name', 'sales_representative', 'status'],
    displayFields: ['name', 'plan_date', 'sales_representative', 'status'],
    highlightFields: ['name', 'sales_representative']
  }
}

/**
 * Get search configuration for a DocType
 */
export function getSearchConfig(doctype: string): SearchFieldConfig | null {
  return SEARCH_CONFIGS[doctype] || null
}

/**
 * Build search filter for useFrappeGetDocList
 */
export function buildSearchFilter(doctype: string, query: string): any[] {
  const config = getSearchConfig(doctype)
  if (!config || !query) return []

  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  // Create OR filters for all searchable fields
  const orFilters = config.searchFields.map(field => [
    field,
    'like',
    `%${trimmedQuery}%`
  ])

  return orFilters
}
