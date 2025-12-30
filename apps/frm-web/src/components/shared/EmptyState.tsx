/**
 * EmptyState Component
 * Reusable empty state component with icon, title, and description
 * Reference: specs/001-sfa-app-build/tasks.md FE-008
 */

import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6 text-center py-12">
        {Icon && <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="mt-4"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
