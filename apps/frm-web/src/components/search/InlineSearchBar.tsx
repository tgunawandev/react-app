/**
 * InlineSearchBar Component
 * Animated inline search bar for list screens
 * Reference: specs/001-sfa-app-build/tasks.md SEARCH-002
 */

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface InlineSearchBarProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export function InlineSearchBar({
  isOpen,
  onClose,
  onSearch,
  placeholder = 'Search...',
  initialValue = ''
}: InlineSearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Call onSearch when query changes (real-time filtering)
  useEffect(() => {
    onSearch(query)
  }, [query, onSearch])

  // Reset query when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="animate-slide-down border-b bg-background p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {query && (
        <div className="mt-2 text-xs text-muted-foreground">
          Searching for "{query}"...
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
