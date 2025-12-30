/**
 * Error Boundary Component
 * Graceful error handling with user-friendly messages and recovery paths
 * Reference: specs/001-sfa-app-build/tasks.md INFRA-002
 */

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to backend for debugging
    this.logErrorToBackend(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  logErrorToBackend = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // In production, this would send error to backend logging service
      console.error('Error caught by boundary:', error, errorInfo)

      // Optionally send to Frappe backend
      await fetch('/api/method/frm.api.logs.log_frontend_error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
        }),
      }).catch(() => {
        // Silently fail if logging fails
      })
    } catch (e) {
      // Silently fail if logging fails
    }
  }

  handleReload = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.href = '/sfa/home'
  }

  getErrorMessage = (error: Error | null): string => {
    if (!error) return 'An unexpected error occurred'

    // Provide user-friendly messages for common errors
    if (error.message.includes('Failed to fetch')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You do not have permission to access this resource. Please contact your administrator.'
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.'
    }

    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'Server error occurred. Our team has been notified. Please try again later.'
    }

    return error.message || 'An unexpected error occurred'
  }

  getRecoveryInstructions = (error: Error | null): string => {
    if (!error) return 'Try refreshing the page or going back to the home page.'

    if (error.message.includes('Failed to fetch')) {
      return 'Check your internet connection and try again.'
    }

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Contact your administrator to request access.'
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'Please log in again to continue.'
    }

    return 'Try refreshing the page or going back to the home page.'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-muted">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    {this.getErrorMessage(this.state.error)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-sm">
                <p className="text-sm font-medium mb-2">What can you do?</p>
                <p className="text-sm text-muted-foreground">
                  {this.getRecoveryInstructions(this.state.error)}
                </p>
              </div>

              {/* Error details (collapsed by default in production) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="p-4 bg-destructive/5 rounded-sm border border-destructive/20">
                  <summary className="cursor-pointer text-sm font-medium text-destructive">
                    Technical Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-destructive font-mono">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs text-destructive overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1 gap-2">
                  <Home className="h-4 w-4" />
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
