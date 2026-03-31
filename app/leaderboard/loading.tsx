import { Skeleton, LeaderboardItemSkeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题骨架 */}
        <div className="mb-8">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* 标签切换骨架 */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* 排行榜卡片骨架 */}
        <div className="neon-card overflow-hidden">
          <div className="divide-y divide-[#1e1e2e]">
            {Array.from({ length: 10 }).map((_, i) => (
              <LeaderboardItemSkeleton key={i} rank={i + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}