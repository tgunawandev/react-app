/**
 * SearchIcon Component
 * Search icon button for toggling inline search bar
 * Reference: specs/001-sfa-app-build/tasks.md SEARCH-001
 */

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface SearchIconProps {
  onClick: () => void
  isActive?: boolean
}

export function SearchIcon({ onClick, isActive = false }: SearchIconProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      size="icon"
      onClick={onClick}
      aria-label="Toggle search"
      className={isActive ? 'bg-primary text-primary-foreground' : ''}
    >
      <Search className="h-5 w-5" />
    </Button>
  )
}
