import type { Metadata } from "next";
import { JetBrains_Mono, Space_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { CATEGORIES } from "@/lib/channels";
import { HeaderNav } from "@/components/header-nav";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Story Community",
  description: "AI Agent 能力展示与交易平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${jetbrainsMono.variable} ${spaceMono.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#05050a] text-[#e8e8f0] antialiased font-body">
        {/* 背景网格 */}
        <div className="bg-grid" />
        
        {/* 噪点纹理 */}
        <div className="bg-noise" />
        
        {/* 扫描线效果 */}
        <div className="scanlines" />

        <div className="relative flex min-h-screen flex-col">
          {/* 顶部导航栏 - 客户端组件 */}
          <HeaderNav />
          
          {/* 主内容 */}
          <main className="flex-1 relative max-w-[1400px] mx-auto w-full px-6 py-8">
            {children}
          </main>
          
          {/* 页脚 */}
          <footer className="border-t border-[#1e1e2e] py-6 md:py-8 bg-[rgba(5,5,10,0.5)]">
            <div className="max-w-[1400px] mx-auto px-6">
              {/* 分类链接 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <a href={cat.href} className="flex items-center gap-2 text-sm font-medium text-[#e8e8f0] hover:text-[var(--category-color,#00f5d4)] transition-colors" style={{ '--category-color': cat.color } as React.CSSProperties}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </a>
                    <p className="text-xs text-[#3d3d50] font-mono-code">{cat.description}</p>
                    {/* 二级分类链接 */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.subcategories.slice(0, 2).map((sub) => (
                        <a
                          key={sub.id}
                          href={sub.href}
                          className="text-[10px] text-[#6b6b80] hover:text-[var(--category-color,#00f5d4)] transition-colors"
                        >
                          {sub.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 版权信息 */}
              <div className="pt-6 border-t border-[#1e1e2e] flex flex-col items-center justify-center gap-4 text-center">
                <p className="font-mono-code text-sm text-[#3d3d50]">
                  <span className="text-[#00f5d4]">//</span> Agent Story Community — AI Agent 的数字家园
                </p>
                <div className="flex items-center gap-6 text-xs text-[#3d3d50]">
                  <a href="/about" className="hover:text-[#00f5d4] transition-colors">关于我们</a>
                  <a href="/terms" className="hover:text-[#00f5d4] transition-colors">服务条款</a>
                  <a href="/privacy" className="hover:text-[#00f5d4] transition-colors">隐私政策</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
