/**
 * Products Page
 * Modal-based view with Sheet pattern (view-only, no create/edit)
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { useProductCatalog, type Product } from '@/hooks/useProductCatalog'
import { Badge } from '@/components/ui/badge'
import { EntitySheet } from '@/components/entity/EntitySheet'
import { useEntitySheet } from '@/components/entity/useEntitySheet'
import { ProductDetailView } from '@/components/product/ProductDetailView'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [classification, setClassification] = useState('all')
  const [priority, setPriority] = useState('all')

  const { products: allProducts, totalCount, isLoading } = useProductCatalog({
    search: searchTerm,
    limit: 50,
    offset: 0
  })

  // Client-side filtering for SFA classification and priority
  const products = allProducts.filter(product => {
    const classificationMatch = classification === 'all' || product.sfa_classification === classification
    const priorityMatch = priority === 'all' || product.field_priority === priority
    return classificationMatch && priorityMatch
  })

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Entity sheet state management
  const {
    selectedEntity,
    handleOpen,
    handleClose,
  } = useEntitySheet({
    entityType: 'Product'
  })

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedEntity) {
      // Directly open the modal - the detail fetch will load the data
      handleOpen(id, 'view')
      // Clean up URL immediately after triggering open
      setTimeout(() => setSearchParams({}), 100)
    }
  }, [searchParams, setSearchParams, selectedEntity, handleOpen])

  // Fetch product detail when selected (reuse catalog with specific search)
  const { products: detailProducts, isLoading: isLoadingDetail } = useProductCatalog({
    search: selectedEntity?.id || '',
    limit: 1,
    offset: 0
  })

  const selectedProduct = selectedEntity ? detailProducts.find(p => p.item_code === selectedEntity.id) || detailProducts[0] : null

  const handleProductClick = (product: Product) => {
    handleOpen(product.item_code, 'view')
  }

  const getStockBadge = (stock: number) => {
    if (stock > 100) {
      return <Badge variant="default" className="bg-primary">In Stock</Badge>
    } else if (stock > 0) {
      return <Badge variant="outline" className="border-secondary text-secondary-foreground">Low Stock</Badge>
    } else {
      return <Badge variant="outline" className="border-destructive text-destructive">Out of Stock</Badge>
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Products
          </h1>
          <p className='text-muted-foreground'>
            Browse product catalog with inventory and pricing
          </p>
        </div>
        {/* Search and Filters - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search products...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: Classification and Priority filters */}
          <div className='flex items-center gap-3'>
            <Select value={classification} onValueChange={setClassification}>
              <SelectTrigger className='w-full sm:w-48'>
                <SelectValue>Classification</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='Fast Moving'>Fast Moving</SelectItem>
                <SelectItem value='Slow Moving'>Slow Moving</SelectItem>
                <SelectItem value='New Launch'>New Launch</SelectItem>
                <SelectItem value='Promotional'>Promotional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className='w-full sm:w-48'>
                <SelectValue>Priority</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='High'>High Priority</SelectItem>
                <SelectItem value='Medium'>Medium Priority</SelectItem>
                <SelectItem value='Low'>Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Separator className='shadow-sm' />
        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && products.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : products.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No products found
            </li>
          ) : (
            products.map((product) => (
              <li
                key={product.item_code}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleProductClick(product)}
              >
                {product.image_url && (
                  <div className='mb-2'>
                    <img
                      src={product.image_url}
                      alt={product.item_name}
                      className='w-full h-24 object-cover rounded'
                    />
                  </div>
                )}

                {/* Header: Name + Code + Badges */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-0.5'>{product.item_name}</h2>
                  <p className='text-[11px] text-muted-foreground truncate'>{product.item_code}</p>
                  <div className='flex items-center gap-1 mt-1.5 flex-wrap'>
                    {product.sfa_classification && (
                      <Badge variant='outline' className='text-[10px] h-4 px-1.5'>{product.sfa_classification}</Badge>
                    )}
                    {product.field_priority && (
                      <Badge variant='secondary' className='text-[10px] h-4 px-1.5'>{product.field_priority}</Badge>
                    )}
                    {product.promotional_eligible === 1 && (
                      <Badge className='bg-purple-500 text-[10px] h-4 px-1.5'>Promo</Badge>
                    )}
                  </div>
                </div>

                {/* Odoo Integration */}
                {(product.odoo_name || product.odoo_state) && (
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-2'>
                    <ExternalLink className='h-3 w-3 shrink-0' />
                    {product.odoo_name && <span className='truncate text-[11px]'>{product.odoo_name}</span>}
                    {product.odoo_state && <Badge variant='outline' className='text-[10px] h-4 px-1.5'>{product.odoo_state}</Badge>}
                  </div>
                )}

                {/* Pricing & Stock - Compact Layout */}
                <div className='space-y-1 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px]'>Price:</span>
                    <span className='font-semibold text-xs'>
                      {product.list_price
                        ? `Rp ${(product.list_price / 1000).toFixed(0)}k`
                        : 'N/A'}
                    </span>
                  </div>
                  {product.customer_specific_rate && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground text-[11px]'>Your Price:</span>
                      <span className='font-semibold text-xs text-primary'>
                        Rp {(product.customer_specific_rate / 1000).toFixed(0)}k
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-[11px]'>Stock:</span>
                    {getStockBadge(product.available_stock)}
                  </div>
                  {product.has_active_schemes && (
                    <Badge variant="default" className="w-full justify-center bg-orange-500 text-[10px] h-5 mt-1">
                      🎁 Promo
                    </Badge>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {products.length} of {totalCount} products
          </div>
        )}
      </Main>

      {/* Product Detail Modal (View-Only) */}
      <EntitySheet
        open={!!selectedEntity}
        onOpenChange={(open) => !open && handleClose()}
        mode="view"
        entityType="Product"
        title={selectedProduct?.item_name || 'Product'}
        description={
          selectedProduct ? (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant="outline">{selectedProduct.item_code}</Badge>
              {selectedProduct.sfa_classification && (
                <Badge variant="secondary">{selectedProduct.sfa_classification}</Badge>
              )}
              {selectedProduct.field_priority && (
                <Badge variant="outline">{selectedProduct.field_priority} Priority</Badge>
              )}
              {selectedProduct.promotional_eligible === 1 && (
                <Badge className="bg-purple-500">Promotional</Badge>
              )}
            </div>
          ) : undefined
        }
        FormComponent={() =>
          selectedProduct ? (
            <ProductDetailView
              product={selectedProduct}
              getStockBadge={getStockBadge}
            />
          ) : null
        }
        canEdit={false}
        canDelete={false}
        isLoading={isLoadingDetail}
        size="xl"
      />
    </>
  )
}
