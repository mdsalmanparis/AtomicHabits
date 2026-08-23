import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-text-primary select-none transition-colors">
          <div className="max-w-md w-full bg-card-bg border border-border-primary rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden animate-fadeIn">
            {/* Ambient background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
            
            {/* Animated Icon Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
                <AlertOctagon className="h-10 w-10 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-black font-poppins text-text-primary tracking-tight">
                  Glitch in the Habit Loop!
                </h1>
                <p className="text-xs text-neutral-500 font-semibold max-w-sm">
                  Something broke inside the dashboard rendering, but your progress streaks and database logs are safe.
                </p>
              </div>
            </div>

            {/* Error Detail Log */}
            {this.state.error && (
              <div className="bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl p-4 space-y-2 select-text">
                <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-extrabold text-[8px] uppercase tracking-wider">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Technical Log</span>
                </div>
                <div className="text-[10px] font-mono text-red-500 dark:text-red-400 overflow-x-auto max-h-24 scrollbar-thin">
                  <p className="font-bold">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="mt-1 opacity-70 whitespace-pre text-[9px] leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full h-10 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reload Habit Loop</span>
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full h-10 border border-border-primary hover:border-red-900/30 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 font-semibold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Clear Local Storage & Reload
              </button>
            </div>
          </div>
          
          <footer className="mt-8 text-center select-none opacity-50">
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest font-poppins">
              Atomic Habits • Dashboard Recovery Mode
            </p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
