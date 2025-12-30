/**
 * Driver Dashboard Page
 * Main interface for drivers to view and manage their delivery assignments
 * Reference: Delivery Tracking System Phase 1
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  MapPin,
  Clock,
  Package,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Navigation,
  RefreshCw,
  Calendar,
  User,
  Warehouse,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { toast } from 'sonner'
import {
  usePendingDeliveries,
  useDeliveryAssignmentMutations,
  type DeliveryForAssignment
} from '@/hooks/useDeliveryAssignment'
import { useFrappeGetCall } from 'frappe-react-sdk'

// Transfer type for hub driver
interface Transfer {
  name: string
  transfer_type: string
  source_warehouse: string
  dest_warehouse: string
  scheduled_date: string
  sfa_state: string
  total_items: number
  total_deliveries: number
  driver_name?: string
  odoo_name?: string
}
import {
  useDriverTracking,
  useGPSCapture
} from '@/hooks/useDriverLocation'
import HandoffDialog from '@/components/delivery/HandoffDialog'

export default function DriverDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('transfers')
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryForAssignment | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showHandoffDialog, setShowHandoffDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Get stock transfers for hub driver
  const {
    data: transferData,
    isLoading: loadingTransfers,
    mutate: refreshTransfers
  } = useFrappeGetCall<{ message: { success: boolean, transfers: Transfer[], count: number } }>(
    'frm.api.stock_transfer.get_my_transfers',
    { include_completed: false },
    'driver-transfers',
    { revalidateOnFocus: false }
  )

  const transfers = transferData?.message?.transfers || []
  const transferCount = transferData?.message?.count || 0

  // Get pending deliveries for current driver
  const {
    deliveries: pendingDeliveries,
    totalCount: pendingCount,
    isLoading: loadingPending,
    mutate: refreshPending
  } = usePendingDeliveries({
    status: activeTab === 'deliveries' ? 'pending,accepted' : 'in_progress'
  })

  // Assignment mutations
  const {
    acceptAssignment,
    isAccepting,
    rejectAssignment,
    isRejecting,
    startDelivery,
    isStarting,
    error: mutationError
  } = useDeliveryAssignmentMutations()

  // GPS capture for starting delivery
  const { capture: captureGPS, isCapturing } = useGPSCapture()

  // Active delivery tracking
  const activeDelivery = pendingDeliveries.find(d =>
    d.state === 'in_transit' || d.state === 'loading'
  )

  const {
    isTracking,
    latitude,
    longitude,
    accuracy,
    batteryLevel,
    startTracking,
    stopTracking
  } = useDriverTracking(activeDelivery?.name)

  const handleAccept = async (delivery: DeliveryForAssignment) => {
    if (!delivery.current_assignment) return

    try {
      await acceptAssignment(delivery.current_assignment)
      toast.success('Assignment accepted')
      refreshPending()
    } catch {
      toast.error('Failed to accept assignment')
    }
  }

  const handleReject = async () => {
    if (!selectedDelivery?.current_assignment) return

    try {
      await rejectAssignment(selectedDelivery.current_assignment, rejectReason)
      toast.success('Assignment rejected')
      setShowRejectDialog(false)
      setRejectReason('')
      setSelectedDelivery(null)
      refreshPending()
    } catch {
      toast.error('Failed to reject assignment')
    }
  }

  const handleStartDelivery = async (delivery: DeliveryForAssignment) => {
    if (!delivery.current_assignment) return

    try {
      // Capture GPS first
      const position = await captureGPS({ enableHighAccuracy: true, timeout: 30000 })

      await startDelivery(
        delivery.current_assignment,
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy
      )

      toast.success('Delivery started! GPS tracking enabled.')
      startTracking()
      refreshPending()
    } catch {
      toast.error('Failed to start delivery. Check GPS permissions.')
    }
  }

  const handleViewDelivery = (delivery: DeliveryForAssignment) => {
    navigate(`/deliveries/${delivery.name}`)
  }

  const openRejectDialog = (delivery: DeliveryForAssignment) => {
    setSelectedDelivery(delivery)
    setShowRejectDialog(true)
  }

  const openHandoffDialog = (delivery: DeliveryForAssignment) => {
    setSelectedDelivery(delivery)
    setShowHandoffDialog(true)
  }

  const getStatusBadge = (state: string) => {
    switch (state.toLowerCase()) {
      case 'assigned':
        return <Badge variant="outline">Assigned</Badge>
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>
      case 'in_transit':
        return <Badge className="bg-muted0">In Transit</Badge>
      case 'arrived':
        return <Badge className="bg-primary">Arrived</Badge>
      case 'delivering':
        return <Badge className="bg-orange-500">Delivering</Badge>
      default:
        return <Badge variant="outline">{state}</Badge>
    }
  }

  const formatTime = (datetime?: string) => {
    if (!datetime) return '-'
    return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderDeliveryCard = (delivery: DeliveryForAssignment) => {
    const isPending = delivery.status === 'pending'
    const isAccepted = delivery.status === 'accepted' || delivery.state === 'assigned'
    const isInProgress = delivery.state === 'in_transit' || delivery.state === 'loading'

    return (
      <Card
        key={delivery.name}
        className={`cursor-pointer hover:shadow-md transition-shadow ${
          isInProgress ? 'border-primary border-2' : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{delivery.name}</CardTitle>
              {delivery.odoo_name && (
                <p className="text-xs text-muted-foreground">{delivery.odoo_name}</p>
              )}
            </div>
            {getStatusBadge(delivery.state || 'assigned')}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Customer info */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{delivery.customer_name}</span>
            </div>

            {/* Delivery date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(delivery.delivery_date).toLocaleDateString()}</span>
            </div>

            {/* ETA */}
            {delivery.estimated_delivery_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>ETA: {formatTime(delivery.estimated_delivery_time)}</span>
              </div>
            )}

            {/* Item count */}
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{delivery.item_count || 0} items</span>
            </div>

            {/* Sequence number */}
            {delivery.sequence_number && (
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span>Stop #{delivery.sequence_number}</span>
              </div>
            )}

            <Separator />

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {isPending && (
                <>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAccept(delivery)
                    }}
                    disabled={isAccepting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openRejectDialog(delivery)
                    }}
                    disabled={isRejecting}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}

              {isAccepted && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartDelivery(delivery)
                  }}
                  disabled={isStarting || isCapturing}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Delivery
                </Button>
              )}

              {isInProgress && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      openHandoffDialog(delivery)
                    }}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1" />
                    Handoff
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDelivery(delivery)
                }}
              >
                <Truck className="h-4 w-4 mr-1" />
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Driver Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your delivery assignments
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshPending()
              refreshTransfers()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Active tracking status */}
        {isTracking && (
          <Card className="bg-muted border-muted">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-muted0 rounded-full animate-pulse" />
                  <div>
                    <p className="font-medium text-foreground">GPS Tracking Active</p>
                    <p className="text-xs text-primary">
                      {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                      {accuracy && ` (±${Math.round(accuracy)}m)`}
                      {batteryLevel !== null && ` | Battery: ${batteryLevel}%`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stopTracking()}
                  className="border-primary/30 text-foreground hover:bg-muted"
                >
                  Stop Tracking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mutation error display */}
        {mutationError && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="py-3">
              <p className="text-destructive text-sm">{mutationError.message}</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfers">
              <Warehouse className="h-4 w-4 mr-1" />
              Transfers ({transferCount})
            </TabsTrigger>
            <TabsTrigger value="deliveries">
              <MapPin className="h-4 w-4 mr-1" />
              Deliveries ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="active">
              <Truck className="h-4 w-4 mr-1" />
              Active
            </TabsTrigger>
          </TabsList>

          {/* Transfers Tab - Hub Driver */}
          <TabsContent value="transfers" className="mt-4">
            {loadingTransfers ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading transfers...
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No stock transfers assigned</p>
                <p className="text-sm mt-1">Hub drivers see WH to DC transfers here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {transfers.map((transfer) => (
                  <Card
                    key={transfer.name}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/transfers/${transfer.name}`)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{transfer.name}</CardTitle>
                          {transfer.odoo_name && (
                            <p className="text-xs text-muted-foreground">{transfer.odoo_name}</p>
                          )}
                        </div>
                        <Badge variant={
                          transfer.sfa_state === 'completed' ? 'default' :
                          transfer.sfa_state === 'in_transit' ? 'default' :
                          transfer.sfa_state === 'loading' ? 'secondary' : 'outline'
                        }>
                          {transfer.sfa_state.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Route */}
                        <div className="flex items-center gap-2 text-sm">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{transfer.source_warehouse}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{transfer.dest_warehouse}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(transfer.scheduled_date).toLocaleDateString()}</span>
                        </div>

                        {/* Items / Deliveries */}
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{transfer.total_items} items for {transfer.total_deliveries} deliveries</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Deliveries Tab - Delivery Driver */}
          <TabsContent value="deliveries" className="mt-4">
            {loadingPending ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading deliveries...
              </div>
            ) : pendingDeliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending deliveries</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingDeliveries
                  .filter(d => d.status === 'pending' || d.status === 'accepted' || d.state === 'assigned')
                  .map(renderDeliveryCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {loadingPending ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading deliveries...
              </div>
            ) : pendingDeliveries.filter(d =>
                d.state === 'in_transit' || d.state === 'loading'
              ).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active deliveries</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingDeliveries
                  .filter(d => d.state === 'in_transit' || d.state === 'loading')
                  .map(renderDeliveryCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejecting this delivery assignment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setRejectReason('')
                setSelectedDelivery(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                disabled={isRejecting || !rejectReason.trim()}
              >
                Reject Assignment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Handoff Dialog */}
        {selectedDelivery && (
          <HandoffDialog
            open={showHandoffDialog}
            onOpenChange={setShowHandoffDialog}
            delivery={selectedDelivery}
            onSuccess={() => {
              setShowHandoffDialog(false)
              setSelectedDelivery(null)
              refreshPending()
            }}
          />
        )}
      </Main>
    </>
  )
}
