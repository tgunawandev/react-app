/**
 * GPSTrailMap Component
 * Displays GPS check-in points on a map with connecting polyline
 * Reference: specs/001-sfa-app-build/tasks.md US2-007
 */

import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react'
import L from 'leaflet'

interface GPSTrailMapProps {
  sales_representative: string
  date: string
  full_name?: string
}

interface GPSPoint {
  timestamp: string
  latitude: number
  longitude: number
  accuracy: number
  customer_name: string
  proximity_validated: boolean
  gps_distance_from_customer_meters: number
  visit_id: string
  status: string
}

// Fix for default marker icons in react-leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
        ">📍</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  })
}

const validIcon = createCustomIcon('#22c55e') // green
const invalidIcon = createCustomIcon('#ef4444') // red

export function GPSTrailMap({ sales_representative, date, full_name }: GPSTrailMapProps) {
  // Fetch GPS trail data
  const { data: trailData, isLoading } = useFrappeGetCall<{ message: any }>(
    'frm.api.dashboard.get_gps_trail',
    {
      sales_representative,
      date
    },
    `gps-trail-${sales_representative}-${date}`,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )

  const trail = trailData?.message?.trail || []
  const summary = trailData?.message?.summary

  // Calculate map bounds and center
  const { center, bounds } = useMemo(() => {
    if (!trail.length) {
      return {
        center: [0, 0] as [number, number],
        bounds: null
      }
    }

    const latitudes = trail.map((p: GPSPoint) => p.latitude)
    const longitudes = trail.map((p: GPSPoint) => p.longitude)

    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)

    return {
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number],
      bounds: [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
    }
  }, [trail])

  // Extract polyline coordinates
  const polylinePositions = useMemo(() => {
    return trail.map((p: GPSPoint) => [p.latitude, p.longitude] as [number, number])
  }, [trail])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GPS Trail Map</CardTitle>
          <CardDescription>Loading GPS trail data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!trail.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GPS Trail Map</CardTitle>
          <CardDescription>
            No GPS trail data available for {full_name || sales_representative} on {date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            GPS trail will appear here once visits are recorded with GPS check-ins.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GPS Trail Map</CardTitle>
        <CardDescription>
          {full_name || sales_representative} - {date}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Visits</div>
              <div className="text-lg font-semibold">{summary.total_visits}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Distance Traveled</div>
              <div className="text-lg font-semibold">{summary.total_distance_km.toFixed(2)} km</div>
            </div>
            <div>
              <div className="text-muted-foreground">Proximity Valid</div>
              <div className="text-lg font-semibold flex items-center gap-1">
                {summary.proximity_validated_count}
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Proximity Invalid</div>
              <div className="text-lg font-semibold flex items-center gap-1">
                {summary.proximity_invalid_count}
                <XCircle className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="h-[500px] rounded-sm overflow-hidden border">
          <MapContainer
            center={center}
            bounds={bounds || undefined}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Polyline connecting all points */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#3b82f6',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5'
              }}
            />

            {/* Markers for each GPS point */}
            {trail.map((point: GPSPoint, index: number) => (
              <div key={`${point.visit_id}-${index}`}>
                <Marker
                  position={[point.latitude, point.longitude]}
                  icon={point.proximity_validated ? validIcon : invalidIcon}
                >
                  <Popup>
                    <div className="space-y-2 text-sm min-w-[200px]">
                      <div className="font-semibold border-b pb-1">
                        {point.customer_name}
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </span>
                      </div>

                      <div className="pt-2 border-t space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className={point.proximity_validated ? 'text-primary font-medium' : 'text-destructive font-medium'}>
                            {point.gps_distance_from_customer_meters}m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Accuracy:</span>
                          <span>{point.accuracy}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="capitalize">{point.status}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <a
                          href={`/app/sales-visit/${point.visit_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          View Visit Details →
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Accuracy circle */}
                <Circle
                  center={[point.latitude, point.longitude]}
                  radius={point.accuracy}
                  pathOptions={{
                    color: point.proximity_validated ? '#22c55e' : '#ef4444',
                    fillColor: point.proximity_validated ? '#22c55e' : '#ef4444',
                    fillOpacity: 0.1,
                    weight: 1,
                    opacity: 0.3
                  }}
                />
              </div>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <span>Proximity Valid (≤100m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive/50"></div>
            <span>Proximity Invalid (&gt;100m)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
