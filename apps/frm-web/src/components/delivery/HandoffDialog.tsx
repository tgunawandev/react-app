/**
 * HandoffDialog Component
 * Dialog for transferring delivery to another driver at a transit hub
 * Reference: Delivery Tracking System Phase 1 (Cross-Dock MVP)
 */

import { useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  MapPin,
  User,
  Navigation,
  Loader2,
  Building2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useFrappeGetCall } from 'frappe-react-sdk'
import {
  useDeliveryAssignmentMutations,
  useNearbyHubs,
  useTransitHubs,
  type DeliveryForAssignment,
  type TransitHub
} from '@/hooks/useDeliveryAssignment'
import { useGPSCapture } from '@/hooks/useDriverLocation'

interface HandoffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  delivery: DeliveryForAssignment
  onSuccess?: () => void
}

interface DriverOption {
  name: string
  full_name: string
  email: string
}

export default function HandoffDialog({
  open,
  onOpenChange,
  delivery,
  onSuccess
}: HandoffDialogProps) {
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedHub, setSelectedHub] = useState('')
  const [notes, setNotes] = useState('')
  const [useNearby, setUseNearby] = useState(true)

  // GPS capture
  const {
    capture: captureGPS,
    isCapturing,
    latitude: currentLat,
    longitude: currentLon,
    error: gpsError
  } = useGPSCapture()

  // Get nearby hubs based on current location
  const {
    hubs: nearbyHubs,
    isLoading: loadingNearby
  } = useNearbyHubs(currentLat, currentLon, 20)

  // Get all transit hubs (fallback)
  const {
    hubs: allHubs,
    isLoading: loadingHubs
  } = useTransitHubs(undefined, true)

  // Get available drivers
  const { data: driversData, isLoading: loadingDrivers } = useFrappeGetCall<{
    message: DriverOption[]
  }>(
    'frappe.client.get_list',
    {
      doctype: 'User',
      filters: JSON.stringify([
        ['enabled', '=', 1],
        ['user_type', '=', 'System User']
      ]),
      fields: JSON.stringify(['name', 'full_name', 'email']),
      limit_page_length: 50
    },
    'available-drivers',
    { revalidateOnFocus: false }
  )

  const drivers = driversData?.message || []

  // Handoff mutation
  const {
    handoffDelivery,
    isHandingOff,
    error: handoffError
  } = useDeliveryAssignmentMutations()

  // Capture GPS on open
  useEffect(() => {
    if (open && !currentLat) {
      captureGPS({ enableHighAccuracy: true, timeout: 15000 }).catch(() => {
        // GPS error handled by hook
      })
    }
  }, [open, currentLat, captureGPS])

  const displayHubs = useNearby && nearbyHubs.length > 0 ? nearbyHubs : allHubs

  const handleHandoff = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver')
      return
    }

    if (!delivery.current_assignment) {
      toast.error('No active assignment found')
      return
    }

    try {
      await handoffDelivery(
        delivery.current_assignment,
        selectedDriver,
        selectedHub || undefined,
        notes || undefined,
        currentLat,
        currentLon
      )

      toast.success('Delivery handed off successfully')
      onSuccess?.()
      resetForm()
    } catch {
      toast.error('Failed to handoff delivery')
    }
  }

  const resetForm = () => {
    setSelectedDriver('')
    setSelectedHub('')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const getHubTypeIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return <Building2 className="h-4 w-4" />
      case 'cross_dock':
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Handoff Delivery
          </DialogTitle>
          <DialogDescription>
            Transfer this delivery to another driver at a transit hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Delivery info */}
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="text-sm space-y-1">
                <div className="font-medium">{delivery.name}</div>
                <div className="text-muted-foreground">{delivery.customer_name}</div>
                <div className="text-muted-foreground">
                  {delivery.item_count || 0} items
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GPS Status */}
          {(isCapturing || gpsError) && (
            <div className={`p-3 rounded-lg text-sm ${
              gpsError ? 'bg-secondary/5 text-secondary-foreground' : 'bg-muted text-foreground'
            }`}>
              {isCapturing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting your location...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  GPS unavailable. Hub selection may be less accurate.
                </div>
              )}
            </div>
          )}

          {currentLat && currentLon && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Navigation className="h-4 w-4" />
              <span>
                Location: {currentLat.toFixed(5)}, {currentLon.toFixed(5)}
              </span>
            </div>
          )}

          <Separator />

          {/* Driver selection */}
          <div className="space-y-2">
            <Label htmlFor="driver">New Driver *</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger id="driver">
                <SelectValue placeholder={loadingDrivers ? "Loading drivers..." : "Select driver"} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.name} value={driver.name}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{driver.full_name || driver.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hub selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="hub">Transit Hub (Optional)</Label>
              {nearbyHubs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseNearby(!useNearby)}
                  className="h-7 text-xs"
                >
                  {useNearby ? 'Show All' : 'Show Nearby'}
                </Button>
              )}
            </div>
            <Select value={selectedHub} onValueChange={setSelectedHub}>
              <SelectTrigger id="hub">
                <SelectValue placeholder={
                  loadingHubs || loadingNearby
                    ? "Loading hubs..."
                    : "Select transit hub"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground">No hub (direct handoff)</span>
                </SelectItem>
                {displayHubs.map((hub: TransitHub) => (
                  <SelectItem key={hub.name} value={hub.name}>
                    <div className="flex items-center gap-2">
                      {getHubTypeIcon(hub.hub_type)}
                      <div className="flex flex-col">
                        <span>{hub.hub_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {hub.city}
                          {hub.distance_km !== undefined && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {hub.distance_km} km
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Handoff Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes for the receiving driver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error display */}
          {handoffError && (
            <div className="p-3 bg-destructive/5 text-destructive rounded-lg text-sm">
              {handoffError.message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleHandoff}
            disabled={!selectedDriver || isHandingOff}
          >
            {isHandingOff ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Handing off...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Confirm Handoff
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
