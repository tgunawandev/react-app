/**
 * Protected Route Component
 * Handles authentication state and redirects to login if not authenticated
 * Reference: specs/001-sfa-app-build/tasks.md AUTH-006
 *
 * Authentication is enforced in both DEV and PRODUCTION modes.
 * Redirects to Frappe login if user is not authenticated.
 */

import { useEffect } from 'react'
import { useFrappeAuth } from 'frappe-react-sdk'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useFrappeAuth()

  // Redirect to Frappe login if not authenticated (Guest user or null)
  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser === 'Guest')) {
      // Build login URL - always redirect back to the SFA app at /frm
      const loginBaseUrl = import.meta.env.DEV ? 'http://sfa.local:8000' : ''
      // After login, redirect to /frm (the SFA app entry point)
      const redirectUrl = encodeURIComponent('/frm')
      window.location.href = `${loginBaseUrl}/login?redirect-to=${redirectUrl}`
    }
  }, [currentUser, isLoading])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-96">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser === 'Guest') {
    // Show loading while redirecting to login
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-96">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}
