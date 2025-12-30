/**
 * useOperatingUnits Hook
 * Fetches active Operating Units for filtering
 * Reference: Dynamic filter implementation (Odoo operating.unit model)
 */

import { useFrappeGetCall } from 'frappe-react-sdk'

export interface OperatingUnit {
  name: string
  operating_unit_name: string
  code: string
}

export function useOperatingUnits() {
  const { data, error, isLoading } = useFrappeGetCall<{ message: OperatingUnit[] }>(
    'frm.api.customer.get_operating_units',
    undefined,
    'operating-units', // Static cache key - units don't change frequently
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 600000, // 10 minutes - units rarely change
    }
  )

  const operatingUnits = data?.message || []

  return {
    operatingUnits,
    isLoading,
    error: error || null,
  }
}
