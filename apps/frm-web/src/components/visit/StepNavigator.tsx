/**
 * StepNavigator Component
 * Visual progress indicator for 7-step visit flow
 */

import type { VisitStep, StepStatus } from '@/hooks/useVisitFlow'
import {
  CheckCircle,
  Circle,
  MapPin,
  Camera,
  Package,
  CreditCard,
  ShoppingCart,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepNavigatorProps {
  currentStep: VisitStep
  steps: Array<{ step: VisitStep; name: string; status: StepStatus; isMandatory: boolean }>
  onStepClick?: (step: VisitStep) => void
  canNavigateToStep?: (step: VisitStep) => boolean
}

const STEP_ICONS = {
  1: MapPin,
  2: Camera,
  3: Package,
  4: CreditCard,
  5: ShoppingCart,
  6: BarChart3,
  7: LogOut,
}

export function StepNavigator({
  currentStep,
  steps,
  onStepClick,
  canNavigateToStep,
}: StepNavigatorProps) {
  const handleStepClick = (step: VisitStep) => {
    if (canNavigateToStep && canNavigateToStep(step) && onStepClick) {
      onStepClick(step)
    }
  }

  const getStepColor = (status: StepStatus, isCurrent: boolean) => {
    if (status === 'completed') return 'bg-green-600 dark:bg-green-700 text-white'
    if (status === 'skipped') return 'bg-orange-500 dark:bg-orange-600 text-white'
    if (isCurrent) return 'bg-primary text-primary-foreground'
    return 'bg-muted text-muted-foreground'
  }

  const getStepIcon = (step: VisitStep, status: StepStatus) => {
    const Icon = STEP_ICONS[step]
    if (status === 'completed') return <CheckCircle className="h-5 w-5" />
    if (status === 'skipped') return <Circle className="h-5 w-5" />
    return <Icon className="h-5 w-5" />
  }

  const getConnectorColor = (fromStep: VisitStep) => {
    const fromStepData = steps.find(s => s.step === fromStep)
    if (fromStepData?.status === 'completed' || fromStepData?.status === 'skipped') {
      return 'bg-green-600 dark:bg-green-700'
    }
    return 'bg-muted'
  }

  return (
    <div className="w-full py-6">
      {/* Mobile view - Compact horizontal */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between px-2">
          <div className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of 7
          </div>
          <div className="text-sm text-muted-foreground">
            {steps[currentStep - 1].name}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center flex-1">
              <div
                className={cn(
                  'h-2 w-full rounded-full transition-all',
                  getStepColor(step.status, step.step === currentStep)
                )}
              />
              {index < steps.length - 1 && <div className="w-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop view - Full horizontal stepper */}
      <div className="hidden lg:flex items-start justify-between relative">
        {steps.map((step, index) => {
          const isCurrent = step.step === currentStep
          const isClickable = canNavigateToStep ? canNavigateToStep(step.step) : false

          return (
            <div key={step.step} className="flex flex-col items-center flex-1 relative">
              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
                  getStepColor(step.status, isCurrent),
                  isClickable && 'cursor-pointer hover:scale-110',
                  !isClickable && 'cursor-not-allowed',
                  isCurrent && 'ring-4 ring-primary/20'
                )}
                onClick={() => isClickable && handleStepClick(step.step)}
              >
                {getStepIcon(step.step, step.status)}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {step.isMandatory ? 'Required' : 'Optional'}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-6 left-1/2 h-0.5 w-full transition-all',
                    getConnectorColor(step.step)
                  )}
                  style={{ transform: 'translateX(50%)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress percentage */}
      <div className="mt-4 text-center">
        <div className="text-xs text-muted-foreground">
          {steps.filter(s => s.status === 'completed' || s.status === 'skipped').length} of{' '}
          {steps.length} steps completed
        </div>
      </div>
    </div>
  )
}
