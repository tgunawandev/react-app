/**
 * RouteMap Component
 * React Leaflet map showing customers as markers with polyline route
 * Reference: specs/001-sfa-app-build/tasks.md US3-006
 */

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { OptimizedCustomer } from '@/services/route-optimizer'

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

interface RouteMapProps {
  customers: OptimizedCustomer[]
  center?: [number, number]
  zoom?: number
  height?: string
}

export function RouteMap({
  customers,
  center,
  zoom = 13,
  height = '500px'
}: RouteMapProps) {
  // Calculate center if not provided
  const mapCenter: [number, number] = center || calculateCenter(customers)

  // Extract positions for polyline
  const positions: [number, number][] = customers.map((customer) => [
    customer.gps_latitude,
    customer.gps_longitude
  ])

  // Create numbered markers for sequence
  const createNumberedIcon = (number: number) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: #2563eb;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${number}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  }

  useEffect(() => {
    // Clean up on unmount
    return () => {
      // Leaflet cleanup if needed
    }
  }, [])

  if (customers.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <p className="text-muted-foreground">No customers to display on map</p>
      </div>
    )
  }

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer markers */}
        {customers.map((customer) => (
          <Marker
            key={customer.customer}
            position={[customer.gps_latitude, customer.gps_longitude]}
            icon={createNumberedIcon(customer.sequence)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{customer.customer_name}</div>
                <div className="text-xs text-muted-foreground">
                  Stop #{customer.sequence}
                </div>
                {customer.distance_from_previous_km > 0 && (
                  <div className="text-xs mt-1">
                    {customer.distance_from_previous_km.toFixed(2)} km from previous
                  </div>
                )}
                {customer.estimated_arrival_time && (
                  <div className="text-xs">
                    ETA: {customer.estimated_arrival_time}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route polyline */}
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#2563eb',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10'
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}

/**
 * Calculate center point from customers
 */
function calculateCenter(customers: OptimizedCustomer[]): [number, number] {
  if (customers.length === 0) {
    return [0, 0]
  }

  if (customers.length === 1) {
    return [customers[0].gps_latitude, customers[0].gps_longitude]
  }

  const sumLat = customers.reduce((sum, c) => sum + c.gps_latitude, 0)
  const sumLng = customers.reduce((sum, c) => sum + c.gps_longitude, 0)

  return [sumLat / customers.length, sumLng / customers.length]
}
