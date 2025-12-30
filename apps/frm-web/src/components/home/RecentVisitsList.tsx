/**
 * Recent Visits List Component
 * Display last 3 completed visits with compliance indicators
 * Reference: specs/001-sfa-app-build/tasks.md HOME-005
 */

import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRecentVisits,
  formatRelativeTime,
  getComplianceColor,
} from '@/hooks/useRecentVisits'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function RecentVisitsList() {
  const navigate = useNavigate()
  const { visits, isLoading, error } = useRecentVisits()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Visits
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load recent visits
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // No visits yet
  if (!visits || visits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recent Visits
              </CardTitle>
              <CardDescription>Your latest customer interactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/visit')}>
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No visits completed yet</p>
            <Button
              variant="link"
              onClick={() => navigate('/visit/check-in')}
              className="mt-2"
            >
              Start your first visit
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Visits
            </CardTitle>
            <CardDescription>Your latest customer interactions</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/visit')}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.name}
              className="flex items-center justify-between p-4 border rounded-sm hover:bg-accent cursor-pointer transition-colors"
              onClick={() => navigate(`/visit/${visit.name}/activities`)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-3 h-3 rounded-sm mt-1.5 ${getComplianceColor(
                    visit.compliance_score || 0
                  )}`}
                  title={`Compliance: ${visit.compliance_score || 0}%`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{visit.customer_name || visit.customer}</p>
                    <span className="text-xs text-muted-foreground">
                      {visit.completion_time ? formatRelativeTime(visit.completion_time) : 'Recently'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={visit.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {visit.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {visit.activities_completed_count} activities
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Compliance</p>
                  <p
                    className={`text-sm font-medium ${
                      (visit.compliance_score || 0) >= 80
                        ? 'text-primary'
                        : (visit.compliance_score || 0) >= 60
                        ? 'text-secondary-foreground'
                        : 'text-destructive'
                    }`}
                  >
                    {visit.compliance_score || 0}%
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
