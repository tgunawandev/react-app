/**
 * Routes Hub Page
 * Central navigation hub for Visit Routes and Delivery Routes
 * Role-aware: Shows Visit Routes for Sales Rep, Delivery Routes for Drivers
 *
 * Design Pattern: Hero Card + Quick Actions Grid
 * - Hero Card: Prominent display of today's route with ALL stops visible
 * - Quick Actions: Secondary navigation to History, Planning, etc.
 */

import { useUser, isSalesRole, isDeliveryRole, isHubDriver } from '@/hooks/useUser'
import { useTodayRouteData } from '@/hooks/useRouteProgress'
import { TodayRouteHeroCard } from '@/components/route/TodayRouteHeroCard'
import { QuickActionsGrid } from '@/components/route/QuickActionsGrid'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { Skeleton } from '@/components/ui/skeleton'
import type { Route } from '@/types/frm/Route'

export default function Routes() {
  const { user, isLoading: isUserLoading } = useUser()
  const { route, isLoading: isRouteLoading } = useTodayRouteData()

  // Determine user role
  const userRole = user?.sfa_role
  const isSales = isSalesRole(userRole)
  const isDelivery = isDeliveryRole(userRole)
  const isHub = isHubDriver(userRole)

  // Show loading state while fetching user info or route data
  if (isUserLoading || isRouteLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </Main>
      </>
    )
  }

  // Get page title and subtitle based on role
  const getPageContent = () => {
    if (isSales) {
      return {
        title: 'Visit Routes',
        subtitle: 'Your scheduled customer visits and route planning'
      }
    }
    if (isDelivery) {
      return {
        title: 'Delivery Routes',
        subtitle: 'Your delivery assignments and schedules'
      }
    }
    if (isHub) {
      return {
        title: 'Transfer Routes',
        subtitle: 'Your stock transfer routes and schedules'
      }
    }
    return {
      title: 'Routes',
      subtitle: 'Manage your routes and schedules'
    }
  }

  const { title, subtitle } = getPageContent()

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Hero Card - Today's Route */}
        <TodayRouteHeroCard
          route={route as Route | null}
          isLoading={isRouteLoading}
          userRole={userRole}
        />

        {/* Quick Actions Grid */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <QuickActionsGrid userRole={userRole} />
        </div>
      </Main>
    </>
  )
}
