/**
 * SurveyDialog Component
 * Dialog for completing customer survey during visit
 * Supports dynamic form fields based on survey template
 */

import { useState, useMemo } from 'react'
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FieldDefinition {
  field_name: string
  field_type: 'Select' | 'MultiSelect' | 'Text' | 'Data' | 'Int' | 'Float' | 'Date'
  label: string
  options?: string[]
  required?: boolean
  validation?: {
    min?: number
    max?: number
  }
}

interface SurveyTemplate {
  name: string
  template_name: string
  field_definitions: string | FieldDefinition[]
}

interface SurveyDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Customer name for context */
  customerName?: string
  /** Visit ID for linking survey results */
  visitId?: string
  /** Callback when survey is complete */
  onComplete: (data: Record<string, unknown>) => void
}

export function SurveyDialog({
  open,
  onOpenChange,
  customerName,
  visitId,
  onComplete,
}: SurveyDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch survey template
  const { data: templateData, isLoading } = useFrappeGetCall<{
    message: SurveyTemplate
  }>(
    open ? 'frm.api.visit.get_survey_template' : null,
    open ? {} : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Submit survey
  const { call: submitSurvey, loading: isSubmitting } = useFrappePostCall(
    'frm.api.visit.submit_survey'
  )

  // Parse field definitions
  const fields: FieldDefinition[] = useMemo(() => {
    if (!templateData?.message?.field_definitions) {
      // Default survey fields if template not found
      return [
        {
          field_name: 'satisfaction_rating',
          field_type: 'Select',
          label: 'Satisfaction Rating',
          options: ['5 - Very Satisfied', '4 - Satisfied', '3 - Neutral', '2 - Unsatisfied', '1 - Very Unsatisfied'],
          required: true,
        },
        {
          field_name: 'service_quality',
          field_type: 'Select',
          label: 'Service Quality',
          options: ['Excellent', 'Good', 'Fair', 'Poor'],
          required: true,
        },
        {
          field_name: 'product_quality',
          field_type: 'Select',
          label: 'Product Quality',
          options: ['Excellent', 'Good', 'Fair', 'Poor'],
          required: true,
        },
        {
          field_name: 'feedback',
          field_type: 'Text',
          label: 'Customer Feedback',
          required: false,
        },
        {
          field_name: 'would_recommend',
          field_type: 'Select',
          label: 'Would Recommend?',
          options: ['Definitely Yes', 'Probably Yes', 'Not Sure', 'Probably No', 'Definitely No'],
          required: true,
        },
      ]
    }

    const definitions = templateData.message.field_definitions
    if (typeof definitions === 'string') {
      try {
        return JSON.parse(definitions) as FieldDefinition[]
      } catch {
        return []
      }
    }
    return definitions
  }, [templateData])

  // Update field value
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    // Clear error when field is edited
    if (errors[fieldName]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
  }

  // Toggle MultiSelect option
  const toggleMultiSelectOption = (fieldName: string, option: string) => {
    const current = (formData[fieldName] as string[]) || []
    const newValue = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option]
    handleFieldChange(fieldName, newValue)
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of fields) {
      const value = formData[field.field_name]

      // Required validation
      if (field.required) {
        if (field.field_type === 'MultiSelect') {
          if (!value || (value as string[]).length === 0) {
            newErrors[field.field_name] = `${field.label} is required`
          }
        } else if (!value && value !== 0) {
          newErrors[field.field_name] = `${field.label} is required`
        }
      }

      // Number validation
      if ((field.field_type === 'Int' || field.field_type === 'Float') && value !== undefined && value !== '') {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          newErrors[field.field_name] = `${field.label} must be a number`
        } else if (field.validation) {
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            newErrors[field.field_name] = `${field.label} must be at least ${field.validation.min}`
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            newErrors[field.field_name] = `${field.label} must be at most ${field.validation.max}`
          }
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await submitSurvey({
        visit_id: visitId,
        survey_data: formData,
      })

      toast.success('Survey submitted successfully')
      setFormData({})
      onComplete(formData)
      onOpenChange(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit survey'
      toast.error(errorMessage)
    }
  }

  // Handle skip
  const handleSkip = () => {
    toast.info('Survey skipped')
    onComplete({})
    onOpenChange(false)
  }

  // Render field based on type
  const renderField = (field: FieldDefinition) => {
    const value = formData[field.field_name]
    const error = errors[field.field_name]

    switch (field.field_type) {
      case 'Select':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <Select
              value={(value as string) || ''}
              onValueChange={(v) => handleFieldChange(field.field_name, v)}
            >
              <SelectTrigger className={cn(error && 'border-destructive')}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'MultiSelect':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <div className={cn('space-y-2 rounded-md border p-3', error && 'border-destructive')}>
              {field.options?.map((option) => {
                const selected = ((value as string[]) || []).includes(option)
                return (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`${field.field_name}-${option}`}
                      checked={selected}
                      onCheckedChange={() => toggleMultiSelectOption(field.field_name, option)}
                    />
                    <label
                      htmlFor={`${field.field_name}-${option}`}
                      className="text-sm cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                )
              })}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'Text':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <Textarea
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={cn('min-h-[80px]', error && 'border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'Data':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <Input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={cn(error && 'border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'Int':
      case 'Float':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <Input
              type="number"
              step={field.field_type === 'Float' ? '0.01' : '1'}
              value={(value as number) ?? ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className={cn(error && 'border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'Date':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label className={cn(field.required && 'after:content-["*"] after:text-destructive after:ml-0.5')}>
              {field.label}
            </Label>
            <Input
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={cn(error && 'border-destructive')}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customer Survey
          </DialogTitle>
          <DialogDescription>
            {customerName
              ? `Complete survey for ${customerName}`
              : 'Fill out the customer feedback survey'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-40" />
              <p>No survey fields configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map(renderField)}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || fields.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
