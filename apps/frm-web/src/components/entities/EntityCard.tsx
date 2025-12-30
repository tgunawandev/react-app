/**
 * EntityCard Component
 * Card-based entity navigation (no accordions)
 * Follows shadcn-admin patterns with semantic colors
 */

import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'

export interface EntityCardProps {
  label: string
  description: string
  route: string
  count?: number
  icon: LucideIcon
  isLoading?: boolean
}

export function EntityCard({
  label,
  description,
  route,
  count,
  icon: Icon,
  isLoading
}: EntityCardProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card>
        <div className="p-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => navigate(route)}
    >
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-sm text-foreground">
                {label}
              </h3>
              {count !== undefined && (
                <Badge variant="secondary" className="font-mono text-[10px] h-4 px-1.5">
                  {count.toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </Card>
  )
}
