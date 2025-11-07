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
 * VisualizationErrorBoundary - Catches and handles visualization/SVG rendering errors
 * Allows the app to continue functioning even if the visualization crashes
 */
export class VisualizationErrorBoundary extends Component<Props, State> {
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
    console.error('[VISUALIZATION ERROR BOUNDARY]', error, errorInfo);
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
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              fontFamily: 'system-ui, sans-serif',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <h3>Visualization Error</h3>
            <p>The visualization encountered an error and cannot be rendered.</p>
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
                backgroundColor: '#f5c6cb',
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
