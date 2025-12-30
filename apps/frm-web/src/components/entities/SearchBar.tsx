/**
 * SearchBar Component - Cross-DocType Search
 * Searches across Customers, Sales Orders, Items, Route Plans
 * Reference: specs/001-sfa-app-build/tasks.md ENT-002
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,  CommandItem,
  CommandList
} from '@/components/ui/command'
import { searchAcrossDocTypes } from '@/lib/searchUtils'
import type { SearchResult } from '@/lib/searchUtils'

export function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Debounced search with 300ms delay
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const searchResults = await searchAcrossDocTypes(query)
        setResults(searchResults)
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleResultClick = (result: SearchResult) => {
    // Navigate to list page with ID query parameter to trigger modal
    const routes: Record<string, string> = {
      'Customer': `/customers?id=${result.name}`,
      'Item': `/products?id=${result.name}`,
      'Sales Order': `/orders?id=${result.name}`,
      'Delivery Order': `/deliveries?id=${result.name}`,
      'Sales Invoice': `/invoices/${result.name}`, // Has dedicated detail page
      'Payment Entry': `/payments?id=${result.name}`,
      'Delivery Return': `/delivery-returns?id=${result.name}`,
      'Route Plan': `/routes/visits/${result.name}` // Has dedicated detail page
    }

    const route = routes[result.doctype]
    if (route) {
      navigate(route)
      setQuery('')
      setShowResults(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search customers, orders, items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
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

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50">
          <Command>
            <CommandList>
              {isSearching && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}

              {!isSearching && results.length === 0 && query.length >= 2 && (
                <CommandEmpty>No results found for "{query}"</CommandEmpty>
              )}

              {!isSearching && results.length > 0 && (
                <>
                  {/* Group by DocType */}
                  {['Customer', 'Item', 'Sales Order', 'Delivery Order', 'Sales Invoice', 'Payment Entry', 'Delivery Return', 'Route Plan'].map(doctype => {
                    const doctypeResults = results.filter(r => r.doctype === doctype)
                    if (doctypeResults.length === 0) return null

                    return (
                      <CommandGroup key={doctype} heading={doctype}>
                        {doctypeResults.map(result => (
                          <CommandItem
                            key={`${result.doctype}-${result.name}`}
                            onSelect={() => handleResultClick(result)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col flex-1">
                              <div className="font-medium">{result.display_name}</div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-foreground">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            {result.match_type === 'exact' && (
                              <span className="ml-auto text-xs text-primary font-medium">Exact</span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  })}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}

      {/* Backdrop to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}
