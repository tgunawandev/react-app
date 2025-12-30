/**
 * VisitCompletion Component
 * Displays mandatory activity checklist, compliance preview, and completes visit
 * Reference: specs/001-sfa-app-build/tasks.md US1-018
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFrappeGetDocList } from 'frappe-react-sdk'
import { CheckCircle, XCircle, Loader2, Award, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useVisit } from '@/hooks/useVisit'
import { toast } from 'sonner'

interface ActivityStatus {
  template_name: string
  activity_type: string
  is_mandatory: boolean
  is_completed: boolean
}

interface VisitCompletionProps {
  visitId: string
  completedActivities: string[] // Array of activity template names
}

export function VisitCompletion({ visitId: _visitId, completedActivities }: VisitCompletionProps) {
  const navigate = useNavigate()
  const visit = useVisit()
  const [selectedOrder, setSelectedOrder] = useState<string>('')
  const [activityStatuses, setActivityStatuses] = useState<ActivityStatus[]>([])
  const [compliancePreview, setCompliancePreview] = useState<number | null>(null)

  // Fetch all activity templates
  const { data: templates } = useFrappeGetDocList('Visit Activity Template', {
    fields: ['name', 'template_name', 'activity_type', 'is_mandatory'],
    filters: [],
    orderBy: {
      field: 'is_mandatory',
      order: 'desc'
    }
  })

  // Fetch sales orders for the customer (optional linking)
  const { data: salesOrders, isLoading: isLoadingOrders } = useFrappeGetDocList('Sales Order', {
    fields: ['name', 'transaction_date', 'grand_total', 'status'],
    filters: [
      ['docstatus', '=', 1], // Submitted orders only
      ['status', 'in', ['Draft', 'To Deliver and Bill', 'To Bill', 'To Deliver']]
    ],
    limit: 50,
    orderBy: {
      field: 'transaction_date',
      order: 'desc'
    }
  })

  // Calculate activity statuses and compliance preview
  useEffect(() => {
    if (!templates) return

    const statuses: ActivityStatus[] = templates.map((template: any) => ({
      template_name: template.template_name,
      activity_type: template.activity_type,
      is_mandatory: template.is_mandatory === 1,
      is_completed: completedActivities.includes(template.name)
    }))

    setActivityStatuses(statuses)

    // Calculate compliance preview (simplified - actual calculation done in backend)
    const mandatoryActivities = statuses.filter(s => s.is_mandatory)
    const completedMandatory = mandatoryActivities.filter(s => s.is_completed)

    // Activity compliance: 40 points (from task spec)
    const activityScore = mandatoryActivities.length > 0
      ? (completedMandatory.length / mandatoryActivities.length) * 40
      : 40

    // GPS (30) + Photo (20) already validated at check-in
    // Assuming those are valid = 50 points
    // Order linkage: 10 points
    const orderScore = selectedOrder ? 10 : 0

    const estimatedCompliance = 50 + activityScore + orderScore

    setCompliancePreview(Math.round(estimatedCompliance))
  }, [templates, completedActivities, selectedOrder])

  const handleComplete = async () => {
    // Validate mandatory activities
    const incompleteMandatory = activityStatuses.filter(s => s.is_mandatory && !s.is_completed)

    if (incompleteMandatory.length > 0) {
      toast.error('Incomplete mandatory activities', {
        description: `Please complete: ${incompleteMandatory.map(s => s.template_name).join(', ')}`
      })
      return
    }

    try {
      const result = await visit.completeVisit()

      toast.success('Visit completed successfully!', {
        description: `Compliance Score: ${result.compliance_score}%`,
        duration: 5000
      })

      // Navigate to visit history or home
      navigate('/visits')
    } catch (error) {
      toast.error('Failed to complete visit', {
        description: visit.error || 'Please try again'
      })
    }
  }

  const mandatoryActivities = activityStatuses.filter(s => s.is_mandatory)
  const completedMandatory = mandatoryActivities.filter(s => s.is_completed)
  const optionalActivities = activityStatuses.filter(s => !s.is_mandatory)
  const completedOptional = optionalActivities.filter(s => s.is_completed)

  const totalCompleted = completedActivities.length
  const totalActivities = activityStatuses.length
  const completionPercentage = totalActivities > 0 ? (totalCompleted / totalActivities) * 100 : 0

  const canComplete = mandatoryActivities.length === completedMandatory.length

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Visit Progress
          </CardTitle>
          <CardDescription>
            {totalCompleted} of {totalActivities} activities completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span className="font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {compliancePreview !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimated Compliance Score</span>
                <span className={`font-bold ${compliancePreview >= 80 ? 'text-primary' : compliancePreview >= 60 ? 'text-secondary-foreground' : 'text-destructive'}`}>
                  {compliancePreview}%
                </span>
              </div>
              <Progress
                value={compliancePreview}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mandatory Activities Checklist */}
      {mandatoryActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-destructive">*</span>
              Mandatory Activities
            </CardTitle>
            <CardDescription>
              {completedMandatory.length} of {mandatoryActivities.length} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mandatoryActivities.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    activity.is_completed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {activity.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="font-medium">{activity.template_name}</div>
                      <div className="text-sm text-muted-foreground">{activity.activity_type}</div>
                    </div>
                  </div>
                  {activity.is_completed && (
                    <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-1 rounded">
                      Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional Activities */}
      {optionalActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optional Activities</CardTitle>
            <CardDescription>
              {completedOptional.length} of {optionalActivities.length} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optionalActivities.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    activity.is_completed ? 'bg-primary/5 border-primary/20' : 'bg-muted border-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {activity.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <div className="font-medium">{activity.template_name}</div>
                      <div className="text-sm text-muted-foreground">{activity.activity_type}</div>
                    </div>
                  </div>
                  {activity.is_completed && (
                    <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-1 rounded">
                      Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Order Linking (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Link Sales Order (Optional)</CardTitle>
          <CardDescription>
            Link this visit to a sales order for +10% compliance boost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sales-order">Sales Order</Label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder} disabled={isLoadingOrders}>
              <SelectTrigger id="sales-order">
                <SelectValue placeholder={isLoadingOrders ? 'Loading orders...' : 'Select sales order (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {salesOrders?.map((order: any) => (
                  <SelectItem key={order.name} value={order.name}>
                    {order.name} - {new Date(order.transaction_date).toLocaleDateString()} - ${order.grand_total.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOrder && selectedOrder !== 'none' && (
              <p className="text-sm text-primary">+10% compliance score bonus</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Alert */}
      {!canComplete && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must complete all mandatory activities before finishing this visit.
            Missing: {mandatoryActivities.filter(s => !s.is_completed).map(s => s.template_name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Complete Visit Button */}
      <Card className={canComplete ? 'border-primary' : 'border-destructive'}>
        <CardContent className="pt-6">
          <Button
            onClick={handleComplete}
            disabled={!canComplete || visit.isCompleting}
            size="lg"
            className="w-full"
            variant={canComplete ? 'default' : 'secondary'}
          >
            {visit.isCompleting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Completing Visit...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Visit
              </>
            )}
          </Button>

          {visit.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{visit.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
