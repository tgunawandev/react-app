/**
 * Route Card Component
 * Display today's route plan progress with circular indicator
 * Reference: specs/001-sfa-app-build/tasks.md HOME-003
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useTodayRoute } from '@/hooks/useRouteProgress'
import { MapPin, ArrowRight, Clock } from 'lucide-react'

export default function RouteCard() {
  const navigate = useNavigate()
  const { visitedCount, totalCount, progress, estimatedRemainingTime, routePlanName, isLoading, error } =
    useTodayRoute()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Today's Route
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load route data
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // No route planned
  if (!routePlanName) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Today's Route
              </CardTitle>
              <CardDescription>Your planned visits for today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/routes')}>
              Plan Route
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No route planned for today</p>
            <Button variant="link" onClick={() => navigate('/routes')} className="mt-2">
              Create a route plan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Route exists - show progress
  const isComplete = visitedCount === totalCount && totalCount > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Today's Route
            </CardTitle>
            <CardDescription>{routePlanName}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/routes')}>
            View Full Route
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {visitedCount} of {totalCount}
            </p>
            <p className="text-sm text-muted-foreground">customers visited</p>
          </div>
          <div className="relative w-20 h-20">
            {/* Circular Progress SVG */}
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
                className={
                  isComplete
                    ? 'text-primary'
                    : progress >= 50
                    ? 'text-primary'
                    : 'text-secondary-foreground'
                }
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {!isComplete && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{estimatedRemainingTime}</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <MapPin className="h-4 w-4" />
            <span>Route completed!</span>
          </div>
        )}

        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  )
}
