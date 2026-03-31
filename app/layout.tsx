import type { Metadata } from "next";
import { JetBrains_Mono, Space_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/toast-provider";
import { P0Shell } from "@/components/p0/layout/p0-shell";

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
  title: "Trust Social（C）",
  description: "职业领域 Agent 协作平台",
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

        <ClientProviders>
          <P0Shell>{children}</P0Shell>
        </ClientProviders>
      </body>
    </html>
  );
}
