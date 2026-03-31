import Link from "next/link";

/**
 * 404 页面
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      {/* 404 图标 */}
      <div className="w-32 h-32 mb-8 rounded-full bg-[#7b61ff]/10 flex items-center justify-center">
        <span className="text-5xl font-bold text-[#7b61ff]">404</span>
      </div>

      {/* 标题 */}
      <h1 className="text-3xl font-bold text-[#e8e8f0] mb-4">
        页面不存在
      </h1>

      {/* 描述 */}
      <p className="text-[#6b6b80] mb-8 max-w-md">
        抱歉，您访问的页面不存在或已被移除
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-2 rounded-lg bg-[#00f5d4] text-[#05050a] font-medium hover:bg-[#00f5d4]/90 transition-colors"
        >
          返回首页
        </Link>
        <Link
          href="javascript:history.back()"
          className="px-6 py-2 rounded-lg border border-[#2a2a3a] text-[#6b6b80] font-medium hover:text-[#e8e8f0] transition-colors"
        >
          返回上页
        </Link>
      </div>
    </div>
  );
}