/**
 * VisitTimeline Component
 * Vertical timeline stepper for visit activities
 * Clean shadcn UI design with subtle enhancements
 */

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Camera,
  Package,
  CreditCard,
  ShoppingCart,
  ClipboardList,
  LogOut,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped'

/** Photo item for the Photos step */
export interface PhotoItem {
  id: string
  url: string
  thumbnail_url?: string
  caption?: string
}

export interface TimelineStep {
  id: string
  name: string
  icon: LucideIcon
  status: StepStatus
  isRequired: boolean
  summary?: string
  count?: number
  actionLabel: string
  onAction: () => void
  /** Photos to display (only for photos step) */
  photos?: PhotoItem[]
  /** Callback to delete a photo */
  onDeletePhoto?: (photoId: string) => void
  /** Callback to edit/re-take a photo */
  onEditPhoto?: (photoId: string) => void
}

interface VisitTimelineProps {
  steps: TimelineStep[]
  canCheckOut: boolean
  onCheckOut: () => void
  isProcessing: boolean
  /** When true, all actions are disabled (visit completed) */
  readOnly?: boolean
}

export function VisitTimeline({
  steps,
  canCheckOut,
  onCheckOut,
  isProcessing,
  readOnly = false,
}: VisitTimelineProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const hasPhotos = step.photos && step.photos.length > 0
        const isCompleted = step.status === 'completed'
        const isActive = step.status === 'active'
        const isSkipped = step.status === 'skipped'

        return (
          <Card
            key={step.id}
            className={cn(
              'border-dashed shadow-sm',
              isCompleted && 'border-primary/30',
              isActive && 'border-primary',
              isSkipped && 'opacity-60'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-sm shrink-0 bg-muted">
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">
                      {step.name}
                    </span>
                    <Badge
                      variant={step.isRequired ? 'destructive' : 'outline'}
                      className="text-[10px] h-5"
                    >
                      {step.isRequired ? 'Required' : 'Optional'}
                    </Badge>
                    {step.count !== undefined && step.count > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {step.count}
                      </Badge>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.summary}
                  </p>

                  {/* Photo thumbnails */}
                  {hasPhotos && (
                    <div className="flex gap-2 mt-3">
                      {step.photos!.slice(0, 4).map((photo) => (
                        <div
                          key={photo.id}
                          className="w-12 h-12 rounded-sm overflow-hidden border bg-muted"
                        >
                          <img
                            src={photo.thumbnail_url || photo.url}
                            alt={photo.caption || 'Photo'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {step.photos!.length > 4 && (
                        <div className="w-12 h-12 rounded-sm border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{step.photos!.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action button */}
                  {!isSkipped && (
                    <Button
                      onClick={step.onAction}
                      disabled={isProcessing}
                      variant={readOnly ? 'outline' : (isActive ? 'default' : 'outline')}
                      size="sm"
                      className="mt-3"
                    >
                      {readOnly ? 'View' : (isCompleted ? 'View / Edit' : step.actionLabel)}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}

                  {isSkipped && (
                    <p className="text-sm text-muted-foreground mt-2">Skipped</p>
                  )}
                </div>

                {/* Status indicator */}
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Check Out */}
      {!readOnly ? (
        <Card className={cn('border-dashed shadow-sm', canCheckOut && 'border-primary')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full',
                canCheckOut ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <LogOut className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Check Out</h3>
                {!canCheckOut ? (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Complete required steps first
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ready to complete this visit
                  </p>
                )}
              </div>

              <Button
                onClick={onCheckOut}
                disabled={!canCheckOut || isProcessing}
                size="lg"
                className="w-full"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Complete Visit & Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg">Visit Completed</h3>
              <p className="text-sm text-muted-foreground">This visit has been checked out</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Default step configuration for Sales Visit
export const DEFAULT_VISIT_STEPS = [
  {
    id: 'photos',
    name: 'Photos',
    icon: Camera,
    isRequired: false,
    actionLabel: 'Take Photos',
  },
  {
    id: 'stock_opname',
    name: 'Stock Opname',
    icon: Package,
    isRequired: true,
    actionLabel: 'Check Stock',
  },
  {
    id: 'payment',
    name: 'Payment Collection',
    icon: CreditCard,
    isRequired: false,
    actionLabel: 'Collect Payment',
  },
  {
    id: 'sales_order',
    name: 'Sales Order',
    icon: ShoppingCart,
    isRequired: false,
    actionLabel: 'Create Order',
  },
  {
    id: 'survey',
    name: 'Competitor Survey',
    icon: ClipboardList,
    isRequired: false,
    actionLabel: 'Record Competitors',
  },
] as const
