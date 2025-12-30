/**
 * Quick Actions Bar Component
 * Simplified 2-button horizontal bar for common actions
 * Reference: specs/001-sfa-app-build/tasks.md HOME-008
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Users, MapPin } from 'lucide-react'

export default function QuickActionsBar() {
  const navigate = useNavigate()

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1 h-12 gap-2"
        onClick={() => navigate('/entities')}
      >
        <Users className="h-5 w-5 text-primary" />
        <span className="font-medium">Browse Entities</span>
      </Button>
      <Button
        variant="outline"
        className="flex-1 h-12 gap-2"
        onClick={() => navigate('/routes')}
      >
        <MapPin className="h-5 w-5 text-primary" />
        <span className="font-medium">Routes</span>
      </Button>
    </div>
  )
}
