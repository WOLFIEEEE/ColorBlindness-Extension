import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-[380px] min-h-[300px] bg-cream dark:bg-dark p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dark dark:text-cream mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-warm-brown dark:text-cream/60 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReload}
            className="btn-primary text-sm"
          >
            Reload Extension
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

