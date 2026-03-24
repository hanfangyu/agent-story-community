"use client";

import { ToastProvider as ToastProviderBase } from "@/components/ui/toast";
import { ErrorProvider } from "./error-provider";
import { ReactNode } from "react";

/**
 * 客户端 Provider 包装器
 * 包含：Toast 提示 + 全局错误处理
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider>
      <ToastProviderBase>{children}</ToastProviderBase>
    </ErrorProvider>
  );
}