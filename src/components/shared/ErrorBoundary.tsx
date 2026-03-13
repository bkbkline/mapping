'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A]">
          <div className="mx-4 w-full max-w-md rounded-xl border border-[#374151] bg-[#1F2937] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h2 className="mb-2 text-xl font-semibold text-[#F9FAFB]">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-[#9CA3AF]">
              An unexpected error occurred. Please try reloading the page.
            </p>

            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-[#F59E0B] px-6 py-2.5 text-sm font-medium text-[#0A0E1A] transition-all duration-200 hover:bg-[#D97706] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
            >
              Reload page
            </button>

            {this.state.errorId && (
              <p className="mt-4 text-xs text-[#9CA3AF]/60">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
