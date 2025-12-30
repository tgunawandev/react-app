/**
 * Payment Photo Upload Component
 * Handles payment evidence photo uploads with camera capture support
 * Mobile-first design for field sales representatives
 */

import { useRef, useState } from 'react'
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFrappeFileUpload } from 'frappe-react-sdk'
import { toast } from 'sonner'

interface PaymentPhotoUploadProps {
  /** Array of current photo URLs */
  photos: string[]
  /** Callback when photos change */
  onPhotosChange: (photos: string[]) => void
  /** Whether the component is disabled */
  disabled?: boolean
  /** Maximum number of photos allowed */
  maxPhotos?: number
}

export function PaymentPhotoUpload({
  photos,
  onPhotosChange,
  disabled = false,
  maxPhotos = 5,
}: PaymentPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const { upload } = useFrappeFileUpload()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max photos limit
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`)
      e.target.value = ''
      return
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        e.target.value = ''
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`)
        e.target.value = ''
        return
      }
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        const uploadResult = await upload(file, {
          isPrivate: false,
        })
        uploadedUrls.push(uploadResult.file_url)
      }

      onPhotosChange([...photos, ...uploadedUrls])
      toast.success(`${files.length} photo(s) uploaded`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  const isMaxPhotosReached = photos.length >= maxPhotos

  return (
    <div className="space-y-3">
      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={photoUrl}
                alt={`Payment evidence ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {!disabled && !isMaxPhotosReached && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Uploading...' : 'Take Photo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Choose from Gallery
          </Button>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} photos. Max 5MB per image.
      </p>
    </div>
  )
}
