import { ReactNode, Component, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * AudioErrorBoundary - Catches and handles audio system errors gracefully
 * Prevents audio errors from crashing the entire application
 */
export class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[AUDIO ERROR BOUNDARY]', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              padding: '20px',
              margin: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              color: '#856404',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            <h3>Audio System Error</h3>
            <p>The audio system encountered an error. The application will continue to function without audio.</p>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '10px', fontSize: '12px' }}>
                <summary>Error Details</summary>
                <pre style={{ marginTop: '10px', overflow: 'auto', maxHeight: '200px' }}>
                  {this.state.error?.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.resetError}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#ffc107',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
