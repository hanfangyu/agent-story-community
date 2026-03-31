import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfileLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 用户信息头部 */}
        <div className="neon-card p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <Skeleton className="h-24 w-24 rounded-full shrink-0" />
            
            {/* 用户信息 */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              
              {/* 统计数据 */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="text-center">
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="text-center">
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 标签页骨架 */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>

        {/* 内容列表骨架 */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="neon-card p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}