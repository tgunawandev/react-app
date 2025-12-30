/**
 * Search Utilities
 * Helper functions for search highlighting and result processing
 * Reference: specs/001-sfa-app-build/tasks.md SEARCH-005
 */

/**
 * Search result type for cross-DocType search
 */
export interface SearchResult {
  name: string
  doctype: string
  display_name: string
  subtitle?: string
  match_type?: 'exact' | 'partial'
}

/**
 * Search across multiple DocTypes
 * Searches all major entities: Customers, Products, Orders, Deliveries, Invoices, Payments, Returns, Routes
 */
export async function searchAcrossDocTypes(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      limit: '20'
    })

    const response = await fetch(`/api/method/frm.api.search.global_search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message || []
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

/**
 * Highlight search query matches in text
 * Returns HTML string with <mark> tags
 */
export function highlightSearchMatch(text: string, query: string): string {
  if (!query || !text) return text

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

/**
 * Escape special regex characters in search query
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Check if a record matches the search query
 * Used for client-side filtering
 */
export function matchesSearchQuery(
  record: any,
  query: string,
  searchFields: string[]
): boolean {
  if (!query) return true

  const lowerQuery = query.toLowerCase().trim()

  return searchFields.some(field => {
    const value = record[field]
    if (value === null || value === undefined) return false

    return String(value).toLowerCase().includes(lowerQuery)
  })
}

/**
 * Filter records by search query (client-side)
 */
export function filterRecordsByQuery<T extends Record<string, any>>(
  records: T[],
  query: string,
  searchFields: string[]
): T[] {
  if (!query || !query.trim()) return records

  return records.filter(record => matchesSearchQuery(record, query, searchFields))
}

/**
 * Save search query to localStorage for persistence
 */
export function saveSearchQuery(doctype: string, query: string): void {
  try {
    const key = `search_query_${doctype}`
    if (query) {
      localStorage.setItem(key, query)
    } else {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('Error saving search query:', error)
  }
}

/**
 * Load persisted search query from localStorage
 */
export function loadSearchQuery(doctype: string): string {
  try {
    const key = `search_query_${doctype}`
    return localStorage.getItem(key) || ''
  } catch (error) {
    console.error('Error loading search query:', error)
    return ''
  }
}

/**
 * Clear persisted search query
 */
export function clearSearchQuery(doctype: string): void {
  try {
    const key = `search_query_${doctype}`
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing search query:', error)
  }
}
