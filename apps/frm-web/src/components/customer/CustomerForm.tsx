/**
 * Customer Form Component
 * Shared form for creating, editing, and viewing customer information
 * FIXED: Aligned with actual SFA Customer doctype fields
 * Reference: apps/sfa/sfa/doctype/customer/customer.json
 */

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomerLocationMap } from './CustomerLocationMap'
import { CustomerPhotoUpload } from './CustomerPhotoUpload'
import {
  customerCreateSchema,
  customerEditSchema,
  type CustomerFormData,
} from '@/lib/customer-schema'

export interface CustomerFormProps {
  /** Form mode */
  mode: 'create' | 'edit' | 'view'
  /** Initial form values */
  initialValues?: Partial<CustomerFormData>
  /** Submit handler */
  onSubmit?: (data: CustomerFormData) => Promise<void> | void
  /** Cancel handler */
  onCancel?: () => void
  /** Loading state */
  isLoading?: boolean
}

export function CustomerForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: CustomerFormProps) {
  // Select schema based on mode
  const schema = mode === 'create' ? customerCreateSchema : customerEditSchema

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: initialValues,
  })

  const watchedValues = watch()
  const [capturingLocation, setCapturingLocation] = React.useState(false)

  // Reset form when initialValues change (for view mode reactivity)
  React.useEffect(() => {
    if (initialValues) {
      reset(initialValues)
    }
  }, [initialValues, reset])

  const handleLocationCapture = (lat: number, lng: number) => {
    setValue('gps_latitude', lat)
    setValue('gps_longitude', lng)
    setCapturingLocation(false)
  }

  const handlePhotosChange = (photos: string[]) => {
    setValue('store_photos', photos)
  }

  const isViewMode = mode === 'view'

  return (
    <form id="customer-form" onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6 px-0.5">
      {/* SECTION: Basic Information */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Basic Information</h3>
          <p className="text-xs text-muted-foreground">Customer identity and contact details</p>
        </div>

        {/* Customer Name */}
        <div className="space-y-2">
          <Label htmlFor="customer_name">
            Customer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer_name"
            {...register('customer_name')}
            placeholder="Enter customer name"
            disabled={isViewMode || isLoading}
          />
          {errors.customer_name && (
            <p className="text-sm text-destructive">{errors.customer_name.message}</p>
          )}
        </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="e.g., 021-12345678"
          disabled={isViewMode || isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Mobile Number */}
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile Number</Label>
        <Input
          id="mobile"
          type="tel"
          {...register('mobile')}
          placeholder="e.g., +62812345678"
          disabled={isViewMode || isLoading}
        />
        {errors.mobile && (
          <p className="text-sm text-destructive">{errors.mobile.message}</p>
        )}
      </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
            disabled={isViewMode || isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* SECTION: Address */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Address</h3>
          <p className="text-xs text-muted-foreground">Store location details</p>
        </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          {...register('street')}
          placeholder="Enter street address"
          disabled={isViewMode || isLoading}
        />
        {errors.street && (
          <p className="text-sm text-destructive">{errors.street.message}</p>
        )}
      </div>

      {/* Street 2 */}
      <div className="space-y-2">
        <Label htmlFor="street2">Street Line 2</Label>
        <Input
          id="street2"
          {...register('street2')}
          placeholder="Apartment, suite, etc."
          disabled={isViewMode || isLoading}
        />
        {errors.street2 && (
          <p className="text-sm text-destructive">{errors.street2.message}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          {...register('city')}
          placeholder="Enter city"
          disabled={isViewMode || isLoading}
        />
        {errors.city && (
          <p className="text-sm text-destructive">{errors.city.message}</p>
        )}
      </div>

      {/* State */}
      <div className="space-y-2">
        <Label htmlFor="state">State/Province</Label>
        <Input
          id="state"
          {...register('state')}
          placeholder="Enter state"
          disabled={isViewMode || isLoading}
        />
        {errors.state && (
          <p className="text-sm text-destructive">{errors.state.message}</p>
        )}
      </div>

      {/* Postal Code */}
      <div className="space-y-2">
        <Label htmlFor="zip">Postal Code</Label>
        <Input
          id="zip"
          {...register('zip')}
          placeholder="Enter postal code"
          disabled={isViewMode || isLoading}
        />
        {errors.zip && (
          <p className="text-sm text-destructive">{errors.zip.message}</p>
        )}
      </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Enter country"
            disabled={isViewMode || isLoading}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      {/* SECTION: GPS Location */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">GPS Location</h3>
          <p className="text-xs text-muted-foreground">Store GPS coordinates (optional)</p>
        </div>

        <CustomerLocationMap
          mode={mode}
          latitude={watchedValues.gps_latitude ?? null}
          longitude={watchedValues.gps_longitude ?? null}
          customerName={watchedValues.customer_name}
          onLocationCapture={handleLocationCapture}
          isCapturing={capturingLocation}
        />
        {(errors.gps_latitude || errors.gps_longitude) && (
          <p className="text-sm text-destructive mt-2">
            {errors.gps_latitude?.message || errors.gps_longitude?.message}
          </p>
        )}
      </div>

      {/* SECTION: Store Photos */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold">Store Photos</h3>
          <p className="text-xs text-muted-foreground">Upload photos of the store</p>
        </div>

        <CustomerPhotoUpload
          mode={mode}
          photos={watchedValues.store_photos || []}
          onPhotosChange={handlePhotosChange}
          required={false}
        />
        {errors.store_photos && (
          <p className="text-sm text-destructive mt-2">{errors.store_photos.message}</p>
        )}
      </div>
    </form>
  )
}
