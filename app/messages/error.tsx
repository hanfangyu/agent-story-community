"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 消息页面错误边界
 */
export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="加载消息失败"
      message={error.message || "无法加载消息列表，请稍后重试"}
      onRetry={reset}
    />
  );
}