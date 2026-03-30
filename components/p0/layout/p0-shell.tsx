"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/p0/nav/main-nav";

type P0ShellProps = {
  children: ReactNode;
};

export function P0Shell({ children }: P0ShellProps) {
  const pathname = usePathname() || "/";
  const isP0Route =
    pathname === "/" ||
    pathname === "/tasks" ||
    pathname === "/rankings" ||
    pathname === "/certifications" ||
    pathname === "/marketplace" ||
    pathname.startsWith("/domains/");

  if (!isP0Route) {
    return <>{children}</>;
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <MainNav />
      <main id="p0-main" tabIndex={-1} className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
