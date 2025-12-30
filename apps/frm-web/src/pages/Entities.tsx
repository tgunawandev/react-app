/**
 * Entities Page - Card-Based Navigation Hub
 * Direct access to all entities without accordions
 * Reference: specs/001-sfa-app-build/tasks.md ENT-001
 */

import { Users, ShoppingCart, FileText, Box, Truck, RotateCcw, Receipt } from 'lucide-react'
import { SearchBar } from '@/components/entities/SearchBar'
import { RecentCarousel } from '@/components/entities/RecentCarousel'
import { EntityCard } from '@/components/entities/EntityCard'
import { useDocTypeList } from '@/hooks/useDocTypeList'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

export default function Entities() {
  const { counts, isLoading } = useDocTypeList()

  // All entities in one flat list (no categories)
  const entities = [
    {
      label: 'All Customers',
      route: '/customers',
      count: counts.customers,
      icon: Users,
      description: 'Browse all customers in your area'
    },
    {
      label: 'All Products',
      route: '/products',
      count: counts.products,
      icon: Box,
      description: 'Browse product catalog with inventory and pricing'
    },
    {
      label: 'Sales Orders',
      route: '/orders',
      count: counts.sales_orders,
      icon: ShoppingCart,
      description: 'View and manage sales orders'
    },
    {
      label: 'Delivery Orders',
      route: '/deliveries',
      count: counts.delivery_orders,
      icon: Truck,
      description: 'Track delivery orders and status'
    },
    {
      label: 'Invoices',
      route: '/invoices',
      count: counts.invoices,
      icon: Receipt,
      description: 'View customer invoices from Odoo'
    },
    {
      label: 'Payment Entries',
      route: '/payments',
      count: counts.payment_entries,
      icon: FileText,
      description: 'Track customer payments'
    },
    {
      label: 'Delivery Returns',
      route: '/delivery-returns',
      count: counts.delivery_returns,
      icon: RotateCcw,
      description: 'Manage product returns'
    }
  ]

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Entities</h1>
          <p className="text-sm text-muted-foreground">
            Access and manage all your records
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Recent Carousel */}
        <RecentCarousel />

        {/* Entity Cards Grid */}
        <div className="space-y-2">
          {entities.map((entity) => (
            <EntityCard
              key={entity.route}
              label={entity.label}
              description={entity.description}
              route={entity.route}
              count={entity.count}
              icon={entity.icon}
              isLoading={isLoading}
            />
          ))}
        </div>
      </Main>
    </>
  )
}
