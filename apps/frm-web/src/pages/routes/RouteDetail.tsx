/**
 * Route Detail Page
 * Full route view with stop list, map view, progress tracking, and actions
 * Reference: Route-First Architecture Plan - Section 5.2
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  Route as RouteIcon,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Plus,
  Truck,
  ShoppingBag,
  Package,
  Coffee,
  SkipForward,
  Navigation,
  Camera,
  List,
  Map,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState, lazy, Suspense } from 'react'
import type { Route, RouteStop } from '@/types/frm'

// Lazy load the map component
const RouteStopsMap = lazy(() => import('@/components/route/RouteStopsMap'))

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

interface RouteResponse {
  route: Route | null
  message?: string
}

export default function RouteDetail() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()
  const [showAddStop, setShowAddStop] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list')

  // Fetch route details
  const {
    data: routeData,
    isLoading,
    error,
    mutate,
  } = useFrappeGetCall<RouteResponse>(
    routeId ? 'frm.api.route.get_route_execution' : null,
    routeId ? { route_name: routeId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  const route = routeData?.message || routeData?.route || (routeData as unknown as Route)
  const stops = route?.stops || []

  // Calculate progress
  const totalStops = stops.length
  const completedStops = stops.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0

  // Calculate total distance
  const totalDistance = stops.reduce(
    (acc, s) => acc + (s.distance_from_previous_km || 0),
    0
  )

  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </Main>
      </>
    )
  }

  if (error || !route) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load route details. The route may not exist or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

  return (
    <>
      <StandardHeader />
      <Main className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <RouteIcon className="h-6 w-6" />
                Route Stops
              </h1>
              <Badge variant={route.status === 'completed' ? 'default' : 'outline'}>
                {route.status || 'Not Started'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {totalStops} stops · {totalDistance.toFixed(1)} km
            </p>
          </div>
        </div>

        {/* Progress Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{completedStops}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stops.filter((s) => s.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stops.filter((s) => s.status === 'skipped').length}
                </p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              {progress}% complete
            </p>
          </CardContent>
        </Card>

        {/* Custom Tabs: List / Map */}
        <div className="w-full">
          <div className="relative flex items-center bg-muted dark:bg-muted rounded-xl p-1 border border-muted dark:border-muted">
            <div
              className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white dark:bg-background rounded-lg shadow-sm transition-transform duration-200 ease-in-out border border-muted dark:border-muted"
              style={{
                transform: activeTab === 'map' ? 'translateX(100%)' : 'translateX(0%)'
              }}
            />
            <button
              onClick={() => setActiveTab('list')}
              className={`relative flex items-center justify-center gap-2 flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 z-10 ${
                activeTab === 'list'
                  ? 'text-foreground dark:text-muted-foreground'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`relative flex items-center justify-center gap-2 flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 z-10 ${
                activeTab === 'map'
                  ? 'text-foreground dark:text-muted-foreground'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Map</span>
            </button>
          </div>

          {/* List View */}
          {activeTab === 'list' && (
          <div className="mt-4">
            <div className="space-y-3">
              {stops.map((stop, index) => {
                const Icon = stopTypeIcons[stop.stop_type] || MapPin
                const isCurrentStop =
                  stop.status !== 'completed' &&
                  stop.status !== 'skipped' &&
                  (index === 0 ||
                    stops[index - 1]?.status === 'completed' ||
                    stops[index - 1]?.status === 'skipped')

                return (
                  <Card
                    key={stop.name || index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isCurrentStop ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => navigate(`/routes/${routeId}/stop/${stop.idx}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Sequence & Icon */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-medium ${
                              stop.status === 'completed'
                                ? 'bg-primary text-white'
                                : stop.status === 'skipped'
                                ? 'bg-secondary/50 text-white'
                                : stop.status === 'in_progress' || stop.status === 'arrived'
                                ? 'bg-muted0 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {stop.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : stop.status === 'skipped' ? (
                              <SkipForward className="h-4 w-4" />
                            ) : (
                              stop.sequence
                            )}
                          </div>
                          {index < stops.length - 1 && (
                            <div className="w-0.5 h-8 bg-muted mt-1" />
                          )}
                        </div>

                        {/* Stop Info - Mobile optimized */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                {stop.customer_name || stop.location_name || 'Unknown'}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground">
                                  {stop.stop_type}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${statusColors[stop.status || 'Pending']} shrink-0 text-xs`}
                            >
                              {stop.status || 'Pending'}
                            </Badge>
                          </div>

                          {/* Additional Info - Compact */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            {stop.estimated_arrival && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {String(stop.estimated_arrival).substring(0, 5)}
                              </span>
                            )}
                            {stop.distance_from_previous_km && stop.distance_from_previous_km > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Navigation className="h-3 w-3" />
                                {stop.distance_from_previous_km.toFixed(1)}km
                              </span>
                            )}
                            {/* Show timestamp for Sales Visit, POD for Delivery */}
                            {stop.stop_type === 'Sales Visit' && stop.actual_arrival && (
                              <span className="flex items-center gap-0.5 text-primary">
                                <Clock className="h-3 w-3" />
                                {new Date(stop.actual_arrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                {stop.departure_time && (
                                  <>
                                    {' - '}
                                    {new Date(stop.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </>
                                )}
                              </span>
                            )}
                            {stop.stop_type === 'Delivery' && stop.pod_captured === 1 && (
                              <span className="flex items-center gap-0.5 text-primary">
                                <Camera className="h-3 w-3" />
                                POD
                              </span>
                            )}
                          </div>

                          {/* Skip Reason */}
                          {stop.status === 'skipped' && stop.skip_reason && (
                            <p className="text-xs text-secondary-foreground mt-1 truncate">
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
          </div>
          )}

          {/* Map View */}
          {activeTab === 'map' && (
          <div className="mt-4">
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-sm" />}>
              <RouteStopsMap stops={stops} height="400px" />
            </Suspense>
          </div>
          )}
        </div>

        {/* Add Urgent Stop Button */}
        {route.status === 'in_progress' && (
          <Dialog open={showAddStop} onOpenChange={setShowAddStop}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Urgent Stop
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Urgent Stop</DialogTitle>
                <DialogDescription>
                  Add an unplanned stop to your current route
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stop-type">Stop Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stop type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales Visit">Sales Visit</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                      <SelectItem value="Break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Input id="customer" placeholder="Search customer..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location Name</Label>
                  <Input id="location" placeholder="e.g., PT ABC Store" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddStop(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.info('Feature coming soon')
                    setShowAddStop(false)
                  }}
                >
                  Add Stop
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Main>
    </>
  )
}
