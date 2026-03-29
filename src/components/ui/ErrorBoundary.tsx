import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackClassName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={[
            "flex flex-1 items-center justify-center p-8",
            this.props.fallbackClassName ?? "",
          ].join(" ")}
        >
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-bg-secondary p-6 text-center shadow-sm">
            <AlertTriangle className="h-8 w-8 text-text-muted" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-text-primary">
                Something went wrong
              </p>
              <p className="text-xs text-text-muted">
                {this.state.error?.message ?? "An unexpected error occurred."}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-accent hover:text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
