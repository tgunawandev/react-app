/**
 * Customer Photo Upload Component
 * Handles multiple store photo uploads with mode-specific behavior
 * Reference: specs/001-sfa-app-build/tasks.md Phase 1
 */

import { useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFrappeFileUpload } from 'frappe-react-sdk'
import { toast } from 'sonner'

interface CustomerPhotoUploadProps {
  /** Form mode: create, edit, or view */
  mode: 'create' | 'edit' | 'view'
  /** Array of current photo URLs */
  photos?: string[]
  /** Callback when photos are uploaded */
  onPhotosChange?: (photos: string[]) => void
  /** Whether at least one photo is required */
  required?: boolean
}

export function CustomerPhotoUpload({
  mode,
  photos = [],
  onPhotosChange,
  required = false,
}: CustomerPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { upload } = useFrappeFileUpload()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`)
        return
      }
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      // Upload all files
      for (const file of files) {
        const uploadResult = await upload(file, {
          isPrivate: false,
        })
        uploadedUrls.push(uploadResult.file_url)
      }

      // Add to existing photos
      const newPhotos = [...photos, ...uploadedUrls]
      onPhotosChange?.(newPhotos)

      toast.success(`${files.length} photo(s) uploaded successfully`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload photos')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange?.(newPhotos)
    toast.success('Photo removed')
  }

  // View mode - display only
  if (mode === 'view') {
    if (photos.length === 0) {
      return (
        <div className="p-8 border rounded-md text-center text-muted-foreground bg-accent/20">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No store photos available</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Label>Store Photos ({photos.length})</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photoUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={photoUrl}
                alt={`Store photo ${index + 1}`}
                className="w-full h-48 object-cover rounded-md border"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Create/Edit mode - upload interface
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="photos">
          Store Photos {required && photos.length === 0 && <span className="text-destructive">*</span>}
          {photos.length > 0 && <span className="text-muted-foreground ml-2">({photos.length})</span>}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        {uploading && (
          <p className="text-sm text-muted-foreground">Uploading photos...</p>
        )}
        <p className="text-xs text-muted-foreground">
          You can select multiple images. Max 5MB per image.
        </p>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Photos ({photos.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photoUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={photoUrl}
                  alt={`Store photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-md border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Photo {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
