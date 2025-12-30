/**
 * PODCapture Component
 * Always-available POD capture - decoupled from stop/delivery status
 * Reference: Route-First Architecture Plan - Section 6 (POD Always Available)
 *
 * Key Principle: POD capture is ALWAYS available regardless of stop status.
 * This component should NEVER be disabled based on workflow state.
 */

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  User,
  FileText,
  MapPin,
  Loader2,
  PenLine,
  Trash2,
} from 'lucide-react'

export interface PODData {
  photo?: string
  signature?: string
  receiver_name?: string
  notes?: string
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  timestamp?: string
}

interface PODCaptureProps {
  // Existing POD data (for display/editing)
  existingData?: PODData
  // Whether POD has been captured
  isCaptured?: boolean
  // Callback when POD is saved
  onSave: (data: PODData) => Promise<void>
  // Whether save is in progress
  isSaving?: boolean
  // Optional: Hide GPS capture
  hideGPS?: boolean
  // Optional: Hide signature
  hideSignature?: boolean
  // Optional: Title override
  title?: string
  // Optional: Description override
  description?: string
}

export function PODCapture({
  existingData,
  isCaptured = false,
  onSave,
  isSaving = false,
  hideGPS = false,
  hideSignature = false, // Signature capture enabled by default
  title = 'Proof of Delivery/Visit',
  description = 'Capture photo, receiver name, and notes as proof',
}: PODCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(existingData?.photo || null)
  const [signature, setSignature] = useState<string | null>(existingData?.signature || null)
  const [receiverName, setReceiverName] = useState(existingData?.receiver_name || '')
  const [notes, setNotes] = useState(existingData?.notes || '')
  const [gpsData, setGpsData] = useState<{
    latitude?: number
    longitude?: number
    accuracy?: number
  }>({
    latitude: existingData?.gps_latitude,
    longitude: existingData?.gps_longitude,
    accuracy: existingData?.gps_accuracy,
  })
  const [isCapturingGPS, setIsCapturingGPS] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize canvas for signature
  useEffect(() => {
    if (!hideSignature && canvasRef.current && !signature) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [hideSignature, signature])

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  // Start drawing
  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const coords = getCanvasCoords(e)
    lastPosRef.current = coords
  }

  // Draw on canvas
  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current || !lastPosRef.current) return
    e.preventDefault()

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const coords = getCanvasCoords(e)

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    lastPosRef.current = coords
  }

  // End drawing
  const handleDrawEnd = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false)
      lastPosRef.current = null
      // Save signature as data URL
      setSignature(canvasRef.current.toDataURL('image/png'))
    }
  }

  // Clear signature
  const handleClearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    setSignature(null)
  }

  // Handle photo capture from camera or file
  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo too large. Maximum size is 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Capture GPS location
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsCapturingGPS(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setIsCapturingGPS(false)
      },
      (error) => {
        console.error('GPS error:', error)
        alert('Failed to capture location. Please enable location access.')
        setIsCapturingGPS(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Clear photo
  const handleClearPhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Save POD data
  const handleSave = async () => {
    const podData: PODData = {
      photo: photo || undefined,
      signature: signature || undefined,
      receiver_name: receiverName || undefined,
      notes: notes || undefined,
      gps_latitude: gpsData.latitude,
      gps_longitude: gpsData.longitude,
      gps_accuracy: gpsData.accuracy,
      timestamp: new Date().toISOString(),
    }

    await onSave(podData)
  }

  // Check if there's any data to save
  const hasData = photo || signature || receiverName || notes || gpsData.latitude

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
          {isCaptured && (
            <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Capture - Primary */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photo
          </Label>
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="POD Photo"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClearPhoto}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Take a photo or upload from gallery
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Signature Capture */}
        {!hideSignature && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Signature
            </Label>
            {signature ? (
              <div className="relative">
                <img
                  src={signature}
                  alt="Signature"
                  className="w-full h-32 object-contain rounded-lg border bg-white"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClearSignature}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full h-32 touch-none cursor-crosshair"
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDraw}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  onTouchStart={handleDrawStart}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleDrawEnd}
                />
                <p className="text-xs text-center text-muted-foreground py-1">
                  Draw signature above
                </p>
              </div>
            )}
          </div>
        )}

        {/* Receiver Name */}
        <div className="space-y-2">
          <Label htmlFor="receiver-name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Receiver Name
          </Label>
          <Input
            id="receiver-name"
            placeholder="Name of person receiving/verifying"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="pod-notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </Label>
          <Textarea
            id="pod-notes"
            placeholder="Additional details, comments, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* GPS Location */}
        {!hideGPS && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS Location
            </Label>
            {gpsData.latitude && gpsData.longitude ? (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
                    {gpsData.accuracy && (
                      <span className="text-muted-foreground ml-2">
                        (±{Math.round(gpsData.accuracy)}m)
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCaptureGPS}
                    disabled={isCapturingGPS}
                  >
                    Refresh
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                variant="outline"
                onClick={handleCaptureGPS}
                disabled={isCapturingGPS}
                className="w-full"
              >
                {isCapturingGPS ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Capturing Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Capture GPS Location
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasData}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isCaptured ? 'Update POD' : 'Save POD'}
            </>
          )}
        </Button>

        {/* Status Indicator */}
        {isCaptured && (
          <p className="text-sm text-center text-primary flex items-center justify-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            POD has been captured
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default PODCapture
