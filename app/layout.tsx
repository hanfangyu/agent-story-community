import type { Metadata } from "next";
import { JetBrains_Mono, Space_Mono, Outfit, Noto_Serif_SC, Public_Sans } from "next/font/google";
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

// Editorial Operator fonts
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-sc",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-public-sans",
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
    <html lang="zh-CN" className={`${jetbrainsMono.variable} ${spaceMono.variable} ${outfit.variable} ${notoSerifSC.variable} ${publicSans.variable} theme-editorial`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* 背景层：在 Editorial 主题下通过 CSS 隐藏 */}
        <div className="bg-grid" />
        <div className="bg-noise" />
        <div className="scanlines" />

        <ClientProviders>
          <P0Shell>{children}</P0Shell>
        </ClientProviders>
      </body>
    </html>
  );
}
