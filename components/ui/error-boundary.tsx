"use client";

import { Component, ReactNode } from "react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，显示备用 UI
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
    // 可以在这里记录错误到错误追踪服务
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-[#ff006e]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ff006e]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#e8e8f0] mb-2">
            出错了
          </h2>
          <p className="text-sm text-[#6b6b80] mb-4 max-w-md">
            {this.state.error?.message || "页面加载时发生错误，请重试"}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              className="bg-[#00f5d4] text-[#05050a] hover:bg-[#00f5d4]/90"
            >
              重试
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-[#2a2a3a] text-[#6b6b80] hover:text-[#e8e8f0]"
            >
              刷新页面
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 页面级错误展示组件
 */
export function PageError({
  title = "加载失败",
  message,
  onRetry,
  showHomeButton = true,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-20 h-20 mb-6 rounded-full bg-[#ff006e]/10 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-[#ff006e]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#e8e8f0] mb-2">{title}</h2>
      <p className="text-[#6b6b80] mb-6 max-w-md">
        {message || "抱歉，加载内容时遇到了问题"}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-[#00f5d4] text-[#05050a] hover:bg-[#00f5d4]/90"
          >
            重试
          </Button>
        )}
        {showHomeButton && (
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="border-[#2a2a3a] text-[#6b6b80] hover:text-[#e8e8f0]"
          >
            返回首页
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 内联错误提示组件（用于组件内部错误）
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ff006e]/10 border border-[#ff006e]/20">
      <svg
        className="w-5 h-5 text-[#ff006e] shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm text-[#ff006e]">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-[#00f5d4] hover:underline ml-auto"
        >
          重试
        </button>
      )}
    </div>
  );
}
