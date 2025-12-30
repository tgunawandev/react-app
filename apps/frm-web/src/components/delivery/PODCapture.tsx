/**
 * PODCapture Component
 * Proof of Delivery capture with photo, signature, and receiver info
 * Reference: Delivery Tracking System Phase 4
 *
 * State Persistence: Receiver info is auto-saved to server on blur,
 * so data persists across page refreshes.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Camera,
  Pencil,
  User,
  Phone,
  Check,
  X,
  Loader2,
  ImageIcon,
  FileImage,
  AlertCircle,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { usePOD, usePODMutations, type ReceiverRelationship } from '@/hooks/usePOD'
import { useGPSCapture } from '@/hooks/useDriverLocation'
import SignaturePad from './SignaturePad'

interface PODCaptureProps {
  deliveryOrder: string
  photoRequired?: boolean
  signatureRequired?: boolean
  readOnly?: boolean
  onComplete?: () => void
}

export default function PODCapture({
  deliveryOrder,
  photoRequired = true,
  signatureRequired = false,
  readOnly = false,
  onComplete
}: PODCaptureProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverRelationship, setReceiverRelationship] = useState<ReceiverRelationship | ''>('')
  const [notes, setNotes] = useState('')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { pod, isLoading: loadingPOD, refresh } = usePOD(deliveryOrder)
  const {
    capturePhotoBase64,
    isCapturingPhoto,
    captureSignature,
    isCapturingSignature,
    completePOD,
    isCompleting,
    rejectDelivery,
    isRejecting,
    saveDraft,
    error
  } = usePODMutations()

  // Initialize form from existing POD data
  useEffect(() => {
    if (pod) {
      if (pod.receiver_name && !receiverName) {
        setReceiverName(pod.receiver_name)
      }
      if (pod.receiver_phone && !receiverPhone) {
        setReceiverPhone(pod.receiver_phone)
      }
      if (pod.receiver_relationship && !receiverRelationship) {
        setReceiverRelationship(pod.receiver_relationship as ReceiverRelationship)
      }
      if (pod.delivery_notes && !notes) {
        setNotes(pod.delivery_notes)
      }
    }
  }, [pod]) // Only run when pod data changes

  // Auto-save draft with debounce
  const debouncedSaveDraft = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after 500ms of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSavingDraft(true)
      setDraftSaved(false)

      await saveDraft(
        deliveryOrder,
        receiverName || undefined,
        receiverPhone || undefined,
        receiverRelationship as ReceiverRelationship || undefined,
        notes || undefined
      )

      setIsSavingDraft(false)
      setDraftSaved(true)

      // Hide "saved" indicator after 2 seconds
      setTimeout(() => setDraftSaved(false), 2000)
    }, 500)
  }, [deliveryOrder, receiverName, receiverPhone, receiverRelationship, notes, saveDraft])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const { capture: captureGPS, latitude, longitude, accuracy } = useGPSCapture()

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)

      // Capture GPS location
      captureGPS().catch(() => {
        // GPS error is ok, continue without it
      })
    } catch (err) {
      toast.error('Failed to access camera')
      console.error('Camera error:', err)
    }
  }, [captureGPS])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }, [])

  // Take photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedPhoto(dataUrl)
      stopCamera()
    }
  }, [stopCamera])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setCapturedPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  // Upload captured photo
  const uploadPhoto = async () => {
    if (!capturedPhoto) return

    try {
      await capturePhotoBase64(
        deliveryOrder,
        capturedPhoto,
        latitude,
        longitude,
        accuracy
      )
      toast.success('Photo uploaded')
      setCapturedPhoto(null)
      refresh()
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  // Handle signature save
  const handleSignatureSave = async (signatureData: string) => {
    try {
      await captureSignature(deliveryOrder, signatureData)
      toast.success('Signature captured')
      setShowSignature(false)
      refresh()
    } catch {
      toast.error('Failed to save signature')
    }
  }

  // Complete delivery
  const handleComplete = async () => {
    // Validate requirements
    if (photoRequired && !pod?.delivery_photo) {
      toast.error('Photo is required')
      return
    }
    if (signatureRequired && !pod?.signature_image) {
      toast.error('Signature is required')
      return
    }

    try {
      await completePOD(
        deliveryOrder,
        receiverName || undefined,
        receiverPhone || undefined,
        receiverRelationship as ReceiverRelationship || undefined,
        notes || undefined
      )
      toast.success('Delivery completed!')
      onComplete?.()
    } catch {
      toast.error('Failed to complete delivery')
    }
  }

  // Reject delivery
  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      await rejectDelivery(deliveryOrder, notes)
      toast.success('Delivery marked as rejected')
      onComplete?.()
    } catch {
      toast.error('Failed to reject delivery')
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-primary">Completed</Badge>
      case 'photo_captured':
        return <Badge variant="secondary">Photo Captured</Badge>
      case 'signature_captured':
        return <Badge variant="secondary">Signature Captured</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  if (loadingPOD) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading POD...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Proof of Delivery
            </CardTitle>
            {getStatusBadge(pod?.pod_status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              Delivery Photo
              {photoRequired && <span className="text-destructive">*</span>}
            </Label>

            {pod?.delivery_photo ? (
              <div className="relative">
                <img
                  src={pod.delivery_photo}
                  alt="Delivery photo"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Badge className="absolute top-2 right-2 bg-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Captured
                </Badge>
              </div>
            ) : capturedPhoto ? (
              <div className="space-y-2">
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={uploadPhoto}
                    disabled={isCapturingPhoto}
                  >
                    {isCapturingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Use Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCapturedPhoto(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Retake
                  </Button>
                </div>
              </div>
            ) : !readOnly ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={startCamera}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                No photo captured
              </div>
            )}
          </div>

          <Separator />

          {/* Signature section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Pencil className="h-4 w-4" />
              Customer Signature
              {signatureRequired && <span className="text-destructive">*</span>}
            </Label>

            {pod?.signature_image ? (
              <div className="relative">
                <img
                  src={pod.signature_image}
                  alt="Signature"
                  className="w-full h-24 object-contain border rounded-lg bg-white"
                />
                <Badge className="absolute top-2 right-2 bg-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Signed
                </Badge>
              </div>
            ) : !readOnly ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowSignature(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Capture Signature
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                No signature captured
              </div>
            )}
          </div>

          <Separator />

          {/* Receiver info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Receiver Information</Label>
              {/* Auto-save indicator */}
              {isSavingDraft && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
              {draftSaved && !isSavingDraft && (
                <span className="text-xs text-primary600 flex items-center gap-1">
                  <Save className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="receiver_name" className="text-xs">
                  <User className="h-3 w-3 inline mr-1" />
                  Name
                </Label>
                <Input
                  id="receiver_name"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  onBlur={debouncedSaveDraft}
                  placeholder="Receiver name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="receiver_phone" className="text-xs">
                  <Phone className="h-3 w-3 inline mr-1" />
                  Phone
                </Label>
                <Input
                  id="receiver_phone"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  onBlur={debouncedSaveDraft}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="relationship" className="text-xs">Relationship</Label>
              <Select
                value={receiverRelationship}
                onValueChange={(v) => {
                  setReceiverRelationship(v as ReceiverRelationship)
                  // Save immediately on select change
                  setTimeout(debouncedSaveDraft, 0)
                }}
              >
                <SelectTrigger id="relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Family Member">Family Member</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={debouncedSaveDraft}
              placeholder="Add any notes about the delivery..."
              rows={2}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-destructive/5 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error.message}
            </div>
          )}

          {/* Action buttons */}
          {!readOnly && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={isCompleting || pod?.pod_status === 'completed'}
              >
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Complete Delivery
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || pod?.pod_status === 'rejected'}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={takePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Signature</DialogTitle>
          </DialogHeader>
          <SignaturePad
            onSave={handleSignatureSave}
            onCancel={() => setShowSignature(false)}
            isLoading={isCapturingSignature}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
