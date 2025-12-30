/**
 * Targets Card Component
 * Display 4 horizontal progress bars for monthly sales targets
 * Reference: specs/001-sfa-app-build/tasks.md HOME-002
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useSalesTargets } from '@/hooks/useSalesTargets'
import { Target } from 'lucide-react'

export default function TargetsCard() {
  const { salesQty, invoicePayments, activeOutlets, effectiveCalls, isLoading, error } =
    useSalesTargets()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My Targets
          </CardTitle>
          <CardDescription className="text-destructive">
            Failed to load targets data
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const targets = [salesQty, invoicePayments, activeOutlets, effectiveCalls]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          My Targets
        </CardTitle>
        <CardDescription>This month's performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {targets.map((target, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{target.label}</span>
              <span className={target.color}>
                {target.current.toLocaleString()} / {target.target.toLocaleString()}
              </span>
            </div>
            <Progress
              value={target.progress}
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(target.progress)}% complete</span>
              <span className={target.color}>{Math.round(target.progress)}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
