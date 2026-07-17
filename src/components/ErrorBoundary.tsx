import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 捕获子组件渲染错误，防止整个页面白屏
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-screen gap-4 p-8"
          style={{ backgroundColor: 'var(--td-bg-color-page)', color: 'var(--td-text-color-primary)' }}
        >
          <div
            className="text-6xl"
            style={{ filter: 'grayscale(0.3)' }}
          >
            😵
          </div>
          <h2 className="text-xl font-semibold">页面出了点问题</h2>
          <p
            className="text-sm text-center max-w-md"
            style={{ color: 'var(--td-text-color-secondary)' }}
          >
            {this.state.error?.message || '渲染过程中发生了错误'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--td-brand-color)',
                color: '#fff',
              }}
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--td-bg-color-component)',
                color: 'var(--td-text-color-primary)',
                border: '1px solid var(--td-component-stroke)',
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
