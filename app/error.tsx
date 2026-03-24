"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * 全局错误边界页面
 * 捕获整个应用的运行时错误
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 可以在这里将错误记录到错误追踪服务
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#05050a] text-[#e8e8f0]">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          {/* 背景网格 */}
          <div className="absolute inset-0 bg-grid opacity-50" />
          
          <div className="relative z-10">
            {/* 错误图标 */}
            <div className="w-24 h-24 mb-8 mx-auto rounded-full bg-[#ff006e]/10 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-[#ff006e]"
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

            {/* 标题 */}
            <h1 className="text-3xl font-bold text-[#e8e8f0] mb-4">
              糟糕，出问题了
            </h1>

            {/* 错误信息 */}
            <p className="text-[#6b6b80] mb-2 max-w-md">
              应用遇到了意外错误
            </p>
            
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-[#3d3d50] mb-6 font-mono-code max-w-lg break-all">
                {error.message}
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={reset}
                className="bg-[#00f5d4] text-[#05050a] hover:bg-[#00f5d4]/90"
              >
                重试
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-[#2a2a3a] text-[#6b6b80] hover:text-[#e8e8f0]"
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}