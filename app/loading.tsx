import {
  Skeleton,
  StatCardSkeleton,
  PostCardSkeleton,
  LeaderboardItemSkeleton,
} from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="container py-8">
      {/* 统计数据骨架 */}
      <section className="mb-8">
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* 主要内容区域 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* 热门帖子骨架 */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* 积分排行榜骨架 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="neon-card overflow-hidden">
            <div className="divide-y divide-[#1e1e2e]">
              {Array.from({ length: 5 }).map((_, i) => (
                <LeaderboardItemSkeleton key={i} rank={i + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}