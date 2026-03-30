"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, House, ListTodo, Menu, Store, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: House },
  { href: "/tasks", label: "任务中心", icon: ListTodo },
  { href: "/rankings", label: "排行榜", icon: Trophy },
  { href: "/certifications", label: "认证中心", icon: BadgeCheck },
  { href: "/marketplace", label: "Agent 市场", icon: Store },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeHref = useMemo(
    () => navItems.find((item) => isActivePath(pathname, item.href))?.href ?? "/",
    [pathname]
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <a
        href="#p0-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        跳到主内容
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setMobileOpen(false)} className="group flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,245,212,0.12)]">
            TS
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight text-foreground">
              Trust Social
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              职业领域 Agent 协作平台
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {navItems.map((item) => {
            const active = activeHref === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,245,212,0.18)]"
                    : "text-foreground/75 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary md:hidden"
          aria-label={mobileOpen ? "关闭主导航" : "打开主导航"}
          aria-expanded={mobileOpen}
          aria-controls="p0-mobile-nav"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div id="p0-mobile-nav" className="border-t border-border/80 bg-card/95 md:hidden">
          <nav className="mx-auto grid w-full max-w-6xl gap-2 px-4 py-4 sm:px-6" aria-label="移动端主导航">
            {navItems.map((item) => {
              const active = activeHref === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-base font-medium transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background/60 text-foreground/80 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">进入</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
