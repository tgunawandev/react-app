/**
 * RouteProgressCard Component
 * Displays route progress with visual indicators
 * Reference: Route-First Architecture Plan - Section 5.1
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Route as RouteIcon,
  MapPin,
  Clock,
  CheckCircle2,
  SkipForward,
  ArrowRight,
} from 'lucide-react'
import type { Route, RouteStop } from '@/types/frm'

interface RouteProgressCardProps {
  route: Route
  stops: RouteStop[]
  onViewRoute?: () => void
  onStartStop?: (stop: RouteStop) => void
  compact?: boolean
}

export function RouteProgressCard({
  route,
  stops,
  onViewRoute,
  onStartStop,
  compact = false,
}: RouteProgressCardProps) {
  // Calculate progress
  const totalStops = stops.length
  const completedStops = stops.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length
  const skippedStops = stops.filter((s) => s.status === 'skipped').length
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0

  // Find current/next stop
  const currentStop = stops.find(
    (s) => s.status !== 'completed' && s.status !== 'skipped'
  )

  // Status color mapping
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-primary'
      case 'Skipped':
        return 'bg-secondary/50'
      case 'In Progress':
      case 'Arrived':
        return 'bg-muted0'
      case 'Failed':
        return 'bg-destructive/50'
      default:
        return 'bg-muted'
    }
  }

  const getProgressColor = () => {
    if (progress === 100) return 'text-primary'
    if (progress >= 50) return 'text-primary'
    return 'text-secondary-foreground'
  }

  if (compact) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewRoute}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-muted-foreground"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    className={getProgressColor()}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">{progress}%</span>
                </div>
              </div>
              <div>
                <p className="font-semibold">
                  {completedStops} / {totalStops} stops
                </p>
                <p className="text-sm text-muted-foreground">
                  {route.status || 'Not Started'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Today's Route
            </CardTitle>
            <CardDescription>
              {route.route_date} · {route.user_role || 'Field Staff'}
            </CardDescription>
          </div>
          <Badge
            variant={route.status === 'completed' ? 'default' : 'outline'}
          >
            {route.status || 'Not Started'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-muted-foreground"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                className={getProgressColor()}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{progress}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Completed
              </span>
              <span className="font-medium">{completedStops - skippedStops}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <SkipForward className="h-4 w-4 text-secondary-foreground" />
                Skipped
              </span>
              <span className="font-medium">{skippedStops}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Remaining
              </span>
              <span className="font-medium">{totalStops - completedStops}</span>
            </div>
          </div>
        </div>

        {/* Stop Indicators */}
        <div className="flex gap-1 flex-wrap">
          {stops.map((stop, index) => (
            <div
              key={stop.name || index}
              className={`h-2 flex-1 min-w-[6px] max-w-[16px] rounded-full ${getStatusColor(
                stop.status
              )}`}
              title={`${stop.sequence}. ${stop.customer_name || stop.location_name || 'Stop'} - ${stop.status || 'Pending'}`}
            />
          ))}
        </div>

        {/* Current Stop Preview */}
        {currentStop && route.status !== 'completed' && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {currentStop.status === 'in_progress' ? 'Current Stop' : 'Next Stop'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium truncate max-w-[200px]">
                  {currentStop.customer_name || currentStop.location_name || 'Unknown'}
                </span>
              </div>
              {onStartStop && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartStop(currentStop)
                  }}
                >
                  Go
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStop.stop_type}
              {currentStop.estimated_arrival && ` · ETA: ${currentStop.estimated_arrival}`}
            </p>
          </div>
        )}

        {/* Completed State */}
        {route.status === 'completed' && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="font-medium text-primary dark:text-primary">
              Route Completed!
            </p>
          </div>
        )}

        {/* View Route Button */}
        {onViewRoute && (
          <Button onClick={onViewRoute} variant="outline" className="w-full">
            View Full Route
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteProgressCard
