import { Skeleton, ListItemSkeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>

        {/* 通知列表 */}
        <div className="neon-card overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}