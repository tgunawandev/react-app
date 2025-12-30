/**
 * Route Planning Page
 * Full route planning page with map, customer list, and optimization
 * Reference: specs/001-sfa-app-build/tasks.md US3-003
 */

import { useState } from 'react'
import { useFrappeGetDocList } from 'frappe-react-sdk'
import { RouteMap } from '@/components/route/RouteMap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Map, MapPin, Navigation, Calendar, Clock, TrendingDown } from 'lucide-react'
import { nearestNeighbor, calculateTotalDistance, calculateArrivalTimes } from '@/services/route-optimizer'
import { useOptimizeRoute } from '@/hooks/useRoute'
import { toast } from 'sonner'
import type { Customer } from '@/types/frm/Customer'
import type { OptimizedCustomer } from '@/services/route-optimizer'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

export default function RoutePlanPage() {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedCustomer[]>([])
  const [planDate, setPlanDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')

  const { optimizeRoute, loading: optimizing } = useOptimizeRoute()

  // Fetch customers
  const { data: customers, isLoading } = useFrappeGetDocList<Customer>(
    'Customer',
    {
      fields: ['name', 'customer_name', 'gps_latitude', 'gps_longitude', 'last_visit_date'] as ('*' | keyof Customer)[],
      filters: [
        ['status', '=', 'Active'],
        ['gps_latitude', 'is not', null],
        ['gps_longitude', 'is not', null]
      ] as any,
      limit: 100
    }
  )

  // Filter customers by search
  const filteredCustomers = customers?.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleToggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
  }

  const handleOptimizeLocal = () => {
    if (selectedCustomers.size < 2) {
      toast.error('Select at least 2 customers to optimize route')
      return
    }

    // Get selected customer data
    const selectedData = customers?.filter((c) =>
      selectedCustomers.has(c.name)
    ) || []

    // Run local optimization
    const optimized = nearestNeighbor(
      selectedData.map((c) => ({
        customer: c.name,
        customer_name: c.customer_name,
        gps_latitude: c.gps_latitude || 0,
        gps_longitude: c.gps_longitude || 0
      }))
    )

    // Add arrival times
    const withTimes = calculateArrivalTimes(optimized)
    setOptimizedRoute(withTimes)

    const totalDistance = calculateTotalDistance(withTimes)
    toast.success('Route optimized!', {
      description: `Total distance: ${totalDistance.toFixed(2)} km`
    })
  }

  const handleSaveRoutePlan = async () => {
    if (selectedCustomers.size < 2) {
      toast.error('Select at least 2 customers')
      return
    }

    try {
      const result = await optimizeRoute({
        customer_ids: Array.from(selectedCustomers),
        plan_date: planDate,
        algorithm: 'nearest_neighbor',
        create_route_plan: true
      })

      if (result) {
        toast.success('Route plan created!', {
          description: `Plan ID: ${result.route_plan_id}`
        })
        setOptimizedRoute(result.optimized_sequence)
      }
    } catch (error) {
      toast.error('Failed to create route plan', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    }
  }

  return (
    <>
      
<StandardHeader />

      <Main>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Map className="h-6 w-6" />
          Route Planning
        </h1>
        <p className="text-muted-foreground">
          Optimize your daily route to minimize travel distance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        {/* Left: Customer Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Customers</CardTitle>
              <CardDescription>
                Choose customers to visit ({selectedCustomers.size} selected)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="plan-date">Plan Date</Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                />
              </div>

              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Customers</Label>
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Customer List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No customers found with GPS coordinates
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.name}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleCustomer(customer.name)}
                    >
                      <Checkbox
                        checked={selectedCustomers.has(customer.name)}
                        onCheckedChange={() => handleToggleCustomer(customer.name)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {customer.customer_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(customer as any).territory || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleOptimizeLocal}
                  disabled={selectedCustomers.size < 2 || optimizing}
                  className="w-full"
                  variant="default"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Optimize Route
                </Button>

                <Button
                  onClick={handleSaveRoutePlan}
                  disabled={selectedCustomers.size < 2 || optimizing}
                  className="w-full"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Save Route Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Map & Route Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle>Route Map</CardTitle>
              <CardDescription>
                Visual representation of optimized route
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizedRoute.length > 0 ? (
                <RouteMap customers={optimizedRoute} height="500px" />
              ) : (
                <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select customers and click "Optimize Route" to see the map
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Summary */}
          {optimizedRoute.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Route Summary</CardTitle>
                <CardDescription>
                  Optimized visit sequence and statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {optimizedRoute.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Stops</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {calculateTotalDistance(optimizedRoute).toFixed(1)}
                      <span className="text-sm"> km</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Total Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {(calculateTotalDistance(optimizedRoute) / 4 + optimizedRoute.length * 0.5).toFixed(1)}
                      <span className="text-sm"> hrs</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Duration</div>
                  </div>
                </div>

                {/* Stop List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {optimizedRoute.map((customer) => (
                    <div
                      key={customer.customer}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Badge variant="outline" className="shrink-0">
                        #{customer.sequence}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {customer.customer_name}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {customer.distance_from_previous_km > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {customer.distance_from_previous_km.toFixed(2)} km
                            </span>
                          )}
                          {customer.estimated_arrival_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {customer.estimated_arrival_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </Main>
    </>
  )
}
