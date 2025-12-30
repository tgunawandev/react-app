/**
 * CustomerSelect Component
 * Reusable searchable customer dropdown using Command (combobox) pattern
 * Designed for 12,000+ customers with search-as-you-type functionality
 */

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCustomers, type CustomerWithStats } from '@/hooks/useCustomers'

export interface CustomerSelectProps {
  /** Currently selected customer ID */
  value?: string
  /** Callback when customer is selected */
  onValueChange: (customerId: string, customerName?: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Label for accessibility */
  label?: string
  /** Whether the component is disabled */
  disabled?: boolean
  /** Additional class names */
  className?: string
  /** Error state */
  error?: boolean
  /** Show customer code in the selection */
  showCode?: boolean
  /** Display label when customer not found in search results */
  selectedLabel?: string
}

export function CustomerSelect({
  value,
  onValueChange,
  placeholder = 'Select customer...',
  label = 'Customer',
  disabled = false,
  className,
  error = false,
  showCode = true,
  selectedLabel,
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCustomerCache, setSelectedCustomerCache] = useState<CustomerWithStats | null>(null)

  // Clear cache when value is cleared
  useEffect(() => {
    if (!value) {
      setSelectedCustomerCache(null)
    }
  }, [value])

  // Fetch customers with search
  const { customers, isLoading } = useCustomers({
    limit: 50,
    search: search.length >= 2 ? search : undefined,
  })

  // Find selected customer for display
  const selectedCustomer = useMemo(() => {
    if (!value) return null
    return customers.find(
      (c) => c.customer_id === value || c.name === value || c.customer_code === value
    )
  }, [value, customers])

  // Filter customers based on search (client-side for already fetched data)
  const filteredCustomers = useMemo(() => {
    if (!search || search.length < 2) return customers

    const searchLower = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.customer_code?.toLowerCase().includes(searchLower) ||
        c.customer_id?.toLowerCase().includes(searchLower) ||
        c.name?.toLowerCase().includes(searchLower)
    )
  }, [customers, search])

  const handleSelect = (customerId: string) => {
    const customer = customers.find(
      (c) => c.customer_id === customerId || c.name === customerId
    )

    // Cache the selected customer before clearing search
    if (customer) {
      setSelectedCustomerCache(customer)
    }

    // Call onValueChange with customer data before clearing search
    onValueChange(customerId, customer?.customer_name)
    setOpen(false)
    setSearch('')
  }

  // Display text for the selected customer
  const displayText = useMemo(() => {
    if (!value) return placeholder

    // First try selectedLabel from parent
    if (selectedLabel) return selectedLabel

    // Then try cached customer
    if (selectedCustomerCache &&
        (selectedCustomerCache.customer_id === value || selectedCustomerCache.name === value)) {
      // customer_name already includes the code, so just return it as-is
      return selectedCustomerCache.customer_name
    }

    // Then try to find in current search results
    if (selectedCustomer) {
      if (showCode && selectedCustomer.customer_code) {
        return `${selectedCustomer.customer_code} - ${selectedCustomer.customer_name}`
      }
      return selectedCustomer.customer_name
    }

    // Fallback to just the ID if customer not found
    return value
  }, [value, selectedLabel, selectedCustomerCache, selectedCustomer, placeholder, showCode])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className
          )}
        >
          <span className="truncate flex-1 text-left">
            {displayText}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <CommandEmpty>
                {search.length < 2
                  ? 'Type at least 2 characters to search...'
                  : 'No customers found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCustomers.map((customer) => {
                  const customerId = customer.customer_id || customer.name
                  if (!customerId) return null

                  return (
                    <CommandItem
                      key={customerId}
                      value={customerId}
                      onSelect={() => handleSelect(customerId)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === customerId ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {customer.customer_name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {customer.customer_code && (
                            <span className="font-mono">{customer.customer_code}</span>
                          )}
                          {customer.territory && (
                            <span className="truncate">• {customer.territory}</span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
          {filteredCustomers.length > 0 && (
            <div className="border-t px-2 py-2 text-xs text-muted-foreground text-center">
              Showing {filteredCustomers.length} customers
              {search.length >= 2 && ' (filtered)'}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
