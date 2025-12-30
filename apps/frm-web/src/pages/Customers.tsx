/**
 * Customers Page
 * Modal-based CRUD with EntitySheet pattern
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { type ChangeEvent, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PlusCircle, Phone, MapPin, Calendar, ExternalLink, Navigation2 } from 'lucide-react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { useCustomers, type CustomerWithStats } from '@/hooks/useCustomers'
import { EntitySheet } from '@/components/entity/EntitySheet'
import { useEntitySheet } from '@/components/entity/useEntitySheet'
import { CustomerForm } from '@/components/customer/CustomerForm'
import type { CustomerFormData } from '@/lib/customer-schema'
import { toast } from 'sonner'

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [territory, setTerritory] = useState('all')

  const { customers, totalCount, isLoading, mutate } = useCustomers({
    search: searchTerm,
    territory: territory === 'all' ? undefined : territory,
    limit: 50,
    offset: 0
  })

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Entity sheet state management
  const {
    selectedEntity,
    isSubmitting,
    handleOpen,
    handleClose,
    handleModeChange,
  } = useEntitySheet<CustomerFormData>({
    entityType: 'Customer'
  })

  // Auto-open detail modal from search query parameter
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && !selectedEntity) {
      console.log('[Customers] Opening modal for ID:', id)
      // Directly open the modal - the detail fetch will load the data
      handleOpen(id, 'view')
      // Clean up URL immediately after triggering open
      setTimeout(() => setSearchParams({}), 100)
    }
  }, [searchParams, setSearchParams, selectedEntity, handleOpen])

  // Create customer mutation
  const { call: createCustomer } = useFrappePostCall('frm.api.customer.create_customer')

  // Update customer mutation
  const { call: updateCustomer } = useFrappePostCall('frm.api.customer.update_customer')

  // Fetch customer detail when selected
  const { data: customerData, isLoading: isLoadingCustomer } = useFrappeGetCall<{ message: any }>(
    'frm.api.customer.get_customer_detail',
    { customer_id: selectedEntity?.id },
    selectedEntity && selectedEntity.mode !== 'create' ? undefined : null,
    { revalidateOnFocus: false }
  )

  const customer = customerData?.message

  // Parse store_photos from JSON string to array
  const parsedCustomer = useMemo(() => {
    if (!customer) return null
    return {
      ...customer,
      store_photos: customer.store_photos
        ? (typeof customer.store_photos === 'string'
            ? JSON.parse(customer.store_photos)
            : customer.store_photos)
        : []
    }
  }, [customer])

  // Form submission handlers
  const handleSubmit = async (formData: CustomerFormData) => {
    try {
      if (selectedEntity?.mode === 'create') {
        // Create new customer
        const timestamp = Date.now().toString().slice(-6)
        const customerCode = `UNK-${timestamp}`

        const payload = {
          customer_code: customerCode,
          customer_name: formData.customer_name,
          street: formData.street || null,
          street2: formData.street2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          country: formData.country || null,
          phone: formData.phone || null,
          mobile: formData.mobile || null,
          email: formData.email || null,
          gps_latitude: formData.gps_latitude || null,
          gps_longitude: formData.gps_longitude || null,
          store_photos: formData.store_photos && formData.store_photos.length > 0
            ? JSON.stringify(formData.store_photos)
            : undefined
        }

        await createCustomer(payload)
        toast.success('Customer created successfully')
      } else {
        // Update existing customer
        const payload = {
          customer_id: selectedEntity?.id,
          ...formData,
          store_photos: formData.store_photos && formData.store_photos.length > 0
            ? JSON.stringify(formData.store_photos)
            : undefined
        }

        await updateCustomer(payload)
        toast.success('Customer updated successfully')
      }

      // Refresh customer list
      await mutate()

      // Close modal
      handleClose()
    } catch (error: any) {
      console.error('Error saving customer:', error)
      toast.error(error?.message || error?.exception || 'Failed to save customer')
      throw error
    }
  }

  const handleCustomerClick = (customer: CustomerWithStats) => {
    handleOpen(customer.name, 'view')
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <StandardHeader />

      {/* ===== Content ===== */}
      <Main className="space-y-6">
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Customers
          </h1>
          <p className='text-muted-foreground'>
            Browse and manage customers in your territory
          </p>
        </div>

        {/* Search and Actions - Full Width Layout */}
        <div className='space-y-3'>
          {/* Row 1: Full-width search */}
          <Input
            placeholder='Search customers...'
            className='h-9 w-full'
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Row 2: Territory filter and Add Customer button */}
          <div className='flex items-center justify-between gap-4'>
            <Select value={territory} onValueChange={setTerritory}>
              <SelectTrigger className='w-full sm:w-40'>
                <SelectValue>All Territories</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Territories</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => handleOpen('new', 'create')} className='shrink-0'>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        <Separator className='shadow-sm' />

        <ul className='faded-bottom no-scrollbar grid gap-4 overflow-auto pt-4 md:grid-cols-2 lg:grid-cols-3'>
          {isLoading && customers.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              Loading...
            </li>
          ) : customers.length === 0 ? (
            <li className='col-span-full text-center text-muted-foreground'>
              No customers found
            </li>
          ) : (
            customers.map((customer) => (
              <li
                key={customer.name}
                className='rounded-lg border p-3 hover:shadow-md cursor-pointer overflow-hidden transition-shadow'
                onClick={() => handleCustomerClick(customer)}
              >
                {/* Header: Name + Odoo Badge */}
                <div className='mb-2'>
                  <h2 className='font-semibold text-base truncate mb-1'>{customer.customer_name}</h2>
                  {customer.odoo_id && (
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <ExternalLink className='h-3 w-3 shrink-0' />
                      <span className='truncate'>#{customer.odoo_id}</span>
                      {customer.odoo_state && (
                        <Badge variant={customer.odoo_state === 'Active' ? 'default' : 'secondary'} className='text-[10px] h-4 px-1.5 shrink-0'>
                          {customer.odoo_state}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact & Location Info */}
                <div className='space-y-0.5 text-xs text-muted-foreground mb-1.5'>
                  {(customer.mobile || customer.phone) && (
                    <div className='flex items-center gap-1.5'>
                      <Phone className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate'>{String(customer.mobile || customer.phone).replace(/["']/g, '')}</span>
                    </div>
                  )}
                  {(customer.city || customer.street) && (
                    <div className='flex items-center gap-1.5'>
                      <MapPin className='h-3.5 w-3.5 shrink-0' />
                      <span className='truncate'>{customer.city || customer.street}</span>
                    </div>
                  )}
                </div>

                {/* Status Indicators - Two Column Layout */}
                <div className='grid grid-cols-2 gap-1.5 text-xs'>
                  <div className='flex items-center gap-1.5'>
                    <Navigation2 className='h-3.5 w-3.5 shrink-0' />
                    {customer.gps_latitude && customer.gps_longitude ? (
                      <span className='text-primary text-[11px]'>GPS</span>
                    ) : (
                      <span className='text-orange-600 text-[11px]'>No GPS</span>
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Calendar className='h-3.5 w-3.5 shrink-0' />
                    <span className={`text-[11px] truncate ${!customer.last_visit_date ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {customer.last_visit_date
                        ? `${customer.days_since_last_visit}d ago`
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        {totalCount > 0 && (
          <div className='text-center text-sm text-muted-foreground pb-4'>
            Showing {customers.length} of {totalCount} customers
          </div>
        )}
      </Main>

      {/* Customer Modal */}
      <EntitySheet
        open={!!selectedEntity}
        onOpenChange={(open) => !open && handleClose()}
        mode={selectedEntity?.mode || 'view'}
        onModeChange={handleModeChange}
        entityType="Customer"
        title={
          selectedEntity?.mode === 'create'
            ? 'Create New Customer'
            : customer?.customer_name || 'Customer'
        }
        description={
          selectedEntity?.mode === 'create'
            ? 'Add a new customer to your territory'
            : customer?.last_visit_date
            ? `Last Visit: ${new Date(customer.last_visit_date).toLocaleDateString()}`
            : 'Never visited'
        }
        FormComponent={CustomerForm}
        formProps={{
          initialValues: parsedCustomer,
          onSubmit: handleSubmit
        }}
        onSubmit={handleSubmit}
        canEdit={true}
        canDelete={false}
        isLoading={isLoadingCustomer}
        isSubmitting={isSubmitting}
        size="lg"
      />
    </>
  )
}
