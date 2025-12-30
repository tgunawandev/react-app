/**
 * usePhoto Hook
 * React hook for photo capture, compression, and upload
 * Reference: specs/001-sfa-app-build/tasks.md US1-021
 */

import { useState, useCallback } from 'react'
import { useFrappePostCall } from 'frappe-react-sdk'
import {
  captureAndCompressPhoto,
  checkCameraAvailability,
  type CapturedPhoto,
  type PhotoCaptureOptions
} from '@/services/photo'

interface UsePhotoState {
  photo: CapturedPhoto | null
  isCapturing: boolean
  isUploading: boolean
  uploadProgress: number
  error: string | null
  cameraAvailable: boolean | null
  uploadedFileId: string | null
  uploadedFileUrl: string | null
}

interface UsePhotoReturn extends UsePhotoState {
  capture: (options?: PhotoCaptureOptions) => Promise<CapturedPhoto>
  upload: (salesVisit: string) => Promise<{ file_id: string; file_url: string }>
  checkCamera: () => Promise<boolean>
  retry: () => Promise<CapturedPhoto>
  reset: () => void
  clearPhoto: () => void
}

/**
 * Hook for photo capture and upload with progress tracking
 *
 * @returns UsePhotoReturn - Photo state and control functions
 *
 * @example
 * ```tsx
 * const { photo, isCapturing, capture, upload } = usePhoto()
 *
 * const handleCapture = async () => {
 *   const photo = await capture({ maxSizeMB: 2 })
 *   console.log('Photo captured:', photo.metadata)
 * }
 *
 * const handleUpload = async () => {
 *   const result = await upload('SV-2023-11-001')
 *   console.log('Uploaded:', result.file_url)
 * }
 * ```
 */
export function usePhoto(): UsePhotoReturn {
  const [state, setState] = useState<UsePhotoState>({
    photo: null,
    isCapturing: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    cameraAvailable: null,
    uploadedFileId: null,
    uploadedFileUrl: null
  })

  const [lastOptions, setLastOptions] = useState<PhotoCaptureOptions>({})

  // Frappe API call for photo upload
  const { call: uploadPhotoAPI } = useFrappePostCall<{
    message: { file_id: string; file_url: string; validation: any }
  }>('frm.api.photo.upload_visit_photo')

  /**
   * Capture photo from camera
   *
   * @param options - Photo capture options
   * @returns Promise<CapturedPhoto> - Captured photo with metadata
   */
  const capture = useCallback(async (options: PhotoCaptureOptions = {}): Promise<CapturedPhoto> => {
    setState(prev => ({
      ...prev,
      isCapturing: true,
      error: null,
      uploadedFileId: null,
      uploadedFileUrl: null
    }))

    setLastOptions(options)

    try {
      const photo = await captureAndCompressPhoto(options)

      setState(prev => ({
        ...prev,
        photo,
        isCapturing: false,
        error: null
      }))

      return photo
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo'

      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: errorMessage
      }))

      throw error
    }
  }, [])

  /**
   * Upload captured photo to Frappe backend
   *
   * @param salesVisit - Sales Visit document name
   * @returns Promise<{file_id: string, file_url: string}> - Uploaded file info
   */
  const upload = useCallback(
    async (salesVisit: string): Promise<{ file_id: string; file_url: string }> => {
      if (!state.photo) {
        throw new Error('No photo to upload')
      }

      setState(prev => ({
        ...prev,
        isUploading: true,
        uploadProgress: 0,
        error: null
      }))

      try {
        // Simulate upload progress (since Frappe SDK doesn't provide progress)
        const progressInterval = setInterval(() => {
          setState(prev => ({
            ...prev,
            uploadProgress: Math.min(prev.uploadProgress + 10, 90)
          }))
        }, 200)

        const response = await uploadPhotoAPI({
          base64_data: state.photo.base64,
          sales_visit: salesVisit
        })

        clearInterval(progressInterval)

        if (!response?.message) {
          throw new Error('Invalid upload response')
        }

        const { file_id, file_url } = response.message

        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
          uploadedFileId: file_id,
          uploadedFileUrl: file_url,
          error: null
        }))

        return { file_id, file_url }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo'

        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          error: errorMessage
        }))

        throw error
      }
    },
    [state.photo, uploadPhotoAPI]
  )

  /**
   * Check camera availability
   *
   * @returns Promise<boolean> - true if camera available
   */
  const checkCamera = useCallback(async (): Promise<boolean> => {
    const available = await checkCameraAvailability()

    setState(prev => ({
      ...prev,
      cameraAvailable: available
    }))

    return available
  }, [])

  /**
   * Retry photo capture with last options
   *
   * @returns Promise<CapturedPhoto> - Captured photo
   */
  const retry = useCallback(async (): Promise<CapturedPhoto> => {
    return capture(lastOptions)
  }, [capture, lastOptions])

  /**
   * Reset all photo state
   */
  const reset = useCallback(() => {
    // Revoke preview URL to free memory
    if (state.photo?.preview) {
      URL.revokeObjectURL(state.photo.preview)
    }

    setState({
      photo: null,
      isCapturing: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,
      cameraAvailable: null,
      uploadedFileId: null,
      uploadedFileUrl: null
    })
  }, [state.photo])

  /**
   * Clear captured photo only (keep other state)
   */
  const clearPhoto = useCallback(() => {
    if (state.photo?.preview) {
      URL.revokeObjectURL(state.photo.preview)
    }

    setState(prev => ({
      ...prev,
      photo: null,
      uploadedFileId: null,
      uploadedFileUrl: null,
      uploadProgress: 0
    }))
  }, [state.photo])

  return {
    ...state,
    capture,
    upload,
    checkCamera,
    retry,
    reset,
    clearPhoto
  }
}
