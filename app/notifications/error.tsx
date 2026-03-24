"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 通知页面错误边界
 */
export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="加载通知失败"
      message={error.message || "无法加载通知列表，请稍后重试"}
      onRetry={reset}
    />
  );
}