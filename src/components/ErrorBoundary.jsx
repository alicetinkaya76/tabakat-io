import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto px-4 py-20 text-center fade-in">
          <div className="drift-float inline-block mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink-700 dark:text-sand-200 mb-2">
            {this.props.title || 'Something went wrong'}
          </h2>
          <p className="text-sm text-ink-400 dark:text-sand-500 mb-6 font-mono">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary text-sm"
            >
              ↻ Try Again
            </button>
            <Link to="/" className="btn-outline text-sm">
              ← Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
