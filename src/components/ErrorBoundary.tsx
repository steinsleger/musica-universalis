import React, { ReactNode, ReactElement } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>Something went wrong</h1>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page or contact support if
              the problem persists.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#d32f2f', fontWeight: 'bold' }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    marginTop: '12px',
                    overflow: 'auto',
                    color: '#666',
                    fontSize: '12px',
                    backgroundColor: '#f9f9f9',
                    padding: '12px',
                    borderRadius: '4px'
                  }}
                >
                  {`${this.state.error.toString()}\n\n${this.state.errorInfo?.componentStack || ''}`}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#45a049';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4CAF50';
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
