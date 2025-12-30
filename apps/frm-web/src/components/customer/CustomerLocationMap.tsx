/**
 * Customer Location Map Component
 * Displays GPS location on map with mode-specific behavior
 * Reference: specs/001-sfa-app-build/tasks.md Phase 1
 */

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface CustomerLocationMapProps {
  /** Form mode: create, edit, or view */
  mode: 'create' | 'edit' | 'view'
  /** Current latitude value */
  latitude: number | null
  /** Current longitude value */
  longitude: number | null
  /** Customer name for map popup */
  customerName?: string
  /** Callback when location is captured */
  onLocationCapture?: (lat: number, lng: number) => void
  /** Loading state for location capture */
  isCapturing?: boolean
}

export function CustomerLocationMap({
  mode,
  latitude,
  longitude,
  customerName,
  onLocationCapture,
  isCapturing = false,
}: CustomerLocationMapProps) {
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationCapture?.(position.coords.latitude, position.coords.longitude)
        toast.success('Location captured successfully')
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Failed to capture location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        toast.error(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Check for valid coordinates (not null and not 0,0)
  const hasLocation = latitude !== null && longitude !== null &&
                       latitude !== 0 && longitude !== 0

  return (
    <div className="space-y-4">
      {/* Capture Button (show in create and edit modes) */}
      {mode !== 'view' && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleCaptureLocation}
            disabled={isCapturing}
            variant="outline"
            className="flex-1"
          >
            {isCapturing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                {hasLocation ? 'Re-capture Location' : 'Capture Location'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Location Display and Map */}
      {hasLocation && (
        <div className="space-y-3">
          {/* Coordinates Display */}
          <div className="p-3 bg-accent/50 rounded-md">
            <div className="text-sm text-muted-foreground">Coordinates</div>
            <div className="font-mono text-sm">
              {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
            </div>
            <Badge variant="outline" className="mt-2">
              <MapPin className="h-3 w-3 mr-1" />
              Location {mode === 'view' ? 'Saved' : 'Captured'}
            </Badge>
          </div>

          {/* Map Display */}
          <div className="h-64 rounded-md overflow-hidden border">
            <MapContainer
              center={[latitude!, longitude!]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[latitude!, longitude!]}>
                <Popup>
                  Store Location<br />
                  {customerName || 'Customer'}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* No Location Message (view mode only) */}
      {!hasLocation && mode === 'view' && (
        <div className="p-4 border rounded-md text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No GPS location available</p>
        </div>
      )}
    </div>
  )
}
