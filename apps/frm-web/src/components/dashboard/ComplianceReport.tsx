/**
 * ComplianceReport Component
 * Shows compliance violations with breakdown by type and SR
 * Reference: specs/001-sfa-app-build/tasks.md US2-008
 */

import { useState, useMemo } from 'react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, MapPin, Camera, Target, ExternalLink } from 'lucide-react'

interface ComplianceReportProps {
  dateRange: {
    date_from: string
    date_to: string
  }
}

interface Violation {
  visit_id: string
  sales_representative: string
  full_name: string
  customer: string
  visit_date: string
  compliance_score: number
  violation_types: string[]
  gps_distance_from_customer_meters: number
  gps_accuracy: number
  check_in_photo: string | null
  activities_completion_rate: number
}

const violationTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  gps_proximity: {
    label: 'GPS Proximity',
    icon: MapPin,
    color: 'bg-destructive/10 text-destructive'
  },
  gps_accuracy: {
    label: 'GPS Accuracy',
    icon: Target,
    color: 'bg-orange-100 text-orange-800'
  },
  photo_missing: {
    label: 'Photo Missing',
    icon: Camera,
    color: 'bg-orange-500 text-white'
  },
  low_compliance: {
    label: 'Low Compliance',
    icon: AlertTriangle,
    color: 'bg-purple-100 text-purple-800'
  }
}

export function ComplianceReport({ dateRange }: ComplianceReportProps) {
  const [selectedViolationType, setSelectedViolationType] = useState<string | null>(null)

  // Fetch compliance violations
  const { data: violationsData, isLoading } = useFrappeGetCall<{ message: any }>(
    'frm.api.dashboard.get_compliance_violations',
    {
      date_from: dateRange.date_from,
      date_to: dateRange.date_to
    },
    'compliance-violations',
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  )

  const violations = violationsData?.message?.violations || []
  const summary = violationsData?.message?.summary

  // Filter violations by selected type
  const filteredViolations = useMemo(() => {
    if (!selectedViolationType) return violations

    return violations.filter((v: Violation) =>
      v.violation_types.includes(selectedViolationType)
    )
  }, [violations, selectedViolationType])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Report</CardTitle>
          <CardDescription>Loading compliance data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!violations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Report</CardTitle>
          <CardDescription>No compliance violations found for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All visits met compliance requirements!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Report</CardTitle>
        <CardDescription>
          Compliance violations and issue breakdown for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="by-type" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-type">By Violation Type</TabsTrigger>
            <TabsTrigger value="by-sr">By Sales Rep</TabsTrigger>
            <TabsTrigger value="details">Violation Details</TabsTrigger>
          </TabsList>

          {/* By Violation Type */}
          <TabsContent value="by-type" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {summary?.by_violation_type &&
                Object.entries(summary.by_violation_type).map(([type, count]) => {
                  const config = violationTypeLabels[type]
                  if (!config) return null

                  const Icon = config.icon

                  return (
                    <Card
                      key={type}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedViolationType(type === selectedViolationType ? null : type)}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{count as number}</div>
                        <p className="text-xs text-muted-foreground">
                          {((count as number) / summary.total_violations * 100).toFixed(1)}% of violations
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>

            {selectedViolationType && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">
                    {violationTypeLabels[selectedViolationType]?.label} Violations ({filteredViolations.length})
                  </h4>
                  <button
                    onClick={() => setSelectedViolationType(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear filter
                  </button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Sales Rep</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Compliance Score</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations.map((violation: Violation) => (
                      <TableRow key={violation.visit_id}>
                        <TableCell>{new Date(violation.visit_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{violation.full_name}</div>
                            <div className="text-xs text-muted-foreground">{violation.sales_representative}</div>
                          </div>
                        </TableCell>
                        <TableCell>{violation.customer}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            violation.compliance_score >= 80
                              ? 'bg-primary text-primary-foreground'
                              : violation.compliance_score >= 60
                              ? 'bg-orange-500 text-white'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {violation.compliance_score.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/app/sales-visit/${violation.visit_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* By Sales Representative */}
          <TabsContent value="by-sr" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Representative</TableHead>
                  <TableHead className="text-right">Total Violations</TableHead>
                  <TableHead className="text-right">GPS Issues</TableHead>
                  <TableHead className="text-right">Photo Issues</TableHead>
                  <TableHead className="text-right">Other Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.by_sales_representative &&
                  Object.entries(summary.by_sales_representative)
                    .sort(([, a]: any, [, b]: any) => b.violation_count - a.violation_count)
                    .map(([email, data]: [string, any]) => {
                      // Count violation types for this SR
                      const srViolations = violations.filter((v: Violation) => v.sales_representative === email)
                      const gpsIssues = srViolations.filter((v: Violation) =>
                        v.violation_types.includes('gps_proximity') || v.violation_types.includes('gps_accuracy')
                      ).length
                      const photoIssues = srViolations.filter((v: Violation) =>
                        v.violation_types.includes('photo_missing')
                      ).length
                      const otherIssues = srViolations.filter((v: Violation) =>
                        v.violation_types.includes('low_compliance')
                      ).length

                      return (
                        <TableRow key={email}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{data.full_name}</div>
                              <div className="text-xs text-muted-foreground">{email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-lg">{data.violation_count}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {gpsIssues > 0 && (
                              <Badge variant="outline" className="bg-destructive/5">
                                {gpsIssues}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {photoIssues > 0 && (
                              <Badge variant="outline" className="bg-secondary/5">
                                {photoIssues}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {otherIssues > 0 && (
                              <Badge variant="outline" className="bg-purple-50">
                                {otherIssues}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Violation Details */}
          <TabsContent value="details" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Violations</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation: Violation) => (
                  <TableRow key={violation.visit_id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(violation.visit_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{violation.full_name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {violation.sales_representative}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{violation.customer}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {violation.violation_types.map((type) => {
                          const config = violationTypeLabels[type]
                          if (!config) return null

                          return (
                            <Badge key={type} variant="outline" className={config.color}>
                              {config.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        violation.compliance_score >= 80
                          ? 'bg-primary text-primary-foreground'
                          : violation.compliance_score >= 60
                          ? 'bg-orange-500 text-white'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {violation.compliance_score.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/app/sales-visit/${violation.visit_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
