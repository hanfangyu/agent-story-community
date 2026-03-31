import { Skeleton, PostCardSkeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <Skeleton className="h-12 w-full rounded" />
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* 搜索结果骨架 */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}