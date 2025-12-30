/**
 * QRScanner Component - Customer Check-in Scanner
 * Wrapper around camera scanner for customer QR code validation
 * Shows customer details after successful scan and enables visit start
 * Reference: specs/001-sfa-app-build/tasks.md QR-003
 */

import { useState } from 'react'
import { useFrappePostCall } from 'frappe-react-sdk'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CameraPreview } from '@/components/scanner/CameraPreview'
import { useScanner, type CustomerScanResult } from '@/hooks/useScanner'
import { AlertCircle, CheckCircle2, MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'

export interface QRScannerProps {
  onVisitStart?: (customer_id: string, customer_data: CustomerScanResult) => void
  onClose?: () => void
}

export function QRScanner({ onVisitStart, onClose }: QRScannerProps) {
  const [scannedCustomer, setScannedCustomer] = useState<CustomerScanResult | null>(null)
  const { isScanning, videoRef, result, error, startScanning, stopScanning, reset } = useScanner()
  const videoRefTyped = videoRef as React.RefObject<HTMLVideoElement>

  // API call to start visit
  const { call: startVisit, loading: visitStarting } = useFrappePostCall(
    'frm.api.visit.start_visit'
  )

  // Handle QR code detection
  const handleScanSuccess = (customerData: CustomerScanResult) => {
    setScannedCustomer(customerData)
    stopScanning()
  }

  // Effect: Process scan results
  if (result?.customerData && !scannedCustomer) {
    handleScanSuccess(result.customerData)
  }

  // Handle start visit button click
  const handleStartVisit = async () => {
    if (!scannedCustomer) return

    try {
      await startVisit({
        customer_id: scannedCustomer.customer_id,
        check_in_method: 'qr_scan'
      })

      toast.success(`Visit started for ${scannedCustomer.customer_name}`)

      if (onVisitStart) {
        onVisitStart(scannedCustomer.customer_id, scannedCustomer)
      }

      // Close scanner
      handleClose()
    } catch (err: any) {
      const message = err?.message || 'Failed to start visit'
      toast.error(message)
    }
  }

  // Reset scanner and close
  const handleClose = () => {
    stopScanning()
    reset()
    setScannedCustomer(null)
    if (onClose) {
      onClose()
    }
  }

  // Start scanning on mount
  const handleOpenChange = (open: boolean) => {
    if (open && !isScanning) {
      startScanning()
    } else if (!open) {
      handleClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Customer Check-in via QR Code</DialogTitle>
          <DialogDescription>
            {scannedCustomer
              ? 'Confirm customer details and start visit'
              : 'Point camera at customer QR code to scan'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!scannedCustomer ? (
            // Scanning View
            <div className="h-full flex flex-col">
              {/* Camera Preview */}
              <div className="flex-1 bg-black">
                <CameraPreview videoRef={videoRefTyped} isActive={isScanning} />
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="m-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              {!isScanning && (
                <div className="bg-muted border border-muted rounded-sm p-4 m-4">
                  <p className="text-sm text-foreground">
                    Click the button below to start camera and begin scanning
                  </p>
                </div>
              )}

              {isScanning && (
                <div className="bg-primary/5 border border-primary/20 rounded-sm p-4 m-4">
                  <p className="text-sm text-foreground">
                    Align QR code within the frame to scan
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Scanned Customer Details View
            <div className="h-full overflow-y-auto px-6 py-6">
              {/* Success Alert */}
              <Alert className="mb-6 bg-primary/5 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  Customer found successfully!
                </AlertDescription>
              </Alert>

              {/* Customer Information Card */}
              <div className="space-y-4 mb-6">
                {/* Customer Name */}
                <div className="pb-4 border-b">
                  <h3 className="text-lg font-semibold text-foreground">
                    {scannedCustomer.customer_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ID: {scannedCustomer.customer_id}
                  </p>
                </div>

                {/* Territory */}
                <div className="flex items-start gap-3">
                  <Badge variant="outline">{scannedCustomer.territory}</Badge>
                </div>

                {/* Route Status */}
                {scannedCustomer.is_in_route ? (
                  <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-foreground">
                      Customer is in today's route plan
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-secondary/5 border-secondary/20">
                    <AlertCircle className="h-4 w-4 text-secondary-foreground" />
                    <AlertDescription className="text-secondary-foreground">
                      Customer is not in today's route plan
                    </AlertDescription>
                  </Alert>
                )}

                {/* GPS Location */}
                {scannedCustomer.gps_latitude && scannedCustomer.gps_longitude && (
                  <div className="flex items-center gap-2 text-sm text-foreground bg-muted p-3 rounded">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">GPS Location</p>
                      <p className="text-xs text-muted-foreground">
                        {scannedCustomer.gps_latitude.toFixed(4)}, {scannedCustomer.gps_longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}

                {/* QR Code Reference */}
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono truncate">
                  QR: {scannedCustomer.customer_id}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 px-6 py-4 border-t bg-muted">
          {!scannedCustomer ? (
            <>
              {!isScanning && (
                <Button
                  onClick={() => startScanning()}
                  className="flex-1"
                  size="lg"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              )}
              {isScanning && (
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Stop Scanning
                </Button>
              )}
              <Button
                onClick={handleClose}
                variant="ghost"
                size="lg"
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleStartVisit}
                className="flex-1"
                size="lg"
                disabled={visitStarting}
              >
                {visitStarting ? 'Starting Visit...' : 'Start Visit'}
              </Button>
              <Button
                onClick={() => {
                  setScannedCustomer(null)
                  reset()
                  startScanning()
                }}
                variant="outline"
                size="lg"
              >
                Scan Another
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
