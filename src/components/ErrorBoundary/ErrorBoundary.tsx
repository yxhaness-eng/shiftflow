import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ShiftFlow ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: 'var(--bg-primary, #FAF5EB)',
          color: 'var(--text-primary, #62544B)',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '460px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color, #E6DBCB)',
            borderRadius: '20px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FDE8E8',
              color: '#C62828',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
              Что-то пошло не так
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#8B7A70', marginBottom: '16px' }}>
              Произошла непредвиденная ошибка отображения. Ваши сохраненные данные в безопасности.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: '#F4EBDD',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                marginBottom: '16px'
              }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#D9CDEB',
                color: '#4A3E59',
                border: 'none',
                borderRadius: '999px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              <span>Перезагрузить страницу</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
