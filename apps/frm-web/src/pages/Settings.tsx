/**
 * Settings Page
 * User profile, app preferences, sync status, and help/support
 * Reference: specs/001-sfa-app-build/tasks.md NAV-004
 */

import { useState } from 'react'
import { useFrappeAuth } from 'frappe-react-sdk'
import { useAuthStore } from '@/stores/auth-store'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  RefreshCw,
  Check,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Info,
  Mail,
  Phone,
  RotateCcw,
  Layout,
  Sidebar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/context/theme-provider'
import { useLayout } from '@/context/layout-provider'
import { useSidebar } from '@/components/ui/sidebar'
import { type Collapsible } from '@/context/layout-provider'
import { toast } from 'sonner'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

export default function Settings() {
  const { user, logout: logoutStore } = useAuthStore()
  const { logout: logoutFrappe } = useFrappeAuth()
  const { theme, setTheme, defaultTheme, resetTheme } = useTheme()
  const {
    variant,
    setVariant,
    defaultVariant,
    collapsible,
    setCollapsible,
    defaultCollapsible,
    resetLayout
  } = useLayout()
  const { open, setOpen } = useSidebar()
  const navigate = useNavigate()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Notification preferences
  const [notifyVisitReminders, setNotifyVisitReminders] = useState(true)
  const [notifyOrderUpdates, setNotifyOrderUpdates] = useState(true)
  const [notifyStockAlerts, setNotifyStockAlerts] = useState(true)
  const [notifyRouteChanges, setNotifyRouteChanges] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutFrappe()
      logoutStore()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Failed to logout', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000))
      setLastSync(new Date())
      toast.success('Sync completed', {
        description: 'All data is up to date'
      })
    } catch (error) {
      toast.error('Sync failed', {
        description: 'Please check your connection and try again'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleResetAll = () => {
    setOpen(true)
    resetTheme()
    resetLayout()
    toast.success('All settings reset to defaults')
  }

  const handleLayoutChange = (value: string) => {
    if (value === 'default') {
      setOpen(true)
      return
    }
    setOpen(false)
    setCollapsible(value as Collapsible)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const appVersion = '1.0.0' // TODO: Get from package.json

  return (
    <>
      
<StandardHeader />

      <Main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and app preferences
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user ? getInitials(user.full_name || user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold text-lg">
                {user?.full_name || user?.name || 'User'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {user?.email || 'No email'}
              </div>
              {(user as any)?.mobile_no && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {(user as any).mobile_no}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            App Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Preferences */}
          <div className="space-y-4">
            <Label>Notification Preferences</Label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-visits" className="font-normal">
                    Visit Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about upcoming customer visits
                  </p>
                </div>
                <Switch
                  id="notify-visits"
                  checked={notifyVisitReminders}
                  onCheckedChange={setNotifyVisitReminders}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-orders" className="font-normal">
                    Order Updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates on order status changes
                  </p>
                </div>
                <Switch
                  id="notify-orders"
                  checked={notifyOrderUpdates}
                  onCheckedChange={setNotifyOrderUpdates}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-stock" className="font-normal">
                    Stock Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Alert me when stock levels are low
                  </p>
                </div>
                <Switch
                  id="notify-stock"
                  checked={notifyStockAlerts}
                  onCheckedChange={setNotifyStockAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-routes" className="font-normal">
                    Route Changes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify when route plans are updated
                  </p>
                </div>
                <Switch
                  id="notify-routes"
                  checked={notifyRouteChanges}
                  onCheckedChange={setNotifyRouteChanges}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Layout */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Appearance & Layout
          </CardTitle>
          <CardDescription>
            Customize the visual appearance and layout of the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Theme Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Theme
              {theme !== defaultTheme && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-4 w-4 rounded-full"
                  onClick={() => setTheme(defaultTheme)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color theme
            </p>
          </div>

          <Separator />

          {/* Sidebar Configuration */}
          <div className="space-y-2 max-md:hidden">
            <Label className="flex items-center gap-2">
              <Sidebar className="h-4 w-4" />
              Sidebar Style
              {variant !== defaultVariant && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-4 w-4 rounded-full"
                  onClick={() => setVariant(defaultVariant)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inset">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-muted-foreground rounded-sm" />
                    Inset
                  </div>
                </SelectItem>
                <SelectItem value="floating">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-muted-foreground rounded" />
                    Floating
                  </div>
                </SelectItem>
                <SelectItem value="sidebar">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-sm" />
                    Sidebar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the sidebar style that fits your workflow
            </p>
          </div>

          <Separator className="max-md:hidden" />

          {/* Layout Configuration */}
          <div className="space-y-2 max-md:hidden">
            <Label className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout Mode
              {(open ? 'default' : collapsible) !== 'default' && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-4 w-4 rounded-full"
                  onClick={() => {
                    setOpen(true)
                    setCollapsible(defaultCollapsible)
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </Label>
            <Select
              value={open ? 'default' : collapsible}
              onValueChange={handleLayoutChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted border border-muted-foreground rounded-sm" />
                    Default
                  </div>
                </SelectItem>
                <SelectItem value="icon">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    Compact
                  </div>
                </SelectItem>
                <SelectItem value="offcanvas">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted border-2 border-dashed border-muted-foreground rounded-sm" />
                    Full Layout
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how the sidebar behaves and displays content
            </p>
          </div>

          <Separator />

          {/* Reset All Settings */}
          <div className="space-y-2">
            <Label>Reset Settings</Label>
            <Button
              variant="destructive"
              onClick={handleResetAll}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All to Defaults
            </Button>
            <p className="text-xs text-muted-foreground">
              Restore all appearance and layout settings to their default values
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Keep your data up to date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastSync ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Last synced: {lastSync.toLocaleString()}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No sync performed yet
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full"
            variant="outline"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => toast.info('Documentation coming soon')}
          >
            <span>Documentation</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => toast.info('FAQ coming soon')}
          >
            <span>Frequently Asked Questions</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => toast.info('Support contact: support@example.com')}
          >
            <span>Contact Support</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-sm text-muted-foreground px-3">
            <span>App Version</span>
            <span className="font-mono">{appVersion}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="mt-6 border-destructive/50">
        <CardContent className="pt-6">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Log Out
          </Button>
        </CardContent>
      </Card>
      </Main>
    </>
  )
}
