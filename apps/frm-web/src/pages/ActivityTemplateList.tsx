/**
 * Activity Template List Page
 * Modal-based view with Sheet pattern (create still uses separate page)
 * Reference: specs/001-sfa-app-build/entity-crud-modal-refactoring-plan.md
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, CheckCircle2, XCircle, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { Main } from '@/components/layout/Main'
import { useActivityTemplates, useActivityTemplateDetail } from '@/hooks/useActivityTemplates'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

export default function ActivityTemplateList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const { templates, totalCount, isLoading, error } = useActivityTemplates({
    status: statusFilter,
    activity_type: typeFilter,
    search,
    limit: 50,
  })

  // Fetch template detail when selected
  const { template, isLoading: isLoadingTemplate } = useActivityTemplateDetail(selectedTemplateId)

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId)
  }

  const handleCloseModal = () => {
    setSelectedTemplateId(null)
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'Checklist':
        return 'bg-muted0'
      case 'Photo':
        return 'bg-purple-500'
      case 'Stock Check':
        return 'bg-primary'
      case 'Competitor Tracking':
        return 'bg-orange-500'
      default:
        return 'bg-muted0'
    }
  }

  if (isLoading) {
    return (
      <>
        <StandardHeader />
        <Main className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </Main>
      </>
    )
  }

  return (
    <>
      <StandardHeader />

      <Main className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Activity Templates</h1>
            <p className="text-muted-foreground">
              {totalCount} template{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => navigate('/activity-templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={typeFilter || 'all'}
                onValueChange={(value) => setTypeFilter(value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Checklist">Checklist</SelectItem>
                  <SelectItem value="Photo">Photo</SelectItem>
                  <SelectItem value="Stock Check">Stock Check</SelectItem>
                  <SelectItem value="Competitor Tracking">Competitor Tracking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load templates. {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Templates List */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No templates found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first activity template'}
              </p>
              {!search && !statusFilter && !typeFilter && (
                <Button onClick={() => navigate('/activity-templates/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((tmpl) => (
              <Card
                key={tmpl.template_id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleTemplateClick(tmpl.template_id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{tmpl.template_name}</CardTitle>
                      <CardDescription className="mt-2">
                        {tmpl.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end ml-4">
                      <Badge
                        variant={tmpl.status === 'active' ? 'default' : 'secondary'}
                      >
                        {tmpl.status}
                      </Badge>
                      <Badge className={getActivityTypeColor(tmpl.activity_type)}>
                        {tmpl.activity_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {tmpl.is_mandatory === 1 && (
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">Mandatory</Badge>
                      </span>
                    )}
                    {tmpl.photo_required === 1 && (
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">Photo Required</Badge>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Main>

      {/* Activity Template Detail Modal */}
      <Sheet open={!!selectedTemplateId} onOpenChange={(open) => !open && handleCloseModal()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {isLoadingTemplate ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : template ? (
            <>
              <SheetHeader>
                <SheetTitle>{template.template_name}</SheetTitle>
                <SheetDescription>
                  Template details and configuration
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                    <Badge className={getActivityTypeColor(template.activity_type)}>
                      {template.activity_type}
                    </Badge>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Template Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Template Information</CardTitle>
                    <CardDescription>Details and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        {template.is_mandatory === 1 ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-sm">
                          <div className="text-muted-foreground">Is Mandatory</div>
                          <div className="font-medium">
                            {template.is_mandatory === 1 ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {template.photo_required === 1 ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-sm">
                          <div className="text-muted-foreground">Photo Required</div>
                          <div className="font-medium">
                            {template.photo_required === 1 ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {template.description && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Description</div>
                          <div className="text-sm">{template.description}</div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="text-muted-foreground">Created By</div>
                          <div className="font-medium">{template.created_by}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="text-muted-foreground">Created</div>
                          <div className="font-medium">
                            {new Date(template.creation).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="text-muted-foreground">Modified By</div>
                          <div className="font-medium">{template.modified_by}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="text-muted-foreground">Modified</div>
                          <div className="font-medium">
                            {new Date(template.modified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
