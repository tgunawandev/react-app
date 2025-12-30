/**
 * NotificationCenter Page - Notification List and Management
 * Displays user notifications with read/unread status and actions
 * Reference: specs/001-sfa-app-build/tasks.md NOTIF-002
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

interface Notification {
  name: string
  subject: string
  email_content: string
  read: number
  creation: string
  document_type: string | null
  document_name: string | null
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Fetch notifications
  const { data, isLoading, mutate } = useFrappeGetCall<{
    message: {
      notifications: Notification[]
      total_count: number
      unread_count: number
    }
  }>(
    'frm.api.notifications.get_my_notifications',
    {
      limit: 50,
      offset: 0,
      read_status: filter === 'unread' ? 'unread' : undefined
    },
    `notifications-${filter}`,
    {
      revalidateOnFocus: true
    }
  )

  const { call: markAsRead } = useFrappePostCall('frm.api.notifications.mark_as_read')
  const { call: deleteNotification } = useFrappePostCall('frm.api.notifications.delete_notification')

  const notifications = data?.message?.notifications || []
  const unreadCount = data?.message?.unread_count || 0

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await markAsRead({ notification_ids: JSON.stringify(notificationIds) })
      toast.success('Notifications marked as read')
      mutate()
      setSelectedIds([])
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark as read')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification({ notification_id: notificationId })
      toast.success('Notification deleted')
      mutate()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete notification')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead([notification.name])
    }

    // Navigate to referenced document if available
    if (notification.document_type && notification.document_name) {
      const routes: Record<string, string> = {
        'Route Plan': `/sfa/routes/${notification.document_name}`,
        'Sales Visit': `/sfa/visit/${notification.document_name}/activities`,
        'Customer': `/customers/${notification.document_name}`
      }

      const route = routes[notification.document_type]
      if (route) {
        navigate(route)
      }
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      
<StandardHeader />

      {/* ===== Main Content ===== */}
      <Main>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAsRead(selectedIds)}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark {selectedIds.length} as read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="mt-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const unreadIds = notifications.filter(n => !n.read).map(n => n.name)
                handleMarkAsRead(unreadIds)
              }}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notification List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground mt-6">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : 'You have no notifications yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 mt-6">
            {notifications.map((notification) => (
              <Card
                key={notification.name}
                className={`cursor-pointer transition-colors ${
                  !notification.read ? 'bg-accent/50' : ''
                } ${selectedIds.includes(notification.name) ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.name)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelect(notification.name)
                      }}
                      className="mt-1"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{notification.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.email_content}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="shrink-0">
                            New
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatTimestamp(notification.creation)}</span>
                        {notification.document_type && (
                          <Badge variant="outline" className="text-xs">
                            {notification.document_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMarkAsRead([notification.name])
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>
    </>
  )
}
