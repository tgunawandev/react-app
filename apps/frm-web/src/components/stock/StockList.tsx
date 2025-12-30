/**
 * StockList Component
 * Product-wise stock list with reorder alerts
 * Reference: specs/001-sfa-app-build/tasks.md US7-002
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, AlertTriangle, TrendingDown } from 'lucide-react'

interface StockItem {
  item_code: string
  item_name: string
  sfa_classification?: string
  field_priority?: string
  stock_uom: string
  available_stock: number
  reorder_level: number
  reorder_qty: number
  standard_rate: number
  needs_reorder: number
}

interface StockListProps {
  items: StockItem[]
  isLoading?: boolean
}

export function StockList({ items, isLoading }: StockListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No stock items found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const stockPercentage = item.reorder_level > 0
          ? Math.min(100, (item.available_stock / item.reorder_level) * 100)
          : 100

        const isLow = item.needs_reorder === 1
        const isCritical = item.available_stock <= 0

        return (
          <Card key={item.item_code} className={isCritical ? 'border-destructive' : isLow ? 'border-secondary' : ''}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.item_name}</h3>
                    <p className="text-xs text-muted-foreground">{item.item_code}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.sfa_classification && (
                      <Badge variant="secondary" className="text-xs">
                        {item.sfa_classification}
                      </Badge>
                    )}
                    {item.field_priority && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.field_priority === 'High'
                            ? 'border-destructive text-destructive'
                            : item.field_priority === 'Medium'
                            ? 'border-secondary text-secondary-foreground'
                            : 'border-primary text-primary'
                        }`}
                      >
                        {item.field_priority}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stock Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock Level</span>
                    <span className={`font-semibold ${
                      isCritical ? 'text-destructive' : isLow ? 'text-secondary-foreground' : 'text-primary'
                    }`}>
                      {item.available_stock} {item.stock_uom}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {item.reorder_level > 0 && (
                    <Progress
                      value={stockPercentage}
                      className={`h-2 ${
                        isCritical ? 'bg-destructive/10' : isLow ? 'bg-secondary/10' : 'bg-primary/10'
                      }`}
                    />
                  )}

                  {/* Reorder Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reorder Level: {item.reorder_level} {item.stock_uom}</span>
                    <span>${item.standard_rate.toFixed(2)}</span>
                  </div>
                </div>

                {/* Alerts */}
                {isCritical && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Out of Stock - Reorder {item.reorder_qty} {item.stock_uom}</span>
                  </div>
                )}

                {!isCritical && isLow && (
                  <div className="flex items-center gap-2 text-xs text-secondary-foreground bg-secondary/5 p-2 rounded">
                    <TrendingDown className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Low Stock - Reorder {item.reorder_qty} {item.stock_uom}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
