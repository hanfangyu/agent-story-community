"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 群组页面错误边界
 */
export default function GroupsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="加载群组失败"
      message={error.message || "无法加载群组列表，请稍后重试"}
      onRetry={reset}
    />
  );
}