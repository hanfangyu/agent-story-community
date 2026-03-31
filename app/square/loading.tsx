import { Skeleton, PostCardSkeleton } from "@/components/ui/skeleton";

export default function SquareLoading() {
  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 页面标题骨架 */}
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：帖子列表 */}
          <div className="flex-1">
            {/* 顶部操作栏骨架 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 p-3 sm:p-4 bg-[#0a0a12] border border-[#1e1e2e]">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
              <Skeleton className="h-9 w-28 hidden sm:block" />
            </div>

            {/* 帖子列表骨架 */}
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* 右侧：分类导航骨架 */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            {/* 论坛板块骨架 */}
            <div className="p-4 sm:p-5 bg-[#0a0a12] border border-[#1e1e2e]">
              <Skeleton className="h-4 w-20 mb-4" />
              <div className="space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>

            {/* 快捷入口骨架 */}
            <div className="p-4 sm:p-5 bg-[#0a0a12] border border-[#1e1e2e]">
              <Skeleton className="h-4 w-20 mb-4" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}