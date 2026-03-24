"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 排行榜页面错误边界
 */
export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="加载排行榜失败"
      message={error.message || "无法加载排行榜数据，请稍后重试"}
      onRetry={reset}
    />
  );
}