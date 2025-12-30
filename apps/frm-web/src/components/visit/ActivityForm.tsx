/**
 * ActivityForm Component
 * Dynamic form rendering from Activity Template field definitions
 * Reference: specs/001-sfa-app-build/tasks.md US1-017
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface ActivityTemplate {
  name: string
  template_name: string
  activity_type: string
  field_definitions: string // JSON string
  is_mandatory: boolean
}

interface ActivityFormProps {
  template: ActivityTemplate
  onSubmit: (formData: Record<string, any>) => Promise<void>
  onCancel?: () => void
}

/**
 * Dynamic activity form component
 * Renders form fields based on template field_definitions JSON
 */
export function ActivityForm({ template, onSubmit, onCancel }: ActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState<string>(new Date().toISOString())
  const [error, setError] = useState<string | null>(null)

  // Parse field definitions from JSON
  let fieldDefinitions: any[] = []
  try {
    const rawDefinitions = JSON.parse(template.field_definitions || '[]')
    // Normalize field schema from fixtures format to frontend format
    fieldDefinitions = rawDefinitions.map((field: any) => ({
      fieldname: field.fieldname || field.field_name,
      fieldtype: field.fieldtype || field.field_type,
      label: field.label,
      required: field.required === true || field.required === 1 ? 1 : 0,
      options: field.options,
      validation: field.validation,
      description: field.description
    }))
  } catch (e) {
    console.error('Failed to parse field definitions:', e)
  }

  // Build dynamic Zod schema
  const buildSchema = () => {
    const shape: Record<string, any> = {}

    fieldDefinitions.forEach((field: any) => {
      let validator: any

      switch (field.fieldtype) {
        case 'Number':
        case 'Int':
        case 'Float':
          validator = z.number()
          if (field.required === 0) {
            validator = validator.optional()
          }
          break

        case 'Text':
        case 'Small Text':
        case 'Long Text':
        case 'Data':
          validator = z.string()
          if (field.required === 1) {
            validator = validator.min(1, `${field.label} is required`)
          } else {
            validator = validator.optional()
          }
          break

        case 'Select':
          validator = z.string()
          if (field.required === 1) {
            validator = validator.min(1, `${field.label} is required`)
          } else {
            validator = validator.optional()
          }
          break

        case 'MultiSelect':
          validator = z.array(z.string())
          if (field.required === 1) {
            validator = validator.min(1, `${field.label} is required`)
          } else {
            validator = validator.optional()
          }
          break

        case 'Date':
          validator = z.string()
          if (field.required === 1) {
            validator = validator.min(1, `${field.label} is required`)
          } else {
            validator = validator.optional()
          }
          break

        default:
          validator = z.any().optional()
      }

      shape[field.fieldname] = validator
    })

    // Add outcome notes field
    shape.outcome_notes = z.string().optional()

    return z.object(shape)
  }

  const formSchema = buildSchema()
  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const endTime = new Date().toISOString()

      // Build form data excluding outcome_notes
      const { outcome_notes, ...formData } = values

      await onSubmit({
        ...formData,
        start_time: startTime,
        end_time: endTime,
        outcome_notes: outcome_notes || undefined
      })

      toast.success('Activity completed', {
        description: template.template_name
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save activity'
      setError(errorMsg)
      toast.error('Activity failed', {
        description: errorMsg
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    switch (field.fieldtype) {
      case 'Number':
      case 'Int':
      case 'Float':
        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={field.fieldtype === 'Float' ? '0.01' : '1'}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    {...formField}
                    value={formField.value as any}
                    onChange={(e) => formField.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'Text':
      case 'Small Text':
      case 'Data':
        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} {...formField} value={formField.value as any} />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'Long Text':
        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows={4}
                    {...formField}
                    value={formField.value as any}
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'Select':
        const options = field.options ? field.options.split('\n').filter(Boolean) : []
        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <Select onValueChange={formField.onChange} defaultValue={formField.value as any}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'MultiSelect': {
        const multiOptions = Array.isArray(field.options)
          ? field.options
          : (field.options ? field.options.split('\n').filter(Boolean) : [])

        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>
                    {field.label}
                    {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                  {field.description && <FormDescription className="mt-1">{field.description}</FormDescription>}
                </div>
                <div className="space-y-2">
                  {multiOptions.map((option: string) => {
                    const currentValue = (formField.value as string[]) || []
                    return (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={currentValue.includes(option)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...currentValue, option]
                              : currentValue.filter((v) => v !== option)
                            formField.onChange(newValue)
                          }}
                        />
                        <label className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {option}
                        </label>
                      </div>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )
      }

      case 'Date':
        return (
          <FormField
            key={field.fieldname}
            control={form.control}
            name={field.fieldname}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required === 1 && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input type="date" {...formField} value={formField.value as any} />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.template_name}</CardTitle>
        <CardDescription>
          {template.activity_type}
          {template.is_mandatory && <span className="ml-2 text-destructive">• Mandatory</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Dynamic fields */}
            {fieldDefinitions.map((field) => renderField(field))}

            {/* Outcome notes */}
            <FormField
              control={form.control}
              name="outcome_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes..." rows={3} {...field} value={field.value as any} />
                  </FormControl>
                  <FormDescription>Optional notes about this activity</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Activity
                  </>
                )}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
