/**
 * ShoppingCart Component
 * Manages cart items with quantity editing and order submission
 * Reference: specs/001-sfa-app-build/tasks.md US5-008
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from 'lucide-react'
import type { Product } from '@/hooks/useProductCatalog'

export interface CartItem extends Product {
  cart_qty: number
  // Legacy field aliases for backward compatibility
  standard_rate?: number // Alias for standard_price
  image?: string | null // Alias for image_url
  stock_uom?: string | null // Alias for uom
}

interface ShoppingCartProps {
  items: CartItem[]
  onUpdateQuantity: (item_code: string, qty: number) => void
  onRemoveItem: (item_code: string) => void
  onClear: () => void
  onCheckout: () => void
  isCheckingOut?: boolean
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onCheckout,
  isCheckingOut = false
}: ShoppingCartProps) {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const rate = item.customer_specific_rate || item.standard_rate || item.standard_price
    return sum + (rate * item.cart_qty)
  }, 0)

  const totalItems = items.reduce((sum, item) => sum + item.cart_qty, 0)

  const handleQuantityChange = (item_code: string, value: string) => {
    const qty = parseInt(value) || 1
    if (qty > 0) {
      onUpdateQuantity(item_code, qty)
    }
  }

  const incrementQty = (item: CartItem) => {
    onUpdateQuantity(item.item_code, item.cart_qty + 1)
  }

  const decrementQty = (item: CartItem) => {
    if (item.cart_qty > 1) {
      onUpdateQuantity(item.item_code, item.cart_qty - 1)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <CartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add products from the catalog to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Shopping Cart</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? 'item' : 'items'} ({totalItems} total units)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const rate = item.customer_specific_rate || item.standard_rate || item.standard_price
            const lineTotal = rate * item.cart_qty

            return (
              <div key={item.item_code}>
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {(item.image || item.image_url) ? (
                      <img
                        src={item.image || item.image_url || ''}
                        alt={item.item_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <CartIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm">{item.item_name}</h4>
                      <p className="text-xs text-muted-foreground">{item.item_code}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      {item.has_active_schemes && (
                        <Badge variant="outline" className="text-xs border-primary text-foreground">
                          Promo
                        </Badge>
                      )}
                      {item.sfa_classification && (
                        <Badge variant="secondary" className="text-xs">
                          {item.sfa_classification}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <span className="text-sm font-semibold">
                        ${rate.toFixed(2)} / {item.stock_uom || item.uom}
                      </span>
                      {item.customer_specific_rate && item.customer_specific_rate < (item.standard_rate || item.standard_price) && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          ${(item.standard_rate || item.standard_price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decrementQty(item)}
                        disabled={item.cart_qty <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.cart_qty}
                        onChange={(e) => handleQuantityChange(item.item_code, e.target.value)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => incrementQty(item)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2">
                        Stock: {item.available_stock}
                      </span>
                    </div>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.item_code)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="text-right">
                      <div className="font-bold">${lineTotal.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.cart_qty} × ${rate.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({totalItems} items)</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg">${subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onCheckout}
          className="w-full"
          size="lg"
          disabled={isCheckingOut || items.length === 0}
        >
          {isCheckingOut ? 'Processing...' : 'Place Order'}
        </Button>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center">
          Note: Final pricing and taxes will be calculated at checkout
        </p>
      </CardContent>
    </Card>
  )
}
