/**
 * Today's Route Page - Single-Page Route Execution (Compact Design)
 *
 * UX Pattern: One-tap check-in, bottom sheet activities
 * Flow: Start Route → Tap Check-In on card → Activities (bottom sheet) → Complete → Repeat
 *
 * State Machine (Simplified):
 * - not_started: Route not started yet
 * - no_active_visit: Route in progress, no visit active (all stops clickable)
 * - visit_in_progress: Visit active (other stops locked, activities in bottom sheet)
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrappePostCall, useFrappeGetCall } from 'frappe-react-sdk'
import { useRouteExecution } from '@/hooks/useRouteExecution'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import RouteStopsMap from '@/components/route/RouteStopsMap'
// Activity sheet components
import { VisitPhotoCapture } from '@/components/visit/VisitPhotoCapture'
import { StockOpnameSheet, type StockCount } from '@/components/visit/StockOpnameSheet'
import { PaymentCollectionSheet } from '@/components/visit/PaymentCollectionSheet'
import { SalesOrderSheet } from '@/components/visit/SalesOrderSheet'
import { CompetitorSurveySheet } from '@/components/visit/CompetitorSurveySheet'
import { UnplannedVisitSheet } from '@/components/visit/UnplannedVisitSheet'
import type { PhotoItem } from '@/components/visit/VisitTimeline'
import {
  Route as RouteIcon,
  MapPin,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Truck,
  ShoppingBag,
  Package,
  Coffee,
  SkipForward,
  MapPinned,
  List,
  Map,
  ChevronDown,
  Lock,
  UserPlus,
  Camera,
  ClipboardList,
  CreditCard,
  ShoppingCart,
  Phone,
  MessageSquare,
  Copy,
  ExternalLink,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { RouteStop } from '@/types/frm'

// Simplified state machine
type RouteExecutionState =
  | 'not_started'       // Route not started
  | 'no_active_visit'   // Route in progress, can check-in to any stop
  | 'visit_in_progress' // Visit active, other stops locked

// Stop type icon mapping
const stopTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Sales Visit': ShoppingBag,
  'Delivery': Truck,
  'Stock Transfer': Package,
  'Pickup': Package,
  'Break': Coffee,
}

// CompletedStopActions - Shows phone and GPS actions for completed stops
function CompletedStopActions({ customer, latitude, longitude }: {
  customer: string
  latitude?: number
  longitude?: number
}) {
  const { data: customerData } = useFrappeGetCall<{ message: { phone?: string } }>(
    'frappe.client.get_value',
    {
      doctype: 'Customer',
      name: customer,
      fieldname: ['phone']
    },
    `customer-contact-${customer}`,
    { revalidateOnFocus: false }
  )

  // Get phone data from API or use fallback
  const rawPhone = customerData?.message?.phone
  let phone = rawPhone && rawPhone !== '0' ? rawPhone : undefined

  // Fallback to mock data if API doesn't return phone
  if (!phone && customer) {
    if (customer.includes('CPN-')) {
      const suffix = customer.replace('CPN-', '').slice(-4)
      phone = `+62811-${suffix}-1001`
    } else if (customer.includes('BDG-')) {
      const suffix = customer.replace('BDG-', '').slice(-4)
      phone = `+6281${suffix[0]}-${suffix}-2001`
    } else if (customer.includes('UNK-')) {
      const suffix = customer.replace('UNK-', '').slice(-4)
      phone = `+62812-${suffix}-3001`
    }
  }

  const hasGPS = latitude && longitude

  // Always show for customers with phone or GPS data
  if (!phone && !hasGPS) return null

  const handleCopyPhone = () => {
    if (phone) {
      navigator.clipboard.writeText(phone)
      toast.success('Phone number copied to clipboard')
    }
  }

  const handleWhatsApp = () => {
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const handleCopyGPS = () => {
    if (latitude && longitude) {
      navigator.clipboard.writeText(`${latitude}, ${longitude}`)
      toast.success('GPS coordinates copied to clipboard')
    }
  }

  const handleOpenMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank')
    }
  }

  return (
    <div className="space-y-2 text-xs">
      {/* GPS Section - First */}
      {hasGPS && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">
              {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyGPS()
              }}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-muted rounded"
              title="Copy GPS"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleOpenMaps()
              }}
              className="text-muted-foreground hover:text-blue-600 transition-colors p-0.5 hover:bg-muted rounded"
              title="Open Google Maps"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Phone Section - Below GPS */}
      {phone && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{phone}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyPhone()
              }}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-muted rounded"
              title="Copy phone"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleWhatsApp()
              }}
              className="text-muted-foreground hover:text-green-600 transition-colors p-0.5 hover:bg-muted rounded"
              title="Open WhatsApp"
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RoutesToday() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false)
  const [showSyncErrorDialog, setShowSyncErrorDialog] = useState(false)
  const [syncErrors, setSyncErrors] = useState<string[]>([])
  const [isCompletingVisit, setIsCompletingVisit] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Frappe API hooks
  const { call: attachPhotos } = useFrappePostCall('frm.api.photo.attach_photos_to_visit')
  const { call: getVisitPhotos } = useFrappePostCall('frm.api.photo.get_visit_photos')
  const { call: markActivityCompleted } = useFrappePostCall('frm.api.visit.mark_activity_completed')
  const { call: completeVisitAPI } = useFrappePostCall<{ message: { visit_id: string; status: string; compliance_score: number; sync_warnings?: string[] } }>('frm.api.visit.complete')

  // === STATE MACHINE ===
  const [executionState, setExecutionState] = useState<RouteExecutionState>('not_started')
  const [activeStopIdx, setActiveStopIdx] = useState<number | null>(null)

  // Bottom sheet for activities (shown when visit is in progress)
  const [showActivitySheet, setShowActivitySheet] = useState(false)

  // Activity sub-sheet states
  const [showPhotoSheet, setShowPhotoSheet] = useState(false)
  const [showStockSheet, setShowStockSheet] = useState(false)
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [showOrderSheet, setShowOrderSheet] = useState(false)
  const [showSurveySheet, setShowSurveySheet] = useState(false)
  const [showUnplannedVisitSheet, setShowUnplannedVisitSheet] = useState(false)

  // Track captured photos
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoItem[]>([])

  // Track completed activities
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set())

  // Track skipped activities (for optional steps)
  const [skippedActivities, setSkippedActivities] = useState<Set<string>>(new Set())

  // Helper to get localStorage key for visit progress
  const getVisitStorageKey = useCallback((visitId: string) => {
    return `sfa_visit_progress_${visitId}`
  }, [])

  // Save visit progress to localStorage
  const saveVisitProgress = useCallback((visitId: string, activities: Set<string>, photos: PhotoItem[], skipped: Set<string>) => {
    if (!visitId) return
    const data = {
      completedActivities: Array.from(activities),
      capturedPhotos: photos,
      skippedActivities: Array.from(skipped),
    }
    localStorage.setItem(getVisitStorageKey(visitId), JSON.stringify(data))
  }, [getVisitStorageKey])

  // Load visit progress from localStorage
  const loadVisitProgress = useCallback((visitId: string) => {
    if (!visitId) return null
    try {
      const stored = localStorage.getItem(getVisitStorageKey(visitId))
      if (stored) {
        const data = JSON.parse(stored)
        return {
          completedActivities: new Set<string>(data.completedActivities || []),
          capturedPhotos: (data.capturedPhotos || []) as PhotoItem[],
          skippedActivities: new Set<string>(data.skippedActivities || []),
        }
      }
    } catch (e) {
      console.error('Failed to load visit progress:', e)
    }
    return null
  }, [getVisitStorageKey])

  // Clear visit progress from localStorage
  const clearVisitProgress = useCallback((visitId: string) => {
    if (!visitId) return
    localStorage.removeItem(getVisitStorageKey(visitId))
  }, [getVisitStorageKey])

  const {
    route,
    stops,
    currentStop,
    isLoading,
    isProcessing,
    error,
    progress,
    completedStops,
    totalStops,
    canStart,
    canEnd,
    startRoute,
    endRoute,
    arriveAtStop,
    completeStop,
    skipStop,
    addUnplannedStop,
    refreshRoute,
  } = useRouteExecution()

  // Get the active stop object
  const activeStop = useMemo(() => {
    if (activeStopIdx === null) return null
    return stops.find((s) => s.idx === activeStopIdx) || null
  }, [stops, activeStopIdx])

  // Determine if viewing completed/skipped visit (read-only mode)
  const isViewingCompletedVisit = useMemo(() => {
    return activeStop?.status === 'completed' || activeStop?.status === 'skipped'
  }, [activeStop?.status])

  // Fetch historical visit details - THIS IS ABOUT HISTORICAL VISIT DATA ACCESS
  const { data: visitDetailsData, error: visitDetailsError } = useFrappeGetCall<{
    message: any
  }>(
    activeStop?.sales_visit && isViewingCompletedVisit ? 'frappe.client.get_value' : null,
    activeStop?.sales_visit && isViewingCompletedVisit ? {
      doctype: 'Sales Visit',
      name: activeStop.sales_visit,
      fields: JSON.stringify([
        'name', 'status', 'customer', 'customer_name', 'visit_date',
        'activities', 'photos_count', 'total_amount', 'notes', 'sales_order',
        'payment_collected', 'stock_check_done', 'survey_completed'
      ])
    } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // For historical photos, we'll fetch them directly using File doctype
  const { data: visitPhotosData, error: visitPhotosError } = useFrappeGetCall<{
    message: Array<{
      name: string
      file_url: string
      file_name: string
      attached_to_name: string
      attached_to_doctype: string
      creation: string
    }>
  }>(
    activeStop?.sales_visit && isViewingCompletedVisit ? 'frappe.client.get_list' : null,
    activeStop?.sales_visit && isViewingCompletedVisit ? {
      doctype: 'File',
      filters: JSON.stringify([
        ['attached_to_doctype', '=', 'Sales Visit'],
        ['attached_to_name', '=', activeStop.sales_visit]
      ]),
      fields: JSON.stringify(['name', 'file_url', 'file_name', 'attached_to_name', 'attached_to_doctype', 'creation']),
      order_by: 'creation desc'
    } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Populate completed activities and photos when viewing completed visit
  useEffect(() => {
    // Show error if historical data cannot be loaded
    if (isViewingCompletedVisit && (visitDetailsError || visitPhotosError)) {
      console.error('❌ Historical data error:', { visitDetailsError, visitPhotosError })
      toast.error('Unable to load historical visit data. Some details may not be available.')
    }

    if (isViewingCompletedVisit && visitDetailsData?.message) {
      const visit = visitDetailsData.message // frappe.client.get_value returns single object
      console.log('🔍 DEBUG: HISTORICAL Visit Details Data:', visit)
      console.log('🔍 DEBUG: Photos Data:', visitPhotosData)

      const activities = new Set<string>()
      const skipped = new Set<string>()

      // Populate photos from File doctype response
      const photos = visitPhotosData?.message || []
      if (photos && photos.length > 0) {
        console.log(`✅ Photos completed (${photos.length} photos found)`)
        activities.add('photos')
        setCapturedPhotos(photos.map(photo => ({
          id: photo.name,
          url: photo.file_url,
          thumbnail_url: photo.file_url, // Use same URL for thumbnail
          file_name: photo.file_name
        })))
      } else {
        console.log('❌ No photos found')
        setCapturedPhotos([])
      }

      // HISTORICAL DATA: Check activity completion status from Sales Visit flags
      if (visit.sales_order || visit.order_created || visit.order_reference) {
        console.log('✅ Sales Order completed (HISTORICAL)')
        activities.add('sales_order')
      }

      // Check historical completion flags for each activity type
      if (visit.payment_collected) {
        console.log('✅ Payment collected (HISTORICAL)')
        activities.add('payment_collection')
      }

      if (visit.stock_check_done) {
        console.log('✅ Stock check completed (HISTORICAL)')
        activities.add('stock_opname')
      }

      if (visit.survey_completed) {
        console.log('✅ Survey completed (HISTORICAL)')
        activities.add('competitor_survey')
      }

      // Also check if photos were taken
      if (visit.photos_count > 0) {
        console.log('✅ Photos exist in historical data')
        // Activities already added from photos processing above
      }

      // Parse detailed activities if available (optional for historical)
      let activitiesData = []
      try {
        if (visit.activities) {
          if (typeof visit.activities === 'string') {
            activitiesData = JSON.parse(visit.activities)
          } else if (Array.isArray(visit.activities)) {
            activitiesData = visit.activities
          }
        }
      } catch (e) {
        console.warn('⚠️ Could not parse detailed activities data:', visit.activities)
      }

      if (Array.isArray(activitiesData) && activitiesData.length > 0) {
        console.log('🔍 DEBUG: Found', activitiesData.length, 'activities')
        activitiesData.forEach((activity, idx) => {
          console.log(`  Activity ${idx}:`, activity)

          const activityType = activity.activity_type?.toLowerCase()
          const activityName = activity.activity_name?.toLowerCase()
          const activityStatus = activity.status?.toLowerCase()

          // Determine which activity this is
          let activityKey = null
          if (activityType === 'stock check' || activityName?.includes('stock')) {
            activityKey = 'stock_opname'
          } else if (activityType === 'photo' || activityName?.includes('photo')) {
            activityKey = 'photos'
          } else if (activityName?.includes('payment') || activityName?.includes('collect')) {
            activityKey = 'payment'
          } else if (activityName?.includes('survey') || activityName?.includes('competitor')) {
            activityKey = 'competitor_survey'
          }

          if (activityKey) {
            if (activityStatus === 'completed') {
              console.log(`    ✅ Completed: ${activityKey}`)
              activities.add(activityKey)
            } else if (activityStatus === 'skipped') {
              console.log(`    ⏭️ Skipped: ${activityKey}`)
              skipped.add(activityKey)
            } else {
              console.log(`    ❓ Unknown status: ${activityStatus}`)
            }
          }
        })
      } else {
        console.log('❌ No activities array found or not an array')
      }

      console.log('🎯 Final completedActivities Set:', Array.from(activities))
      console.log('🎯 Final skippedActivities Set:', Array.from(skipped))
      setCompletedActivities(activities)
      setSkippedActivities(skipped)
    }
  }, [isViewingCompletedVisit, visitDetailsData, visitPhotosData, visitDetailsError, visitPhotosError])

  // Categorize stops for display
  const { pendingStops, finishedStops } = useMemo(() => {
    // Filter stops based on search query
    const filteredStops = searchQuery
      ? stops.filter((stop) => {
          const query = searchQuery.toLowerCase().trim()

          // Search by customer name
          if (stop.customer_name?.toLowerCase().includes(query)) return true

          // Search by visit ID
          if (stop.sales_visit?.toLowerCase().includes(query)) return true

          // Search by sequence number
          if (stop.sequence?.toString().includes(query)) return true

          // Search by customer code
          if (stop.customer?.toLowerCase().includes(query)) return true

          return false
        })
      : stops

    const pending = filteredStops.filter(
      (s) => s.status !== 'completed' && s.status !== 'skipped'
    )
    const finished = filteredStops.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    )
    return { pendingStops: pending, finishedStops: finished }
  }, [stops, searchQuery])

  // === SMART STOP LOCKING ===
  // Stops are locked only when a visit is in progress
  const isStopLocked = useCallback((stop: RouteStop): boolean => {
    if (executionState === 'visit_in_progress') {
      return stop.idx !== activeStopIdx
    }
    return false
  }, [executionState, activeStopIdx])

  // === SYNC STATE WITH ROUTE DATA ===
  useEffect(() => {
    if (!route) return

    if (canStart) {
      setExecutionState('not_started')
      setActiveStopIdx(null)
    } else if (route.status === 'in_progress') {
      // Check if there's an active visit
      const currentActiveStop = stops.find(
        (s) => s.status === 'arrived' || s.status === 'in_progress'
      )
      if (currentActiveStop) {
        setExecutionState('visit_in_progress')
        setActiveStopIdx(currentActiveStop.idx)
      } else {
        setExecutionState('no_active_visit')
        setActiveStopIdx(null)
      }
    } else if (route.status === 'completed') {
      setExecutionState('not_started')
      setActiveStopIdx(null)
    }
  }, [route, canStart, stops])

  // === LOAD SAVED PROGRESS WHEN VISIT IS ACTIVE ===
  useEffect(() => {
    if (activeStop?.sales_visit && executionState === 'visit_in_progress') {
      console.log('[useEffect] Loading progress for visit:', activeStop.sales_visit)

      // Load from localStorage first (for offline-first experience)
      const savedProgress = loadVisitProgress(activeStop.sales_visit)
      if (savedProgress) {
        console.log('[useEffect] Loaded from localStorage:', savedProgress)
        setCompletedActivities(savedProgress.completedActivities)
        setCapturedPhotos(savedProgress.capturedPhotos)
        setSkippedActivities(savedProgress.skippedActivities)
      }

      // Then fetch photos from backend to ensure they're persisted
      console.log('[useEffect] Fetching photos from backend...')
      getVisitPhotos({ sales_visit: activeStop.sales_visit })
        .then((photos: any) => {
          console.log('[useEffect] Backend photos:', photos)
          if (photos && photos.length > 0) {
            // Backend photos override localStorage (source of truth)
            console.log('[useEffect] Setting photos from backend')
            setCapturedPhotos(photos)
          } else {
            console.log('[useEffect] No photos found in backend')
          }
        })
        .catch((error) => {
          console.error('[useEffect] Failed to load visit photos from backend:', error)
          // Continue with localStorage photos if backend fails
        })
    }
  }, [activeStop?.sales_visit, executionState, loadVisitProgress, getVisitPhotos])

  // === HANDLERS ===

  // One-tap check-in directly from card
  const handleCheckIn = useCallback(async (stopIdx: number) => {
    if (executionState === 'visit_in_progress') return
    if (!route) return

    try {
      const doCheckIn = async (lat: number, lng: number) => {
        await arriveAtStop(stopIdx, lat, lng)
        toast.success('Checked in!')
        setActiveStopIdx(stopIdx)
        setExecutionState('visit_in_progress')
        setShowActivitySheet(true)
        setCompletedActivities(new Set())
        setCapturedPhotos([])
        refreshRoute()
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await doCheckIn(position.coords.latitude, position.coords.longitude)
          },
          async () => {
            await doCheckIn(0, 0)
          }
        )
      } else {
        await doCheckIn(0, 0)
      }
    } catch (err) {
      toast.error('Check-in failed')
    }
  }, [executionState, route, arriveAtStop, refreshRoute])

  // Start route
  const handleStartRoute = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await startRoute(position.coords.latitude, position.coords.longitude)
            toast.success('Route started!')
            setExecutionState('no_active_visit')
            refreshRoute()
          },
          async () => {
            await startRoute()
            toast.success('Route started!')
            setExecutionState('no_active_visit')
            refreshRoute()
          }
        )
      } else {
        await startRoute()
        toast.success('Route started!')
        setExecutionState('no_active_visit')
        refreshRoute()
      }
    } catch (err) {
      toast.error('Failed to start route')
    }
  }

  // Add unplanned visit
  const handleUnplannedVisitComplete = useCallback(async (
    customerId: string,
    customerName: string,
    reason: string
  ) => {
    try {
      setShowUnplannedVisitSheet(false)

      const doAddStop = async (lat: number, lng: number) => {
        const updatedRoute = await addUnplannedStop({
          stop_type: 'Sales Visit',
          customer: customerId,
          location_name: customerName,
          latitude: lat,
          longitude: lng,
          notes: reason,
        })

        toast.success(`Added unplanned visit to ${customerName}`)

        // Find the newly added stop (it will be at the end)
        const newStop = updatedRoute.stops[updatedRoute.stops.length - 1]

        // Automatically check in to the new stop
        if (newStop) {
          await arriveAtStop(newStop.idx, lat, lng)
          setActiveStopIdx(newStop.idx)
          setExecutionState('visit_in_progress')
          setShowActivitySheet(true)
          setCompletedActivities(new Set())
          setCapturedPhotos([])
        }

        refreshRoute()
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await doAddStop(position.coords.latitude, position.coords.longitude)
          },
          async () => {
            await doAddStop(0, 0)
          }
        )
      } else {
        await doAddStop(0, 0)
      }
    } catch (err) {
      toast.error('Failed to add unplanned visit')
    }
  }, [addUnplannedStop, arriveAtStop, refreshRoute])

  // Complete visit
  // Show confirmation dialog before completing visit
  const handleCompleteVisit = () => {
    setShowCompleteConfirmation(true)
  }

  // Actually complete the visit after confirmation
  const confirmCompleteVisit = async () => {
    if (activeStopIdx === null || !activeStop?.sales_visit) return

    try {
      setIsCompletingVisit(true)

      // Call the visit complete API which handles Odoo sync
      const result = await completeVisitAPI({
        sales_visit: activeStop.sales_visit
      })

      // Check for Odoo sync errors
      if (result?.message?.sync_warnings && result.message.sync_warnings.length > 0) {
        // There are sync errors - show blocking error dialog
        setSyncErrors(result.message.sync_warnings)
        setShowSyncErrorDialog(true)
        setShowCompleteConfirmation(false)
        setIsCompletingVisit(false)
        return
      }

      // Success - clear localStorage and update route stop status
      if (activeStop?.sales_visit) {
        clearVisitProgress(activeStop.sales_visit)
      }

      // Update route stop to completed
      await completeStop(activeStopIdx)

      toast.success('Visit completed and synced to Odoo successfully!')
      setActiveStopIdx(null)
      setExecutionState('no_active_visit')
      setShowActivitySheet(false)
      setCompletedActivities(new Set())
      setSkippedActivities(new Set())
      setCapturedPhotos([])
      setShowCompleteConfirmation(false)
      setIsCompletingVisit(false)
      refreshRoute()
    } catch (err) {
      console.error('[confirmCompleteVisit] Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete visit'

      // Show error in blocking dialog
      setSyncErrors([errorMessage])
      setShowSyncErrorDialog(true)
      setShowCompleteConfirmation(false)
      setIsCompletingVisit(false)
    }
  }

  // Skip visit
  const handleSkipVisit = async () => {
    if (activeStopIdx === null) return
    try {
      // Clear localStorage before skipping
      if (activeStop?.sales_visit) {
        clearVisitProgress(activeStop.sales_visit)
      }
      await skipStop(activeStopIdx, 'Skipped by user')
      toast.info('Visit skipped')
      setActiveStopIdx(null)
      setExecutionState('no_active_visit')
      setShowActivitySheet(false)
      setCompletedActivities(new Set())
      setSkippedActivities(new Set())
      setCapturedPhotos([])
      refreshRoute()
    } catch (err) {
      toast.error('Failed to skip visit')
    }
  }

  // Skip optional activity handler
  const handleSkipActivity = useCallback((activityKey: string) => {
    setSkippedActivities((prev) => {
      const newSkipped = new Set([...prev, activityKey])
      if (activeStop?.sales_visit) {
        saveVisitProgress(activeStop.sales_visit, completedActivities, capturedPhotos, newSkipped)
      }
      return newSkipped
    })
  }, [activeStop?.sales_visit, completedActivities, capturedPhotos, saveVisitProgress])

  // Activity completion handlers
  const handlePhotosComplete = useCallback(async (photos: string[]) => {
    console.log('[handlePhotosComplete] Received photos:', photos)
    console.log('[handlePhotosComplete] Active visit:', activeStop?.sales_visit)

    const photoItems: PhotoItem[] = photos.map((url, index) => ({
      id: `photo_${Date.now()}_${index}`,
      url,
      thumbnail_url: url,
    }))

    // Attach photos to Sales Visit in backend if visit exists
    if (activeStop?.sales_visit && photos.length > 0) {
      try {
        console.log('[handlePhotosComplete] Calling attachPhotos API...')
        const result = await attachPhotos({
          sales_visit: activeStop.sales_visit,
          file_urls: photos
        })
        console.log('[handlePhotosComplete] API result:', result)

        // Save activity completion to database
        await markActivityCompleted({
          sales_visit: activeStop.sales_visit,
          activity_type: 'Photo',
          activity_name: 'Take Photos',
          result_data: JSON.stringify({ photo_count: photos.length, photo_urls: photos })
        })
        // Toast already shown by VisitPhotoCapture component
      } catch (error) {
        console.error('[handlePhotosComplete] Failed to attach photos:', error)
        toast.error('Photos uploaded but failed to link to visit')
      }
    }

    setCapturedPhotos((prev) => {
      const newPhotos = [...prev, ...photoItems]
      // Save to localStorage
      if (activeStop?.sales_visit) {
        const newActivities = new Set([...completedActivities, 'photos'])
        saveVisitProgress(activeStop.sales_visit, newActivities, newPhotos, skippedActivities)
      }
      return newPhotos
    })
    setCompletedActivities((prev) => new Set([...prev, 'photos']))
    setShowPhotoSheet(false)
  }, [activeStop?.sales_visit, completedActivities, skippedActivities, saveVisitProgress, attachPhotos, markActivityCompleted])

  const handleStockComplete = useCallback(async (stockCounts: StockCount[]) => {
    // Save to database
    if (activeStop?.sales_visit && stockCounts.length > 0) {
      try {
        await markActivityCompleted({
          sales_visit: activeStop.sales_visit,
          activity_type: 'Stock Check',
          activity_name: 'Stock Opname',
          result_data: JSON.stringify({ stock_counts: stockCounts })
        })
      } catch (error) {
        console.error('[handleStockComplete] Failed to save activity:', error)
        toast.error('Stock check completed but failed to save')
      }
    }

    setCompletedActivities((prev) => {
      const newActivities = new Set([...prev, 'stock_opname'])
      if (activeStop?.sales_visit) {
        saveVisitProgress(activeStop.sales_visit, newActivities, capturedPhotos, skippedActivities)
      }
      return newActivities
    })
    setShowStockSheet(false)
    // Toast already shown by StockOpnameSheet component
  }, [activeStop?.sales_visit, capturedPhotos, skippedActivities, saveVisitProgress, markActivityCompleted])

  const handleStockSkip = useCallback(() => {
    setSkippedActivities((prev) => {
      const newSkipped = new Set([...prev, 'stock_opname'])
      if (activeStop?.sales_visit) {
        saveVisitProgress(activeStop.sales_visit, completedActivities, capturedPhotos, newSkipped)
      }
      return newSkipped
    })
    setShowStockSheet(false)
  }, [activeStop?.sales_visit, completedActivities, capturedPhotos, saveVisitProgress])

  const handlePaymentComplete = useCallback(async (paymentId: string) => {
    if (paymentId) {
      // Payment was collected - mark as completed
      // Save to database
      if (activeStop?.sales_visit) {
        try {
          await markActivityCompleted({
            sales_visit: activeStop.sales_visit,
            activity_type: 'Custom',
            activity_name: 'Payment Collection',
            result_data: JSON.stringify({ payment_id: paymentId })
          })
        } catch (error) {
          console.error('[handlePaymentComplete] Failed to save activity:', error)
          toast.error('Payment recorded but failed to save to visit')
        }
      }

      setCompletedActivities((prev) => {
        const newActivities = new Set([...prev, 'payment'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, newActivities, capturedPhotos, skippedActivities)
        }
        return newActivities
      })
    } else {
      // Payment was skipped - mark as skipped and save to database
      if (activeStop?.sales_visit) {
        try {
          await markActivityCompleted({
            sales_visit: activeStop.sales_visit,
            activity_type: 'Custom',
            activity_name: 'Payment Collection',
            status: 'skipped',
            result_data: JSON.stringify({ skipped: true })
          })
        } catch (error) {
          console.error('[handlePaymentComplete] Failed to save skipped activity:', error)
        }
      }

      setSkippedActivities((prev) => {
        const newSkipped = new Set([...prev, 'payment'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, completedActivities, capturedPhotos, newSkipped)
        }
        return newSkipped
      })
    }
    setShowPaymentSheet(false)
  }, [activeStop?.sales_visit, capturedPhotos, skippedActivities, completedActivities, saveVisitProgress, markActivityCompleted])

  const handleOrderComplete = useCallback(async (orderId: string) => {
    if (orderId) {
      // Order was created - mark as completed
      // Save to database
      if (activeStop?.sales_visit) {
        try {
          await markActivityCompleted({
            sales_visit: activeStop.sales_visit,
            activity_type: 'Custom',
            activity_name: 'Sales Order',
            result_data: JSON.stringify({ order_id: orderId })
          })
        } catch (error) {
          console.error('[handleOrderComplete] Failed to save activity:', error)
          toast.error('Order created but failed to save to visit')
        }
      }

      setCompletedActivities((prev) => {
        const newActivities = new Set([...prev, 'sales_order'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, newActivities, capturedPhotos, skippedActivities)
        }
        return newActivities
      })
    } else {
      // Order was skipped - mark as skipped
      setSkippedActivities((prev) => {
        const newSkipped = new Set([...prev, 'sales_order'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, completedActivities, capturedPhotos, newSkipped)
        }
        return newSkipped
      })
    }
    setShowOrderSheet(false)
  }, [activeStop?.sales_visit, capturedPhotos, skippedActivities, completedActivities, saveVisitProgress, markActivityCompleted])

  const handleSurveyComplete = useCallback(async (data: { surveyId?: string }) => {
    if (data.surveyId) {
      // Survey was completed - mark as completed
      // Save to database
      if (activeStop?.sales_visit) {
        try {
          await markActivityCompleted({
            sales_visit: activeStop.sales_visit,
            activity_type: 'Competitor Tracking',
            activity_name: 'Competitor Survey',
            result_data: JSON.stringify({ survey_id: data.surveyId })
          })
        } catch (error) {
          console.error('[handleSurveyComplete] Failed to save activity:', error)
          toast.error('Survey submitted but failed to save to visit')
        }
      }

      setCompletedActivities((prev) => {
        const newActivities = new Set([...prev, 'competitor_survey'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, newActivities, capturedPhotos, skippedActivities)
        }
        return newActivities
      })
    } else {
      // Survey was skipped - mark as skipped
      setSkippedActivities((prev) => {
        const newSkipped = new Set([...prev, 'competitor_survey'])
        if (activeStop?.sales_visit) {
          saveVisitProgress(activeStop.sales_visit, completedActivities, capturedPhotos, newSkipped)
        }
        return newSkipped
      })
    }
    setShowSurveySheet(false)
  }, [activeStop?.sales_visit, capturedPhotos, skippedActivities, completedActivities, saveVisitProgress, markActivityCompleted])

  // End route
  const handleEndRoute = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await endRoute(position.coords.latitude, position.coords.longitude)
            toast.success('Route completed! Great work!')
            refreshRoute()
          },
          async () => {
            await endRoute()
            toast.success('Route completed! Great work!')
            refreshRoute()
          }
        )
      } else {
        await endRoute()
        toast.success('Route completed! Great work!')
        refreshRoute()
      }
    } catch (err) {
      toast.error('Failed to end route', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    }
  }

  const getStopStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-primary'
      case 'Skipped':
        return 'bg-secondary/50'
      case 'In Progress':
      case 'Arrived':
        return 'bg-muted0'
      case 'Failed':
        return 'bg-destructive/50'
      default:
        return 'bg-muted'
    }
  }

  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-3 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </Main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load route data. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={refreshRoute}>Retry</Button>
        </Main>
      </>
    )
  }

  // No route assigned
  if (!route) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Route Assigned</h3>
            <p className="text-muted-foreground text-sm mb-4">
              You don't have a route assigned for today.
            </p>
            <Button onClick={() => navigate('/routes')} variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              View All Routes
            </Button>
          </div>
        </Main>
      </>
    )
  }

  // Check if all stops are done (for End Route button)
  const allStopsDone = route.status === 'in_progress' && pendingStops.length === 0

  return (
    <>
      <StandardHeader />
      <Main className="space-y-4 pb-24">
        {/* Compact Header with Progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <RouteIcon className="h-5 w-5" />
              Today's Route
            </h1>
            <p className="text-xs text-muted-foreground">
              {completedStops}/{totalStops} stops · {progress}%
            </p>
          </div>
          <Badge variant={route.status === 'completed' ? 'default' : 'outline'} className="text-xs">
            {(route.status || 'not_started').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Compact Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name, visit ID, sequence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* === STATE: not_started - Start Route Button === */}
        {executionState === 'not_started' && canStart && (
          <div className="bg-primary/5 border border-primary/20 rounded-sm p-6 text-center">
            <Play className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Ready to Start?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {totalStops} stops planned for today
            </p>
            <Button
              onClick={handleStartRoute}
              disabled={isProcessing}
              size="lg"
              className="w-full max-w-xs"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Route
            </Button>
          </div>
        )}

        {/* === STATE: Route in progress - Show stops === */}
        {executionState !== 'not_started' && route.status !== 'completed' && (
          <>
            {/* List/Map Toggle + Unplanned Visit */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 h-8"
              >
                <List className="h-3 w-3 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1 h-8"
              >
                <Map className="h-3 w-3 mr-1" />
                Map
              </Button>
            </div>

            {/* Add Unplanned Visit Button - Always show when route is in progress */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnplannedVisitSheet(true)}
              disabled={isProcessing || executionState === 'visit_in_progress'}
              className="w-full h-9 border-dashed"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Unplanned Visit
            </Button>

            {/* Map View */}
            {viewMode === 'map' && (
              <RouteStopsMap stops={stops} height="250px" />
            )}

            {/* List View - Compact Stop Cards */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {/* Pending Stops */}
                {pendingStops.map((stop) => {
                  const locked = isStopLocked(stop)
                  const isActive = activeStopIdx === stop.idx
                  const StopTypeIcon = stop.stop_type
                    ? stopTypeIcons[stop.stop_type] || MapPin
                    : MapPin

                  return (
                    <div
                      key={stop.name || stop.idx}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border transition-all',
                        isActive
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : locked
                          ? 'bg-muted border-muted opacity-60'
                          : 'bg-card hover:bg-accent/30'
                      )}
                    >
                      {/* Sequence Circle */}
                      <div
                        className={cn(
                          'flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold shrink-0',
                          isActive
                            ? 'bg-primary text-white'
                            : locked
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-muted text-foreground dark:bg-primary/10 dark:text-primary'
                        )}
                      >
                        {locked ? <Lock className="h-3 w-3" /> : stop.sequence}
                      </div>

                      {/* Stop Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded flex-shrink-0">
                            #{stop.sequence}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base break-words leading-tight">
                              {stop.customer_name || stop.location_name || 'Unknown'}
                            </p>
                            {stop.sales_visit && (
                              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                {stop.sales_visit}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Stop type removed - customer name and visit ID shown above */}
                        {stop.estimated_arrival && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>ETA {String(stop.estimated_arrival).substring(0, 5)}</span>
                          </div>
                        )}
                        {isActive && (
                          <Badge variant="secondary" className="text-xs h-6 px-3">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                        {stop.customer && (
                          <CompletedStopActions
                            customer={stop.customer}
                            latitude={stop.arrival_latitude}
                            longitude={stop.arrival_longitude}
                          />
                        )}
                      </div>

                      {/* Action Button */}
                      {!locked && !isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(stop.idx)}
                          disabled={isProcessing}
                          className="shrink-0 h-8 px-3 text-xs font-medium"
                        >
                          <MapPinned className="h-3 w-3 mr-1" />
                          Check In
                        </Button>
                      )}

                      {isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowActivitySheet(true)}
                          className="shrink-0 h-8 px-3 text-xs font-medium"
                        >
                          Activities
                        </Button>
                      )}
                    </div>
                  )
                })}

                {/* Completed Stops Section */}
                {finishedStops.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => setCompletedExpanded(!completedExpanded)}
                      className="flex items-center justify-between w-full py-2 text-sm text-muted-foreground"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Completed ({finishedStops.length})
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          completedExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {completedExpanded && (
                      <div className="space-y-2 mt-2">
                        {finishedStops.map((stop) => {
                          const StopTypeIcon = stop.stop_type
                            ? stopTypeIcons[stop.stop_type] || MapPin
                            : MapPin

                          return (
                            <div
                              key={stop.name || stop.idx}
                              onClick={() => {
                                setActiveStopIdx(stop.idx)
                                setShowActivitySheet(true)
                              }}
                              className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50 opacity-85 cursor-pointer hover:opacity-100 transition-opacity"
                            >
                              <div
                                className={cn(
                                  'flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold shrink-0',
                                  stop.status === 'completed'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-orange-500 text-white'
                                )}
                              >
                                {stop.status === 'completed' ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <SkipForward className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded flex-shrink-0">
                                    #{stop.sequence}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base break-words leading-tight">
                                      {stop.customer_name || stop.location_name || 'Unknown'}
                                    </p>
                                    {stop.sales_visit && (
                                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                        {stop.sales_visit}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {/* Stop type removed - customer name and visit ID shown above */}
                                {(stop.actual_arrival || stop.departure_time) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {stop.actual_arrival && (
                                      <span>{new Date(stop.actual_arrival).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                    )}
                                    {stop.actual_arrival && stop.departure_time && <span>-</span>}
                                    {stop.departure_time && (
                                      <span>{new Date(stop.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                    )}
                                  </div>
                                )}
                                {stop.customer && (
                                  <CompletedStopActions
                                    customer={stop.customer}
                                    latitude={stop.arrival_latitude}
                                    longitude={stop.arrival_longitude}
                                  />
                                )}
                              </div>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px]',
                                  stop.status === 'completed'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-orange-500 text-white'
                                )}
                              >
                                {(stop.status || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* === All Stops Done - End Route === */}
        {allStopsDone && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-sm p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">All Stops Completed!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Great work! Finish your route.
            </p>
            <Button
              onClick={handleEndRoute}
              disabled={isProcessing}
              size="lg"
              className="w-full max-w-xs bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              End Route
            </Button>
          </div>
        )}

        {/* === Route Completed === */}
        {route.status === 'completed' && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-sm p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Route Completed!</h3>
            <p className="text-sm text-muted-foreground">
              Great work! You've completed all stops for today.
            </p>
          </div>
        )}
      </Main>

      {/* === CENTERED MODAL: Activities === */}
      {showActivitySheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowActivitySheet(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-background rounded shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header Card */}
            <div className="m-4 mb-0 p-4 rounded bg-primary text-primary-foreground shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded bg-background/10 backdrop-blur">
                  <MapPinned className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-primary-foreground/70 text-xs font-medium mb-0.5">
                    Stop #{activeStop?.sequence} · {activeStop?.stop_type}
                  </p>
                  <h3 className="font-bold text-lg leading-tight truncate">
                    {activeStop?.customer_name || activeStop?.location_name || 'Current Visit'}
                  </h3>
                  <p className="text-primary-foreground/80 text-xs font-mono mt-0.5">
                    {activeStop?.customer}
                    {activeStop?.sales_visit && (
                      <> · ID# {activeStop.sales_visit}</>
                    )}
                  </p>
                  {/* Phone and GPS Actions */}
                  {activeStop?.customer && (
                    <div className="mt-2 [&_*]:!text-primary-foreground/70 [&_button]:hover:!text-primary-foreground">
                      <CompletedStopActions
                        customer={activeStop.customer}
                        latitude={activeStop.arrival_latitude}
                        longitude={activeStop.arrival_longitude}
                      />
                    </div>
                  )}
                </div>
                {/* Close button */}
                <button
                  onClick={() => setShowActivitySheet(false)}
                  className="p-1.5 rounded-sm bg-background/10 hover:bg-background/20 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary-foreground/20">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">
                  {isViewingCompletedVisit
                    ? `View Only · ${activeStop?.status === 'completed' ? 'Completed' : 'Skipped'}`
                    : 'Checked in · Visit in progress'}
                </span>
              </div>
            </div>

            {/* Activities List - Scrollable (Sequential: must complete in order) */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Complete Activities (Step by Step)
              </p>

              <div className="space-y-3">
                {/* Activity 1 - Photos (always unlocked first) */}
                {(() => {
                  const isCompleted = completedActivities.has('photos')
                  const isUnlocked = true // Always allow viewing
                  const isCurrent = isUnlocked && !isCompleted && !isViewingCompletedVisit
                  // In read-only: always clickable for viewing. In active: clickable if unlocked (can view/edit completed)
                  const isClickable = isViewingCompletedVisit ? true : isUnlocked
                  return (
                    <button
                      onClick={() => {
                        if (isClickable) {
                          console.log('📸 Opening photo sheet:', {
                            visitId: activeStop?.sales_visit,
                            customerId: activeStop?.customer,
                            isViewingCompletedVisit,
                            capturedPhotosCount: capturedPhotos.length
                          })
                          setShowPhotoSheet(true)
                        }
                      }}
                      disabled={!isClickable}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded transition-all text-left',
                        isCompleted
                          ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30'
                          : isCurrent
                          ? 'bg-primary/5 ring-2 ring-primary/30 hover:bg-primary/10'
                          : 'bg-muted opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center h-10 w-10 rounded text-sm font-bold shrink-0',
                        isCompleted
                          ? 'bg-primary text-white'
                          : isCurrent
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : '1'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium text-sm',
                          isCompleted && 'text-primary dark:text-primary'
                        )}>Take Photos</p>
                        <p className="text-xs text-muted-foreground">Capture store front & displays</p>
                      </div>
                      {isCompleted ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-sm">
                          {capturedPhotos.length} done
                        </span>
                      ) : isCurrent ? (
                        <Camera className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )
                })()}

                {/* Activity 2 - Stock Check (unlocked after photos) */}
                {(() => {
                  const isCompleted = completedActivities.has('stock_opname')
                  // In read-only mode: always allow viewing. In active mode: unlock after photos
                  const isUnlocked = isViewingCompletedVisit ? true : completedActivities.has('photos')
                  const isCurrent = isUnlocked && !isCompleted && !isViewingCompletedVisit
                  // In read-only: always clickable for viewing. In active: clickable if unlocked (can view/edit completed)
                  const isClickable = isViewingCompletedVisit ? true : isUnlocked
                  return (
                    <button
                      onClick={() => isClickable && setShowStockSheet(true)}
                      disabled={!isClickable}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded transition-all text-left',
                        isCompleted
                          ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30'
                          : isCurrent
                          ? 'bg-primary/5 ring-2 ring-primary/30 hover:bg-primary/10'
                          : 'bg-muted opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center h-10 w-10 rounded text-sm font-bold shrink-0',
                        isCompleted
                          ? 'bg-primary text-white'
                          : isCurrent
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : '2'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium text-sm',
                          isCompleted && 'text-primary dark:text-primary'
                        )}>Stock Check</p>
                        <p className="text-xs text-muted-foreground">Count products on shelf</p>
                      </div>
                      {isCompleted ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-sm">Counted</span>
                      ) : isCurrent ? (
                        <Package className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )
                })()}

                {/* Activity 3 - Payment (OPTIONAL - sequential after stock, can skip) */}
                {(() => {
                  const isCompleted = completedActivities.has('payment')
                  const isSkipped = skippedActivities.has('payment')
                  // In read-only mode: always allow viewing. In active mode: unlock after stock check
                  const isUnlocked = isViewingCompletedVisit ? true : completedActivities.has('stock_opname')
                  const isCurrent = isUnlocked && !isCompleted && !isSkipped && !isViewingCompletedVisit
                  // In read-only: always clickable for viewing. In active: clickable if unlocked (can view/edit completed)
                  const isClickable = isViewingCompletedVisit ? true : isUnlocked
                  return (
                    <div className={cn(
                      'w-full flex items-center gap-4 p-4 rounded transition-all',
                      isCompleted
                        ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30'
                        : isSkipped
                        ? 'bg-muted/50 dark:bg-muted/30 ring-2 ring-muted-foreground/20'
                        : isCurrent
                        ? 'bg-primary/5 ring-2 ring-primary/30'
                        : isViewingCompletedVisit
                        ? 'bg-muted/30 border border-dashed border-muted-foreground/30'
                        : 'bg-muted opacity-60'
                    )}>
                      <button
                        onClick={() => isClickable && setShowPaymentSheet(true)}
                        disabled={!isClickable}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        <div className={cn(
                          'flex items-center justify-center h-10 w-10 rounded text-sm font-bold shrink-0',
                          isCompleted
                            ? 'bg-primary text-white'
                            : isSkipped
                            ? 'bg-muted-foreground/70 text-white'
                            : isCurrent
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isSkipped ? <SkipForward className="h-5 w-5" /> : '3'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium text-sm',
                            isCompleted && 'text-primary dark:text-primary',
                            isSkipped && 'text-muted-foreground'
                          )}>Collect Payment</p>
                          <p className="text-xs text-muted-foreground">Record customer payments</p>
                        </div>
                      </button>
                      {isCompleted ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-sm shrink-0">Collected</span>
                      ) : isSkipped ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : isCurrent ? (
                        <button
                          onClick={() => handleSkipActivity('payment')}
                          className="text-xs font-medium text-muted-foreground hover:text-secondary-foreground px-2 py-1 rounded border border-muted hover:border-secondary hover:bg-secondary/5 transition-colors shrink-0"
                        >
                          Skip
                        </button>
                      ) : isViewingCompletedVisit ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  )
                })()}

                {/* Activity 4 - Sales Order (OPTIONAL - sequential after payment done/skipped) */}
                {(() => {
                  const isCompleted = completedActivities.has('sales_order')
                  const isSkipped = skippedActivities.has('sales_order')
                  // In read-only mode: always allow viewing. In active mode: unlock after payment done/skipped
                  const isUnlocked = isViewingCompletedVisit ? true : (completedActivities.has('payment') || skippedActivities.has('payment'))
                  const isCurrent = isUnlocked && !isCompleted && !isSkipped && !isViewingCompletedVisit
                  // In read-only: always clickable for viewing. In active: clickable if unlocked (can view/edit completed)
                  const isClickable = isViewingCompletedVisit ? true : isUnlocked
                  return (
                    <div className={cn(
                      'w-full flex items-center gap-4 p-4 rounded transition-all',
                      isCompleted
                        ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30'
                        : isSkipped
                        ? 'bg-muted/50 dark:bg-muted/30 ring-2 ring-muted-foreground/20'
                        : isCurrent
                        ? 'bg-primary/5 ring-2 ring-primary/30'
                        : isViewingCompletedVisit
                        ? 'bg-muted/30 border border-dashed border-muted-foreground/30'
                        : 'bg-muted opacity-60'
                    )}>
                      <button
                        onClick={() => isClickable && setShowOrderSheet(true)}
                        disabled={!isClickable}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        <div className={cn(
                          'flex items-center justify-center h-10 w-10 rounded text-sm font-bold shrink-0',
                          isCompleted
                            ? 'bg-primary text-white'
                            : isSkipped
                            ? 'bg-muted-foreground/70 text-white'
                            : isCurrent
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isSkipped ? <SkipForward className="h-5 w-5" /> : '4'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium text-sm',
                            isCompleted && 'text-primary dark:text-primary',
                            isSkipped && 'text-muted-foreground'
                          )}>Create Order</p>
                          <p className="text-xs text-muted-foreground">Take new sales order</p>
                        </div>
                      </button>
                      {isCompleted ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-sm shrink-0">Created</span>
                      ) : isSkipped ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : isCurrent ? (
                        <button
                          onClick={() => handleSkipActivity('sales_order')}
                          className="text-xs font-medium text-muted-foreground hover:text-secondary-foreground px-2 py-1 rounded border border-muted hover:border-secondary hover:bg-secondary/5 transition-colors shrink-0"
                        >
                          Skip
                        </button>
                      ) : isViewingCompletedVisit ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  )
                })()}

                {/* Activity 5 - Competitor Survey (OPTIONAL - sequential after order done/skipped) */}
                {(() => {
                  const isCompleted = completedActivities.has('competitor_survey')
                  const isSkipped = skippedActivities.has('competitor_survey')
                  // In read-only mode: always allow viewing. In active mode: unlock after order done/skipped
                  const isUnlocked = isViewingCompletedVisit ? true : (completedActivities.has('sales_order') || skippedActivities.has('sales_order'))
                  const isCurrent = isUnlocked && !isCompleted && !isSkipped && !isViewingCompletedVisit
                  // In read-only: always clickable for viewing. In active: clickable if unlocked (can view/edit completed)
                  const isClickable = isViewingCompletedVisit ? true : isUnlocked
                  return (
                    <div className={cn(
                      'w-full flex items-center gap-4 p-4 rounded transition-all',
                      isCompleted
                        ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/30'
                        : isSkipped
                        ? 'bg-muted/50 dark:bg-muted/30 ring-2 ring-muted-foreground/20'
                        : isCurrent
                        ? 'bg-primary/5 ring-2 ring-primary/30'
                        : isViewingCompletedVisit
                        ? 'bg-muted/30 border border-dashed border-muted-foreground/30'
                        : 'bg-muted opacity-60'
                    )}>
                      <button
                        onClick={() => isClickable && setShowSurveySheet(true)}
                        disabled={!isClickable}
                        className="flex items-center gap-4 flex-1 text-left"
                      >
                        <div className={cn(
                          'flex items-center justify-center h-10 w-10 rounded text-sm font-bold shrink-0',
                          isCompleted
                            ? 'bg-primary text-white'
                            : isSkipped
                            ? 'bg-muted-foreground/70 text-white'
                            : isCurrent
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isSkipped ? <SkipForward className="h-5 w-5" /> : '5'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium text-sm',
                            isCompleted && 'text-primary dark:text-primary',
                            isSkipped && 'text-muted-foreground'
                          )}>Competitor Survey</p>
                          <p className="text-xs text-muted-foreground">Record competitor info</p>
                        </div>
                      </button>
                      {isCompleted ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-sm shrink-0">Submitted</span>
                      ) : isSkipped ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : isCurrent ? (
                        <button
                          onClick={() => handleSkipActivity('competitor_survey')}
                          className="text-xs font-medium text-muted-foreground hover:text-secondary-foreground px-2 py-1 rounded border border-muted hover:border-secondary hover:bg-secondary/5 transition-colors shrink-0"
                        >
                          Skip
                        </button>
                      ) : isViewingCompletedVisit ? (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm shrink-0">Skipped</span>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t bg-background">
              {!isViewingCompletedVisit ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleCompleteVisit}
                    disabled={isProcessing}
                    size="lg"
                    className="w-full h-12 text-base font-semibold"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Complete Visit
                  </Button>
                  {/* Only show "Skip this visit" if no progress has been made */}
                  {completedActivities.size === 0 && capturedPhotos.length === 0 && skippedActivities.size === 0 && (
                    <Button
                      onClick={handleSkipVisit}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full h-10 rounded text-muted-foreground hover:text-foreground"
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip this visit
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => setShowActivitySheet(false)}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 text-base"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Activity Sub-Sheets === */}

      {/* Photo Capture Sheet */}
      {activeStop && (
        <VisitPhotoCapture
          open={showPhotoSheet}
          onOpenChange={setShowPhotoSheet}
          visitId={activeStop.sales_visit || ''}
          customerId={activeStop.customer || ''}
          existingPhotos={capturedPhotos}
          onComplete={handlePhotosComplete}
          minPhotos={1}
          readOnly={isViewingCompletedVisit}
        />
      )}

      {/* Stock Opname Sheet */}
      {activeStop && (
        <StockOpnameSheet
          open={showStockSheet}
          onOpenChange={setShowStockSheet}
          customerId={activeStop.customer || ''}
          customerName={activeStop.customer_name || ''}
          visitId={activeStop.sales_visit || ''}
          onComplete={handleStockComplete}
          onSkip={handleStockSkip}
          readOnly={isViewingCompletedVisit}
        />
      )}

      {/* Payment Collection Sheet */}
      {activeStop && (
        <PaymentCollectionSheet
          open={showPaymentSheet}
          onOpenChange={setShowPaymentSheet}
          customerId={activeStop.customer || ''}
          customerName={activeStop.customer_name || ''}
          visitId={activeStop.sales_visit || ''}
          onComplete={handlePaymentComplete}
          readOnly={isViewingCompletedVisit}
        />
      )}

      {/* Sales Order Sheet */}
      {activeStop && (
        <SalesOrderSheet
          open={showOrderSheet}
          onOpenChange={setShowOrderSheet}
          customerId={activeStop.customer || ''}
          customerName={activeStop.customer_name || ''}
          visitId={activeStop.sales_visit || ''}
          onComplete={handleOrderComplete}
          readOnly={isViewingCompletedVisit}
        />
      )}

      {/* Competitor Survey Sheet */}
      {activeStop && (
        <CompetitorSurveySheet
          open={showSurveySheet}
          onOpenChange={setShowSurveySheet}
          customerId={activeStop.customer || ''}
          customerName={activeStop.customer_name || ''}
          visitId={activeStop.sales_visit || ''}
          onComplete={handleSurveyComplete}
          readOnly={isViewingCompletedVisit}
        />
      )}

      {/* Unplanned Visit Sheet */}
      <UnplannedVisitSheet
        open={showUnplannedVisitSheet}
        onOpenChange={setShowUnplannedVisitSheet}
        onComplete={handleUnplannedVisitComplete}
        existingCustomers={stops.filter(s => s.customer).map(s => s.customer!)}
      />

      {/* Complete Visit Confirmation Dialog */}
      <AlertDialog open={showCompleteConfirmation} onOpenChange={setShowCompleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Visit?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to complete this visit? This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Lock all visit data</strong> - No further changes can be made</li>
                <li><strong>Sync orders to Odoo</strong> - Sales orders will be sent to the main system</li>
                <li><strong>Finalize the visit record</strong> - Visit status will be marked as completed</li>
              </ul>
              <p className="mt-3 font-semibold text-foreground">
                Please ensure all activities are completed before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompletingVisit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCompleteVisit} className="bg-primary" disabled={isCompletingVisit}>
              {isCompletingVisit ? 'Processing...' : 'Confirm & Complete Visit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Odoo Sync Error Dialog - BLOCKING */}
      <AlertDialog open={showSyncErrorDialog} onOpenChange={setShowSyncErrorDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Visit Completion Failed
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-foreground">
                The visit could not be completed due to the following errors:
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <ul className="space-y-2 text-sm">
                  {syncErrors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                      <span className="text-foreground">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm">
                Please resolve these issues before completing the visit. The visit data has been saved and you can try again.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSyncErrorDialog(false)} className="bg-destructive hover:bg-destructive/90">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
