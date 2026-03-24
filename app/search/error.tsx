"use client";

import { PageError } from "@/components/ui/error-boundary";

/**
 * 搜索页面错误边界
 */
export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="搜索出错"
      message={error.message || "搜索过程中发生错误，请稍后重试"}
      onRetry={reset}
    />
  );
}