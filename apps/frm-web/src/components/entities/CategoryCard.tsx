/**
 * CategoryCard Component - Expandable Entity Category
 * Shows category name with record count badge, expandable list
 * Reference: specs/001-sfa-app-build/tasks.md ENT-004
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

export interface CategoryItem {
  label: string
  doctype: string
  route: string
  count?: number
  icon?: LucideIcon
  description?: string
}

export interface CategoryCardProps {
  title: string
  items: CategoryItem[]
  icon: LucideIcon
  onQuickCreate?: () => void
  defaultExpanded?: boolean
}

export function CategoryCard({
  title,
  items,
  icon: Icon,
  onQuickCreate,
  defaultExpanded = false
}: CategoryCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const totalCount = items.reduce((sum, item) => sum + (item.count || 0), 0)

  const handleItemClick = (item: CategoryItem) => {
    navigate(item.route)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}

            {/* Category Icon */}
            <Icon className="h-4 w-4 text-primary shrink-0" />

            {/* Category Title */}
            <h3 className="font-semibold truncate">{title}</h3>

            {/* Count Badge */}
            <Badge variant="secondary" className="shrink-0 text-xs">
              {totalCount}
            </Badge>
          </div>

          {/* Quick Create Button */}
          {onQuickCreate && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onQuickCreate()
              }}
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quick Create</span>
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="p-0 border-t">
          <div className="divide-y">
            {items.map((item) => {
              const ItemIcon = item.icon

              return (
                <div
                  key={item.route}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {ItemIcon && <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.count !== undefined && (
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {item.count}
                    </Badge>
                  )}
                </div>
              )
            })}

            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No items in this category
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
