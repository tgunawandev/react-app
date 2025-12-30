/**
 * RecentCarousel Component - Recently Accessed Records
 * Horizontal scroll carousel showing last 5 accessed records
 * Reference: specs/001-sfa-app-build/tasks.md ENT-003
 */

import { useNavigate } from 'react-router-dom'
import { Clock, User, ShoppingCart, MapPin, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRecentRecords } from '@/hooks/useRecentRecords'
import type { RecentRecord } from '@/hooks/useRecentRecords'

const DOCTYPE_ICONS: Record<string, typeof User> = {
  'Customer': User,
  'Sales Order': ShoppingCart,
  'Route Plan': MapPin,
  'Item': FileText,
  'Visit Activity Template': FileText
}

const DOCTYPE_COLORS: Record<string, string> = {
  'Customer': 'bg-muted text-foreground',
  'Sales Order': 'bg-primary text-primary-foreground',
  'Route Plan': 'bg-purple-100 text-purple-700',
  'Item': 'bg-orange-100 text-orange-700',
  'Visit Activity Template': 'bg-pink-100 text-pink-700'
}

export function RecentCarousel() {
  const navigate = useNavigate()
  const { records, isEmpty } = useRecentRecords()

  const handleRecordClick = (record: RecentRecord) => {
    const routes: Record<string, string> = {
      'Customer': `/sfa/customers/${record.name}`,
      'Sales Order': `/sfa/orders/${record.name}`,
      'Route Plan': `/sfa/routes/${record.name}`,
      'Item': `/sfa/catalog/${record.name}`,
      'Visit Activity Template': `/sfa/settings`
    }

    const route = routes[record.doctype]
    if (route) {
      navigate(route)
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (isEmpty) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Recent</h3>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {records.map((record) => {
          const Icon = DOCTYPE_ICONS[record.doctype] || FileText
          const colorClass = DOCTYPE_COLORS[record.doctype] || 'bg-muted text-foreground'

          return (
            <Card
              key={`${record.doctype}-${record.name}`}
              className="min-w-[200px] cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRecordClick(record)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {record.display_name || record.name}
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {record.doctype}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(record.timestamp)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
