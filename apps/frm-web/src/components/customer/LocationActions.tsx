/**
 * LocationActions Component
 * Provides GPS navigation and copy functionality for customer locations
 * Reference: Mobile-first SFA design pattern
 */

import { useState } from 'react'
import { MapPin, Navigation, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface LocationActionsProps {
  latitude: number | null | undefined
  longitude: number | null | undefined
  customerName?: string
  variant?: 'default' | 'compact'
}

export function LocationActions({
  latitude,
  longitude,
  customerName = 'this location',
  variant = 'default'
}: LocationActionsProps) {
  const [copied, setCopied] = useState(false)

  // Don't show if no coordinates at all
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null
  }

  const handleNavigate = (e: React.MouseEvent) => {
    // Prevent parent card click
    e.stopPropagation()

    // Format coordinates for Google Maps
    const coords = `${latitude},${longitude}`

    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // Use geo: URI scheme for native Maps app
      // This works on both iOS (Apple Maps) and Android (Google Maps)
      window.location.href = `geo:${coords}?q=${coords}`
    } else {
      // Use Google Maps web URL for desktop
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords}`
      window.open(mapsUrl, '_blank')
    }

    toast.success(`Opening navigation to ${customerName}`)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    // Prevent parent card click
    e.stopPropagation()

    const coords = `${latitude},${longitude}`

    try {
      await navigator.clipboard.writeText(coords)
      setCopied(true)
      toast.success('Location copied to clipboard')

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy location')
      console.error('Copy failed:', error)
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigate}
          className="h-7 px-2 text-xs"
        >
          <Navigation className="h-3 w-3 mr-1" />
          Navigate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <MapPin className="h-3 w-3 text-muted-foreground" />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNavigate}
        className="h-7 px-2 text-xs hover:bg-muted hover:text-foreground"
      >
        <Navigation className="h-3 w-3 mr-1" />
        Navigate
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs hover:bg-muted"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1 text-primary" />
            <span className="text-primary">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}
