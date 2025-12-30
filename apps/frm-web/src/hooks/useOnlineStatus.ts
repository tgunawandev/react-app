/**
 * Online Status Hook
 * Monitor network connectivity and provide online/offline status
 * Reference: specs/001-sfa-app-build/tasks.md INFRA-001
 */

import { useState, useEffect } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  wasOffline: boolean
}

/**
 * Hook to monitor online/offline connectivity status
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Track that we were offline to show reconnection message
      if (!navigator.onLine) {
        setWasOffline(true)
        // Clear the flag after 3 seconds
        setTimeout(() => setWasOffline(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}
