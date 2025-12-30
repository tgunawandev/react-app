/**
 * AppLayout Component
 * EXACTLY matches shadcn-admin pattern with correct provider nesting
 * Reference: shadcn-admin/src/components/layout/authenticated-layout.tsx
 *
 * Layout provides: SearchProvider → LayoutProvider → SidebarProvider
 * Pages provide: Their own Header + Main components
 */

import { Outlet } from 'react-router-dom'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-provider'
import { LayoutProvider } from '@/context/layout-provider'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SkipToMain } from '@/components/layout/skip-to-main'

export default function AppLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
      <SkipToMain />
      <AppSidebar />
      <SidebarInset
        className={cn(
          // Set content container for container queries
          '@container/content',

          // Always constrain height to viewport and enable scrolling
          'flex flex-col h-svh overflow-y-auto',

          // If layout is fixed, set height to 100svh to prevent overflow
          'has-data-[layout=fixed]:h-svh',

          // If layout is fixed and sidebar is inset,
          // set height to 100svh - spacing to prevent overflow
          'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
        )}
      >
        {/* Pages render their own Header + Main */}
        <Outlet />

        {/* Mobile bottom navigation */}
        <BottomNav />
      </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
