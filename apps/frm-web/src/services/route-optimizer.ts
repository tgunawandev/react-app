/**
 * Route Optimization Service
 * Nearest Neighbor algorithm for route optimization
 * Reference: specs/001-sfa-app-build/tasks.md US3-001
 */

export interface CustomerLocation {
  customer: string
  customer_name: string
  gps_latitude: number
  gps_longitude: number
  [key: string]: any
}

export interface OptimizedCustomer extends CustomerLocation {
  sequence: number
  distance_from_previous_km: number
  estimated_arrival_time?: string
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Starting latitude
 * @param lon1 Starting longitude
 * @param lat2 Ending latitude
 * @param lon2 Ending longitude
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371.0

  // Convert degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180
  const lon1Rad = (lon1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180
  const lon2Rad = (lon2 * Math.PI) / 180

  // Differences
  const dlat = lat2Rad - lat1Rad
  const dlon = lon2Rad - lon1Rad

  // Haversine formula
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Nearest Neighbor algorithm for route optimization
 * Time Complexity: O(n²)
 * Approximation Ratio: ~1.25x optimal (25% longer than perfect route)
 *
 * @param customers Array of customers with GPS coordinates
 * @param startPoint Optional starting point with gps_latitude, gps_longitude
 * @returns Optimized sequence of customers with distances
 */
export function nearestNeighbor(
  customers: CustomerLocation[],
  startPoint?: { gps_latitude: number; gps_longitude: number }
): OptimizedCustomer[] {
  if (customers.length === 0) {
    return []
  }

  const unvisited = [...customers]
  const route: OptimizedCustomer[] = []

  // Start from provided location or first customer
  let current: { gps_latitude: number; gps_longitude: number }
  if (startPoint) {
    current = startPoint
  } else {
    current = unvisited[0]
    unvisited.splice(0, 1)
  }

  let sequence = 1

  while (unvisited.length > 0) {
    // Find nearest unvisited customer
    let nearestIndex = 0
    let minDistance = haversineDistance(
      current.gps_latitude,
      current.gps_longitude,
      unvisited[0].gps_latitude,
      unvisited[0].gps_longitude
    )

    for (let i = 1; i < unvisited.length; i++) {
      const distance = haversineDistance(
        current.gps_latitude,
        current.gps_longitude,
        unvisited[i].gps_latitude,
        unvisited[i].gps_longitude
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    // Add to route
    const nearest = unvisited[nearestIndex]
    const routeItem: OptimizedCustomer = {
      ...nearest,
      sequence,
      distance_from_previous_km: Math.round(minDistance * 100) / 100
    }
    route.push(routeItem)

    // Remove from unvisited, update current
    unvisited.splice(nearestIndex, 1)
    current = nearest
    sequence++
  }

  return route
}

/**
 * Calculate total distance for a route
 * @param route Array of customers with distance_from_previous_km
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(route: OptimizedCustomer[]): number {
  return route.reduce((sum, item) => sum + item.distance_from_previous_km, 0)
}

/**
 * Calculate estimated arrival times for route
 * @param route Optimized route
 * @param startTime Start time (default: 08:00)
 * @returns Route with estimated arrival times
 */
export function calculateArrivalTimes(
  route: OptimizedCustomer[],
  startTime: Date = new Date()
): OptimizedCustomer[] {
  if (route.length === 0) return route

  // Set default start time to 08:00 if not provided
  const start = new Date(startTime)
  if (start.getHours() === 0 && start.getMinutes() === 0) {
    start.setHours(8, 0, 0, 0)
  }

  let cumulativeMinutes = 0

  return route.map((item, index) => {
    if (index > 0) {
      // Add travel time (15 min/km) + previous visit time (30 min)
      const travelMinutes = route[index - 1].distance_from_previous_km * 15
      cumulativeMinutes += travelMinutes + 30
    }

    const arrivalTime = new Date(start.getTime() + cumulativeMinutes * 60000)
    const hours = arrivalTime.getHours().toString().padStart(2, '0')
    const minutes = arrivalTime.getMinutes().toString().padStart(2, '0')

    return {
      ...item,
      estimated_arrival_time: `${hours}:${minutes}:00`
    }
  })
}
