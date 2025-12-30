/**
 * CheckInStep Component
 * Step 1: Manual GPS capture and visit creation
 */

import { useState, useEffect } from 'react'
import { MapPin, Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGPS } from '@/hooks/useGPS'
import { toast } from 'sonner'

interface CheckInStepProps {
  customerId: string
  onCheckIn: (data: {
    customer: string
    gps_latitude: number
    gps_longitude: number
    gps_accuracy: number
  }) => Promise<void>
  isProcessing: boolean
}

export function CheckInStep({ customerId, onCheckIn, isProcessing }: CheckInStepProps) {
  const gps = useGPS()
  const [isCapturingGPS, setIsCapturingGPS] = useState(false)

  const handleStartVisit = async () => {
    setIsCapturingGPS(true)

    try {
      // Try to capture GPS, but allow fallback if not available
      let gpsData = {
        gps_latitude: 0,
        gps_longitude: 0,
        gps_accuracy: 0,
      }

      try {
        const position = await gps.capture(50)
        gpsData = {
          gps_latitude: position.latitude,
          gps_longitude: position.longitude,
          gps_accuracy: position.accuracy,
        }
        toast.success('GPS captured successfully', {
          description: `Accuracy: ${position.accuracy.toFixed(1)}m`,
        })
      } catch (gpsError) {
        // GPS failed - use mock coordinates for development
        console.warn('GPS not available, using mock coordinates:', gpsError)
        gpsData = {
          gps_latitude: -6.2088, // Jakarta coordinates
          gps_longitude: 106.8456,
          gps_accuracy: 50,
        }
        toast.warning('GPS not available', {
          description: 'Using mock location for development',
        })
      }

      // Call check-in with GPS data (real or mock)
      await onCheckIn({
        customer: customerId,
        ...gpsData,
      })

      toast.success('Visit started successfully!')
    } catch (error) {
      console.error('Check-in failed:', error)
      toast.error('Check-in failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsCapturingGPS(false)
    }
  }

  // Auto-check GPS permission on mount
  useEffect(() => {
    gps.checkPermission()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Step 1: Check-In
        </CardTitle>
        <CardDescription>
          Start your visit by capturing your current location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* GPS Permission Status */}
        {gps.hasPermission === false && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Location permission denied. Will use mock coordinates for development.
              <br />
              <span className="text-xs text-muted-foreground mt-1 block">
                To enable GPS: Use HTTPS or access via localhost
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* GPS Capture Status */}
        {gps.position && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-primary font-medium">
              <CheckCircle className="h-5 w-5" />
              GPS Location Captured
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div>Latitude: {gps.position.latitude.toFixed(6)}</div>
              <div>Longitude: {gps.position.longitude.toFixed(6)}</div>
              <div>Accuracy: {gps.position.accuracy.toFixed(1)} meters</div>
            </div>
          </div>
        )}

        {/* GPS Error */}
        {gps.error && !isCapturingGPS && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{gps.error.message}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="space-y-2">
          <h4 className="font-medium">Before you start:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Ensure you have stable GPS signal</li>
            <li>Be within 100 meters of the customer location</li>
            <li>Check that your device location is enabled</li>
          </ul>
        </div>

        {/* Start Visit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleStartVisit}
          disabled={isCapturingGPS || isProcessing}
        >
          {isCapturingGPS || gps.isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Capturing GPS...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Visit...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start Visit
            </>
          )}
        </Button>

        {/* GPS Accuracy Info */}
        <div className="text-xs text-muted-foreground text-center">
          GPS accuracy should be under 50 meters for optimal check-in
        </div>
      </CardContent>
    </Card>
  )
}
