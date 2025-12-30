/**
 * Route Plan Form Component
 * Shared form for creating and editing route plans
 * Reference: specs/001-sfa-app-build/tasks.md PHASE 3 (Route Plan CRUD)
 */

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  routePlanFormSchema,
  routePlanStatusOptions,
  type RoutePlanFormData,
} from '@/lib/route-plan-schema'
import { useCustomers } from '@/hooks/useCustomers'

export interface RoutePlanFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<RoutePlanFormData>
  onSubmit?: (data: RoutePlanFormData) => Promise<void> | void
  onCancel?: () => void
  isLoading?: boolean
}

export function RoutePlanForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoutePlanFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<RoutePlanFormData>({
    resolver: zodResolver(routePlanFormSchema) as any,
    defaultValues: initialValues,
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'customers',
  })

  const watchedValues = watch()

  // Fetch all customers for selection
  const { customers: availableCustomers, isLoading: loadingCustomers } = useCustomers({
    limit: 1000,
  })

  const handleAddCustomer = () => {
    append({
      customer: '',
      sequence: fields.length + 1,
    })
  }

  const handleRemoveCustomer = (index: number) => {
    remove(index)
    // Recalculate sequences
    fields.forEach((_, idx) => {
      if (idx > index) {
        setValue(`customers.${idx}.sequence`, idx + 1)
      }
    })
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1)
      // Update sequences
      setValue(`customers.${index - 1}.sequence`, index)
      setValue(`customers.${index}.sequence`, index + 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1)
      // Update sequences
      setValue(`customers.${index}.sequence`, index + 2)
      setValue(`customers.${index + 1}.sequence`, index + 1)
    }
  }

  return (
    <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6">
      {/* Route Plan Information */}
      <Card>
        <CardHeader>
          <CardTitle>Route Plan Information</CardTitle>
          <CardDescription>Plan date and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Date */}
          <div className="space-y-2">
            <Label htmlFor="plan_date">
              Plan Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="plan_date"
              type="date"
              {...register('plan_date')}
              disabled={isLoading}
            />
            {errors.plan_date && (
              <p className="text-sm text-destructive">{errors.plan_date.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchedValues.status}
              onValueChange={(value) => setValue('status', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routePlanStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Sequence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Visit Sequence</CardTitle>
              <CardDescription>
                Order of customer visits (drag to reorder)
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomer}
              disabled={isLoading || loadingCustomers}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No customers added yet.</p>
              <p className="text-sm mt-2">Click "Add Customer" to start building your route.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  {/* Sequence Number */}
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || isLoading}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === fields.length - 1 || isLoading}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`customers.${index}.customer`}>
                      Customer <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={watchedValues.customers?.[index]?.customer || ''}
                      onValueChange={(value) => setValue(`customers.${index}.customer`, value)}
                      disabled={isLoading || loadingCustomers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCustomers.map((customer: any) => (
                          <SelectItem key={customer.customer_id} value={customer.customer_id}>
                            {customer.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customers?.[index]?.customer && (
                      <p className="text-sm text-destructive">
                        {errors.customers[index]?.customer?.message}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomer(index)}
                    disabled={isLoading}
                    className="mt-7"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {errors.customers && typeof errors.customers === 'object' && 'message' in errors.customers && (
            <p className="text-sm text-destructive mt-2">{errors.customers.message as string}</p>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 pb-24 md:pb-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Create Route Plan' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
