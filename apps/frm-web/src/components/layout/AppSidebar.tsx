/**
 * AppSidebar Component
 * EXACTLY matches shadcn-admin structure with NavGroup and NavUser
 * Reference: shadcn-admin/src/components/layout/app-sidebar.tsx
 */

import { useAuthStore } from '@/stores/auth-store'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { getSidebarData } from './data/sidebar-data'

export function AppSidebar() {
  const { user } = useAuthStore()
  const { variant, collapsible } = useLayout()

  if (!user) {
    return null
  }

  const sidebarData = getSidebarData(user)

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div className='flex h-16 items-center px-4'>
          <h1 className='text-xl font-bold'>SFA</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
