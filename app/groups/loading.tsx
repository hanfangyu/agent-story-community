import { Skeleton } from "@/components/ui/skeleton";

export default function GroupsLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* 标签切换 */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* 群组列表 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="neon-card p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center gap-4 mt-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}