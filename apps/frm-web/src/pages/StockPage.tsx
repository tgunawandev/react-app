/**
 * Stock Monitoring Page
 * Stock level monitoring with filters and reorder alerts
 * Reference: specs/001-sfa-app-build/tasks.md US7-001
 */

import { useState } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { StockList } from '@/components/stock/StockList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, Search, RefreshCw } from 'lucide-react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

interface StockResponse {
  stock_items: Array<{
    item_code: string
    item_name: string
    product_category?: string
    uom: string
    available_stock: number
    reorder_level: number
    reorder_qty: number
    list_price: number
    needs_reorder: number
  }>
  total_count: number
  reorder_count: number
}

export default function StockPage() {
  const [classification, setClassification] = useState<string>()
  const [showReorderOnly, setShowReorderOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Build API params
  const params: Record<string, string> = {
    limit: '50',
    offset: '0'
  }

  if (classification && classification !== '__all__') {
    params.classification = classification
  }

  if (showReorderOnly) {
    params.show_reorder_only = 'true'
  }

  if (searchQuery) {
    params.item_code = searchQuery
  }

  const { data, error, isLoading, mutate } = useFrappeGetCall<StockResponse>(
    'frm.api.stock.get_stock_levels',
    params,
    `stock-levels-${JSON.stringify(params)}`,
    {
      revalidateOnFocus: false
    }
  )

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRefresh = () => {
    mutate()
  }

  return (
    <>
      
<StandardHeader />

      <Main>
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6" />
          Stock Monitoring
        </h1>
        <p className="text-muted-foreground">
          Track inventory levels and reorder alerts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_count || 0}</div>
            <p className="text-xs text-muted-foreground">Active items in stock</p>
          </CardContent>
        </Card>

        <Card className="border-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">
              {data?.reorder_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {data?.stock_items?.reduce((sum, item) => sum + (item.available_stock * item.list_price), 0).toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter stock items by criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Item Code</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button onClick={handleSearch} variant="secondary" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="classification">Category</Label>
              <Select value={classification} onValueChange={setClassification}>
                <SelectTrigger id="classification">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  <SelectItem value="Consumable">Consumable</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Storable Product">Storable Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for All vs Reorder Only */}
      <Tabs value={showReorderOnly ? 'reorder' : 'all'} onValueChange={(v) => setShowReorderOnly(v === 'reorder')} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all">
            All Stock
            {data?.total_count !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {data.total_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reorder">
            Reorder Alerts
            {data?.reorder_count !== undefined && data.reorder_count > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.reorder_count}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">
                  Error loading stock: {error.message || 'Please try again'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <StockList items={(data?.stock_items || []) as any} isLoading={isLoading} />
          )}
        </TabsContent>

        <TabsContent value="reorder" className="mt-6">
          {error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">
                  Error loading stock: {error.message || 'Please try again'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <StockList items={(data?.stock_items || []) as any} isLoading={isLoading} />
          )}
        </TabsContent>
      </Tabs>
      </Main>
    </>
  )
}
