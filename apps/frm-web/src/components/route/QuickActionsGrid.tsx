/**
 * Quick Actions Grid
 * Role-aware secondary action cards for Routes hub
 * Provides quick access to History, Planning, and other role-specific actions
 */

import { useNavigate } from 'react-router-dom'
import { History, Map, ClipboardList, Calendar, Package, TrendingUp, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { UserRole } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon: React.ElementType
  route: string
  description?: string
}

interface QuickActionsGridProps {
  userRole?: UserRole
}

// Role-specific quick actions
const getQuickActions = (role?: UserRole): QuickAction[] => {
  const salesActions: QuickAction[] = [
    {
      label: 'Visit History',
      icon: History,
      route: '/routes/visits/history',
      description: 'Past visits and performance'
    },
    {
      label: 'Customers',
      icon: User,
      route: '/customers',
      description: 'Customer directory'
    },
    {
      label: 'Reports',
      icon: TrendingUp,
      route: '/reports',
      description: 'Sales metrics and KPIs'
    }
  ]

  const deliveryActions: QuickAction[] = [
    {
      label: 'Delivery History',
      icon: History,
      route: '/routes/deliveries/history',
      description: 'Past deliveries and POD'
    },
    {
      label: 'Schedules',
      icon: Calendar,
      route: '/routes/deliveries/schedules',
      description: 'Recurring delivery routes'
    },
    {
      label: 'Dashboard',
      icon: ClipboardList,
      route: '/driver',
      description: 'Performance overview'
    }
  ]

  const hubActions: QuickAction[] = [
    {
      label: 'Transfer History',
      icon: History,
      route: '/routes/transfers/history',
      description: 'Past stock transfers'
    },
    {
      label: 'Stock Levels',
      icon: Package,
      route: '/stock',
      description: 'Current inventory'
    },
    {
      label: 'Routes Map',
      icon: Map,
      route: '/routes/transfers/map',
      description: 'View transfer locations'
    }
  ]

  // Map role to actions
  const actionMap: Record<string, QuickAction[]> = {
    'Sales Rep': salesActions,
    'Delivery Driver': deliveryActions,
    'Hub Driver': hubActions
  }

  return actionMap[role || 'Sales Rep'] || salesActions
}

export function QuickActionsGrid({ userRole }: QuickActionsGridProps) {
  const navigate = useNavigate()
  const actions = getQuickActions(userRole)

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Card
            key={action.route}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
              'border-2 hover:border-primary/50'
            )}
            onClick={() => navigate(action.route)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Icon className="h-5 w-5 text-primary md:h-6 md:w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-tight md:text-base">
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="hidden text-xs text-muted-foreground md:block">
                      {action.description}
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
