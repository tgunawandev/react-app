/**
 * useScanner Hook - QR/Barcode Scanning
 * Manages camera stream, code detection, and validation
 * Reference: specs/001-sfa-app-build/tasks.md SCAN-006
 */

import { useState, useEffect, useRef } from 'react'
import { useFrappePostCall } from 'frappe-react-sdk'
import { toast } from 'sonner'
import { getCameraStream, deactivateCameraStream } from '@/lib/cameraUtils'
import jsQR from 'jsqr'
import Quagga from '@ericblade/quagga2'

export interface ScanResult {
  type: 'qr' | 'barcode'
  data: string
  customerData?: CustomerScanResult
  productData?: ProductScanResult
}

export interface CustomerScanResult {
  customer_id: string
  customer_name: string
  is_in_route: boolean
  territory: string
  gps_latitude: number | null
  gps_longitude: number | null
}

export interface ProductScanResult {
  item_id: string
  item_name: string
  item_code: string
  stock_level: number
  price: number
  uom: string
  item_group: string
}

/**
 * Hook for QR code and barcode scanning
 */
export function useScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scanIntervalRef = useRef<number | null>(null)
  const quaggaInitializedRef = useRef<boolean>(false)

  // API calls for validation
  const { call: validateCustomerQR } = useFrappePostCall<{ message: CustomerScanResult }>(
    'frm.api.scanner.validate_customer_qr'
  )

  const { call: validateProductBarcode } = useFrappePostCall<{ message: ProductScanResult }>(
    'frm.api.scanner.validate_product_barcode'
  )

  /**
   * Start camera and begin scanning
   */
  const startScanning = async () => {
    try {
      setIsScanning(true)
      setError(null)

      const cameraStream = await getCameraStream('environment')
      setStream(cameraStream)

      // Attach stream to video element when ready
      if (videoRef.current) {
        videoRef.current.srcObject = cameraStream

        // Play video with proper error handling
        try {
          const playPromise = videoRef.current.play()
          if (playPromise !== undefined) {
            await playPromise
          }
        } catch (playError) {
          // Ignore play() interruption errors (common when component unmounts quickly)
          if (playError instanceof DOMException && playError.name !== 'AbortError') {
            console.warn('Video play interrupted:', playError)
          }
        }
      }

      // Start QR code detection loop
      startQRDetection()

      // Start barcode detection with Quagga2
      startBarcodeDetection()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start camera'
      setError(message)
      toast.error(message)
      setIsScanning(false)
    }
  }

  /**
   * Stop camera and scanning
   */
  const stopScanning = () => {
    // Stop QR detection interval
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop Quagga barcode detection
    if (quaggaInitializedRef.current) {
      try {
        Quagga.stop()
        Quagga.offDetected(handleBarcodeDetected)
        quaggaInitializedRef.current = false
      } catch (err) {
        console.error('Error stopping Quagga:', err)
      }
    }

    // Stop video element playback before removing stream
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      } catch (err) {
        console.warn('Error stopping video:', err)
      }
    }

    deactivateCameraStream(stream)
    setStream(null)
    setIsScanning(false)
  }

  /**
   * QR code detection loop using jsQR
   */
  const startQRDetection = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
    }

    scanIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current) return

      const video = videoRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return

      // Create canvas from video frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Detect QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      if (code && code.data) {
        handleQRDetected(code.data)
      }
    }, 300) // Scan every 300ms
  }

  /**
   * Handle QR code detection
   */
  const handleQRDetected = async (qrData: string) => {
    // Stop scanning to prevent multiple detections
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    try {
      // Validate with backend (5 second timeout)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 5000)
      })

      const validationPromise = validateCustomerQR({ qr_code: qrData })

      const response = await Promise.race([validationPromise, timeoutPromise])

      if (response?.message) {
        setResult({
          type: 'qr',
          data: qrData,
          customerData: response.message
        })
        toast.success(`Customer found: ${response.message.customer_name}`)
      }
    } catch (err: any) {
      const message = err?.message || 'Invalid QR code'
      setError(message)
      toast.error(message)

      // Resume scanning after error
      setTimeout(() => {
        setError(null)
        startQRDetection()
      }, 2000)
    }
  }

  /**
   * Barcode detection using Quagga2
   * Supports EAN-13, EAN-8, and Code 128 formats
   */
  const startBarcodeDetection = () => {
    if (!videoRef.current || quaggaInitializedRef.current) return

    try {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: videoRef.current,
            constraints: {
              facingMode: 'environment'
            }
          },
          decoder: {
            readers: [
              'ean_reader',      // EAN-13
              'ean_8_reader',    // EAN-8
              'code_128_reader'  // Code 128
            ],
            multiple: false
          },
          locate: true,
          locator: {
            patchSize: 'medium',
            halfSample: true
          }
        },
        (err) => {
          if (err) {
            console.error('Quagga initialization error:', err)
            return
          }
          Quagga.start()
          quaggaInitializedRef.current = true
        }
      )

      // Listen for detected barcodes
      Quagga.onDetected(handleBarcodeDetected)
    } catch (err) {
      console.error('Error starting barcode detection:', err)
    }
  }

  /**
   * Handle barcode detection from Quagga2
   */
  const handleBarcodeDetected = async (result: any) => {
    if (!result || !result.codeResult || !result.codeResult.code) return

    const barcodeData = result.codeResult.code

    // Stop all scanning to prevent duplicates
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (quaggaInitializedRef.current) {
      Quagga.stop()
      quaggaInitializedRef.current = false
    }

    // Validate barcode with backend
    await validateBarcodeData(barcodeData)
  }

  /**
   * Validate barcode data with backend API
   */
  const validateBarcodeData = async (barcodeData: string) => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), 5000)
      })

      const validationPromise = validateProductBarcode({ barcode: barcodeData })

      const response = await Promise.race([validationPromise, timeoutPromise])

      if (response?.message) {
        setResult({
          type: 'barcode',
          data: barcodeData,
          productData: response.message
        })
        toast.success(`Product found: ${response.message.item_name}`)
      }
    } catch (err: any) {
      const message = err?.message || 'Product not found'
      setError(message)
      toast.error(message)

      // Resume scanning after error
      setTimeout(() => {
        setError(null)
        startQRDetection()
        startBarcodeDetection()
      }, 2000)
    }
  }

  /**
   * Manually validate a barcode (for barcode scanning libraries) - DEPRECATED
   * Use validateBarcodeData instead
   */
  const validateBarcode = async (barcodeData: string) => {
    await validateBarcodeData(barcodeData)
  }

  /**
   * Reset scanner state
   */
  const reset = () => {
    setResult(null)
    setError(null)
  }

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return {
    isScanning,
    stream,
    result,
    error,
    videoRef,
    startScanning,
    stopScanning,
    validateBarcode,
    reset
  }
}
