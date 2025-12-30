/**
 * ProductCatalog Component
 * Displays products with search, filters, and add-to-cart functionality
 * Reference: specs/001-sfa-app-build/tasks.md US5-007
 */

import { useState } from 'react'
import { useProductCatalog, type ProductWithStock } from '@/hooks/useProductCatalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Package } from 'lucide-react'

interface ProductCatalogProps {
  customer?: string
  onAddToCart: (product: ProductWithStock, qty: number) => void
}

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState<string>()
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { products, totalCount, hasMore, isLoading, error } = useProductCatalog({
    search,
    category: category === '__all__' ? undefined : category,
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

  const handleAddToCart = (product: ProductWithStock) => {
    onAddToCart(product, 1) // Default quantity 1
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Products</CardTitle>
          <CardDescription>{error.message || 'Failed to load product catalog'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Browse and add products to your order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                <SelectItem value="Consumable">Consumable</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Storable Product">Storable Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `Showing ${offset + 1}-${Math.min(offset + limit, totalCount)} of ${totalCount} products`}
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && products.length === 0 ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : products.length === 0 ? (
          // Empty state
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
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
          // Product cards
          products.map((product) => (
            <Card key={product.item_code} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Product Image */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.item_name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Product Name & Code */}
                  <div>
                    <h3 className="font-semibold line-clamp-2">{product.item_name}</h3>
                    <p className="text-xs text-muted-foreground">{product.item_code}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {product.product_category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.product_category}
                      </Badge>
                    )}
                    {product.in_stock && (
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        In Stock
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold">
                        Rp {product.list_price?.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ {product.uom}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.available_stock} {product.uom}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    variant="default"
                    disabled={product.available_stock <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {product.available_stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {Math.floor(offset / limit) + 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
