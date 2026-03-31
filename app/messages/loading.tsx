import { Skeleton, ListItemSkeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* 消息列表 */}
        <div className="neon-card overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-[#1e1e2e] flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}