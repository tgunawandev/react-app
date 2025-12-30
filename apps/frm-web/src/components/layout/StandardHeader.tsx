/**
 * StandardHeader Component
 * Reusable header that ALL pages should use
 * Features: App branding on left, actions on right
 */

import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeSwitch } from '@/components/layout/ThemeSwitch'
import { Store, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StandardHeaderProps {
  children?: React.ReactNode
  className?: string
}

export function StandardHeader({ children, className }: StandardHeaderProps) {
  const navigate = useNavigate()

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  return (
    <Header fixed className={cn(className)}>
      {/* App Icon/Branding */}
      <div className='flex items-center gap-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary'>
          <Store className='h-5 w-5 text-primary-foreground' />
        </div>
        <span className='hidden font-semibold sm:inline-block'>FRM</span>
      </div>

      {children}

      {/* Right-side actions */}
      <div className='ms-auto flex items-center space-x-4'>
        <NotificationBell />
        <ThemeSwitch />
        <Button
          size='icon'
          variant='ghost'
          onClick={handleSettingsClick}
          aria-label='Open settings'
          className='rounded-full'
        >
          <Settings className='h-4 w-4' />
        </Button>
      </div>
    </Header>
  )
}
