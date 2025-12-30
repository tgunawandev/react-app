/**
 * StopListView Component
 * Reusable component to display list of route stops with status indicators
 * Reference: Route-First Architecture Plan - Section 5.2
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  CheckCircle2,
  Clock,
  SkipForward,
  Truck,
  ShoppingBag,
  Package,
  Coffee,
  Navigation,
  Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RouteStop } from '@/types/frm'

// Stop type icon mapping
const stopTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sales Visit': ShoppingBag,
  'Delivery': Truck,
  'Stock Transfer': Package,
  'Pickup': Package,
  'Break': Coffee,
}

const statusColors: Record<string, string> = {
  'Pending': 'bg-muted text-foreground border-muted',
  'Arrived': 'bg-muted text-foreground border-muted',
  'In Progress': 'bg-muted text-foreground border-muted',
  'Completed': 'bg-primary text-primary-foreground border-primary/20',
  'Skipped': 'bg-orange-500 text-white border-secondary/20',
  'Partial': 'bg-orange-100 text-orange-800 border-orange-200',
  'Failed': 'bg-destructive/10 text-destructive border-destructive/20',
}

interface StopListViewProps {
  stops: RouteStop[]
  routeId: string
  onStopClick?: (stop: RouteStop, index: number) => void
  showConnectors?: boolean
  compact?: boolean
  className?: string
}

export function StopListView({
  stops,
  routeId,
  onStopClick,
  showConnectors = true,
  compact = false,
  className,
}: StopListViewProps) {
  const navigate = useNavigate()

  const handleStopClick = (stop: RouteStop, index: number) => {
    if (onStopClick) {
      onStopClick(stop, index)
    } else {
      navigate(`/routes/${routeId}/stop/${stop.idx}`)
    }
  }

  const isCurrentStop = (stop: RouteStop, index: number): boolean => {
    return (
      stop.status !== 'completed' &&
      stop.status !== 'skipped' &&
      (index === 0 ||
        stops[index - 1]?.status === 'completed' ||
        stops[index - 1]?.status === 'skipped')
    )
  }

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {stops.map((stop, index) => {
          const Icon = stopTypeIcons[stop.stop_type] || MapPin
          const current = isCurrentStop(stop, index)

          return (
            <Card
              key={stop.name || index}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                current && 'ring-2 ring-primary'
              )}
              onClick={() => handleStopClick(stop, index)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      stop.status === 'completed' && 'bg-primary text-white',
                      stop.status === 'skipped' && 'bg-secondary/50 text-white',
                      (stop.status === 'in_progress' || stop.status === 'arrived') && 'bg-muted0 text-white',
                      (!stop.status || stop.status === 'pending') && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {stop.status === 'completed' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : stop.status === 'skipped' ? (
                      <SkipForward className="h-3 w-3" />
                    ) : (
                      stop.sequence
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {stop.customer_name || stop.location_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">{stop.stop_type}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusColors[stop.status || 'Pending'])}
                  >
                    {stop.status || 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {stops.map((stop, index) => {
        const Icon = stopTypeIcons[stop.stop_type] || MapPin
        const current = isCurrentStop(stop, index)

        return (
          <Card
            key={stop.name || index}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              current && 'ring-2 ring-primary'
            )}
            onClick={() => handleStopClick(stop, index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Sequence & Icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      stop.status === 'completed' && 'bg-primary text-white',
                      stop.status === 'skipped' && 'bg-secondary/50 text-white',
                      (stop.status === 'in_progress' || stop.status === 'arrived') && 'bg-muted0 text-white',
                      (!stop.status || stop.status === 'pending') && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {stop.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : stop.status === 'skipped' ? (
                      <SkipForward className="h-4 w-4" />
                    ) : (
                      stop.sequence
                    )}
                  </div>
                  {showConnectors && index < stops.length - 1 && (
                    <div className="w-0.5 h-12 bg-muted mt-1" />
                  )}
                </div>

                {/* Stop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold truncate">
                        {stop.customer_name || stop.location_name || 'Unknown'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {stop.stop_type}
                        </span>
                        {stop.linked_document && (
                          <span className="text-sm text-muted-foreground">
                            {stop.linked_document}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusColors[stop.status || 'Pending']}
                    >
                      {stop.status || 'Pending'}
                    </Badge>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {stop.estimated_arrival && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ETA: {stop.estimated_arrival}
                      </span>
                    )}
                    {stop.distance_from_previous_km && stop.distance_from_previous_km > 0 && (
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {stop.distance_from_previous_km.toFixed(1)} km
                      </span>
                    )}
                    {stop.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {stop.duration_minutes} min
                      </span>
                    )}
                    {stop.pod_captured === 1 && (
                      <span className="flex items-center gap-1 text-primary">
                        <Camera className="h-3 w-3" />
                        POD
                      </span>
                    )}
                  </div>

                  {/* Skip Reason */}
                  {stop.status === 'skipped' && stop.skip_reason && (
                    <p className="text-sm text-secondary-foreground mt-2">
                      Skipped: {stop.skip_reason}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default StopListView
