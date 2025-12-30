/**
 * usePullToRefresh Hook
 * Pull-to-refresh gesture for mobile screens
 * Reference: specs/001-sfa-app-build/tasks.md SHARED-001
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPullDistance?: number
  enabled?: boolean
}

export interface PullToRefreshState {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
  lastSyncTime: Date | null
}

/**
 * Hook for implementing pull-to-refresh gesture
 */
export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    enabled = true
  } = options

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    lastSyncTime: getSavedSyncTime()
  })

  const touchStartY = useRef<number>(0)
  const scrollTop = useRef<number>(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return

    const target = e.target as HTMLElement
    const scrollContainer = target.closest('[data-pull-to-refresh]') as HTMLElement

    if (scrollContainer) {
      scrollTop.current = scrollContainer.scrollTop
      touchStartY.current = e.touches[0].clientY
    }
  }, [enabled])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return

    const target = e.target as HTMLElement
    const scrollContainer = target.closest('[data-pull-to-refresh]') as HTMLElement

    if (!scrollContainer || scrollContainer.scrollTop > 0) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0 }))
      return
    }

    const touchY = e.touches[0].clientY
    const pullDistance = Math.max(0, touchY - touchStartY.current)

    if (pullDistance > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault()

      // Apply resistance as user pulls
      const resistance = 0.5
      const adjustedDistance = Math.min(
        pullDistance * resistance,
        maxPullDistance
      )

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: adjustedDistance
      }))
    }
  }, [enabled, state.isRefreshing, maxPullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!enabled) return

    const { pullDistance } = state

    if (pullDistance >= threshold) {
      // Trigger refresh
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false
      }))

      try {
        await onRefresh()
        const now = new Date()
        saveSyncTime(now)
        setState(prev => ({
          ...prev,
          lastSyncTime: now
        }))
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0
        }))
      }
    } else {
      // Reset state
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0
      }))
    }
  }, [enabled, state, threshold, onRefresh])

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  /**
   * Format last sync time as relative string
   */
  const formatLastSync = useCallback((): string => {
    if (!state.lastSyncTime) return 'Never synced'

    const now = new Date()
    const diff = now.getTime() - state.lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes === 1) return '1 minute ago'
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hour ago'
    if (hours < 24) return `${hours} hours ago`

    const days = Math.floor(hours / 24)
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }, [state.lastSyncTime])

  return {
    ...state,
    threshold,
    formatLastSync
  }
}

/**
 * Save sync time to localStorage
 */
function saveSyncTime(time: Date): void {
  try {
    localStorage.setItem('last_sync_time', time.toISOString())
  } catch (error) {
    console.error('Error saving sync time:', error)
  }
}

/**
 * Get saved sync time from localStorage
 */
function getSavedSyncTime(): Date | null {
  try {
    const saved = localStorage.getItem('last_sync_time')
    return saved ? new Date(saved) : null
  } catch (error) {
    console.error('Error loading sync time:', error)
    return null
  }
}
