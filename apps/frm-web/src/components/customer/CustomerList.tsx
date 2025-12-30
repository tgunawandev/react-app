/**
 * CustomerList Component
 * Displays customers with territory filtering and search
 * Reference: specs/001-sfa-app-build/tasks.md US4-003
 */

import { useState } from 'react'
import { useCustomers, type CustomerWithStats } from '@/hooks/useCustomers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { MapPin, Search, Phone, Mail, ChevronRight } from 'lucide-react'
import { LocationActions } from './LocationActions'

interface CustomerListProps {
  onCustomerSelect?: (customer: CustomerWithStats) => void
  selectMode?: boolean
}

export function CustomerList({ onCustomerSelect, selectMode = false }: CustomerListProps) {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { customers, totalCount, hasMore, isLoading, error } = useCustomers({
    search,
    limit,
    offset
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setOffset(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleLoadMore = () => {
    setOffset(offset + limit)
  }

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit))
  }

  const handleCustomerClick = (customer: CustomerWithStats) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Customers</CardTitle>
          <CardDescription>{error.message || 'Failed to load customers'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Browse and manage customers in your territory
        </p>
      </div>

      {/* Filters Row */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Filter customers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 w-40 lg:w-[250px]"
            />
            <Button onClick={handleSearch} variant="secondary" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          </div>

        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              {offset + 1}-{Math.min(offset + limit, totalCount)} of {totalCount}
            </>
          )}
        </div>
      </div>

      <Separator className="shadow-sm" />

      {/* Customer List */}
      <div className="grid gap-4">
        {isLoading && customers.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : customers.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No customers found</p>
              {search && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch('')
                    setSearchInput('')
                    setOffset(0)
                  }}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          // Customer cards
          customers.map((customer) => (
            <Card
              key={customer.name}
              className={`transition-all ${selectMode ? 'cursor-pointer hover:shadow-md' : ''}`}
              onClick={() => handleCustomerClick(customer)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Customer Name & Type */}
                    <div>
                      <h3 className="text-lg font-semibold">{customer.customer_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {customer.active && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {customer.mobile && customer.mobile !== '0' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{customer.mobile}</span>
                        </div>
                      )}
                      {customer.email && customer.email !== '0' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {(customer.street || customer.city) && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {customer.street}
                          {customer.city && `, ${customer.city}`}
                        </span>
                      </div>
                    )}

                    {/* GPS Location Actions */}
                    <LocationActions
                      latitude={customer.gps_latitude}
                      longitude={customer.gps_longitude}
                      customerName={customer.customer_name}
                      variant="default"
                    />
                  </div>

                  {selectMode && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {customers.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {Math.floor(offset / limit) + 1}
          </span>
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
