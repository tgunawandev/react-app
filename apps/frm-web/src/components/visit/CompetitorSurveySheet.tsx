/**
 * CompetitorSurveySheet Component
 * Dialog for recording competitor products during store visits
 * Tracks competitor brands, product names, prices, and stock levels
 * Uses free text input for competitor brand names
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useFrappeGetCall, useFrappePostCall, useFrappeFileUpload } from 'frappe-react-sdk'
import { VisitActivitySheet } from './VisitActivitySheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Camera,
  Package,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CompetitorProduct {
  idx: number
  competitor: string
  competitor_other: string
  product_name: string
  product_category: string
  price: number
  price_unit: string
  stock_estimation: number
  shelf_position: string
  photo: string
  notes: string
}

interface CompetitorSurvey {
  name: string
  sales_visit: string
  customer: string
  customer_name: string
  survey_date: string
  status: string
  total_products: number
  notes: string
  items: CompetitorProduct[]
}

interface CompetitorSurveySheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet open state changes */
  onOpenChange: (open: boolean) => void
  /** Customer ID for the survey */
  customerId: string
  /** Customer name for display */
  customerName?: string
  /** Sales Visit ID (optional) */
  visitId?: string
  /** Existing survey ID to edit (optional) */
  existingSurveyId?: string
  /** Callback when survey is complete */
  onComplete: (data: { surveyId?: string }) => void
  /** When true, only view data (no edit) */
  readOnly?: boolean
}

// Price unit options matching the DocType
const PRICE_UNITS = ['/pcs', '/btl', '/pack', '/box', '/CTN', '/kg', '/ltr']

// Shelf position options matching the DocType
const SHELF_POSITIONS = ['Eye Level', 'Top Shelf', 'Bottom Shelf', 'End Cap', 'Not Displayed']

// Empty product template
const createEmptyProduct = (idx: number): CompetitorProduct => ({
  idx,
  competitor: '',
  competitor_other: '',
  product_name: '',
  product_category: '',
  price: 0,
  price_unit: '/pcs',
  stock_estimation: 0,
  shelf_position: '',
  photo: '',
  notes: '',
})

