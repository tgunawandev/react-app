/**
 * Routes List Page
 * View all routes (historical and upcoming)
 * Reference: Route-First Architecture Plan
 */

import { useNavigate } from 'react-router-dom'
import { useFrappeGetDocList } from 'frappe-react-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  Route as RouteIcon,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Route } from '@/types/frm'

const statusColors: Record<string, string> = {
  'Not Started': 'bg-muted text-foreground',
  'In Progress': 'bg-muted text-foreground',
  'Paused': 'bg-orange-500 text-white',
  'Completed': 'bg-primary text-primary-foreground',
  'Cancelled': 'bg-destructive/10 text-destructive',
}

export default function RoutesList() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Fetch routes for current user
  const { data: routes, isLoading } = useFrappeGetDocList<Route>('Route', {
    fields: [
      'name',
      'route_date',
      'status',
      'user_role',
      'total_stops',
      'completed_stops',
      'skipped_stops',
      'progress_percentage',
      'start_time',
      'end_time',
      'operating_unit',
    ],
    orderBy: { field: 'route_date', order: 'desc' },
    limit: 100,
  })

  const today = new Date().toISOString().split('T')[0]

  // Filter routes
  const filteredRoutes = useMemo(() => {
    let result = routes || []

    // Apply tab filter
    if (activeTab === 'today') {
      result = result.filter((r) => r.route_date === today)
    } else if (activeTab === 'upcoming') {
      result = result.filter((r) => r.route_date > today)
    } else if (activeTab === 'past') {
      result = result.filter((r) => r.route_date < today)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.route_date.includes(query) ||
          r.status?.toLowerCase().includes(query)
      )
    }

    return result
  }, [routes, activeTab, searchQuery, today])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const isToday = dateStr === today
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }

    if (isToday) {
      return 'Today'
    }

    return date.toLocaleDateString('en-US', options)
  }

  return (
    <>
      <StandardHeader />
      <Main className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <RouteIcon className="h-6 w-6" />
            My Routes
          </h1>
          <p className="text-muted-foreground">
            View and manage your assigned routes
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : filteredRoutes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Routes Found</h3>
                  <p className="text-muted-foreground text-center">
                    {activeTab === 'today'
                      ? "You don't have any routes assigned for today."
                      : activeTab === 'upcoming'
                      ? "You don't have any upcoming routes."
                      : activeTab === 'past'
                      ? "You don't have any past routes."
                      : 'No routes match your search.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRoutes.map((route) => {
                const progress = route.progress_percentage || 0
                const isToday = route.route_date === today
                const isPast = route.route_date < today

                return (
                  <Card
                    key={route.name}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isToday ? 'border-primary' : ''
                    }`}
                    onClick={() => {
                      if (isToday && route.status !== 'completed') {
                        navigate('/routes/today')
                      } else {
                        navigate(`/routes/${route.name}`)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-sm ${
                              isToday
                                ? 'bg-primary/10'
                                : isPast
                                ? 'bg-muted'
                                : 'bg-muted'
                            }`}
                          >
                            <Calendar
                              className={`h-5 w-5 ${
                                isToday
                                  ? 'text-primary'
                                  : isPast
                                  ? 'text-muted-foreground'
                                  : 'text-primary'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {formatDate(route.route_date)}
                              </h3>
                              {isToday && (
                                <Badge variant="default" className="text-xs">
                                  Today
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {route.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {route.total_stops || 0} stops
                              </span>
                              {route.user_role && (
                                <span>· {route.user_role}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[route.status || 'Not Started']}>
                            {route.status || 'Not Started'}
                          </Badge>
                          {(route.status === 'in_progress' ||
                            route.status === 'completed') && (
                            <div className="flex items-center gap-1 text-sm">
                              <div
                                className={`w-16 h-2 rounded-sm bg-muted overflow-hidden`}
                              >
                                <div
                                  className={`h-full ${
                                    route.status === 'completed'
                                      ? 'bg-primary'
                                      : 'bg-muted0'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Action: Go to Today's Route */}
        {activeTab !== 'today' && (
          <Button
            onClick={() => navigate('/routes/today')}
            className="w-full"
            size="lg"
          >
            <Clock className="h-5 w-5 mr-2" />
            Go to Today's Route
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </Main>
    </>
  )
}
