/**
 * BottomNav Component
 * Bottom navigation for all screen sizes with 5 primary app sections
 * Reference: specs/001-sfa-app-build/tasks.md NAV-003
 */

import { Link, useLocation } from 'react-router-dom'
import { Home, Layers, ScanLine, Route, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  {
    name: 'home',
    href: '/home',
    icon: Home,
    label: 'Home'
  },
  {
    name: 'entities',
    href: '/entities',
    icon: Layers,
    label: 'Entities'
  },
  {
    name: 'scanner',
    href: '/scanner',
    icon: ScanLine,
    label: 'Scanner'
  },
  {
    name: 'routes',
    href: '/routes',
    icon: Route,
    label: 'Routes'
  },
  {
    name: 'reports',
    href: '/reports',
    icon: BarChart3,
    label: 'Reports'
  }
]

export function BottomNav() {
  const location = useLocation()
  const pathname = location.pathname

  const isActive = (href: string) => {
    // Exact match or sub-route match
    if (pathname === href || pathname.split('?')[0] === href || pathname.startsWith(href + '/')) {
      return true
    }

    // Special case: Routes section includes all /routes/* paths
    if (href === '/routes') {
      return pathname.startsWith('/routes')
    }

    // Special case: Entities section includes customers, products, orders, activity-templates
    if (href === '/entities') {
      const entitiesRoutes = ['/customers', '/products', '/orders', '/activity-templates']
      return entitiesRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/')
      )
    }

    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 relative',
                'transition-all duration-300 ease-out',
                'active:scale-95',
                active && 'bg-accent/30'
              )}
            >
              {/* Active indicator - top border with slide animation */}
              <div
                className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 h-1 rounded-b-full',
                  'transition-all duration-300 ease-out',
                  active
                    ? 'w-16 bg-primary shadow-[0_2px_8px_rgba(var(--primary-rgb,59,130,246),0.6)]'
                    : 'w-0 bg-transparent'
                )}
              />

              {/* Icon with scale animation */}
              <Icon
                className={cn(
                  'transition-all duration-300 ease-out',
                  active
                    ? 'h-7 w-7 text-primary scale-110 drop-shadow-md'
                    : 'h-5 w-5 text-muted-foreground scale-100',
                  // Scanner icon (center) always slightly larger
                  item.name === 'scanner' && !active && 'h-5.5 w-5.5'
                )}
              />

              {/* Label with fade and slide */}
              <span
                className={cn(
                  'text-xs transition-all duration-300 ease-out',
                  active
                    ? 'text-primary font-semibold opacity-100 translate-y-0'
                    : 'text-muted-foreground font-medium opacity-70 translate-y-0.5'
                )}
              >
                {item.label}
              </span>

              {/* Ripple effect on tap (optional - CSS only) */}
              <span className="absolute inset-0 overflow-hidden rounded-lg">
                <span
                  className={cn(
                    'absolute inset-0 bg-primary/10 rounded-full',
                    'scale-0 transition-transform duration-500',
                    'active:scale-150 active:opacity-0'
                  )}
                />
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
