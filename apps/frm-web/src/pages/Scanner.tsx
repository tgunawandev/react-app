/**
 * Scanner Page - QR Code and Barcode Scanner
 * Camera-based scanning for customer check-in and product lookup
 * Reference: specs/001-sfa-app-build/tasks.md SCAN-001
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CameraPreview } from '@/components/scanner/CameraPreview'
import { ScanOverlay } from '@/components/scanner/ScanOverlay'
import { useScanner } from '@/hooks/useScanner'
import { useRecentRecords } from '@/hooks/useRecentRecords'

export default function Scanner() {
  const navigate = useNavigate()
  const { isScanning, result, error, videoRef, startScanning, stopScanning } = useScanner()
  const { addRecord } = useRecentRecords()

  // Start camera on mount
  useEffect(() => {
    startScanning()

    // Cleanup on unmount
    return () => {
      stopScanning()
    }
  }, [])

  // Handle scan result
  useEffect(() => {
    if (!result) return

    // Stop scanning
    stopScanning()

    // Add to recent records
    if (result.customerData) {
      addRecord(
        'Customer',
        result.customerData.customer_id,
        result.customerData.customer_name
      )

      // Navigate based on route status
      if (result.customerData.is_in_route) {
        // Customer is in route - go directly to check-in
        navigate(`/visit/check-in?customer=${result.customerData.customer_id}`)
      } else {
        // Customer not in route - show customer detail with prompt to start visit
        navigate(`/customers/${result.customerData.customer_id}?prompt=visit`)
      }
    } else if (result.productData) {
      addRecord(
        'Item',
        result.productData.item_id,
        result.productData.item_name
      )

      // Navigate to product catalog or show modal
      navigate(`/products/${result.productData.item_id}`)
    }
  }, [result])

  const handleClose = () => {
    stopScanning()
    navigate(-1)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={handleClose}
          className="group relative w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Camera Preview */}
      {isScanning && <CameraPreview videoRef={videoRef as any} isActive={isScanning} />}

      {/* Scan Overlay */}
      {isScanning && <ScanOverlay instructionText="Align QR code or barcode within the frame" />}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-8 left-4 right-4 z-50">
          <Alert variant="destructive" className="bg-destructive/50/90 backdrop-blur-sm border-red-600">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-white font-medium">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Loading State */}
      {!isScanning && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="text-center space-y-6">
            {/* Animated camera icon */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 animate-spin opacity-75" />
              <div className="absolute inset-2 rounded-full bg-black flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              </div>
            </div>

            {/* Loading text */}
            <div className="space-y-2">
              <p className="text-white text-xl font-semibold">Activating Camera</p>
              <p className="text-white/60 text-sm">Please allow camera access...</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-muted0 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied State */}
      {error && error.includes('permission') && (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg p-8 max-w-md text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Camera Access Required</h2>
            <p className="text-muted-foreground">
              Please allow camera access to use the scanner feature. You can change this in your browser settings.
            </p>
            <Button onClick={handleClose} className="w-full">
              Go Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
