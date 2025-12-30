/**
 * Stock Transfer Detail Page
 * Workflow: Load → Transit → Arrive → Handoff
 */

import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Warehouse,
  ArrowRight,
  Package,
  Truck,
  CheckCircle2,
  Circle,
  Camera,
  MapPin,
  Clock,
  AlertCircle,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Main } from '@/components/layout/Main'
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk'
import { toast } from 'sonner'

interface TransferItem {
  name: string
  product: string
  product_name: string
  quantity: number
  quantity_loaded: number
  quantity_received: number
  uom: string
}

interface DeliveryGroup {
  delivery_order: string | null
  customer: string
  items: TransferItem[]
}

interface LinkedDelivery {
  delivery_order: string
  customer_name: string
  item_count: number
  status: string
}

interface TransferData {
  name: string
  transfer_type: string
  source_warehouse: string
  source_location: string
  dest_warehouse: string
  dest_location: string
  dest_contact: string
  scheduled_date: string
  sfa_state: string
  odoo_state: string
  assigned_driver: string
  driver_name: string
  vehicle: string
  vehicle_plate: string
  total_items: number
  total_deliveries: number
  loading_completed_at: string | null
  transit_started_at: string | null
  arrived_at: string | null
  received_by: string | null
  received_at: string | null
  handoff_photo: string | null
  handoff_notes: string | null
  odoo_name: string
}

