/**
 * Visit Management Page
 * Shows today's route plan as primary view (spec requirement)
 * Reference: spec.md line 28 - "Sales Rep selects customer from route/search"
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrappeGetDocList, useFrappeGetDoc, useFrappeUpdateDoc } from 'frappe-react-sdk'
import { MapPin, User, Calendar, Clock, CheckCircle2, XCircle, ListChecks, Play, PlayCircle, StopCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { EndOfDayDialog } from '@/components/visit/EndOfDayDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import type { SalesVisit } from '@/types/frm/SalesVisit'
import type { RoutePlan } from '@/types/frm/RoutePlan'

export default function Visit() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState('all')
  const [routePlanName, setRoutePlanName] = useState<string | null>(null)
  const [showEndOfDayDialog, setShowEndOfDayDialog] = useState(false)

  // Get today's date for route plan
  const today = new Date().toISOString().split('T')[0]

  // First, find today's route plan (just get the name)
  const { data: routePlans, isLoading: routeLoading, error: routeError } = useFrappeGetDocList<RoutePlan>(
    'Route Plan',
    {
      fields: ['name'],
      filters: [
        ['plan_date', '=', today],
        ['status', 'in', ['Draft', 'Confirmed', 'In Progress']]
      ],
      orderBy: {
        field: 'creation',
        order: 'desc'
      },
      limit: 1
    }
  )

  // Set route plan name when found
  useEffect(() => {
    if (routePlans && routePlans.length > 0) {
      setRoutePlanName(routePlans[0].name)
    } else {
      setRoutePlanName(null)
    }
  }, [routePlans])

  // Then, fetch the full route plan with child table (only if we have a name)
  const { data: routeDetail, isLoading: detailLoading, error: detailError, mutate: mutateRoutePlan } = useFrappeGetDoc<RoutePlan>(
    'Route Plan',
    routePlanName || undefined,
    {
      enabled: !!routePlanName  // Only fetch if routePlanName exists
    }
  )

  // Fetch visit history with filters
  const { data: visits, isLoading: visitsLoading, error: visitsError } = useFrappeGetDocList<SalesVisit>(
    'Sales Visit',
    {
      fields: [
        'name',
        'customer',
        'visit_date',
        'check_in_time',
        'check_out_time',
        'status',
        'check_in_gps_lat',
        'check_in_gps_long'
      ],
      filters: [
        ...(status !== 'all' ? [['status', '=', status]] : []),
        ...(searchTerm ? [['customer', 'like', `%${searchTerm}%`]] : [])
      ] as any,
      orderBy: {
        field: 'visit_date',
        order: 'desc'
      },
      limit: 50
    }
  )

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleVisitClick = (visit: SalesVisit) => {
    navigate(`/visit/${visit.name}/activities`)
  }

  // Update route plan hook
  const { updateDoc: updateRoutePlan, loading: updatingPlan } = useFrappeUpdateDoc()

  const handleStartSession = async () => {
    if (!todayRoute) return

    try {
      await updateRoutePlan('Route Plan', todayRoute.name, {
        status: 'In Progress'
      })
      // Revalidate the route plan data to update UI immediately
      await mutateRoutePlan()
      toast.success('Call session started successfully')
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session. Please try again.')
    }
  }

  const handleEndSession = () => {
    if (!todayRoute) return

    // Check for unvisited customers (visit_status === 'pending')
    const unvisitedCustomers = todayRoute.customers?.filter(c => c.visit_status === 'pending') || []

    if (unvisitedCustomers.length > 0) {
      // Show dialog to collect reasons
      setShowEndOfDayDialog(true)
    } else {
      // No unvisited customers, end session directly
      completeSession()
    }
  }

  const handleEndOfDaySubmit = async (reasons: Map<string, { reason: string; notes: string }>) => {
    if (!todayRoute) return

    try {
      // Update each unvisited customer with skip reason
      const updatedCustomers = todayRoute.customers?.map(customer => {
        if (customer.visit_status === 'pending' && reasons.has(customer.name)) {
          const { reason, notes } = reasons.get(customer.name)!
          return {
            ...customer,
            visit_status: 'Skipped',
            skip_reason: reason,
            skip_notes: notes
          }
        }
        return customer
      })

      // Update route plan with skipped customers and completed status
      await updateRoutePlan('Route Plan', todayRoute.name, {
        customers: updatedCustomers,
        status: 'Completed'
      })

      // Revalidate the route plan data to update UI immediately
      await mutateRoutePlan()

      toast.success('Call session ended successfully', {
        description: `${reasons.size} customer${reasons.size > 1 ? 's' : ''} marked as skipped`
      })
    } catch (error) {
      console.error('Error ending session:', error)
      throw error // Re-throw to let dialog handle error display
    }
  }

  const completeSession = async () => {
    if (!todayRoute) return

    try {
      await updateRoutePlan('Route Plan', todayRoute.name, {
        status: 'Completed'
      })
      // Revalidate the route plan data to update UI immediately
      await mutateRoutePlan()
      toast.success('Call session ended successfully')
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Failed to end session. Please try again.')
    }
  }

  const handleStartVisit = (customerId: string) => {
    navigate(`/visit/start?customer=${customerId}`)
  }

  const handleAddUnplannedCustomer = () => {
    // TODO: Show customer selection dialog to add to current session
    toast.info('Add unplanned customer feature coming soon')
  }

  const getStatusColor = (visitStatus: string) => {
    switch (visitStatus) {
      case 'Planned':
        return 'bg-muted0 text-white'
      case 'In Progress':
        return 'bg-muted0 text-white'
      case 'Completed':
        return 'bg-primary text-white'
      case 'Cancelled':
        return 'bg-destructive/50 text-white'
      default:
        return 'bg-muted0 text-white'
    }
  }

  const getStatusIcon = (visitStatus: string) => {
    switch (visitStatus) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const isLoadingRoute = routeLoading || (routePlanName && detailLoading)
  const routeErrorMessage = routeError || detailError
  const todayRoute = routeDetail

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Visit Management
            </h1>
            <p className='text-muted-foreground'>
              Follow your route and manage visits
            </p>
          </div>
          <Button
            onClick={() => navigate('/visit/start?customer=CUST-2025-00001')}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Test Visit Flow
          </Button>
        </div>

        <Tabs defaultValue="route" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="route">
              <ListChecks className="h-4 w-4 mr-2" />
              Today's Route
            </TabsTrigger>
            <TabsTrigger value="history">
              <Calendar className="h-4 w-4 mr-2" />
              Visit History
            </TabsTrigger>
          </TabsList>

          {/* Today's Route Tab */}
          <TabsContent value="route" className="space-y-4 mt-4">
            {isLoadingRoute && (
              <div className='text-center py-12'>
                <p className='text-muted-foreground'>Loading today's route...</p>
              </div>
            )}

            {routeErrorMessage && (
              <div className='text-center py-12 space-y-2'>
                <p className='text-destructive'>Error loading route</p>
                <p className='text-sm text-muted-foreground'>
                  {routeError?.message || detailError?.message || 'Please try again'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            )}

            {!isLoadingRoute && !routeErrorMessage && !todayRoute && (
              <div className='text-center py-12 space-y-4'>
                <p className='text-muted-foreground text-lg'>No route plan for today</p>
                <p className='text-sm text-muted-foreground'>
                  Contact your manager to get today's route plan
                </p>
              </div>
            )}

            {!isLoadingRoute && !routeErrorMessage && todayRoute && (
              <div className="space-y-4">
                {/* Session Not Started - Show Start Button */}
                {(todayRoute.status === 'draft' || todayRoute.status === 'confirmed') && (
                  <div className='text-center py-12 space-y-6'>
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>Ready to start your day?</h3>
                      <p className='text-muted-foreground'>
                        You have {todayRoute.customers?.length || 0} customers planned for today
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleStartSession}
                      disabled={updatingPlan}
                      className="gap-2"
                    >
                      <PlayCircle className='h-5 w-5' />
                      {updatingPlan ? 'Starting...' : 'Start Call Session'}
                    </Button>
                    <p className='text-sm text-muted-foreground'>
                      Starting the session will activate your route for the day
                    </p>
                  </div>
                )}

                {/* Session In Progress - Show Route */}
                {todayRoute.status === 'in_progress' && (
                  <>
                    {/* Route Progress Summary */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Route Progress</h3>
                            <p className="text-sm text-muted-foreground">
                              {todayRoute.visits_completed || 0} of {todayRoute.visits_planned || 0} visits completed
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-muted0 text-white">
                              Session Active
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                {/* Planned Customers List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Planned Customers ({todayRoute.customers?.length || 0})
                  </h3>

                  {todayRoute.customers && todayRoute.customers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {todayRoute.customers.map((item) => (
                        <Card
                          key={item.name}
                          className={`transition-all hover:shadow-lg ${
                            item.visit_status === 'pending'
                              ? 'border-muted hover:border-primary'
                              : item.visit_status === 'completed'
                              ? 'border-primary/20 hover:border-primary opacity-70'
                              : 'border-muted hover:border-muted opacity-50'
                          }`}
                        >
                          <CardContent className='p-6 space-y-4'>
                            {/* Sequence and Status */}
                            <div className='flex items-center justify-between'>
                              <Badge variant="outline" className="font-mono">
                                #{item.sequence}
                              </Badge>
                              <Badge className={
                                item.visit_status === 'completed' ? 'bg-primary' :
                                item.visit_status === 'pending' ? 'bg-muted0' :
                                'bg-muted0'
                              }>
                                {item.visit_status}
                              </Badge>
                            </div>

                            {/* Customer Info */}
                            <div className='space-y-2'>
                              <div className='flex items-start gap-2'>
                                <User className='h-5 w-5 text-muted-foreground shrink-0 mt-0.5' />
                                <div className='flex-1 min-w-0'>
                                  <p className='font-semibold truncate'>{item.customer}</p>
                                </div>
                              </div>

                              {/* Estimated Arrival */}
                              {item.estimated_arrival_time && (
                                <div className='flex items-center gap-2 text-sm'>
                                  <Clock className='h-4 w-4 text-muted-foreground shrink-0' />
                                  <span className='text-muted-foreground'>
                                    ETA: {item.estimated_arrival_time}
                                  </span>
                                </div>
                              )}

                              {/* Distance */}
                              {item.distance_from_previous_km && (
                                <div className='flex items-center gap-2 text-sm'>
                                  <MapPin className='h-4 w-4 text-muted-foreground shrink-0' />
                                  <span className='text-muted-foreground'>
                                    {item.distance_from_previous_km.toFixed(1)} km from previous
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {item.visit_status === 'pending' && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleStartVisit(item.customer)}
                              >
                                <Play className='mr-2 h-4 w-4' />
                                Start Visit
                              </Button>
                            )}

                            {item.visit_status === 'completed' && item.sales_visit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate(`/visit/${item.sales_visit}/activities`)}
                              >
                                View Visit
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">
                          No customers planned for this route
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                    {/* Session Actions */}
                    <div className="pt-4 border-t space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleAddUnplannedCustomer}
                      >
                        <UserPlus className='mr-2 h-4 w-4' />
                        Add Unplanned Customer
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={handleEndSession}
                        disabled={updatingPlan}
                      >
                        <StopCircle className='h-4 w-4' />
                        {updatingPlan ? 'Ending...' : 'End Call Session'}
                      </Button>
                    </div>
                  </>
                )}

                {/* Session Completed */}
                {todayRoute.status === 'completed' && (
                  <div className='text-center py-12 space-y-4'>
                    <CheckCircle2 className='h-16 w-16 mx-auto text-primary' />
                    <div>
                      <h3 className='text-xl font-semibold mb-2'>Session Completed</h3>
                      <p className='text-muted-foreground'>
                        You completed {todayRoute.visits_completed || 0} of {todayRoute.visits_planned || 0} planned visits
                      </p>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Great work today! Check the Visit History tab to review your visits.
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Visit History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className='flex flex-col gap-4 sm:flex-row'>
              <Input
                placeholder='Search by customer...'
                className='h-9 w-full lg:w-[250px]'
                value={searchTerm}
                onChange={handleSearch}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className='h-9 w-full sm:w-36'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='Planned'>Planned</SelectItem>
                  <SelectItem value='In Progress'>In Progress</SelectItem>
                  <SelectItem value='Completed'>Completed</SelectItem>
                  <SelectItem value='Cancelled'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visitsLoading && (
              <div className='text-center py-12'>
                <p className='text-muted-foreground'>Loading visits...</p>
              </div>
            )}

            {visitsError && (
              <div className='text-center py-12'>
                <p className='text-destructive'>Error loading visits. Please try again.</p>
              </div>
            )}

            {!visitsLoading && !visitsError && visits && visits.length === 0 && (
              <div className='text-center py-12 space-y-4'>
                <p className='text-muted-foreground text-lg'>No visits found</p>
                <p className='text-sm text-muted-foreground'>
                  {searchTerm || status !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Your visit history will appear here'}
                </p>
              </div>
            )}

            {!visitsLoading && !visitsError && visits && visits.length > 0 && (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {visits.map((visit) => (
                  <Card
                    key={visit.name}
                    className='cursor-pointer transition-all hover:shadow-lg hover:border-primary/50'
                    onClick={() => handleVisitClick(visit)}
                  >
                    <CardContent className='p-6 space-y-4'>
                      {/* Status Badge */}
                      <div className='flex items-center justify-between'>
                        <Badge className={getStatusColor(visit.status)}>
                          {getStatusIcon(visit.status)}
                          <span className='ml-1'>{visit.status}</span>
                        </Badge>
                        {visit.check_in_gps_lat && visit.check_in_gps_long && (
                          <MapPin className='h-4 w-4 text-primary' />
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className='space-y-2'>
                        <div className='flex items-start gap-2'>
                          <User className='h-5 w-5 text-muted-foreground shrink-0 mt-0.5' />
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold truncate'>{visit.customer}</p>
                          </div>
                        </div>

                        {/* Visit Date */}
                        <div className='flex items-center gap-2 text-sm'>
                          <Calendar className='h-4 w-4 text-muted-foreground shrink-0' />
                          <span className='text-muted-foreground'>
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Check-in Time */}
                        {visit.check_in_time && (
                          <div className='flex items-center gap-2 text-sm'>
                            <Clock className='h-4 w-4 text-muted-foreground shrink-0' />
                            <span className='text-muted-foreground'>
                              Check-in: {visit.check_in_time}
                            </span>
                          </div>
                        )}

                        {/* Check-out Time */}
                        {visit.check_out_time && (
                          <div className='flex items-center gap-2 text-sm'>
                            <Clock className='h-4 w-4 text-muted-foreground shrink-0' />
                            <span className='text-muted-foreground'>
                              Check-out: {visit.check_out_time}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Visit ID */}
                      <div className='pt-2 border-t'>
                        <p className='text-xs text-muted-foreground truncate' title={visit.name}>
                          ID: {visit.name}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Main>

      {/* End of Day Dialog */}
      {todayRoute && (
        <EndOfDayDialog
          open={showEndOfDayDialog}
          onOpenChange={setShowEndOfDayDialog}
          unvisitedCustomers={todayRoute.customers?.filter(c => c.visit_status === 'pending') || []}
          onSubmit={handleEndOfDaySubmit}
        />
      )}
    </>
  )
}