export function CompetitorSurveySheet({
  open,
  onOpenChange,
  customerId,
  customerName,
  visitId,
  existingSurveyId,
  onComplete,
  readOnly = false,
}: CompetitorSurveySheetProps) {
  // State
  const [products, setProducts] = useState<CompetitorProduct[]>([createEmptyProduct(1)])
  const [surveyNotes, setSurveyNotes] = useState('')
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set([1]))
  const [loadedSurveyId, setLoadedSurveyId] = useState<string | null>(null)

  // Fetch existing survey if editing
  const { data: existingSurveyData } = useFrappeGetCall<{
    message: { survey: CompetitorSurvey | null }
  }>(
    open && existingSurveyId ? 'frm.api.competitor_survey.get_survey' : null,
    open && existingSurveyId ? { survey_id: existingSurveyId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Fetch survey by visit if no existing ID
  const { data: visitSurveyData } = useFrappeGetCall<{
    message: { survey: CompetitorSurvey | null }
  }>(
    open && !existingSurveyId && visitId ? 'frm.api.competitor_survey.get_survey' : null,
    open && !existingSurveyId && visitId ? { visit_id: visitId } : undefined,
    undefined,
    { revalidateOnFocus: false }
  )

  // Save survey API
  const { call: saveSurvey, loading: saving } = useFrappePostCall(
    'frm.api.competitor_survey.save_survey'
  )

  // File upload hook
  const { upload } = useFrappeFileUpload()

  const isEditMode = !!loadedSurveyId

  // Load existing survey data
  useEffect(() => {
    const surveyData = existingSurveyData?.message?.survey || visitSurveyData?.message?.survey
    if (surveyData && surveyData.name !== loadedSurveyId) {
      const loadedProducts = surveyData.items.map((item, idx) => ({
        ...item,
        idx: idx + 1,
      }))
      setProducts(loadedProducts.length > 0 ? loadedProducts : [createEmptyProduct(1)])
      setSurveyNotes(surveyData.notes || '')
      setExpandedProducts(new Set([1])) // Collapse all except first
      setLoadedSurveyId(surveyData.name)
    }
  }, [existingSurveyData, visitSurveyData, loadedSurveyId])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setProducts([createEmptyProduct(1)])
      setSurveyNotes('')
      setExpandedProducts(new Set([1]))
      setLoadedSurveyId(null)
    }
  }, [open])

  // Add new product
  const handleAddProduct = useCallback(() => {
    const newIdx = products.length + 1
    setProducts(prev => [...prev, createEmptyProduct(newIdx)])
    setExpandedProducts(prev => new Set([...prev, newIdx]))
  }, [products.length])

  // Remove product
  const handleRemoveProduct = useCallback((idx: number) => {
    if (products.length <= 1) {
      toast.error('At least one product is required')
      return
    }
    setProducts(prev => prev.filter(p => p.idx !== idx).map((p, i) => ({ ...p, idx: i + 1 })))
    setExpandedProducts(prev => {
      const next = new Set(prev)
      next.delete(idx)
      return next
    })
  }, [products.length])

  // Update product field
  const updateProduct = useCallback((idx: number, field: keyof CompetitorProduct, value: unknown) => {
    setProducts(prev =>
      prev.map(p => (p.idx === idx ? { ...p, [field]: value } : p))
    )
  }, [])

  // Toggle product expansion
  const toggleExpanded = useCallback((idx: number) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }, [])

  // Handle photo capture
  const handlePhotoCapture = useCallback(async (idx: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const result = await upload(file, {
          isPrivate: false,
          doctype: 'Competitor Survey',
          fieldname: 'photo',
        })

        if (result.file_url) {
          updateProduct(idx, 'photo', result.file_url)
          toast.success('Photo uploaded')
        }
      } catch (err) {
        toast.error('Failed to upload photo')
        console.error('Upload error:', err)
      }
    }

    input.click()
  }, [upload, updateProduct])

  // Validate products
  const validateProducts = useMemo(() => {
    const errors: string[] = []
    products.forEach((p, i) => {
      if (!p.product_name) {
        errors.push(`Product ${i + 1}: Name is required`)
      }
      if (!p.competitor_other) {
        errors.push(`Product ${i + 1}: Competitor brand is required`)
      }
      if (p.price <= 0) {
        errors.push(`Product ${i + 1}: Price must be greater than 0`)
      }
    })
    return errors
  }, [products])

  // Check if form is valid
  const isValid = useMemo(() => {
    return products.every(p =>
      p.product_name &&
      p.competitor_other &&
      p.price > 0
    )
  }, [products])

  // Handle submit
  const handleSubmit = async () => {
    if (validateProducts.length > 0) {
      validateProducts.forEach(err => toast.error(err))
      return
    }

    try {
      const result = await saveSurvey({
        customer_id: customerId,
        visit_id: visitId,
        items: JSON.stringify(products.map(p => ({
          competitor: p.competitor,
          competitor_other: p.competitor_other,
          product_name: p.product_name,
          product_category: p.product_category,
          price: p.price,
          price_unit: p.price_unit,
          stock_estimation: p.stock_estimation,
          shelf_position: p.shelf_position,
          photo: p.photo,
          notes: p.notes,
        }))),
        notes: surveyNotes,
        survey_id: loadedSurveyId || undefined,
      })

      if (result?.message?.success) {
        toast.success(result.message.message || 'Competitor survey saved')
        onComplete({ surveyId: result.message.survey_id })
        onOpenChange(false)
      }
    } catch (err) {
      toast.error('Failed to save survey')
      console.error('Save error:', err)
    }
  }

  // Handle skip
  const handleSkip = () => {
    onComplete({})
    onOpenChange(false)
    toast.info('Competitor survey skipped')
  }

  // Count valid products
  const validProductCount = products.filter(p =>
    p.product_name && p.competitor_other && p.price > 0
  ).length

  return (
    <VisitActivitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={readOnly ? 'View Competitor Survey' : 'Competitor Survey'}
      description={readOnly
        ? `Competitor products recorded at ${customerName || 'this location'}`
        : customerName ? `Record competitor products at ${customerName}` : 'Record competitor products and prices'}
      submitLabel={isEditMode ? 'Update Survey' : 'Save Survey'}
      onSubmit={handleSubmit}
      isSubmitting={saving}
      submitDisabled={!isValid}
      readOnly={readOnly}
      footerExtra={
        !readOnly && !isEditMode ? (
          <Button variant="ghost" size="sm" onClick={handleSkip} disabled={saving}>
            Skip
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Summary badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {validProductCount} product{validProductCount !== 1 ? 's' : ''} recorded
          </Badge>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddProduct}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>

        {/* Products list */}
        <div className="space-y-3">
          {products.map((product) => {
              const isExpanded = expandedProducts.has(product.idx)
              const isProductValid = product.product_name && product.competitor_other && product.price > 0

              return (
                <Card
                  key={product.idx}
                  className={cn(
                    'transition-all',
                    isProductValid && 'border-primary/20 bg-primary/5/30'
                  )}
                >
                  <CardContent className="p-3">
                    {/* Header - Always visible */}
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => toggleExpanded(product.idx)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{product.idx}
                          </span>
                          {product.product_name ? (
                            <span className="font-medium truncate">{product.product_name}</span>
                          ) : (
                            <span className="text-muted-foreground italic">New product</span>
                          )}
                        </div>
                        {product.product_name && (
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {product.competitor_other && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {product.competitor_other}
                              </span>
                            )}
                            {product.price > 0 && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                Rp {product.price.toLocaleString('id-ID')}{product.price_unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {isProductValid && (
                          <Badge variant="secondary" className="h-5 text-xs bg-primary text-primary-foreground">
                            Valid
                          </Badge>
                        )}
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveProduct(product.idx)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Competitor Brand - Free text input */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Competitor Brand *</Label>
                          <Input
                            value={product.competitor_other}
                            onChange={(e) => updateProduct(product.idx, 'competitor_other', e.target.value)}
                            placeholder="e.g. Indofood, Mayora, Unilever..."
                            className="h-9"
                            readOnly={readOnly}
                            autoFocus={!readOnly}
                          />
                        </div>

                        {/* Product Name & Category */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Product Name *</Label>
                            <Input
                              value={product.product_name}
                              onChange={(e) => updateProduct(product.idx, 'product_name', e.target.value)}
                              placeholder="e.g. Indomie Goreng"
                              className="h-9"
                              readOnly={readOnly}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Category</Label>
                            <Input
                              value={product.product_category}
                              onChange={(e) => updateProduct(product.idx, 'product_category', e.target.value)}
                              placeholder="e.g. Instant Noodles"
                              className="h-9"
                              readOnly={readOnly}
                            />
                          </div>
                        </div>

                        {/* Price */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Price (Rp) *</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={product.price ? new Intl.NumberFormat('en-US').format(product.price) : ''}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/,/g, '')
                                if (rawValue === '' || /^\d+$/.test(rawValue)) {
                                  updateProduct(product.idx, 'price', parseInt(rawValue) || 0)
                                }
                              }}
                              placeholder="0"
                              className="h-9"
                              readOnly={readOnly}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Price Unit</Label>
                            <Select
                              value={product.price_unit}
                              onValueChange={(v) => updateProduct(product.idx, 'price_unit', v)}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRICE_UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Stock Estimation & Shelf Position */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Stock Estimation (qty)</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={product.stock_estimation ? new Intl.NumberFormat('en-US').format(product.stock_estimation) : ''}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/,/g, '')
                                if (rawValue === '' || /^\d+$/.test(rawValue)) {
                                  updateProduct(product.idx, 'stock_estimation', parseInt(rawValue) || 0)
                                }
                              }}
                              placeholder="0"
                              className="h-9"
                              readOnly={readOnly}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Shelf Position</Label>
                            <Select
                              value={product.shelf_position}
                              onValueChange={(v) => updateProduct(product.idx, 'shelf_position', v)}
                              disabled={readOnly}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select position" />
                              </SelectTrigger>
                              <SelectContent>
                                {SHELF_POSITIONS.map((pos) => (
                                  <SelectItem key={pos} value={pos}>
                                    {pos}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Photo */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Photo</Label>
                          <div className="flex items-center gap-2">
                            {product.photo ? (
                              <div className="relative">
                                <img
                                  src={product.photo}
                                  alt="Product"
                                  className="h-16 w-16 rounded-lg object-cover border"
                                />
                                {!readOnly && (
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                                    onClick={() => updateProduct(product.idx, 'photo', '')}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ) : !readOnly ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePhotoCapture(product.idx)}
                                className="gap-1"
                              >
                                <Camera className="h-4 w-4" />
                                Take Photo
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">No photo</span>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            value={product.notes}
                            onChange={(e) => updateProduct(product.idx, 'notes', e.target.value)}
                            placeholder="Additional notes..."
                            className="min-h-[60px] text-sm"
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>

        {/* Overall survey notes */}
        <div className="space-y-1.5 pt-2 border-t">
          <Label className="text-xs">Survey Notes</Label>
          <Textarea
            value={surveyNotes}
            onChange={(e) => setSurveyNotes(e.target.value)}
            placeholder="Overall observations, market insights..."
            className="min-h-[60px] text-sm"
            readOnly={readOnly}
          />
        </div>
      </div>
    </VisitActivitySheet>
  )
}
