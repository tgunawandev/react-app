/**
 * Search Component
 * Global search bar for header
 * Simplified version from shadcn-admin
 */

import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function Search() {
  return (
    <div className="relative flex-1 md:max-w-sm">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
      />
    </div>
  )
}
