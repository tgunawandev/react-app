/**
 * NotificationBell Component
 * Bell icon with unread count badge in header
 * Reference: specs/001-sfa-app-build/tasks.md NOTIF-001
 */

import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFrappeGetCall } from 'frappe-react-sdk'

export function NotificationBell() {
  const navigate = useNavigate()

  // Fetch unread count - gracefully handle 403 errors (not logged in)
  const { data, error } = useFrappeGetCall<{ message: { unread_count: number } }>(
    'frm.api.notifications.get_my_notifications',
    { limit: 1 },
    'notification-count',
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      shouldRetryOnError: false, // Don't retry on auth errors
      onError: (err) => {
        // Silently ignore 403 errors (user not authenticated)
        if (err?.httpStatus === 403 || err?.httpStatus === 401) {
          return
        }
        console.error('Failed to fetch notifications:', err)
      }
    }
  )

  // If there's an auth error, don't show the notification bell
  if (error?.httpStatus === 403 || error?.httpStatus === 401) {
    return null
  }

  const unreadCount = data?.message?.unread_count || 0

  const handleClick = () => {
    navigate('/notifications')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
