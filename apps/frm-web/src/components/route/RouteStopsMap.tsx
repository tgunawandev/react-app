/**
 * RouteStopsMap Component
 * React Leaflet map showing route stops as markers with polyline
 * Reference: Route-First Architecture Plan
 */

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import type { RouteStop } from '@/types/frm'
import { MapPin, AlertCircle, Phone, Copy, MessageSquare } from 'lucide-react'

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

interface RouteStopsMapProps {
  stops: RouteStop[]
  center?: [number, number]
  zoom?: number
  height?: string
}

// Component to fit bounds when stops change
function FitBounds({ stops }: { stops: RouteStop[] }) {
  const map = useMap()

  useEffect(() => {
    const validStops = stops.filter(
      (s) => s.arrival_latitude && s.arrival_longitude && s.arrival_latitude !== 0 && s.arrival_longitude !== 0
    )

    if (validStops.length > 0) {
      const bounds = L.latLngBounds(
        validStops.map((s) => [s.arrival_latitude!, s.arrival_longitude!] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [stops, map])

  return null
}

// Component for phone actions in popup
function PhoneActions({ customer }: { customer: string }) {
  const [phoneData, setPhoneData] = useState<{ phone?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch phone data when component mounts
    async function fetchPhone() {
      try {
        // This would ideally use Frappe API, but for now we'll use a mock implementation
        // In a real app, you'd call: frappe.call({ method: 'frappe.client.get_value', ... })

        // Mock phone numbers based on customer pattern for demo
        let mockPhone = '+62811-0000-0000'
        if (customer.includes('CPN-')) {
          const suffix = customer.replace('CPN-', '').slice(-4)
          mockPhone = `+62811-${suffix}-1001`
        } else if (customer.includes('BDG-')) {
          const suffix = customer.replace('BDG-', '').slice(-4)
          mockPhone = `+6281${suffix[0]}-${suffix}-2001`
        }

        setPhoneData({ phone: mockPhone })
      } catch (error) {
        console.error('Failed to fetch phone:', error)
      } finally {
        setLoading(false)
      }
    }

    if (customer) {
      fetchPhone()
    }
  }, [customer])

  const handleCopyPhone = () => {
    if (phoneData?.phone) {
      navigator.clipboard.writeText(phoneData.phone)
      // Toast notification would require external library, so we'll use alert
      alert('Phone number copied to clipboard')
    }
  }

  const handleWhatsApp = () => {
    if (phoneData?.phone) {
      const cleanPhone = phoneData.phone.replace(/[^\d+]/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!phoneData?.phone) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 flex-1">
        <Phone className="h-3 w-3 text-muted-foreground" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopyPhone()
          }}
          className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-muted rounded"
          title="Copy phone number"
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
        <span className="text-muted-foreground font-medium">{phoneData.phone}</span>
      </div>
    </div>
  )
}

// Create numbered marker icons with status colors
function createStopIcon(sequence: number, status?: string) {
  const bgColor =
    status === 'completed' ? '#22c55e' :
    status === 'skipped' ? '#eab308' :
    status === 'in_progress' || status === 'arrived' ? '#3b82f6' :
    '#6b7280'

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${sequence}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  })
}

export default function RouteStopsMap({
  stops,
  center,
  zoom = 14,
  height = '400px'
}: RouteStopsMapProps) {
  // Filter stops with valid GPS coordinates
  const validStops = useMemo(() => {
    return stops.filter(
      (s) => s.arrival_latitude && s.arrival_longitude && s.arrival_latitude !== 0 && s.arrival_longitude !== 0
    )
  }, [stops])

  // Calculate center if not provided
  const mapCenter: [number, number] = useMemo(() => {
    if (center) return center

    if (validStops.length === 0) {
      // Default to Jakarta if no valid stops
      return [-6.2088, 106.8456]
    }

    if (validStops.length === 1) {
      return [validStops[0].arrival_latitude!, validStops[0].arrival_longitude!]
    }

    const sumLat = validStops.reduce((sum, s) => sum + s.arrival_latitude!, 0)
    const sumLng = validStops.reduce((sum, s) => sum + s.arrival_longitude!, 0)

    return [sumLat / validStops.length, sumLng / validStops.length]
  }, [validStops, center])

  // Extract positions for polyline
  const positions: [number, number][] = useMemo(() => {
    return validStops.map((stop) => [stop.arrival_latitude!, stop.arrival_longitude!] as [number, number])
  }, [validStops])

  // Show message if no GPS data
  if (validStops.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-muted rounded-lg gap-3"
        style={{ height }}
      >
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-muted-foreground font-medium">No GPS Data Available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Stops don't have GPS coordinates yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to show all stops */}
        <FitBounds stops={validStops} />

        {/* Stop markers */}
        {validStops.map((stop) => (
          <Marker
            key={stop.name || stop.idx}
            position={[stop.arrival_latitude!, stop.arrival_longitude!]}
            icon={createStopIcon(stop.sequence, stop.status)}
          >
            <Popup>
              <div className="text-sm min-w-[220px] space-y-3">
                {/* Header */}
                <div>
                  <div className="font-semibold text-base mb-1">
                    {stop.customer_name || stop.location_name || 'Unknown'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stop #{stop.sequence} · {stop.stop_type}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    stop.status === 'completed' ? 'bg-primary text-primary-foreground' :
                    stop.status === 'skipped' ? 'bg-orange-500 text-white' :
                    stop.status === 'in_progress' ? 'bg-muted text-foreground' :
                    'bg-muted text-foreground'
                  }`}>
                    {stop.status || 'Pending'}
                  </span>
                  {stop.estimated_arrival && (
                    <span className="text-muted-foreground">
                      ETA: {String(stop.estimated_arrival).substring(0, 5)}
                    </span>
                  )}
                </div>

                {/* GPS Coordinates */}
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(`${stop.arrival_latitude}, ${stop.arrival_longitude}`)
                      alert('GPS coordinates copied to clipboard')
                    }}
                    className="text-muted-foreground hover:text-primary transition-colors p-0.5 hover:bg-muted rounded"
                    title="Copy GPS coordinates"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`https://www.google.com/maps?q=${stop.arrival_latitude},${stop.arrival_longitude}`, '_blank')
                    }}
                    className="text-muted-foreground hover:text-blue-600 transition-colors p-0.5 hover:bg-muted rounded"
                    title="Open in Google Maps"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <span className="text-muted-foreground font-mono">
                    {stop.arrival_latitude?.toFixed(4)}, {stop.arrival_longitude?.toFixed(4)}
                  </span>
                </div>

                {/* Phone Actions */}
                {stop.customer && (
                  <div className="border-t pt-2">
                    <PhoneActions customer={stop.customer} />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polyline connecting stops */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#3b82f6',
              weight: 3,
              opacity: 0.7,
              dashArray: '8, 8'
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
