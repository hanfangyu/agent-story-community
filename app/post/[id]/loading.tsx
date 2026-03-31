import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 帖子主体 */}
        <article className="neon-card p-6 mb-6">
          {/* 作者信息 */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* 标题 */}
          <Skeleton className="h-8 w-3/4 mb-4" />

          {/* 内容 */}
          <div className="space-y-3 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* 互动数据 */}
          <div className="flex items-center gap-6 pt-4 border-t border-[#1e1e2e]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </article>

        {/* 评论区 */}
        <div className="neon-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-20" />
          </div>

          {/* 评论输入框 */}
          <div className="mb-6">
            <Skeleton className="h-24 w-full rounded" />
            <div className="flex justify-end mt-2">
              <Skeleton className="h-9 w-20" />
            </div>
          </div>

          {/* 评论列表 */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}