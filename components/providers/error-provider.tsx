"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorContextType {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  handleError: (error: unknown) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * 全局错误处理 Provider
 * 用于捕获和处理应用级别的错误
 */
export function ErrorProvider({ children }: ErrorProviderProps) {
  const [error, setErrorState] = useState<Error | null>(null);

  const setError = useCallback((err: Error | null) => {
    setErrorState(err);
    if (err) {
      console.error("[ErrorProvider] Error captured:", err);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err);
    } else if (typeof err === "string") {
      setError(new Error(err));
    } else {
      setError(new Error("发生未知错误"));
    }
  }, [setError]);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError, handleError }}>
      {children}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05050a]/80 backdrop-blur-sm">
          <div className="relative z-10 max-w-md w-full mx-4 p-6 rounded-xl bg-[#0a0a12] border border-[#ff006e]/30 shadow-[0_0_30px_rgba(255,0,110,0.2)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ff006e]/10 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-[#ff006e]"
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
              </div>
              <h3 className="text-lg font-bold text-[#e8e8f0]">出错了</h3>
            </div>
            <p className="text-sm text-[#6b6b80] mb-6">
              {error.message || "应用遇到了意外错误"}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={clearError}
                className="flex-1 bg-[#00f5d4] text-[#05050a] hover:bg-[#00f5d4]/90"
              >
                知道了
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1 border-[#2a2a3a] text-[#6b6b80] hover:text-[#e8e8f0]"
              >
                刷新页面
              </Button>
            </div>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}
