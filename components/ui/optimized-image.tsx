"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, generateBlurDataURL, IMAGE_SIZES, getResponsiveSizes } from "@/lib/utils/image";

/**
 * 优化图片组件
 * 
 * 封装 Next.js Image，提供：
 * 1. 自动图片优化（Supabase 转换）
 * 2. 懒加载
 * 3. 占位符模糊效果
 * 4. 错误回退
 */

export interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

// 默认模糊占位符
const DEFAULT_BLUR = generateBlurDataURL(10, 10);

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  quality = 75,
  priority = false,
  placeholder = "blur",
  blurDataURL = DEFAULT_BLUR,
  sizes,
  objectFit = "cover",
  fallback,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // 获取优化后的 URL
  const optimizedSrc = React.useMemo(() => {
    if (!src || hasError) return undefined;
    return getOptimizedImageUrl(src, {
      width: width || (fill ? undefined : 400),
      height: height || (fill ? undefined : 400),
      quality,
      format: "webp",
    });
  }, [src, width, height, quality, hasError]);

  // 处理加载错误
  const handleError = React.useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // 处理加载完成
  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // 没有 src 或加载失败时显示回退
  if (!src || hasError) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
        {fallback || (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <svg
              className="w-8 h-8 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // fill 模式
  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", containerClassName)}>
        <Image
          src={optimizedSrc!}
          alt={alt}
          fill
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          className={cn(
            "transition-opacity duration-300",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            objectFit === "scale-down" && "object-scale-down",
            isLoading && "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // 固定尺寸模式
  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <Image
        src={optimizedSrc!}
        alt={alt}
        width={width || 400}
        height={height || 400}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes}
        className={cn(
          "transition-opacity duration-300",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          isLoading && "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * 优化的头像图片组件
 */
export interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

export function AvatarImage({
  src,
  alt,
  size = "md",
  className,
  priority = false,
}: AvatarImageProps) {
  const dimensions = IMAGE_SIZES.avatar[size];
  const sizes = getResponsiveSizes("avatar");

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions}
      height={dimensions}
      quality={85}
      priority={priority}
      sizes={sizes}
      className={cn("rounded-full", className)}
      containerClassName={cn("rounded-full", className)}
      fallback={
        <div
          className={cn(
            "rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium",
            className
          )}
          style={{ width: dimensions, height: dimensions }}
        >
          {alt?.[0]?.toUpperCase() || "?"}
        </div>
      }
    />
  );
}

/**
 * 优化的封面图片组件
 */
export interface CoverImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export function CoverImage({
  src,
  alt,
  size = "md",
  className,
  priority = false,
  fill = true,
}: CoverImageProps) {
  const dimensions = IMAGE_SIZES.cover[size];
  const sizes = getResponsiveSizes("cover");

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={fill ? undefined : dimensions.width}
      height={fill ? undefined : dimensions.height}
      fill={fill}
      quality={80}
      priority={priority}
      sizes={sizes}
      className={className}
      containerClassName={className}
    />
  );
}

/**
 * 优化的缩略图组件
 */
export interface ThumbnailImageProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
}

export function ThumbnailImage({
  src,
  alt,
  size = "md",
  className,
  priority = false,
}: ThumbnailImageProps) {
  const dimensions = IMAGE_SIZES.thumbnail[size];
  const sizes = getResponsiveSizes("thumbnail");

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimensions}
      height={dimensions}
      quality={80}
      priority={priority}
      sizes={sizes}
      className={cn("rounded-lg", className)}
      containerClassName={cn("rounded-lg", className)}
    />
  );
}

export default OptimizedImage;
