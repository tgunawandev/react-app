/**
 * Sales Targets Hook
 * Fetch and calculate current month sales target progress
 * Reference: specs/001-sfa-app-build/tasks.md HOME-006
 */

import { useFrappeGetDocList } from 'frappe-react-sdk'

export interface SalesTargetMetric {
  label: string
  current: number
  target: number
  progress: number
  color: string
}

export interface SalesTargetsData {
  salesQty: SalesTargetMetric
  invoicePayments: SalesTargetMetric
  activeOutlets: SalesTargetMetric
  effectiveCalls: SalesTargetMetric
  isLoading: boolean
  error: Error | undefined
}

/**
 * Hook to fetch current month sales targets and calculate progress
 */
export function useSalesTargets(): SalesTargetsData {
  const currentDate = new Date()
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  // Fetch Sales Visits for the current month
  const { data: visits, isLoading: visitsLoading, error: visitsError } = useFrappeGetDocList(
    'Sales Visit',
    {
      fields: ['name', 'status', 'customer'],
      filters: [
        ['visit_date', '>=', monthStart],
        ['visit_date', '<=', monthEnd],
        ['docstatus', '=', 1], // Only submitted visits
      ],
      limit: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  )

  // Fetch Sales Orders for the current month
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useFrappeGetDocList(
    'Sales Order',
    {
      fields: ['name', 'amount_total', 'docstatus'],
      filters: [
        ['transaction_date', '>=', monthStart],
        ['transaction_date', '<=', monthEnd],
        ['docstatus', '=', 1], // Only submitted orders
      ],
      limit: 1000,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  )

  const isLoading = visitsLoading || ordersLoading
  const error = visitsError || ordersError

  // Calculate metrics
  const completedVisits = visits?.filter((v) => v.status === 'completed').length || 0
  const totalOrderValue = orders?.reduce((sum, order) => sum + (order.amount_total || 0), 0) || 0
  const uniqueCustomers = new Set(visits?.map((v) => v.customer) || []).size

  // Calculate progress percentages and colors
  const getColor = (progress: number): string => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Target values (these should ideally come from Sales Target DocType)
  // const salesQtyTarget = 100
  const invoicePaymentsTarget = 50000
  const activeOutletsTarget = 50
  const effectiveCallsTarget = 80

  const salesQtyProgress = Math.min(100, (totalOrderValue / invoicePaymentsTarget) * 100)
  const invoicePaymentsProgress = Math.min(100, (totalOrderValue / invoicePaymentsTarget) * 100)
  const activeOutletsProgress = Math.min(100, (uniqueCustomers / activeOutletsTarget) * 100)
  const effectiveCallsProgress = Math.min(100, (completedVisits / effectiveCallsTarget) * 100)

  return {
    salesQty: {
      label: 'Sales QTY',
      current: Math.round(totalOrderValue / 1000), // Display in thousands
      target: Math.round(invoicePaymentsTarget / 1000),
      progress: salesQtyProgress,
      color: getColor(salesQtyProgress),
    },
    invoicePayments: {
      label: 'Invoice Payments',
      current: totalOrderValue,
      target: invoicePaymentsTarget,
      progress: invoicePaymentsProgress,
      color: getColor(invoicePaymentsProgress),
    },
    activeOutlets: {
      label: 'Active Outlets',
      current: uniqueCustomers,
      target: activeOutletsTarget,
      progress: activeOutletsProgress,
      color: getColor(activeOutletsProgress),
    },
    effectiveCalls: {
      label: 'Effective Calls',
      current: completedVisits,
      target: effectiveCallsTarget,
      progress: effectiveCallsProgress,
      color: getColor(effectiveCallsProgress),
    },
    isLoading,
    error: error as any,
  }
}
