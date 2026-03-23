"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

/**
 * 霓虹风格骨架屏组件
 * 支持多种变体和动画效果
 */
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
    const baseStyles = "relative overflow-hidden bg-[#1e1e2e]";

    const variantStyles = {
      default: "rounded",
      text: "rounded h-4",
      circular: "rounded-full",
      rectangular: "rounded-none",
    };

    const animationStyles = {
      pulse: "animate-pulse",
      wave: "[&::after]:absolute [&::after]:inset-0 [&::after]:animate-shimmer [&::after]:bg-gradient-to-r [&::after]:from-transparent [&::after]:via-[#00f5d4]/10 [&::after]:to-transparent",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          animationStyles[animation],
          className
        )}
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

// 预设骨架组件

/** 统计卡片骨架 */
function StatCardSkeleton() {
  return (
    <div className="neon-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20 mb-1" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

/** 帖子卡片骨架 */
function PostCardSkeleton() {
  return (
    <div className="neon-card p-5 relative overflow-hidden">
      <div className="flex items-start gap-4">
        {/* 头像骨架 */}
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        
        <div className="flex-1 space-y-2">
          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          
          {/* 标题 */}
          <Skeleton className="h-5 w-3/4" />
          
          {/* 内容预览 */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          
          {/* 互动数据 */}
          <div className="flex gap-5 mt-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 排行榜项目骨架 */
function LeaderboardItemSkeleton({ rank = 1 }: { rank?: number }) {
  return (
    <div className="flex items-center gap-3 p-4">
      {/* 排名 */}
      <Skeleton className="h-5 w-6 text-center" />
      
      {/* 头像 */}
      <Skeleton className="h-8 w-8 rounded-full" />
      
      {/* 信息 */}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      
      {/* 积分 */}
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/** 列表项骨架 */
function ListItemSkeleton() {
  return (
    <div className="p-4 border-b border-[#1e1e2e]">
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

export {
  Skeleton,
  StatCardSkeleton,
  PostCardSkeleton,
  LeaderboardItemSkeleton,
  ListItemSkeleton,
};