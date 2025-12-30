/**
 * Stop Execution Page
 * Vertical timeline flow for visit activities
 * Steps: Photos → Stock Opname → Payment → Sales Order → Survey → Check Out
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import {
  VisitTimeline,
  DEFAULT_VISIT_STEPS,
  type TimelineStep,
  type StepStatus,
  type PhotoItem,
} from '@/components/visit/VisitTimeline'
import { VisitPhotoCapture } from '@/components/visit/VisitPhotoCapture'
import { StockOpnameSheet, type StockCount } from '@/components/visit/StockOpnameSheet'
import { PaymentCollectionSheet } from '@/components/visit/PaymentCollectionSheet'
import { SalesOrderSheet } from '@/components/visit/SalesOrderSheet'
import { CompetitorSurveySheet } from '@/components/visit/CompetitorSurveySheet'
import {
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  SkipForward,
  Truck,
  ShoppingBag,
  Package,
  Coffee,
  Navigation,
  Camera,
  CreditCard,
  ShoppingCart,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Route, RouteStop } from '@/types/frm'

// Stop type icon mapping
const stopTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sales Visit': ShoppingBag,
  'Delivery': Truck,
  'Stock Transfer': Package,
  'Pickup': Package,
  'Break': Coffee,
}

const statusColors: Record<string, string> = {
  'pending': 'bg-muted text-muted-foreground',
  'arrived': 'bg-primary/10 text-primary',
  'in_progress': 'bg-primary/10 text-primary',
  'completed': 'bg-green-600 dark:bg-green-700 text-white',
  'skipped': 'bg-orange-500 dark:bg-orange-600 text-white',
  'partial': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
  'failed': 'bg-destructive/10 text-destructive',
}

const skipReasons = [
  { value: 'Customer Closed', label: 'Customer Closed' },
  { value: 'Out of Stock', label: 'Out of Stock' },
  { value: 'Customer Refused', label: 'Customer Refused' },
  { value: 'Time Constraint', label: 'Time Constraint' },
  { value: 'Other', label: 'Other' },
]

export default function StopExecution() {
  const { routeId, stopIdx } = useParams<{ routeId: string; stopIdx: string }>()
  const navigate = useNavigate()

  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [skipNotes, setSkipNotes] = useState('')

  // Photo capture modal state
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoItem[]>([])

  // Activity overlay states
  const [showStockSheet, setShowStockSheet] = useState(false)
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [showOrderSheet, setShowOrderSheet] = useState(false)
  const [showSurveyDialog, setShowSurveyDialog] = useState(false)

  // Track completed activities and their results
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [paymentId, setPaymentId] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')
  const [surveyId, setSurveyId] = useState<string>('')

  // Fetch route details
  const {
    data: routeData,
    isLoading,
    error,
    mutate,
  } = useFrappeGetCall<{ route: Route }>(
    routeId ? 'frm.api.route.get_route_execution' : null,
    routeId ? { route_name: routeId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // API hooks
  const { call: updateStatus, loading: updatingStatus } = useFrappePostCall<{ message: RouteStop }>(
    'frm.api.route.update_route_stop_status'
  )
  const { call: savePhotos } = useFrappePostCall<{ message: { photos: PhotoItem[] } }>(
    'frm.api.route.save_route_stop_photos'
  )
  const { call: deletePhoto } = useFrappePostCall<{ message: { success: boolean } }>(
    'frm.api.route.delete_route_stop_photo'
  )

  // Fetch photos for this stop
  const { data: photosData, mutate: refreshPhotos } = useFrappeGetCall<{
    message: { photos: PhotoItem[] }
  }>(
    routeId && stopIdx ? 'frm.api.route.get_route_stop_photos' : null,
    routeId && stopIdx ? { route_name: routeId, stop_idx: stopIdx } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  const route = routeData?.message || routeData?.route || (routeData as unknown as Route)
  const stops = route?.stops || []
  const stop = stops.find((s) => s.idx === parseInt(stopIdx || '0'))
  const visitId = stop?.sales_visit || ''

  // Fetch existing stock opname data for this visit (must be after stop is defined)
  const { data: stockOpnameData } = useFrappeGetCall<{
    message: { stock_counts: StockCount[]; summary: { total_items_counted: number } } | null
  }>(
    visitId ? 'frm.api.stock.get_stock_opname' : null,
    visitId ? { visit_id: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Fetch existing sales orders for this visit
  const { data: ordersData } = useFrappeGetCall<{
    message: { orders: Array<{ name: string; amount_total: number; status: string }> }
  }>(
    visitId ? 'frm.api.order.get_my_orders' : null,
    visitId ? { sales_visit: visitId, limit: 10 } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Fetch existing payments for this visit
  const { data: paymentsData } = useFrappeGetCall<{
    message: { payments: Array<{ name: string; amount: number; status: string }> }
  }>(
    visitId ? 'frm.api.payment.get_payment_list' : null,
    visitId ? { sales_visit: visitId, limit: 10 } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Fetch existing competitor survey for this visit
  const { data: competitorSurveyData } = useFrappeGetCall<{
    message: { survey: { name: string; total_products: number } | null }
  }>(
    visitId ? 'frm.api.competitor_survey.get_survey' : null,
    visitId ? { visit_id: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  const StopIcon = stop?.stop_type ? stopTypeIcons[stop.stop_type] || MapPin : MapPin

  // Load photos from server into local state
  useEffect(() => {
    if (photosData?.message?.photos) {
      setCapturedPhotos(photosData.message.photos)
      // Mark photos step as completed if we have photos
      if (photosData.message.photos.length > 0) {
        setCompletedSteps(prev => new Set([...prev, 'photos']))
      }
    }
  }, [photosData])

  // Load stock opname completion status from database
  useEffect(() => {
    if (stockOpnameData?.message?.stock_counts && stockOpnameData.message.stock_counts.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 'stock_opname']))
    }
  }, [stockOpnameData])

  // Load sales order completion status from database
  useEffect(() => {
    const orders = ordersData?.message?.orders
    if (orders && orders.length > 0) {
      setOrderId(orders[0].name)
      setCompletedSteps(prev => new Set([...prev, 'sales_order']))
    }
  }, [ordersData])

  // Load payment completion status from database
  useEffect(() => {
    const payments = paymentsData?.message?.payments
    if (payments && payments.length > 0) {
      setPaymentId(payments[0].name)
      setCompletedSteps(prev => new Set([...prev, 'payment']))
    }
  }, [paymentsData])

  // Load competitor survey completion status from database
  useEffect(() => {
    const survey = competitorSurveyData?.message?.survey
    if (survey) {
      setSurveyId(survey.name)
      setCompletedSteps(prev => new Set([...prev, 'survey']))
    }
  }, [competitorSurveyData])

  // Check if required steps are completed
  const requiredStepsCompleted = useMemo(() => {
    // Stock Opname is required
    return completedSteps.has('stock_opname')
  }, [completedSteps])

  // Handle step actions - open overlays instead of navigating
  const handleStepAction = useCallback((stepId: string) => {
    switch (stepId) {
      case 'photos':
        setShowPhotoCapture(true)
        break

      case 'stock_opname':
        setShowStockSheet(true)
        break

      case 'payment':
        setShowPaymentSheet(true)
        break

      case 'sales_order':
        setShowOrderSheet(true)
        break

      case 'survey':
        setShowSurveyDialog(true)
        break

      default:
        break
    }
  }, [])

  // Completion handlers for each activity
  const handleStockComplete = useCallback((stockCounts: StockCount[]) => {
    setCompletedSteps(prev => new Set([...prev, 'stock_opname']))
    setShowStockSheet(false)
    if (stockCounts.length > 0) {
      const varianceCount = stockCounts.filter(s => s.variance !== 0).length
      if (varianceCount > 0) {
        toast.success(`Stock check completed: ${stockCounts.length} items counted, ${varianceCount} with variance`)
      } else {
        toast.success(`Stock check completed: ${stockCounts.length} items counted, all match`)
      }
    }
  }, [])

  const handlePaymentComplete = useCallback((id: string) => {
    if (id) {
      setPaymentId(id)
      setCompletedSteps(prev => new Set([...prev, 'payment']))
    } else {
      // Skipped - mark as skipped
      setCompletedSteps(prev => new Set([...prev, 'payment_skipped']))
    }
    setShowPaymentSheet(false)
  }, [])

  const handleOrderComplete = useCallback((id: string) => {
    if (id) {
      setOrderId(id)
      setCompletedSteps(prev => new Set([...prev, 'sales_order']))
    } else {
      // Skipped
      setCompletedSteps(prev => new Set([...prev, 'sales_order_skipped']))
    }
    setShowOrderSheet(false)
  }, [])

  const handleSurveyComplete = useCallback((data: { surveyId?: string }) => {
    if (data.surveyId) {
      setSurveyId(data.surveyId)
      setCompletedSteps(prev => new Set([...prev, 'survey']))
    } else {
      // Skipped
      setCompletedSteps(prev => new Set([...prev, 'survey_skipped']))
    }
    setShowSurveyDialog(false)
  }, [])

  // Skip step
  const handleSkipStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(`${stepId}_skipped`)
      return next
    })
  }, [])

  // Handle photo capture completion
  const handlePhotosComplete = useCallback(async (photos: string[]) => {
    if (!routeId || !stopIdx) return

    try {
      // Save photos to server
      const result = await savePhotos({
        route_name: routeId,
        stop_idx: parseInt(stopIdx),
        photo_urls: JSON.stringify(photos),
      })

      if (result?.message?.photos) {
        // Update local state with server-assigned IDs
        setCapturedPhotos(prev => [...prev, ...result.message.photos])
        setCompletedSteps(prev => new Set([...prev, 'photos']))
        toast.success(`${photos.length} photo(s) saved`)
      }
    } catch (err) {
      // Still update local state as fallback (photos are uploaded via useFrappeFileUpload)
      const photoItems: PhotoItem[] = photos.map((url, index) => ({
        id: `photo_${Date.now()}_${index}`,
        url,
        thumbnail_url: url,
      }))
      setCapturedPhotos(prev => [...prev, ...photoItems])
      setCompletedSteps(prev => new Set([...prev, 'photos']))
      console.error('Failed to link photos:', err)
    }
  }, [routeId, stopIdx, savePhotos])

  // Handle photo delete
  const handleDeletePhoto = useCallback(async (photoId: string) => {
    if (!routeId || !stopIdx) return

    // Optimistic update
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId))

    try {
      await deletePhoto({
        route_name: routeId,
        stop_idx: parseInt(stopIdx),
        photo_id: photoId,
      })
      toast.success('Photo deleted')
    } catch (err) {
      // Revert on error - refresh from server
      refreshPhotos()
      toast.error('Failed to delete photo')
    }
  }, [routeId, stopIdx, deletePhoto, refreshPhotos])


  // Complete stop (check out)
  const handleCheckOut = async () => {
    if (!route || !stop) return

    try {
      await updateStatus({
        route_name: route.name,
        stop_idx: stop.idx,
        status: 'Completed',
      })
      toast.success('Visit completed!')
      navigate(`/routes/${routeId}`)
    } catch (err) {
      toast.error('Failed to complete visit', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    }
  }

  // Skip stop
  const handleSkip = async () => {
    if (!route || !stop || !skipReason) return

    try {
      await updateStatus({
        route_name: route.name,
        stop_idx: stop.idx,
        status: 'Skipped',
      })
      toast.success('Stop skipped')
      setShowSkipDialog(false)
      navigate(`/routes/${routeId}`)
    } catch (err) {
      toast.error('Failed to skip stop', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    }
  }

  // Open navigation
  const handleNavigate = () => {
    if (!stop?.latitude || !stop?.longitude) {
      toast.error('No GPS coordinates available for this stop')
      return
    }
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`,
      '_blank'
    )
  }

  // Build timeline steps
  const timelineSteps: TimelineStep[] = useMemo(() => {
    return DEFAULT_VISIT_STEPS.map((stepConfig) => {
      const isCompleted = completedSteps.has(stepConfig.id)
      const isSkipped = completedSteps.has(`${stepConfig.id}_skipped`)

      let status: StepStatus = 'pending'
      if (isCompleted) status = 'completed'
      else if (isSkipped) status = 'skipped'
      else if (stepConfig.isRequired && !isCompleted) status = 'active'

      // Find first pending required step to make it active
      const firstPendingRequired = DEFAULT_VISIT_STEPS.find(
        (s) => s.isRequired && !completedSteps.has(s.id) && !completedSteps.has(`${s.id}_skipped`)
      )
      if (firstPendingRequired?.id === stepConfig.id) {
        status = 'active'
      }

      // Generate summary based on step type
      let summary = ''
      let count: number | undefined = undefined
      let photos: PhotoItem[] | undefined = undefined

      switch (stepConfig.id) {
        case 'photos':
          summary = capturedPhotos.length > 0
            ? `${capturedPhotos.length} photo(s) captured`
            : 'Capture store/product photos'
          count = capturedPhotos.length > 0 ? capturedPhotos.length : undefined
          // Pass photos for display in timeline (view only, edit/delete in modal)
          if (capturedPhotos.length > 0) {
            photos = capturedPhotos
          }
          break
        case 'stock_opname':
          {
            const stockCount = stockOpnameData?.message?.summary?.total_items_counted || 0
            summary = isCompleted
              ? stockCount > 0 ? `${stockCount} item(s) counted` : 'Stock checked'
              : 'Check stock levels at this location'
            if (stockCount > 0) count = stockCount
          }
          break
        case 'payment':
          summary = isCompleted
            ? paymentId ? `Payment ${paymentId} recorded` : 'Payment collected'
            : 'Collect pending invoice payments'
          break
        case 'sales_order':
          summary = isCompleted
            ? orderId ? `Order ${orderId} created` : 'Order created'
            : 'Create a new sales order'
          break
        case 'survey':
          {
            const surveyTotal = competitorSurveyData?.message?.survey?.total_products || 0
            summary = isCompleted
              ? surveyTotal > 0 ? `${surveyTotal} competitor product(s) recorded` : 'Survey completed'
              : 'Record competitor products and prices'
            if (surveyTotal > 0) count = surveyTotal
          }
          break
      }

      return {
        id: stepConfig.id,
        name: stepConfig.name,
        icon: stepConfig.icon,
        status,
        isRequired: stepConfig.isRequired,
        summary,
        count,
        actionLabel: stepConfig.actionLabel,
        onAction: () => handleStepAction(stepConfig.id),
        photos,
      }
    })
  }, [completedSteps, capturedPhotos, paymentId, orderId, surveyId, handleStepAction, stockOpnameData, competitorSurveyData])

  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </Main>
      </>
    )
  }

  if (error || !route || !stop) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load stop details. The stop may not exist.
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

  const isProcessing = updatingStatus

  // Visit state detection
  const isPending = !stop.status || stop.status === 'pending'
  const isInProgress = stop.status === 'in_progress' || stop.status === 'arrived'
  const isFinished = stop.status === 'completed' || stop.status === 'skipped'

  // Activities are only editable during In Progress
  const activitiesLocked = !isInProgress

  const canSkip = stop.status !== 'completed' && stop.status !== 'skipped'

  // Handle Start Visit (transition from Pending to In Progress)
  const handleStartVisit = async () => {
    if (!route || !stop) return

    try {
      const doStartVisit = async (lat: number, lng: number) => {
        await updateStatus({
          route_name: route.name,
          stop_idx: stop.idx,
          status: 'in_progress',
          latitude: lat,
          longitude: lng,
        })
        toast.success('Visit started!')
        mutate() // Refresh route data
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await doStartVisit(position.coords.latitude, position.coords.longitude)
          },
          async () => {
            // GPS denied - still allow start without location
            await doStartVisit(0, 0)
            toast.info('GPS unavailable - location not recorded')
          }
        )
      } else {
        await doStartVisit(0, 0)
      }
    } catch (err) {
      toast.error('Failed to start visit', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    }
  }

  return (
    <>
      <StandardHeader />
      <Main className="space-y-4 pb-24">
        {/* Hero Header Section */}
        <Card className="border-dashed shadow-sm">
          <CardContent className="pt-4">
            {/* Top Row: Back Button + Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/routes/${routeId}`)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Badge className={statusColors[stop.status || 'pending']}>
                {(stop.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>

            {/* Stop Progress Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold">
                {stop.sequence}
              </span>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>of</span>
                <span className="font-medium text-foreground">{stops.length}</span>
                <span>stops</span>
              </div>
              {/* Progress Dots */}
              <div className="flex gap-1 ml-auto">
                {stops.slice(0, Math.min(stops.length, 7)).map((s, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-sm transition-colors ${
                      s.status === 'completed'
                        ? 'bg-primary'
                        : s.status === 'skipped'
                        ? 'bg-muted-foreground'
                        : s.idx === stop.idx
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
                {stops.length > 7 && (
                  <span className="text-xs text-muted-foreground ml-1">+{stops.length - 7}</span>
                )}
              </div>
            </div>

            {/* Customer/Location Name */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center">
                  <StopIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight line-clamp-2">
                  {stop.customer_name || stop.location_name || 'Unknown Location'}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {stop.stop_type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Navigation Card */}
        <Card className="border-dashed shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Status Section */}
              <div className="flex-1 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-sm flex items-center justify-center bg-muted">
                    {stop.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : stop.status === 'skipped' ? (
                      <SkipForward className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{stop.status || 'Pending'}</p>
                    {stop.actual_arrival && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(stop.actual_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigate Button */}
              {stop.latitude && stop.longitude && (
                <button
                  onClick={handleNavigate}
                  className="flex flex-col items-center justify-center gap-1 px-6 border-l hover:bg-muted transition-colors"
                >
                  <Navigation className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">Navigate</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Start Visit Card - Show when Pending */}
        {isPending && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-sm bg-primary/10">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ready to start this visit?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the visit to unlock activities
                  </p>
                </div>
                <Button
                  onClick={handleStartVisit}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full max-w-xs"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Start Visit
                </Button>
                <Button
                  onClick={() => setShowSkipDialog(true)}
                  disabled={isProcessing}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip this visit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline - show in readOnly mode when Pending or Finished */}
        {!isPending && (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Visit Activities</h2>
              <p className="text-sm text-muted-foreground">
                {isFinished
                  ? 'Activities completed for this visit'
                  : 'Complete the following steps for this visit'
                }
              </p>
            </div>

            <VisitTimeline
              steps={timelineSteps}
              canCheckOut={requiredStepsCompleted}
              onCheckOut={handleCheckOut}
              isProcessing={isProcessing}
              readOnly={activitiesLocked}
            />
          </>
        )}

        {/* Skip Button - Only show when In Progress (not Pending or Finished) */}
        {isInProgress && canSkip && (
          <Button
            onClick={() => setShowSkipDialog(true)}
            disabled={isProcessing}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip this visit
          </Button>
        )}

        {/* Skip Dialog */}
        <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip Visit</DialogTitle>
              <DialogDescription>
                Please provide a reason for skipping this visit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={skipReason} onValueChange={setSkipReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {skipReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={skipNotes}
                  onChange={(e) => setSkipNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSkip} disabled={!skipReason || isProcessing}>
                Skip Visit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Capture Modal */}
        <VisitPhotoCapture
          open={showPhotoCapture}
          onOpenChange={setShowPhotoCapture}
          onComplete={handlePhotosComplete}
          existingPhotos={capturedPhotos}
          onDeleteExisting={handleDeletePhoto}
          customerName={stop?.customer_name || stop?.location_name}
          minPhotos={0}
          readOnly={activitiesLocked}
        />

        {/* Stock Opname Sheet */}
        <StockOpnameSheet
          open={showStockSheet}
          onOpenChange={setShowStockSheet}
          visitId={stop?.sales_visit}
          customerName={stop?.customer_name || stop?.location_name}
          onComplete={handleStockComplete}
          readOnly={activitiesLocked}
        />

        {/* Payment Collection Sheet */}
        <PaymentCollectionSheet
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
          customerId={stop?.customer || ''}
          customerName={stop?.customer_name || stop?.location_name}
          visitId={stop?.sales_visit}
          onComplete={handlePaymentComplete}
          readOnly={activitiesLocked}
        />

        {/* Sales Order Sheet */}
        <SalesOrderSheet
          open={showOrderSheet}
          onOpenChange={setShowOrderSheet}
          customerId={stop?.customer || ''}
          customerName={stop?.customer_name || stop?.location_name}
          visitId={stop?.sales_visit}
          existingOrderId={orderId || undefined}
          onComplete={handleOrderComplete}
          readOnly={activitiesLocked}
        />

        {/* Competitor Survey Sheet */}
        <CompetitorSurveySheet
          open={showSurveyDialog}
          onOpenChange={setShowSurveyDialog}
          customerId={stop?.customer || ''}
          customerName={stop?.customer_name || stop?.location_name}
          visitId={stop?.sales_visit}
          existingSurveyId={surveyId || undefined}
          onComplete={handleSurveyComplete}
          readOnly={activitiesLocked}
        />
      </Main>
    </>
  )
}
