/**
 * Today's Route Hero Card
 * Prominent card showing today's route with all stops, progress, and quick action
 * Adapts content based on user role (Sales Rep, Delivery Driver, Hub Driver)
 */

import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, MapPin, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { Route } from '@/types/frm/Route'
import type { UserRole } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

interface TodayRouteHeroCardProps {
  route: Route | null
  isLoading: boolean
  userRole?: UserRole
}

// Role-specific configuration
const getRoleConfig = (role?: UserRole) => {
  const configs = {
    'Sales Rep': {
      title: "TODAY'S VISIT ROUTE",
      icon: '🎯',
      progressLabel: 'visits',
      nextLabel: 'Next Visit',
      ctaLabel: 'Continue Route',
      ctaRoute: '/routes/visits/today',
      emptyMessage: 'You don\'t have any customer visits scheduled for today'
    },
    'Delivery Driver': {
      title: 'TODAY\'S DELIVERIES',
      icon: '🚚',
      progressLabel: 'deliveries',
      nextLabel: 'Next Delivery',
      ctaLabel: 'Continue Deliveries',
      ctaRoute: '/routes/deliveries/today',
      emptyMessage: 'You don\'t have any deliveries assigned for today'
    },
    'Hub Driver': {
      title: 'TODAY\'S STOCK TRANSFERS',
      icon: '🏭',
      progressLabel: 'transfers',
      nextLabel: 'Next Transfer',
      ctaLabel: 'Continue Transfers',
      ctaRoute: '/routes/transfers/today',
      emptyMessage: 'You don\'t have any stock transfers assigned for today'
    }
  }

  return configs[role || 'Sales Rep'] || configs['Sales Rep']
}

// Get status icon for stop
const getStopIcon = (status?: string) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className="h-4 w-4 text-primary" />
    case 'In Progress':
    case 'Arrived':
      return <MapPin className="h-4 w-4 text-primary" />
    case 'Skipped':
    case 'Failed':
      return <AlertCircle className="h-4 w-4 text-secondary-foreground" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
  }
}

// Get status color for highlighting
const getStopStatusColor = (status?: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-primary/5 border-primary/20'
    case 'In Progress':
    case 'Arrived':
      return 'bg-muted border-muted'
    case 'Skipped':
    case 'Failed':
      return 'bg-secondary/5 border-secondary/20'
    default:
      return 'bg-muted/30 border-muted'
  }
}

export function TodayRouteHeroCard({ route, isLoading, userRole }: TodayRouteHeroCardProps) {
  const navigate = useNavigate()
  const config = getRoleConfig(userRole)

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  // Empty state - no route today
  if (!route) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Route Assigned</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {config.emptyMessage}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/routes')}>
              View All Routes
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Find current stop (in progress or arrived) and next stop (pending)
  const currentStop = route.stops?.find(s => s.status === 'in_progress' || s.status === 'arrived')
  const nextStop = route.stops?.find(s => s.status === 'pending' || !s.status)
  const isCompleted = route.status === 'completed'
  const isNotStarted = route.status === 'not_started' || !route.status

  return (
    <Card className="border-2 shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{config.icon}</span>
              <span>{config.title}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{route.name}</span>
              <span>•</span>
              <span>{new Date(route.route_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </CardDescription>
          </div>
          <Badge variant={isCompleted ? 'default' : isNotStarted ? 'secondary' : 'outline'}>
            {route.status || 'Not Started'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {route.completed_stops || 0}/{route.total_stops || 0} {config.progressLabel}
            </span>
            <span className="font-medium">{Math.round(route.progress_percentage || 0)}%</span>
          </div>
          <Progress value={route.progress_percentage || 0} className="h-2" />
        </div>

        {/* Current Stop - Show what user is doing NOW */}
        {currentStop ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary text-primary-foreground h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {route.stops?.findIndex(s => s.idx === currentStop.idx) + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground font-medium mb-1">Currently visiting</div>
                <div className="font-semibold text-lg mb-1 text-foreground">
                  {currentStop.customer_name || currentStop.stop_name || currentStop.location_name || 'Unnamed Stop'}
                </div>
              </div>
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          </div>
        ) : isCompleted ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary dark:text-primary mx-auto mb-2" />
            <p className="font-semibold text-foreground dark:text-primary-foreground">All {config.progressLabel} completed!</p>
          </div>
        ) : (
          <div className="rounded-lg border border-muted bg-muted/20 p-4 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-semibold text-muted-foreground">Ready to start your route</p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isCompleted ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/routes/${route.name}`)}
          >
            View Route Details
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate(config.ctaRoute)}
          >
            {isNotStarted ? 'Start Route' : config.ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
