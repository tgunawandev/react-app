/**
 * Sidebar Navigation Data
 * Adapted from shadcn-admin for SFA
 * Navigation structure matches BottomNav (minus Scanner)
 */

import {
  Home,
  Layers,
  MapPin,
  BarChart3,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

/**
 * Get sidebar data with current user
 * CRITICAL: Navigation items match BottomNav exactly (Home, Entities, Visit, Reports)
 */
export function getSidebarData(user: { full_name?: string; name: string; email: string }): SidebarData {
  return {
    user: {
      name: user.full_name || user.name,
      email: user.email,
      avatar: '',
    },
    teams: [], // Not used in SFA
    navGroups: [
      {
        title: 'Main',
        items: [
          {
            title: 'Home',
            url: '/dashboard',
            icon: Home,
          },
          {
            title: 'Entities',
            url: '/customers',
            icon: Layers,
          },
          {
            title: 'Visit',
            url: '/visit',
            icon: MapPin,
          },
          {
            title: 'Reports',
            url: '/reports',
            icon: BarChart3,
          },
        ],
      },
      {
        title: 'Settings',
        items: [
          {
            title: 'Settings',
            url: '/settings',
            icon: Settings,
          },
        ],
      },
    ],
  }
}
