/**
 * VisitFlowPage Component
 * Main orchestrator for 7-step visit flow
 */

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFrappeGetDocList } from 'frappe-react-sdk'
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { StepNavigator } from '@/components/visit/StepNavigator'
import { CheckInStep } from '@/components/visit/CheckInStep'
import { PhotoStep } from '@/components/visit/PhotoStep'
import { CheckOutStep } from '@/components/visit/CheckOutStep'
import { ActivityForm } from '@/components/visit/ActivityForm'
import { useVisitFlow } from '@/hooks/useVisitFlow'
import { toast } from 'sonner'

interface ActivityTemplate {
  name: string
  template_name: string
  activity_type: string
  field_definitions: string
  is_mandatory: boolean
  display_order: number
}

export default function VisitFlowPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const customerId = searchParams.get('customer')

  const visitFlow = useVisitFlow()

  // Fetch activity templates ordered by display_order
  const { data: templates, isLoading: templatesLoading } = useFrappeGetDocList<ActivityTemplate>(
    'Visit Activity Template',
    {
      fields: ['name', 'template_name', 'activity_type', 'field_definitions', 'is_mandatory', 'display_order'],
      filters: [['status', '=', 'Active']],
      orderBy: {
        field: 'display_order',
        order: 'asc',
      },
    }
  )

  // Validate customer ID on mount
  useEffect(() => {
    if (!customerId) {
      toast.error('No customer selected', {
        description: 'Please select a customer first',
      })
      navigate('/visit')
    }
  }, [customerId, navigate])

  const handleCheckIn = async (data: any) => {
    const visitId = await visitFlow.checkIn(data)
    console.log('Visit created:', visitId)
    // Auto-advance to photo step
    visitFlow.nextStep()
  }

  const handlePhotoSaved = async (data: any) => {
    await visitFlow.savePhoto(data)
    visitFlow.nextStep()
  }

  const handleActivitySubmit = async (templateName: string, formData: Record<string, any>) => {
    await visitFlow.addActivity({
      activity_template: templateName,
      form_data: formData,
      start_time: formData.start_time,
      end_time: formData.end_time,
      outcome_notes: formData.outcome_notes,
    })

    // Auto-advance to next step
    if (visitFlow.currentStep < 7) {
      visitFlow.nextStep()
    }
  }

  const handleSkipActivity = () => {
    // Mark current step as skipped and enable proceeding
    visitFlow.skipActivity()
    // Auto-advance to next step after marking as skipped
    if (visitFlow.currentStep < 7) {
      visitFlow.nextStep()
    }
  }

  const handleCheckOut = async (data: any) => {
    await visitFlow.checkOut(data)
  }

  const handleCompleteVisit = async () => {
    await visitFlow.completeVisit()

    toast.success('Visit completed successfully!', {
      description: 'Redirecting to visit history...',
      duration: 3000,
    })

    // Navigate to visit history after completion
    setTimeout(() => {
      navigate('/visit')
    }, 2000)
  }

  // Determine which step template to show (steps 3-6 map to templates)
  const getActivityTemplate = (): ActivityTemplate | null => {
    if (visitFlow.currentStep < 3 || visitFlow.currentStep > 6 || !templates) {
      return null
    }

    // Map step to template index (step 3 → template[0], step 4 → template[1], etc.)
    const templateIndex = visitFlow.currentStep - 3
    return templates[templateIndex] || null
  }

  // Check if visit has sales order (for check-out validation)
  const hasSalesOrder = visitFlow.steps.find(s => s.step === 5)?.status === 'completed'

  const currentTemplate = getActivityTemplate()
  const currentStepData = visitFlow.steps.find(s => s.step === visitFlow.currentStep)

  if (!customerId) {
    return null
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Visit</h1>
            <p className="text-muted-foreground">Follow the steps to complete your visit</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/visit')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        {/* Step Progress Navigator */}
        <StepNavigator
          currentStep={visitFlow.currentStep}
          steps={visitFlow.steps}
          onStepClick={visitFlow.goToStep}
          canNavigateToStep={visitFlow.canNavigateToStep}
        />

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Check-In */}
          {false && (visitFlow.currentStep as any) === 0 && (
            <CheckInStep
              customerId={customerId || ""}
              onCheckIn={handleCheckIn}
              isProcessing={visitFlow.isProcessing}
            />
          )}

          {/* Step 2: Photo */}
          {visitFlow.currentStep === 2 && (
            <PhotoStep onPhotoSaved={handlePhotoSaved} isProcessing={visitFlow.isProcessing} />
          )}

          {/* Steps 3-6: Activities (Dynamic based on templates) */}
          {visitFlow.currentStep >= 3 && visitFlow.currentStep <= 6 && (
            <>
              {templatesLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading activity templates...</p>
                </div>
              ) : currentTemplate ? (
                <ActivityForm
                  template={currentTemplate}
                  onSubmit={formData => handleActivitySubmit(currentTemplate.name, formData)}
                  onCancel={!currentTemplate.is_mandatory ? handleSkipActivity : undefined}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No activity template configured for this step</p>
                  <Button onClick={handleSkipActivity} className="mt-4">
                    Skip Step
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 7: Check-Out */}
          {visitFlow.currentStep === 7 && (
            <CheckOutStep
              steps={visitFlow.steps}
              hasSalesOrder={hasSalesOrder}
              onCheckOut={handleCheckOut}
              onComplete={handleCompleteVisit}
              isProcessing={visitFlow.isProcessing}
            />
          )}
        </div>

        {/* Navigation Controls */}
        {visitFlow.currentStep !== 1 && visitFlow.currentStep !== 7 && (
          <div className="max-w-2xl mx-auto flex gap-4">
            <Button
              variant="outline"
              onClick={visitFlow.previousStep}
              disabled={false || (visitFlow.currentStep as any) === 0 || visitFlow.isProcessing}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous Step
            </Button>

            {currentStepData && !currentStepData.isMandatory && (
              <Button
                variant="outline"
                onClick={handleSkipActivity}
                disabled={visitFlow.isProcessing}
                className="flex-1"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip (Optional)
              </Button>
            )}

            {visitFlow.canProceed && visitFlow.currentStep < 7 && (
              <Button onClick={visitFlow.nextStep} disabled={visitFlow.isProcessing} className="flex-1">
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Error Display */}
        {visitFlow.error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-destructive">
              {visitFlow.error}
            </div>
          </div>
        )}
      </Main>
    </>
  )
}
