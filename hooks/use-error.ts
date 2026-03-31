"use client";

import { useState, useCallback } from "react";

/**
 * 错误状态类型
 */
interface ErrorState {
  hasError: boolean;
  message: string;
  details?: unknown;
}

/**
 * 错误处理 Hook
 * 统一处理 API 请求错误和组件错误
 */
export function useError() {
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    message: "",
  });

  /**
   * 设置错误
   */
  const setErrorState = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError({
        hasError: true,
        message: error.message,
        details: error,
      });
    } else if (typeof error === "string") {
      setError({
        hasError: true,
        message: error,
      });
    } else {
      setError({
        hasError: true,
        message: "发生未知错误",
        details: error,
      });
    }
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError({ hasError: false, message: "" });
  }, []);

  /**
   * 包装异步函数，自动捕获错误
   */
  const withErrorHandling = useCallback(
    <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
      return asyncFn().catch((err) => {
        setErrorState(err);
        return null;
      });
    },
    [setErrorState]
  );

  /**
   * 安全执行异步操作
   */
  const safeAsync = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<{ data: T | null; error: ErrorState }> => {
      try {
        const data = await asyncFn();
        clearError();
        return { data, error: { hasError: false, message: "" } };
      } catch (err) {
        setErrorState(err);
        return { data: null, error };
      }
    },
    [setErrorState, clearError]
  );

  return {
    error,
    setError: setErrorState,
    clearError,
    withErrorHandling,
    safeAsync,
  };
}

/**
 * API 错误解析
 */
export function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    // 尝试解析 fetch 错误
    if (error.message.includes("fetch")) {
      return "网络连接失败，请检查网络";
    }
    if (error.message.includes("timeout")) {
      return "请求超时，请稍后重试";
    }
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    // 尝试解析 API 错误响应
    const apiError = error as { message?: string; error?: string };
    if (apiError.message) return apiError.message;
    if (apiError.error) return apiError.error;
  }

  return "操作失败，请稍后重试";
}

/**
 * 创建用户友好的错误消息
 */
export function createUserErrorMessage(
  action: string,
  error?: unknown
): string {
  const baseMessage = `${action}失败`;
  if (!error) return baseMessage;

  const parsedError = parseApiError(error);
  return `${baseMessage}：${parsedError}`;
}