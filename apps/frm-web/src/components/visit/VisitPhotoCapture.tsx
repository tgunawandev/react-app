/**
 * Visit Photo Capture Component
 * Modal/Dialog for capturing store photos during a visit
 * Uses camera capture on mobile, file upload fallback on desktop
 * Also shows existing photos and allows deletion
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, X, Loader2, ImagePlus, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFrappeFileUpload, useFrappeGetCall } from 'frappe-react-sdk'
import { toast } from 'sonner'
import type { PhotoItem } from './VisitTimeline'

interface VisitPhotoCaptureProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void
  /** Callback when NEW photos are confirmed (only newly captured ones) */
  onComplete: (photos: string[]) => void
  /** Existing photos already saved */
  existingPhotos?: PhotoItem[]
  /** Callback to delete an existing photo */
  onDeleteExisting?: (photoId: string) => void
  /** Customer/location name for context */
  customerName?: string
  /** Minimum number of photos required (default 0) */
  minPhotos?: number
  /** When true, only view photos (no add/delete) */
  readOnly?: boolean
  /** Visit ID for fetching photos */
  visitId?: string
  /** Customer ID (not used for photos, but kept for consistency) */
  customerId?: string
}

interface CapturedPhoto {
  file: File
  preview: string
  uploaded?: boolean
  url?: string
}

export function VisitPhotoCapture({
  open,
  onOpenChange,
  onComplete,
  existingPhotos = [],
  onDeleteExisting,
  customerName,
  minPhotos = 0,
  readOnly = false,
  visitId,
  customerId,
}: VisitPhotoCaptureProps) {
  const [newPhotos, setNewPhotos] = useState<CapturedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload } = useFrappeFileUpload()

  // Fetch photos from API when in read-only mode
  // Only fetch if visitId is a non-empty string (not empty string or null/undefined)
  const shouldFetchPhotos = open && readOnly && visitId && visitId.trim() !== ''
  const { data: apiPhotosResponse } = useFrappeGetCall<{
    message: PhotoItem[]
  }>(
    shouldFetchPhotos ? 'frm.api.photo.get_visit_photos' : null,
    shouldFetchPhotos ? { sales_visit: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false, revalidateOnMount: true, dedupingInterval: 0 }
  )

  // Unwrap the message property from Frappe API response
  const apiPhotos = apiPhotosResponse?.message || []

  // Use API photos in read-only mode if API returned data, otherwise use existingPhotos prop
  // In read-only mode, prefer apiPhotos (fresh from API) over existingPhotos (cached state)
  const displayPhotos = readOnly ? (apiPhotos.length > 0 ? apiPhotos : existingPhotos) : existingPhotos

  // Debug logging
  console.log('🔍 VisitPhotoCapture DEBUG:', {
    open,
    readOnly,
    visitId,
    apiPhotosResponse: apiPhotosResponse,
    apiPhotosCount: apiPhotos.length,
    existingPhotosCount: existingPhotos.length,
    displayPhotosCount: displayPhotos.length,
    willFetchAPI: shouldFetchPhotos
  })

  // Reset new photos when dialog opens
  useEffect(() => {
    if (open) {
      setNewPhotos([])
    }
  }, [open])

  // Total photos count (existing + new)
  const totalPhotos = displayPhotos.length + newPhotos.length

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const photosToAdd: CapturedPhoto[] = []

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        continue
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`)
        continue
      }

      // Create preview URL
      const preview = URL.createObjectURL(file)
      photosToAdd.push({ file, preview })
    }

    setNewPhotos((prev) => [...prev, ...photosToAdd])

    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }

  // Remove a newly captured photo (not yet uploaded)
  const handleRemoveNewPhoto = useCallback((index: number) => {
    setNewPhotos((prev) => {
      const photo = prev[index]
      // Revoke preview URL to free memory
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // Delete an existing photo from server
  const handleDeleteExisting = useCallback(async (photoId: string) => {
    if (!onDeleteExisting) return
    setDeletingId(photoId)
    try {
      await onDeleteExisting(photoId)
    } finally {
      setDeletingId(null)
    }
  }, [onDeleteExisting])

  const handleConfirm = async () => {
    // Check minimum photos (existing + new)
    if (totalPhotos < minPhotos) {
      toast.error(`Please capture at least ${minPhotos} photo(s)`)
      return
    }

    // Only upload new photos
    if (newPhotos.length === 0) {
      // No new photos to upload, just close
      onComplete([])
      onOpenChange(false)
      return
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const photo of newPhotos) {
        if (photo.url) {
          // Already uploaded
          uploadedUrls.push(photo.url)
        } else {
          // Upload to Frappe
          const result = await upload(photo.file, {
            isPrivate: false,
          })
          uploadedUrls.push(result.file_url)
        }
      }

      toast.success(`${newPhotos.length} photo(s) uploaded successfully`)

      // Clean up preview URLs
      newPhotos.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview)
      })

      // Reset state and close
      setNewPhotos([])
      onComplete(uploadedUrls)
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photos'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    // Clean up preview URLs for new photos only
    newPhotos.forEach((p) => {
      if (p.preview) URL.revokeObjectURL(p.preview)
    })
    setNewPhotos([])
    onOpenChange(false)
  }

  const openCamera = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {readOnly ? 'View Photos' : 'Capture Photos'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? `Photos captured at ${customerName || 'this location'}`
              : customerName
              ? `Take photos at ${customerName}`
              : 'Take photos of the store, products, or displays'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hidden file input - accepts camera on mobile */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Capture Button - Only show when not readOnly */}
          {!readOnly && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={openCamera}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Remove capture attribute for gallery selection
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture')
                    fileInputRef.current.click()
                    // Restore capture attribute after
                    setTimeout(() => {
                      fileInputRef.current?.setAttribute('capture', 'environment')
                    }, 100)
                  }
                }}
                disabled={uploading}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </div>
          )}

          {/* Existing Photos Section */}
          {displayPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Saved Photos ({displayPhotos.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {displayPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.thumbnail_url || photo.url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    {onDeleteExisting && !readOnly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-80 group-hover:opacity-100"
                        onClick={() => handleDeleteExisting(photo.id)}
                        disabled={uploading || deletingId === photo.id}
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Photos Section */}
          {newPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                New Photos ({newPhotos.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {newPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`New photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border border-primary/30"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-80 group-hover:opacity-100"
                      onClick={() => handleRemoveNewPhoto(index)}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-primary text-white px-1.5 py-0.5 rounded text-xs">
                      New
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalPhotos === 0 && (
            <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No photos captured yet</p>
              <p className="text-xs mt-1">
                Tap "Take Photo" or "Gallery" above
              </p>
            </div>
          )}

          {/* Summary */}
          {totalPhotos > 0 && (
            <p className="text-sm text-muted-foreground">
              Total: {totalPhotos} photo(s)
              {minPhotos > 0 && totalPhotos < minPhotos && (
                <span className="text-destructive ml-1">
                  (need {minPhotos - totalPhotos} more)
                </span>
              )}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {readOnly ? (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {newPhotos.length > 0 ? 'Cancel' : 'Close'}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={uploading || (minPhotos > 0 && totalPhotos < minPhotos)}
                className="w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : newPhotos.length > 0 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Upload {newPhotos.length} New Photo{newPhotos.length !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Done
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
