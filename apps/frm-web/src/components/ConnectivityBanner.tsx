/**
 * Connectivity Banner Component
 * Display banner when offline/online status changes
 * Reference: specs/001-sfa-app-build/tasks.md INFRA-001
 */

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff, Wifi } from 'lucide-react'

export default function ConnectivityBanner() {
  const { isOnline, wasOffline } = useOnlineStatus()

  // Don't show anything if online and was never offline
  if (isOnline && !wasOffline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2">
      <Alert
        variant={isOnline ? 'default' : 'destructive'}
        className={`${
          isOnline ? 'bg-primary text-primary-foreground' : 'bg-destructive/5 border-destructive'
        }`}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 text-primary" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        <AlertDescription className="ml-2">
          {isOnline ? (
            <span className="text-foreground">
              <strong>Back online!</strong> Your connection has been restored.
            </span>
          ) : (
            <span className="text-destructive">
              <strong>No internet connection.</strong> Some features may not work. Please check
              your network connection.
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
