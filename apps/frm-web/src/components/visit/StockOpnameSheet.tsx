/**
 * StockOpnameSheet Component
 * Centered dialog for stock opname during visit
 * Shows stock items and allows inputting actual counted quantities
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Minus,
  Plus,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StockItem {
  item_code: string
  item_name: string
  barcode?: string
  product_category?: string
  uom: string
  secondary_uom?: string
  secondary_uom_factor?: number
  available_stock: number
  total_qty: number
  needs_reorder: number
}

export interface StockCount {
  item_code: string
  item_name: string
  uom: string
  system_qty: number
  counted_qty: number
  variance: number
}

interface StockOpnameSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Sales Visit ID for persistence */
  visitId?: string
  /** Customer name for context */
  customerName?: string
  /** Callback when stock check is complete */
  onComplete: (stockCounts: StockCount[]) => void
  /** Callback when stock check is skipped */
  onSkip?: () => void
  /** When true, only view data (no add/edit) */
  readOnly?: boolean
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function StockOpnameSheet({
  open,
  onOpenChange,
  visitId,
  customerName,
  onComplete,
  onSkip,
  readOnly = false,
}: StockOpnameSheetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Map of item_code -> counted quantity (null means not counted yet)
  const [countedQtys, setCountedQtys] = useState<Map<string, number | null>>(new Map())

  // Debounce search query for server-side search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // API hooks
  const { call: saveStockOpname } = useFrappePostCall<{
    message: { success: boolean; message: string; visit_id: string }
  }>('frm.api.stock.save_stock_opname')

  // Fetch existing stock opname data for this visit
  const { data: existingData } = useFrappeGetCall<{
    message: { stock_counts: StockCount[]; summary: { total_items_counted: number } } | null
  }>(
    open && visitId ? 'frm.api.stock.get_stock_opname' : null,
    open && visitId ? { visit_id: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Load existing data when available
  useEffect(() => {
    if (existingData?.message?.stock_counts) {
      const newMap = new Map<string, number | null>()
      existingData.message.stock_counts.forEach((item) => {
        newMap.set(item.item_code, item.counted_qty)
      })
      setCountedQtys(newMap)
    }
  }, [existingData])

  // Fetch stock items with server-side search
  const {
    data: stockData,
    isLoading,
    mutate: refreshStock,
  } = useFrappeGetCall<{
    message: {
      stock_items: StockItem[]
      total_count: number
      reorder_count: number
    }
  }>(
    open ? 'frm.api.stock.get_stock_levels' : null,
    open ? {
      limit: 50,
      search: debouncedSearch || undefined,
    } : undefined,
    open ? `stock-levels-${debouncedSearch || 'all'}` : null,
    { revalidateOnFocus: false }
  )

  const stockItems = stockData?.message?.stock_items || []
  const totalCount = stockData?.message?.total_count || 0
  const reorderCount = stockData?.message?.reorder_count || 0

  // Count of items that have been counted
  const countedItemsCount = useMemo(() => {
    let count = 0
    countedQtys.forEach((qty) => {
      if (qty !== null) count++
    })
    return count
  }, [countedQtys])

  // Count of items with variance
  const varianceCount = useMemo(() => {
    let count = 0
    countedQtys.forEach((qty, itemCode) => {
      if (qty !== null) {
        const item = stockItems.find(i => i.item_code === itemCode)
        if (item && qty !== item.available_stock) count++
      }
    })
    return count
  }, [countedQtys, stockItems])

  // Update counted quantity for an item
  const updateCount = useCallback((itemCode: string, qty: number | null) => {
    setCountedQtys((prev) => {
      const next = new Map(prev)
      if (qty === null || qty < 0) {
        next.delete(itemCode)
      } else {
        next.set(itemCode, qty)
      }
      return next
    })
  }, [])

  // Increment/decrement quantity
  const adjustCount = useCallback((itemCode: string, delta: number, systemQty: number) => {
    setCountedQtys((prev) => {
      const next = new Map(prev)
      const current = next.get(itemCode)
      // If not set yet, start from system qty
      const baseQty = current ?? systemQty
      const newQty = Math.max(0, baseQty + delta)
      next.set(itemCode, newQty)
      return next
    })
  }, [])

  // Set count to match system (no variance)
  const setMatchSystem = useCallback((itemCode: string, systemQty: number) => {
    setCountedQtys((prev) => {
      const next = new Map(prev)
      next.set(itemCode, systemQty)
      return next
    })
  }, [])

  // Handle complete
  const handleComplete = async () => {
    if (countedItemsCount === 0) {
      toast.error('Please count at least one item')
      return
    }

    setIsSubmitting(true)

    // Build stock counts array
    const stockCounts: StockCount[] = []
    countedQtys.forEach((countedQty, itemCode) => {
      if (countedQty !== null) {
        const item = stockItems.find(i => i.item_code === itemCode)
        if (item) {
          stockCounts.push({
            item_code: itemCode,
            item_name: item.item_name,
            uom: item.uom,
            system_qty: item.available_stock,
            counted_qty: countedQty,
            variance: countedQty - item.available_stock,
          })
        }
      }
    })

    // Save to database if visitId is provided
    if (visitId) {
      try {
        await saveStockOpname({
          visit_id: visitId,
          stock_counts: JSON.stringify(stockCounts),
        })
        toast.success(`Stock opname saved (${stockCounts.length} items counted)`)
      } catch (err) {
        console.error('Failed to save stock opname:', err)
        toast.error('Failed to save stock opname')
        setIsSubmitting(false)
        return
      }
    } else {
      toast.success(`Stock opname completed (${stockCounts.length} items counted)`)
    }

    onComplete(stockCounts)
    setIsSubmitting(false)
  }

  // Handle skip (complete without counting)
  const handleSkip = () => {
    toast.info('Stock opname skipped')
    if (onSkip) {
      onSkip()
    } else {
      // Fallback to old behavior if onSkip not provided
      onComplete([])
    }
  }

  // Handle open/close - don't reset counted qtys on open (will be loaded from existing data)
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset search query on open, but NOT countedQtys
      // countedQtys will be loaded from existing data via useEffect
      setSearchQuery('')
    } else {
      // Reset countedQtys when closing to avoid stale data
      setCountedQtys(new Map())
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => {
          // Prevent autofocus in read-only mode to avoid keyboard popup on mobile
          if (readOnly) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{readOnly ? 'View Stock Opname' : 'Stock Opname'}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? `Stock counts recorded at ${customerName || 'this location'}`
              : customerName ? `Count stock at ${customerName}` : 'Count and verify stock levels'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Summary Stats */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Package className="h-3 w-3" />
              {totalCount} Products
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {countedItemsCount} Counted
            </Badge>
            {varianceCount > 0 && (
              <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600">
                {varianceCount} Variance
              </Badge>
            )}
          </div>

          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus={!readOnly}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshStock()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>

          {/* Stock Items List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p>No products found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {stockItems.map((item) => {
                // Use secondary UOM if available, otherwise use primary UOM
                const displayUom = item.secondary_uom || item.uom
                const uomFactor = item.secondary_uom_factor || 1

                // Convert stock to secondary UOM for display
                const displayStock = item.secondary_uom && item.secondary_uom_factor
                  ? Math.round((item.available_stock / item.secondary_uom_factor) * 100) / 100
                  : item.available_stock

                const countedQty = countedQtys.get(item.item_code)
                const isCounted = countedQty !== undefined && countedQty !== null
                const variance = isCounted ? countedQty - displayStock : 0
                const hasVariance = isCounted && variance !== 0

                return (
                  <div
                    key={item.item_code}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      isCounted
                        ? hasVariance
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-primary/30 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    {/* Item Info Row */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {item.item_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.item_code}
                          {item.barcode && ` • ${item.barcode}`}
                        </div>
                      </div>
                      {isCounted && (
                        <Badge
                          variant={hasVariance ? 'outline' : 'secondary'}
                          className={cn(
                            'shrink-0',
                            hasVariance && 'border-orange-400 text-orange-600'
                          )}
                        >
                          {hasVariance ? (variance > 0 ? `+${variance}` : variance) : '✓'}
                        </Badge>
                      )}
                    </div>

                    {/* Quantity Row */}
                    <div className="flex items-center gap-3">
                      {/* System Qty */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">System</div>
                        <div className="font-semibold text-sm text-foreground">
                          {displayStock}
                        </div>
                        <div className="text-xs text-muted-foreground">{displayUom}</div>
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-px bg-border" />

                      {/* Count Input */}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Actual Count</div>
                        {readOnly ? (
                          <div className="h-8 flex items-center justify-center font-semibold text-sm">
                            {countedQty ?? '—'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => adjustCount(item.item_code, -1, item.available_stock)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              value={countedQty ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '') {
                                  updateCount(item.item_code, null)
                                } else {
                                  updateCount(item.item_code, parseInt(val) || 0)
                                }
                              }}
                              placeholder="—"
                              className="h-8 text-center text-sm font-medium"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => adjustCount(item.item_code, 1, item.available_stock)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Quick Match Button - hide in readOnly */}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs h-8 px-2"
                          onClick={() => setMatchSystem(item.item_code, item.available_stock)}
                        >
                          Match
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
          {readOnly ? (
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={countedItemsCount === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Complete (${countedItemsCount})`
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
