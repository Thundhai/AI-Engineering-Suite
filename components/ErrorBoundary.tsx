import React from 'react';
import { ErrorIcon } from './Icons';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-eng-bg p-6">
          <div className="eng-panel max-w-md w-full p-8 text-center">
            <ErrorIcon className="w-10 h-10 text-eng-danger mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-eng-navy mb-2">Something went wrong</h1>
            <p className="text-sm text-eng-muted mb-6">
              The app hit an unexpected error. Your data is safe — it's saved to your account, not this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="eng-button eng-button-primary mx-auto"
            >
              Reload the app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
