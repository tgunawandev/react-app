/**
 * NotificationPanel Component
 * WhatsApp notification controls and history for deliveries
 * Reference: Delivery Tracking System Phase 3
 */

import { useState } from 'react'
import {
  MessageCircle,
  Send,
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Loader2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  useDeliveryNotificationMutations,
  useNotificationHistory,
  useWhatsAppStatus
} from '@/hooks/useDeliveryNotifications'

interface NotificationPanelProps {
  deliveryOrder: string
  deliveryState: string
  customerPhone?: string
  onNotificationSent?: () => void
}

type NotificationType = 'in_transit' | 'arriving' | 'completed' | 'failed' | 'rescheduled'

export default function NotificationPanel({
  deliveryOrder,
  deliveryState,
  customerPhone,
  onNotificationSent
}: NotificationPanelProps) {
  const [showHistory, setShowHistory] = useState(false)
  const [notificationDialog, setNotificationDialog] = useState<{
    open: boolean
    type: NotificationType | null
  }>({ open: false, type: null })
  const [etaMinutes, setEtaMinutes] = useState('')
  const [reason, setReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [receiverName, setReceiverName] = useState('')

  const { status, isEnabled } = useWhatsAppStatus()
  const { notifications, isLoading: loadingHistory, refresh: refreshHistory } = useNotificationHistory(deliveryOrder)
  const {
    notifyInTransit,
    notifyArriving,
    notifyCompleted,
    notifyFailed,
    notifyRescheduled,
    isLoading
  } = useDeliveryNotificationMutations()

  const handleSendNotification = async () => {
    if (!notificationDialog.type) return

    let result = null

    switch (notificationDialog.type) {
      case 'in_transit':
        result = await notifyInTransit(deliveryOrder, etaMinutes ? parseInt(etaMinutes) : undefined)
        break
      case 'arriving':
        result = await notifyArriving(deliveryOrder)
        break
      case 'completed':
        result = await notifyCompleted(deliveryOrder, receiverName || undefined)
        break
      case 'failed':
        if (!reason.trim()) {
          toast.error('Please provide a reason')
          return
        }
        result = await notifyFailed(deliveryOrder, reason)
        break
      case 'rescheduled':
        if (!newDate) {
          toast.error('Please provide a new date')
          return
        }
        result = await notifyRescheduled(deliveryOrder, newDate, newTime || undefined)
        break
    }

    if (result?.success) {
      toast.success('Notification sent successfully')
      setNotificationDialog({ open: false, type: null })
      resetForm()
      refreshHistory()
      onNotificationSent?.()
    } else {
      toast.error(result?.message || 'Failed to send notification')
    }
  }

  const resetForm = () => {
    setEtaMinutes('')
    setReason('')
    setNewDate('')
    setNewTime('')
    setReceiverName('')
  }

  const openNotificationDialog = (type: NotificationType) => {
    resetForm()
    setNotificationDialog({ open: true, type })
  }

  const getNotificationTitle = () => {
    switch (notificationDialog.type) {
      case 'in_transit':
        return 'Notify: On The Way'
      case 'arriving':
        return 'Notify: Arriving Soon'
      case 'completed':
        return 'Notify: Delivery Completed'
      case 'failed':
        return 'Notify: Delivery Failed'
      case 'rescheduled':
        return 'Notify: Rescheduled'
      default:
        return 'Send Notification'
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'in_transit':
        return <Truck className="h-4 w-4" />
      case 'arriving':
        return <MapPin className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'rescheduled':
        return <Calendar className="h-4 w-4" />
    }
  }

  // Determine which notifications can be sent based on state
  const canSendInTransit = ['assigned', 'confirmed'].includes(deliveryState.toLowerCase())
  const canSendArriving = ['in_transit', 'assigned'].includes(deliveryState.toLowerCase())
  const canSendCompleted = ['arrived', 'delivering', 'in_transit'].includes(deliveryState.toLowerCase())
  const canSendFailed = !['done', 'cancel'].includes(deliveryState.toLowerCase())
  const canSendRescheduled = !['done', 'cancel'].includes(deliveryState.toLowerCase())

  if (!isEnabled) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">WhatsApp Not Configured</p>
              <p className="text-sm">WhatsApp notifications are not available. Configure WhatsApp Settings to enable.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Notifications
              </CardTitle>
              <CardDescription>
                Send delivery updates to customer
                {customerPhone && <span className="ml-1">({customerPhone})</span>}
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick send buttons */}
          <div className="grid grid-cols-2 gap-2">
            {canSendInTransit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNotificationDialog('in_transit')}
                disabled={isLoading}
                className="justify-start"
              >
                <Truck className="h-4 w-4 mr-2" />
                On The Way
              </Button>
            )}
            {canSendArriving && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNotificationDialog('arriving')}
                disabled={isLoading}
                className="justify-start"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Arriving
              </Button>
            )}
            {canSendCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNotificationDialog('completed')}
                disabled={isLoading}
                className="justify-start"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </Button>
            )}
            {canSendFailed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNotificationDialog('failed')}
                disabled={isLoading}
                className="justify-start text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Failed
              </Button>
            )}
            {canSendRescheduled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openNotificationDialog('rescheduled')}
                disabled={isLoading}
                className="justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            )}
          </div>

          {/* Notification history */}
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Notification History
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {notifications.length}
                    </Badge>
                  )}
                </span>
                {showHistory ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {loadingHistory ? (
                <div className="py-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications sent yet
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.name}
                      className="flex items-start gap-2 p-2 bg-muted rounded text-sm"
                    >
                      <Send className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {notification.subject.replace('WhatsApp: ', '')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.creation).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialog.open}
        onOpenChange={(open) => !open && setNotificationDialog({ open: false, type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificationDialog.type && getNotificationIcon(notificationDialog.type)}
              {getNotificationTitle()}
            </DialogTitle>
            <DialogDescription>
              Send a WhatsApp notification to the customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* In Transit form */}
            {notificationDialog.type === 'in_transit' && (
              <div className="space-y-2">
                <Label htmlFor="eta">ETA (minutes) - Optional</Label>
                <Input
                  id="eta"
                  type="number"
                  min="0"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(e.target.value)}
                  placeholder="e.g., 30"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if you don&apos;t want to include ETA
                </p>
              </div>
            )}

            {/* Completed form */}
            {notificationDialog.type === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="receiver">Receiver Name - Optional</Label>
                <Input
                  id="receiver"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Name of person who received"
                />
              </div>
            )}

            {/* Failed form */}
            {notificationDialog.type === 'failed' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Failure</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Customer not available, wrong address..."
                  rows={3}
                />
              </div>
            )}

            {/* Rescheduled form */}
            {notificationDialog.type === 'rescheduled' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newDate">New Delivery Date</Label>
                  <Input
                    id="newDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newTime">Time Window - Optional</Label>
                  <Input
                    id="newTime"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g., 9:00 AM - 12:00 PM"
                  />
                </div>
              </div>
            )}

            {/* Arriving - no additional fields */}
            {notificationDialog.type === 'arriving' && (
              <p className="text-sm text-muted-foreground">
                This will notify the customer that the driver is arriving at their location.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotificationDialog({ open: false, type: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
