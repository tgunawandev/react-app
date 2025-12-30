/**
 * Product Detail View Component
 * Read-only product information display for modal
 * Matches Customer form layout - no Cards, sections with dividers
 */

import { ExternalLink, Package, DollarSign, TrendingUp, AlertCircle, Tag, Box, Percent } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Product } from '@/hooks/useProductCatalog'

export interface ProductDetailViewProps {
  product: Product
  getStockBadge: (stock: number) => React.ReactNode
}

export function ProductDetailView({ product, getStockBadge }: ProductDetailViewProps) {
  return (
    <div className="space-y-6 px-0.5">
      {/* SECTION: Product Image */}
      {product.image_url && (
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-semibold">Product Image</h3>
          </div>
          <img
            src={product.image_url}
            alt={product.item_name}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* SECTION: Odoo Integration */}
      {product.odoo_id && (
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-semibold">Odoo Integration</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">#{product.odoo_id}</span>
            {product.odoo_name && (
              <>
                <span className="text-muted-foreground">•</span>
                <span>{product.odoo_name}</span>
              </>
            )}
            {product.odoo_state && (
              <>
                <span className="text-muted-foreground">•</span>
                <Badge variant={product.odoo_state === 'Active' ? 'default' : 'secondary'}>
                  {product.odoo_state}
                </Badge>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION: Product Information */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Product Information</h3>
          <p className="text-xs text-muted-foreground">Details and specifications</p>
        </div>

        {product.description && (
          <div className="space-y-2">
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Category</Label>
          <p className="text-sm">{product.category_display_name || product.category || 'Uncategorized'}</p>
        </div>

        <div className="space-y-2">
          <Label>Unit of Measure</Label>
          <p className="text-sm">
            {product.secondary_uom || product.uom}
            {product.secondary_uom && product.secondary_uom_factor && (
              <span className="text-xs text-muted-foreground ml-2">
                (1 {product.secondary_uom} = {product.secondary_uom_factor} {product.uom})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* SECTION: Pricing */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Pricing</h3>
          <p className="text-xs text-muted-foreground">Current pricing and special offers</p>
        </div>

        <div className="space-y-2">
          <Label>Standard Price</Label>
          <p className="text-sm font-semibold">
            {product.secondary_uom && product.secondary_uom_price
              ? `Rp ${product.secondary_uom_price.toLocaleString()} / ${product.secondary_uom}`
              : product.list_price
              ? `Rp ${product.list_price.toLocaleString()}`
              : 'Price not set'}
          </p>
          {product.secondary_uom && product.list_price && (
            <p className="text-xs text-muted-foreground">
              (Rp {product.list_price.toLocaleString()} / {product.uom})
            </p>
          )}
        </div>

        {product.customer_specific_rate && product.list_price && (
          <div className="space-y-2">
            <Label>Your Special Price</Label>
            <p className="text-sm font-semibold text-primary">
              Rp {product.customer_specific_rate.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Save Rp {(product.list_price - product.customer_specific_rate).toLocaleString()}
            </p>
          </div>
        )}

        {product.has_active_schemes && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
              <strong>Active Promotion!</strong> This product has special pricing rules or discounts available.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* SECTION: Inventory */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Inventory</h3>
          <p className="text-xs text-muted-foreground">Stock availability</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Label>Available Stock</Label>
            <p className="text-sm font-semibold">
              {product.secondary_uom && product.secondary_qty_available !== null && product.secondary_qty_available !== undefined
                ? `${product.secondary_qty_available.toLocaleString()} ${product.secondary_uom}`
                : product.available_stock !== null && product.available_stock !== undefined
                ? `${product.available_stock.toLocaleString()} ${product.uom || ''}`
                : 'Stock not available'}
            </p>
            {product.secondary_uom && product.available_stock !== null && (
              <p className="text-xs text-muted-foreground">
                ({product.available_stock.toLocaleString()} {product.uom})
              </p>
            )}
          </div>
          {getStockBadge(product.available_stock)}
        </div>

        {product.available_stock === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This product is currently out of stock. Please check back later or contact support.
            </AlertDescription>
          </Alert>
        )}

        {product.available_stock > 0 && product.available_stock <= 100 && (
          <Alert className="border-secondary bg-secondary/5 dark:bg-secondary/10">
            <AlertCircle className="h-4 w-4 text-secondary-foreground" />
            <AlertDescription className="text-sm text-secondary-foreground">
              Low stock level. Consider ordering soon to avoid stock-outs.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
