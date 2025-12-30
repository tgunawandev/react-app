/**
 * CameraPreview Component
 * Displays live camera feed for scanning
 * Reference: specs/001-sfa-app-build/tasks.md SCAN-002
 */

import type { RefObject } from 'react'

export interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement>
  isActive: boolean
}

export function CameraPreview({ videoRef, isActive }: CameraPreviewProps) {
  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Element - Full screen camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Vignette effect for focus */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.6) 100%)'
          }}
        />
      )}
    </div>
  )
}
