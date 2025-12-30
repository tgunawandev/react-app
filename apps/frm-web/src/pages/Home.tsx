/**
 * Home Page
 * Main landing page with role-based content for all SFA user types
 * Reference: specs/001-sfa-app-build/tasks.md HOME-001
 */

import { useNavigate } from 'react-router-dom'
import { useUser, isSalesRole, isDeliveryRole, isHubDriver } from '@/hooks/useUser'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  Layers,
  MapPin,
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  Truck,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react'

// Sales Rep components
import RouteCard from '@/components/home/RouteCard'
import RecentVisitsList from '@/components/home/RecentVisitsList'

// Delivery Driver components
import DeliveryMetricsCard from '@/components/home/DeliveryMetricsCard'
import RecentDeliveriesList from '@/components/home/RecentDeliveriesList'

// Hooks
import { useSalesTargets } from '@/hooks/useSalesTargets'

export default function Home() {
  const navigate = useNavigate()
  const { user, isLoading } = useUser()

  // Show loading skeleton while fetching user info
  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </Main>
      </>
    )
  }

  // Determine user role for conditional rendering
  const userRole = user?.sfa_role
  const userName = user?.full_name || user?.user_name || 'User'
  const firstName = userName.split(' ')[0]
  const isSales = isSalesRole(userRole)
  const isDelivery = isDeliveryRole(userRole)
  const isHub = isHubDriver(userRole)

  // Get current hour for greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <StandardHeader />

      <Main className="space-y-4">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{greeting}</p>
                <h1 className="text-xl font-bold tracking-tight">{userName}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {userRole && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-primary font-medium">{userRole}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
            onClick={() => navigate('/entities')}
          >
            <div className="h-10 w-10 rounded-full bg-muted0/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium">Entities</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
            onClick={() => navigate('/routes')}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium">Routes</span>
          </Button>
        </div>

        {/* Role-based Content */}
        {isSales && <SalesContent />}
        {isDelivery && !isHub && <DeliveryContent />}
        {isHub && <HubDriverContent />}

        {/* Fallback for users without SFA role */}
        {!userRole && (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No SFA role assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}

// Sales Rep Content
function SalesContent() {
  const navigate = useNavigate()
  const { salesQty, activeOutlets, effectiveCalls, isLoading, error } = useSalesTargets()

  return (
    <>
      {/* Quick Stats for Sales */}
      {!error && !isLoading && (
        <div className="grid grid-cols-3 gap-2">
          <QuickStatCard
            icon={<ShoppingCart className="h-4 w-4" />}
            label="Sales"
            value={`${salesQty.current}K`}
            color="text-primary"
            bgColor="bg-muted0/10"
          />
          <QuickStatCard
            icon={<Users className="h-4 w-4" />}
            label="Outlets"
            value={activeOutlets.current.toString()}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <QuickStatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Calls"
            value={effectiveCalls.current.toString()}
            color="text-purple-500"
            bgColor="bg-purple-500/10"
          />
        </div>
      )}

      {/* Today's Route */}
      <RouteCard />

      {/* Recent Visits */}
      <RecentVisitsList />

      {/* Quick Actions Row */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate('/orders/create')}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          New Order
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate('/customers')}
        >
          <Users className="h-4 w-4 mr-2" />
          Customers
        </Button>
      </div>
    </>
  )
}

// Delivery Driver Content
function DeliveryContent() {
  const navigate = useNavigate()

  return (
    <>
      {/* Delivery Metrics */}
      <DeliveryMetricsCard />

      {/* Recent Deliveries */}
      <RecentDeliveriesList />

      {/* Quick Action */}
      <Button
        className="w-full"
        onClick={() => navigate('/routes/deliveries/today')}
      >
        <Truck className="h-4 w-4 mr-2" />
        Start Deliveries
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </>
  )
}

// Hub Driver Content
function HubDriverContent() {
  const navigate = useNavigate()

  return (
    <>
      {/* Quick Stats for Hub Driver */}
      <div className="grid grid-cols-3 gap-2">
        <QuickStatCard
          icon={<Truck className="h-4 w-4" />}
          label="Transfers"
          value="0"
          color="text-primary"
          bgColor="bg-muted0/10"
        />
        <QuickStatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending"
          value="0"
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
        <QuickStatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Done"
          value="0"
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Recent Deliveries for Hub */}
      <RecentDeliveriesList />

      {/* Quick Action */}
      <Button
        className="w-full"
        onClick={() => navigate('/transfers')}
      >
        <Truck className="h-4 w-4 mr-2" />
        View Transfers
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </>
  )
}

// Quick Stat Card Component
interface QuickStatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
}

function QuickStatCard({ icon, label, value, color, bgColor }: QuickStatCardProps) {
  return (
    <Card className="border-muted">
      <CardContent className="p-3 text-center">
        <div className={`h-8 w-8 rounded-full ${bgColor} mx-auto mb-1 flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </CardContent>
    </Card>
  )
}
