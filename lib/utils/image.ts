/**
 * 图片优化工具函数
 * 
 * 功能：
 * 1. Supabase 图片转换（缩放、格式转换）
 * 2. 图片 URL 规范化
 * 3. 占位符生成
 */

// Supabase 图片转换配置
const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

/**
 * 生成图片占位符（模糊效果）
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  // 返回一个简单的灰色模糊占位符
  const shimmer = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a2e"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`;
}

/**
 * 检测是否为 Supabase 存储的图片
 */
export function isSupabaseImage(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase') || 
           urlObj.pathname.includes('/storage/') ||
           SUPABASE_PROJECT_URL?.includes(urlObj.hostname) ||
           false;
  } catch {
    return false;
  }
}

/**
 * 获取优化后的图片 URL
 * 
 * Supabase 图片转换 API:
 * https://supabase.com/docs/guides/storage/serving/image-transformations
 * 
 * 参数：
 * - width: 宽度
 * - height: 高度
 * - quality: 质量 (1-100)
 * - format: 格式 (origin, webp, avif)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'origin' | 'webp' | 'avif';
  } = {}
): string | undefined {
  if (!url) return undefined;

  // 非图片 URL 直接返回
  if (!url.startsWith('http') && !url.startsWith('data:')) {
    return url;
  }

  // 非 Supabase 图片，直接返回原 URL（Next.js Image 会处理优化）
  if (!isSupabaseImage(url)) {
    return url;
  }

  // Supabase 图片转换
  const { width, height, quality = 75, format = 'webp' } = options;
  
  try {
    const urlObj = new URL(url);
    
    // Supabase 图片转换参数
    // 格式: /storage/v1/render/image/public/bucket/path?width=xxx&height=xxx
    // 或者使用 transform API: /storage/v1/object/public/bucket/path?width=xxx
    
    // 检查是否已经是 render 端点
    if (urlObj.pathname.includes('/render/image/')) {
      // 已经是转换后的 URL，更新参数
      if (width) urlObj.searchParams.set('width', String(width));
      if (height) urlObj.searchParams.set('height', String(height));
      urlObj.searchParams.set('quality', String(quality));
      if (format !== 'origin') {
        urlObj.searchParams.set('format', format);
      }
      return urlObj.toString();
    }

    // 普通存储 URL，添加转换参数
    // Supabase 支持在 URL 后添加查询参数进行转换
    if (width) urlObj.searchParams.set('width', String(width));
    if (height) urlObj.searchParams.set('height', String(height));
    urlObj.searchParams.set('quality', String(quality));
    if (format !== 'origin') {
      urlObj.searchParams.set('format', format);
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 获取头像图片 URL（带默认尺寸优化）
 */
export function getAvatarUrl(
  url: string | null | undefined,
  size: 'sm' | 'md' | 'lg' | number = 'md'
): string | undefined {
  const sizes = {
    sm: 36,
    md: 44,
    lg: 56,
  };
  
  const width = typeof size === 'number' ? size : sizes[size];
  
  return getOptimizedImageUrl(url, {
    width,
    height: width,
    quality: 85,
    format: 'webp',
  });
}

/**
 * 获取封面图片 URL（带默认尺寸优化）
 */
export function getCoverUrl(
  url: string | null | undefined,
  options: { width?: number; height?: number } = {}
): string | undefined {
  return getOptimizedImageUrl(url, {
    width: options.width || 800,
    height: options.height || 400,
    quality: 80,
    format: 'webp',
  });
}

/**
 * 预定义的图片尺寸
 */
export const IMAGE_SIZES = {
  avatar: {
    sm: 36,
    md: 44,
    lg: 56,
    xl: 96,
  },
  cover: {
    sm: { width: 400, height: 200 },
    md: { width: 800, height: 400 },
    lg: { width: 1200, height: 600 },
  },
  thumbnail: {
    sm: 150,
    md: 300,
    lg: 450,
  },
} as const;

/**
 * 获取响应式图片尺寸属性（用于 Next.js Image）
 */
export function getResponsiveSizes(type: 'avatar' | 'cover' | 'thumbnail'): string {
  switch (type) {
    case 'avatar':
      return '(max-width: 640px) 36px, (max-width: 1024px) 44px, 56px';
    case 'cover':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px';
    case 'thumbnail':
      return '(max-width: 640px) 150px, (max-width: 1024px) 300px, 450px';
    default:
      return '100vw';
  }
}
