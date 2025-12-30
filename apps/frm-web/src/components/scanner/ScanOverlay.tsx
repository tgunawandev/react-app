/**
 * ScanOverlay Component - Modern Scanner UI
 * Beautiful scan overlay with animated corners and gradient effects
 */

export interface ScanOverlayProps {
  instructionText?: string
  showInstructions?: boolean
}

export function ScanOverlay({
  instructionText = 'Position QR code or barcode within the frame',
  showInstructions = true
}: ScanOverlayProps) {
  return (
    <>
      {/* Darkened overlay with cutout for scan area */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient for scan area border */}
            <linearGradient id="scanBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
            </linearGradient>

            {/* Mask for cutout */}
            <mask id="scanAreaMask">
              <rect width="100" height="100" fill="white" />
              <rect x="15" y="25" width="70" height="50" rx="2" ry="2" fill="black" />
            </mask>
          </defs>

          {/* Dark overlay with mask */}
          <rect
            width="100"
            height="100"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#scanAreaMask)"
          />
        </svg>
      </div>

      {/* Scan frame container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative"
          style={{
            width: '70%',
            height: '50%',
            maxWidth: '400px',
            maxHeight: '300px'
          }}
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-90 animate-pulse" />

          {/* Inner transparent area */}
          <div className="absolute inset-[3px] rounded-2xl bg-transparent" />

          {/* Corner brackets - Top Left */}
          <div className="absolute -top-2 -left-2 w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-white rounded-full shadow-lg shadow-blue-500/50" />
            <div className="absolute top-0 left-0 w-1 h-full bg-white rounded-full shadow-lg shadow-blue-500/50" />
            <div className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full animate-ping" />
            <div className="absolute top-0 left-0 w-3 h-3 bg-muted0 rounded-full" />
          </div>

          {/* Corner brackets - Top Right */}
          <div className="absolute -top-2 -right-2 w-12 h-12">
            <div className="absolute top-0 right-0 w-full h-1 bg-white rounded-full shadow-lg shadow-purple-500/50" />
            <div className="absolute top-0 right-0 w-1 h-full bg-white rounded-full shadow-lg shadow-purple-500/50" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-purple-400 rounded-full animate-ping" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-full" />
          </div>

          {/* Corner brackets - Bottom Left */}
          <div className="absolute -bottom-2 -left-2 w-12 h-12">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-full shadow-lg shadow-purple-500/50" />
            <div className="absolute bottom-0 left-0 w-1 h-full bg-white rounded-full shadow-lg shadow-purple-500/50" />
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-purple-400 rounded-full animate-ping" />
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-purple-500 rounded-full" />
          </div>

          {/* Corner brackets - Bottom Right */}
          <div className="absolute -bottom-2 -right-2 w-12 h-12">
            <div className="absolute bottom-0 right-0 w-full h-1 bg-white rounded-full shadow-lg shadow-pink-500/50" />
            <div className="absolute bottom-0 right-0 w-1 h-full bg-white rounded-full shadow-lg shadow-pink-500/50" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-pink-400 rounded-full animate-ping" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-pink-500 rounded-full" />
          </div>

          {/* Scanning line animation */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-75 animate-scan-line shadow-lg shadow-white/50" />
          </div>

          {/* Center target indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-ping" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-white rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Instruction text */}
      {showInstructions && (
        <div className="absolute top-20 left-0 right-0 flex justify-center px-4 pointer-events-none z-50">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50 rounded-full" />

            {/* Text container */}
            <div className="relative bg-black/80 backdrop-blur-md px-8 py-4 rounded-full border border-white/20 shadow-2xl">
              <p className="text-white text-base font-semibold tracking-wide text-center">
                {instructionText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scan tips at bottom */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center px-4 pointer-events-none z-40">
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
            <span className="font-medium">Hold steady for best results</span>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes scan-line {
          0% {
            top: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        .animate-scan-line {
          animation: scan-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </>
  )
}