// Step indicator component
function StepIndicator({ steps, currentStep }: { steps: string[], currentStep: number }) {
  return (
    <div className="flex items-center justify-between w-full px-2 py-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`text-xs mt-1 ${
              index <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              index < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function StockTransferDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State
  const [showHandoffDialog, setShowHandoffDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [receivedBy, setReceivedBy] = useState('')
  const [handoffNotes, setHandoffNotes] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [handoffPhoto, setHandoffPhoto] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // API hooks
  const { data, isLoading, mutate } = useFrappeGetCall<{
    message: {
      success: boolean
      transfer: TransferData
      items_by_delivery: DeliveryGroup[]
      linked_deliveries: LinkedDelivery[]
    }
  }>(
    'frm.api.stock_transfer.get_transfer_detail',
    { transfer_id: id },
    id ? `transfer-${id}` : undefined,
    { revalidateOnFocus: false }
  )

  const { call: startLoading } = useFrappePostCall('frm.api.stock_transfer.start_loading_check')
  const { call: verifyAll } = useFrappePostCall('frm.api.stock_transfer.verify_all_items')
  const { call: completeLoading } = useFrappePostCall('frm.api.stock_transfer.complete_loading')
  const { call: arriveAtDc } = useFrappePostCall('frm.api.stock_transfer.arrive_at_dc')
  const { call: completeHandoff } = useFrappePostCall('frm.api.stock_transfer.complete_handoff')
  const { call: returnTransfer } = useFrappePostCall('frm.api.stock_transfer.return_transfer')
  const { upload } = useFrappeFileUpload()

  const transfer = data?.message?.transfer
  const itemsByDelivery = data?.message?.items_by_delivery || []
  const linkedDeliveries = data?.message?.linked_deliveries || []

  // Determine current step based on state
  const getStepFromState = (state: string): number => {
    switch (state) {
      case 'pending': return 0
      case 'loading': return 0
      case 'in_transit': return 1
      case 'arrived': return 2
      case 'completed': return 4
      case 'returned': return -1
      default: return 0
    }
  }

  const steps = ['Load', 'Transit', 'Arrive', 'Handoff']
  const currentStep = transfer ? getStepFromState(transfer.sfa_state) : 0

  // State variant helpers
  const getSfaStateVariant = (state: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (state?.toLowerCase()) {
      case 'pending': return 'outline'
      case 'loading': return 'secondary'
      case 'in_transit': return 'default'
      case 'arrived': return 'default'
      case 'completed': return 'default'
      case 'returned': return 'destructive'
      default: return 'outline'
    }
  }

  const formatSfaState = (state: string | undefined) => {
    switch (state?.toLowerCase()) {
      case 'pending': return 'Pending'
      case 'loading': return 'Loading'
      case 'in_transit': return 'In Transit'
      case 'arrived': return 'Arrived'
      case 'completed': return 'Completed'
      case 'returned': return 'Returned'
      default: return state || 'Unknown'
    }
  }

  // Calculate loading progress
  const loadingProgress = itemsByDelivery.reduce((acc, group) => {
    const loaded = group.items.filter(i => i.quantity_loaded >= i.quantity).length
    const total = group.items.length
    return { loaded: acc.loaded + loaded, total: acc.total + total }
  }, { loaded: 0, total: 0 })

  const progressPercent = loadingProgress.total > 0
    ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
    : 0

  // Actions
  const handleStartLoading = async () => {
    try {
      setIsSubmitting(true)
      await startLoading({ transfer_id: id })
      toast.success('Loading check started')
      mutate()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to start loading')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyAll = async () => {
    try {
      setIsSubmitting(true)
      await verifyAll({ transfer_id: id })
      toast.success('All items verified')
      mutate()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to verify items')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteLoading = async () => {
    try {
      setIsSubmitting(true)
      await completeLoading({ transfer_id: id })
      toast.success('Loading complete. Transit started.')
      mutate()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to complete loading')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArriveAtDc = async () => {
    try {
      setIsSubmitting(true)
      // Get current position if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await arriveAtDc({
              transfer_id: id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
            toast.success(`Arrived at ${transfer?.dest_warehouse}`)
            mutate()
            setIsSubmitting(false)
          },
          async () => {
            // No GPS, proceed anyway
            await arriveAtDc({ transfer_id: id })
            toast.success(`Arrived at ${transfer?.dest_warehouse}`)
            mutate()
            setIsSubmitting(false)
          }
        )
      } else {
        await arriveAtDc({ transfer_id: id })
        toast.success(`Arrived at ${transfer?.dest_warehouse}`)
        mutate()
        setIsSubmitting(false)
      }
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to mark arrival')
      setIsSubmitting(false)
    }
  }

  const handleCompleteHandoff = async () => {
    if (!receivedBy.trim()) {
      toast.error('Please enter the name of the DC staff')
      return
    }

    try {
      setIsSubmitting(true)
      let photoUrl: string | undefined

      // Upload photo if provided
      if (handoffPhoto) {
        const result = await upload(handoffPhoto, {
          doctype: 'Stock Transfer',
          docname: id!,
          fieldname: 'handoff_photo',
          isPrivate: false
        })
        photoUrl = result.file_url
      }

      await completeHandoff({
        transfer_id: id,
        received_by: receivedBy,
        handoff_photo: photoUrl,
        handoff_notes: handoffNotes
      })

      toast.success('Handoff completed. Deliveries are now ready for pickup.')
      setShowHandoffDialog(false)
      mutate()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to complete handoff')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturnTransfer = async () => {
    if (!returnReason.trim()) {
      toast.error('Please enter a reason for return')
      return
    }

    try {
      setIsSubmitting(true)
      await returnTransfer({
        transfer_id: id,
        reason: returnReason
      })
      toast.success('Transfer returned to warehouse')
      setShowReturnDialog(false)
      mutate()
    } catch (error: unknown) {
      const err = error as Error
      toast.error(err.message || 'Failed to return transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Main className="flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </Main>
    )
  }

  if (!transfer) {
    return (
      <Main className="flex items-center justify-center">
        <div className="text-muted-foreground">Transfer not found</div>
      </Main>
    )
  }

  const isCompleted = transfer.sfa_state === 'completed'
  const isReturned = transfer.sfa_state === 'returned'

  return (
    <>
      <Main className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transfers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{transfer.name}</h1>
            {transfer.odoo_name && (
              <p className="text-xs text-muted-foreground">Odoo: {transfer.odoo_name}</p>
            )}
          </div>
          <Badge variant={getSfaStateVariant(transfer.sfa_state)}>
            {formatSfaState(transfer.sfa_state)}
          </Badge>
        </div>

        {/* Route Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 text-center">
                <Warehouse className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                <p className="font-medium text-sm truncate">{transfer.source_warehouse}</p>
                <p className="text-xs text-muted-foreground">Source</p>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-center">
                <Warehouse className="h-8 w-8 mx-auto text-primary mb-1" />
                <p className="font-medium text-sm truncate">{transfer.dest_warehouse}</p>
                <p className="text-xs text-muted-foreground">Destination</p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Scheduled</p>
                <p className="font-medium">{new Date(transfer.scheduled_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Items / Deliveries</p>
                <p className="font-medium">{transfer.total_items} / {transfer.total_deliveries}</p>
              </div>
              {transfer.driver_name && (
                <div>
                  <p className="text-muted-foreground">Driver</p>
                  <p className="font-medium">{transfer.driver_name}</p>
                </div>
              )}
              {transfer.vehicle && (
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{transfer.vehicle} {transfer.vehicle_plate && `(${transfer.vehicle_plate})`}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step Indicator */}
        {!isCompleted && !isReturned && (
          <Card>
            <CardContent className="pt-2 pb-2">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </CardContent>
          </Card>
        )}

        {/* Completed/Returned Status */}
        {isCompleted && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-primary">Transfer Completed</p>
                  <p className="text-sm text-primary">
                    Received by {transfer.received_by} at {transfer.received_at ? new Date(transfer.received_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isReturned && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Transfer Returned</p>
                  <p className="text-sm text-destructive">{transfer.handoff_notes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Progress */}
        {(transfer.sfa_state === 'loading' || transfer.sfa_state === 'pending') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Loading Progress</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {loadingProgress.loaded}/{loadingProgress.total} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">{progressPercent}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Items by Delivery */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Items to Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {itemsByDelivery.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {group.delivery_order || 'Unassigned'}
                  </span>
                  <span className="text-muted-foreground">({group.customer})</span>
                </div>
                <div className="ml-6 space-y-1">
                  {group.items.map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        item.quantity_loaded >= item.quantity ? 'bg-primary/5' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.quantity_loaded >= item.quantity ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-[180px]">{item.product_name || item.product}</span>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {item.quantity_loaded}/{item.quantity} {item.uom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Linked Deliveries */}
        {linkedDeliveries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Linked Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedDeliveries.map((delivery) => (
                <div
                  key={delivery.delivery_order}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <div>
                    <p className="font-medium">{delivery.delivery_order}</p>
                    <p className="text-xs text-muted-foreground">{delivery.customer_name}</p>
                  </div>
                  <Badge variant={delivery.status === 'ready' ? 'default' : 'outline'}>
                    {delivery.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </Main>

      {/* Action Buttons - Fixed at bottom */}
      {!isCompleted && !isReturned && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
          <div className="max-w-lg mx-auto space-y-2">
            {/* Pending State - Start Loading */}
            {transfer.sfa_state === 'pending' && (
              <Button
                className="w-full h-12"
                onClick={handleStartLoading}
                disabled={isSubmitting}
              >
                <Package className="mr-2 h-5 w-5" />
                Start Loading Check
              </Button>
            )}

            {/* Loading State - Verify All & Complete */}
            {transfer.sfa_state === 'loading' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={handleVerifyAll}
                    disabled={isSubmitting || progressPercent === 100}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Verify All
                  </Button>
                  <Button
                    className="h-12"
                    onClick={handleCompleteLoading}
                    disabled={isSubmitting || progressPercent < 100}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Start Transit
                  </Button>
                </div>
              </>
            )}

            {/* In Transit State - Arrive at DC */}
            {transfer.sfa_state === 'in_transit' && (
              <Button
                className="w-full h-12"
                onClick={handleArriveAtDc}
                disabled={isSubmitting}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Arrived at {transfer.dest_warehouse}
              </Button>
            )}

            {/* Arrived State - Complete Handoff */}
            {transfer.sfa_state === 'arrived' && (
              <Button
                className="w-full h-12"
                onClick={() => setShowHandoffDialog(true)}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Complete Handoff
              </Button>
            )}

            {/* Return button (available before completion) */}
            {['loading', 'in_transit', 'arrived'].includes(transfer.sfa_state) && (
              <Button
                variant="outline"
                className="w-full h-10 text-destructive border-destructive/20"
                onClick={() => setShowReturnDialog(true)}
                disabled={isSubmitting}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Return to Warehouse
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Handoff Dialog */}
      <Dialog open={showHandoffDialog} onOpenChange={setShowHandoffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Handoff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By *</Label>
              <Input
                id="receivedBy"
                placeholder="Name of DC staff"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => setHandoffPhoto(e.target.files?.[0] || null)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {handoffPhoto ? handoffPhoto.name : 'Take Photo'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about the handoff..."
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteHandoff} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Complete Handoff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return to Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnReason">Reason for Return *</Label>
              <Textarea
                id="returnReason"
                placeholder="Why is this transfer being returned?"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReturnTransfer} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
