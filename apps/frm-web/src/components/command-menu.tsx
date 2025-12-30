/**
 * CommandMenu - Placeholder for global search
 * TODO: Implement full command palette with navigation
 */

import { useSearch } from '@/context/search-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'

export function CommandMenu() {
  const { open, setOpen } = useSearch()

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {/* TODO: Add command items */}
      </CommandList>
    </CommandDialog>
  )
}
