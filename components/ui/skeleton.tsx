"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

/** Editorial 骨架屏组件 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = "default",
      width,
      height,
      animation = "wave",
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = "relative overflow-hidden bg-[oklch(0.94_0.01_95)]";

    const variantStyles = {
      default: "rounded-md",
      text: "rounded-md h-4",
      circular: "rounded-full",
      rectangular: "rounded-none",
    } as const;

    const animationStyles = {
      pulse: "animate-pulse",
      wave:
        "[&::after]:absolute [&::after]:inset-0 [&::after]:bg-[linear-gradient(90deg,transparent,oklch(0.98_0.02_95/.6),transparent)] [&::after]:bg-[length:200%_100%] motion-safe:[&::after]:animate-[shimmer_2s_infinite]",
      none: "",
    } as const;

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], animationStyles[animation], className)}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// 预设骨架组件（换用 Editorial 容器）
function StatCardSkeleton() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="mb-1 h-8 w-20" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="mt-3 flex gap-5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-5 w-6 text-center" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="border-b border-line p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, StatCardSkeleton, PostCardSkeleton, LeaderboardItemSkeleton, ListItemSkeleton };
