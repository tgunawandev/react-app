/**
 * Date Range Filter Component
 * Preset buttons and custom date picker for filtering reports
 * Reference: specs/001-sfa-app-build/tasks.md REPORTS-005
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export interface DateRangeValue {
  from: Date
  to: Date
}

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
}

type Preset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom'

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<Preset>('last7days')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handlePresetClick = (preset: Preset) => {
    const today = new Date()
    // Set time to end of day to include all of today's visits
    today.setHours(23, 59, 59, 999)

    let from: Date
    let to: Date = new Date(today)

    switch (preset) {
      case 'today':
        from = new Date(today)
        from.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        from = new Date(today)
        from.setDate(today.getDate() - 1)
        from.setHours(0, 0, 0, 0)
        to = new Date(today)
        to.setDate(today.getDate() - 1)
        to.setHours(23, 59, 59, 999)
        break
      case 'last7days':
        from = new Date(today)
        from.setDate(today.getDate() - 6)
        from.setHours(0, 0, 0, 0)
        break
      case 'last30days':
        from = new Date(today)
        from.setDate(today.getDate() - 29)
        from.setHours(0, 0, 0, 0)
        break
      default:
        return
    }

    setActivePreset(preset)
    onChange({ from, to })
  }

  const handleCustomRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setActivePreset('custom')
      onChange({ from: range.from, to: range.to })
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button
          variant={activePreset === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('today')}
        >
          Today
        </Button>
        <Button
          variant={activePreset === 'yesterday' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('yesterday')}
        >
          Yesterday
        </Button>
        <Button
          variant={activePreset === 'last7days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last7days')}
        >
          Last 7 Days
        </Button>
        <Button
          variant={activePreset === 'last30days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick('last30days')}
        >
          Last 30 Days
        </Button>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activePreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="gap-1"
            >
              <CalendarIcon className="h-4 w-4" />
              {activePreset === 'custom'
                ? `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`
                : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={value.from}
              selected={{ from: value.from, to: value.to }}
              onSelect={handleCustomRangeChange}
              numberOfMonths={2}
              disabled={(date: Date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
