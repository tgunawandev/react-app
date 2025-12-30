/**
 * useNotifications Hook - Real-time Notification Delivery
 * Listens for Socket.IO events and displays toast notifications
 * Reference: specs/001-sfa-app-build/tasks.md NOTIF-003
 */

import { useFrappeEventListener } from 'frappe-react-sdk'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'

export interface NotificationPayload {
  notification_id: string
  title: string
  message: string
  type: string
  timestamp: string
  reference_doctype?: string
  reference_name?: string
}

/**
 * Hook for real-time notification delivery
 */
export function useNotifications() {
  // Listen for sfa_notification events
  useFrappeEventListener('sfa_notification', (data: NotificationPayload) => {
    // Display toast notification
    toast(data.title, {
      description: data.message,
      icon: <Bell className="h-4 w-4" />,
      action: data.reference_doctype && data.reference_name ? {
        label: 'View',
        onClick: () => {
          // Navigate to referenced document
          // Note: basename (/sfa in production) will be automatically prepended
          const routes: Record<string, string | undefined> = {
            'Route Plan': `/routes/${data.reference_name}`,
            'Sales Visit': `/visit/${data.reference_name}/activities`,
            'Customer': `/customers/${data.reference_name}`
          }

          const route = routes[data.reference_doctype || '']
          if (route) {
            window.location.href = route
          }
        }
      } : undefined
    })
  })

  return {
    // Hook is primarily for side effects (listening)
    // Return empty object for consistency
  }
}
