/**
 * Activity Template Form Component
 * Shared form for creating, editing, and viewing activity templates
 * Reference: specs/001-sfa-app-build/tasks.md Phase 2 (Activity Template CRUD)
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  activityTemplateFormSchema,
  activityTypeOptions,
  statusOptions,
  type ActivityTemplateFormData,
} from '@/lib/activity-template-schema'

export interface ActivityTemplateFormProps {
  /** Form mode */
  mode: 'create' | 'edit' | 'view'
  /** Initial form values */
  initialValues?: Partial<ActivityTemplateFormData>
  /** Submit handler */
  onSubmit?: (data: ActivityTemplateFormData) => Promise<void> | void
  /** Cancel handler */
  onCancel?: () => void
  /** Loading state */
  isLoading?: boolean
}

export function ActivityTemplateForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: ActivityTemplateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityTemplateFormData>({
    resolver: zodResolver(activityTemplateFormSchema) as any,
    defaultValues: initialValues,
  })

  const watchedValues = watch()
  const isViewMode = mode === 'view'

  return (
    <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-6">
      {/* Template Information */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic template details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="template_name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template_name"
              {...register('template_name')}
              placeholder="Enter template name"
              disabled={isViewMode || isLoading}
            />
            {errors.template_name && (
              <p className="text-sm text-destructive">{errors.template_name.message}</p>
            )}
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity_type">
              Activity Type <span className="text-destructive">*</span>
            </Label>
            {isViewMode ? (
              <Input value={watchedValues.activity_type || ''} disabled />
            ) : (
              <Select
                value={watchedValues.activity_type}
                onValueChange={(value) => setValue('activity_type', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.activity_type && (
              <p className="text-sm text-destructive">{errors.activity_type.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            {isViewMode ? (
              <Input value={watchedValues.status || ''} disabled />
            ) : (
              <Select
                value={watchedValues.status}
                onValueChange={(value) => setValue('status', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_mandatory"
                checked={watchedValues.is_mandatory || false}
                onCheckedChange={(checked) => setValue('is_mandatory', checked as boolean)}
                disabled={isViewMode || isLoading}
              />
              <Label
                htmlFor="is_mandatory"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Is Mandatory
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="photo_required"
                checked={watchedValues.photo_required || false}
                onCheckedChange={(checked) => setValue('photo_required', checked as boolean)}
                disabled={isViewMode || isLoading}
              />
              <Label
                htmlFor="photo_required"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Photo Required
              </Label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description..."
              rows={3}
              disabled={isViewMode || isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions (not shown in view mode) */}
      {!isViewMode && (
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
                {mode === 'create' ? 'Create Template' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
