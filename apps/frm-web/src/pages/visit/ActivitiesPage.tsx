/**
 * ActivitiesPage Component
 * Manages activity completion flow and visit completion
 * Reference: specs/001-sfa-app-build/tasks.md US1-017, US1-018
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFrappeGetDocList, useFrappeGetCall } from 'frappe-react-sdk'
import { CheckCircle, ListTodo, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ActivityForm } from '@/components/visit/ActivityForm'
import { VisitCompletion } from '@/components/visit/VisitCompletion'
import { useVisit } from '@/hooks/useVisit'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'

interface ActivityTemplate {
  name: string
  template_name: string
  activity_type: string
  field_definitions: string
  is_mandatory: boolean
}

export default function ActivitiesPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const visit = useVisit()
  const [activeTab, setActiveTab] = useState<'activities' | 'complete'>('activities')
  const [completedActivities, setCompletedActivities] = useState<string[]>([])
  const [currentActivityIndex, setCurrentActivityIndex] = useState<number>(0)

  // Fetch activity templates
  const { data: templates, isLoading: isLoadingTemplates } = useFrappeGetDocList('Visit Activity Template', {
    fields: ['name', 'template_name', 'activity_type', 'field_definitions', 'is_mandatory'],
    filters: [],
    orderBy: {
      field: 'is_mandatory',
      order: 'desc'
    }
  })

  // Fetch visit details
  const { data: visitData, isLoading: isLoadingVisit } = useFrappeGetCall<{ message: any }>(
    'frm.api.visit.get_visit_details',
    visitId ? { sales_visit: visitId } : undefined,
    visitId ? `visit-details-${visitId}` : null,
    {
      revalidateOnFocus: false
    }
  )

  // Update completed activities from visit data
  useEffect(() => {
    if (visitData?.message?.activities) {
      const completed = visitData.message.activities.map((act: any) => act.activity_template)
      setCompletedActivities(completed)
    }
  }, [visitData])

  const handleActivitySubmit = async (template: ActivityTemplate, formData: Record<string, any>) => {
    try {
      await visit.addActivity({
        activity_template: template.name,
        form_data: formData,
        start_time: formData.start_time,
        end_time: formData.end_time,
        outcome_notes: formData.outcome_notes
      })

      // Add to completed list
      setCompletedActivities(prev => [...prev, template.name])

      // Move to next activity or completion tab
      if (templates && currentActivityIndex < templates.length - 1) {
        setCurrentActivityIndex(currentActivityIndex + 1)
      } else {
        setActiveTab('complete')
      }
    } catch (error) {
      // Error handled by useVisit hook and displayed via toast
      console.error('Failed to add activity:', error)
    }
  }

  const handleSkipActivity = () => {
    if (templates && currentActivityIndex < templates.length - 1) {
      setCurrentActivityIndex(currentActivityIndex + 1)
    } else {
      setActiveTab('complete')
    }
  }

  const isActivityCompleted = (templateName: string) => {
    return completedActivities.includes(templateName)
  }

  if (!visitId) {
    return (
      <>
        
<StandardHeader />
        <Main>
        <Alert variant="destructive">
          <AlertDescription>Invalid visit ID</AlertDescription>
        </Alert>
        </Main>
      </>
    )
  }

  if (isLoadingTemplates || isLoadingVisit) {
    return (
      <>
        
<StandardHeader />
        <Main>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading visit activities...</span>
        </div>
        </Main>
      </>
    )
  }

  const currentTemplate = templates?.[currentActivityIndex]

  return (
    <>
      
<StandardHeader />

      <Main>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visit Activities</h1>
          <p className="text-muted-foreground">
            Visit ID: {visitId}
            {' • '}
            {completedActivities.length} / {templates?.length || 0} activities completed
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'activities' | 'complete')} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Activities
            {completedActivities.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                {completedActivities.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Complete Visit
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-6 mt-6">
          {templates && templates.length > 0 ? (
            <>
              {/* Activity Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Progress</CardTitle>
                  <CardDescription>
                    Complete activities to finish your visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {templates.map((template: ActivityTemplate, index: number) => (
                      <div
                        key={template.name}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isActivityCompleted(template.name)
                            ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/40'
                            : index === currentActivityIndex
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-muted/30 border-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isActivityCompleted(template.name) ? (
                            <CheckCircle className="h-5 w-5 text-primary dark:text-primary" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <div>
                            <div className="font-medium text-foreground">{template.template_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.activity_type}
                              {template.is_mandatory && (
                                <span className="ml-2 text-destructive">• Mandatory</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {index === currentActivityIndex && !isActivityCompleted(template.name) && (
                          <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Current Activity Form */}
              {currentTemplate && !isActivityCompleted(currentTemplate.name) && (
                <div className="space-y-4">
                  <ActivityForm
                    template={currentTemplate}
                    onSubmit={(formData) => handleActivitySubmit(currentTemplate, formData)}
                    onCancel={currentTemplate.is_mandatory ? undefined : handleSkipActivity}
                  />
                  {!currentTemplate.is_mandatory && (
                    <Button
                      variant="outline"
                      onClick={handleSkipActivity}
                      className="w-full"
                    >
                      Skip this activity
                    </Button>
                  )}
                </div>
              )}

              {/* All activities completed */}
              {currentTemplate && isActivityCompleted(currentTemplate.name) && (
                <Card className="border-primary dark:border-primary">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-12 w-12 text-primary dark:text-primary mx-auto" />
                      <div>
                        <h3 className="text-xl font-bold">Activity Completed!</h3>
                        <p className="text-muted-foreground mt-1">
                          You've completed {completedActivities.length} of {templates.length} activities
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          onClick={handleSkipActivity}
                          className="flex-1"
                        >
                          Next Activity
                        </Button>
                        <Button
                          onClick={() => setActiveTab('complete')}
                          className="flex-1"
                        >
                          Complete Visit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                No activity templates found. Please contact your administrator.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Complete Visit Tab */}
        <TabsContent value="complete" className="mt-6">
          <VisitCompletion
            visitId={visitId}
            completedActivities={completedActivities}
          />
        </TabsContent>
      </Tabs>
      </Main>
    </>
  )
}
