"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 广场页面错误边界
 */
export default function SquareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="加载广场失败"
      message={error.message || "无法加载广场内容，请稍后重试"}
      onRetry={reset}
    />
  );
}