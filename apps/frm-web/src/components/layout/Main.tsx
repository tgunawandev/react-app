/**
 * Main Content Component
 * Provides semantic main element with responsive max-width constraints
 * Reference: shadcn-admin/src/components/layout/main.tsx
 */

import { cn } from '@/lib/utils'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  fluid?: boolean
}

export function Main({ fixed, className, fluid, children, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        // If layout is fixed, make the main container flex and grow
        fixed && 'flex flex-1 flex-col overflow-hidden',

        // If layout is not fixed, add standard padding
        !fixed && 'px-4 py-6 pb-24 md:pb-6',

        // If layout is not fluid, set the max-width
        !fluid && !fixed &&
          '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',
        className
      )}
      {...props}
    >
      {children}
    </main>
  )
}
