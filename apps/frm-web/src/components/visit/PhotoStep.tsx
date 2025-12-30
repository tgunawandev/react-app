/**
 * PhotoStep Component
 * Step 2: Manual photo capture (not auto-capture)
 */

import { useState } from 'react'
import { Camera, Loader2, CheckCircle, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePhoto } from '@/hooks/usePhoto'
import { toast } from 'sonner'

interface PhotoStepProps {
  onPhotoSaved: (data: { photo_base64: string }) => Promise<void>
  isProcessing: boolean
}

export function PhotoStep({ onPhotoSaved, isProcessing }: PhotoStepProps) {
  const photo = usePhoto()
  const [isSaving, setIsSaving] = useState(false)

  const handleTakePhoto = async () => {
    try {
      await photo.capture({
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        cameraOnly: true,
        preserveExif: true,
      })

      toast.success('Photo captured successfully', {
        description: `Size: ${(photo.photo!.metadata.fileSize / 1024).toFixed(0)} KB`,
      })
    } catch (error) {
      console.error('Photo capture failed:', error)
      toast.error('Photo capture failed', {
        description: photo.error || 'Please allow camera access and try again',
      })
    }
  }

  const handleSavePhoto = async () => {
    if (!photo.photo) return

    setIsSaving(true)
    try {
      await onPhotoSaved({
        photo_base64: photo.photo.base64,
      })

      toast.success('Photo saved successfully!')
    } catch (error) {
      console.error('Photo save failed:', error)
      toast.error('Failed to save photo', {
        description: 'Please try again',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetake = () => {
    photo.clearPhoto()
    handleTakePhoto()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Step 2: Take Photo
        </CardTitle>
        <CardDescription>Capture a photo of the customer location or store front</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        {!photo.photo && (
          <div className="space-y-2">
            <h4 className="font-medium">Photo Guidelines:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ensure good lighting for clear visibility</li>
              <li>Include recognizable features of the location</li>
              <li>Hold your device steady to avoid blur</li>
              <li>Maximum file size: 2 MB</li>
            </ul>
          </div>
        )}

        {/* Photo Preview */}
        {photo.photo && (
          <div className="space-y-4">
            <div className="relative rounded-sm overflow-hidden border">
              <img
                src={photo.photo.preview}
                alt="Captured photo"
                className="w-full h-auto"
              />
              <div className="absolute top-2 right-2">
                <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Captured
                </div>
              </div>
            </div>

            {/* Photo Metadata */}
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Size: {(photo.photo.metadata.fileSize / 1024).toFixed(0)} KB</div>
              <div>
                Dimensions: {photo.photo.metadata.width} × {photo.photo.metadata.height}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {photo.error && (
          <Alert variant="destructive">
            <AlertDescription>{photo.error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!photo.photo ? (
            // Take Photo Button
            <Button
              size="lg"
              className="w-full"
              onClick={handleTakePhoto}
              disabled={photo.isCapturing || photo.cameraAvailable === false}
            >
              {photo.isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Opening Camera...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Take Photo
                </>
              )}
            </Button>
          ) : (
            // Retake & Save Buttons
            <>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={handleRetake}
                disabled={isSaving || isProcessing}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Retake Photo
              </Button>
              <Button
                size="lg"
                className="w-full"
                onClick={handleSavePhoto}
                disabled={isSaving || isProcessing}
              >
                {isSaving || isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Photo...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Save & Continue
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Camera Availability Warning */}
        {photo.cameraAvailable === false && (
          <Alert variant="destructive">
            <AlertDescription>
              Camera not available. Please check your device settings and browser permissions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
