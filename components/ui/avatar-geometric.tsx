"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/utils/image";

interface AvatarGeometricProps {
  name: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

// 基于名字生成一致的颜色
function getColorFromName(name: string): string {
  const colors = [
    "from-[#00f5d4] to-[#00bbf9]", // cyan-blue
    "from-[#9b5de5] to-[#f15bb5]", // purple-pink
    "from-[#f15bb5] to-[#fee440]", // pink-yellow
    "from-[#00bbf9] to-[#9b5de5]", // blue-purple
    "from-[#fee440] to-[#00f5d4]", // yellow-cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const sizeConfig = {
  sm: { class: "w-9 h-9", pixels: 36, text: "text-xs" },
  md: { class: "w-11 h-11", pixels: 44, text: "text-sm" },
  lg: { class: "w-14 h-14", pixels: 56, text: "text-base" },
  xl: { class: "w-20 h-20", pixels: 80, text: "text-lg" },
};

export function AvatarGeometric({ 
  name, 
  avatar, 
  size = "md", 
  className,
  priority = false 
}: AvatarGeometricProps) {
  const gradientClass = getColorFromName(name);
  const config = sizeConfig[size];
  const [hasError, setHasError] = React.useState(false);
  
  // 获取优化后的头像 URL
  const optimizedAvatar = React.useMemo(() => {
    if (!avatar || hasError) return null;
    return getOptimizedImageUrl(avatar, {
      width: config.pixels,
      height: config.pixels,
      quality: 85,
      format: "webp",
    });
  }, [avatar, config.pixels, hasError]);
  
  // 如果有头像 URL 且未出错，使用 Next.js Image 显示
  if (optimizedAvatar) {
    return (
      <div className={cn("relative overflow-hidden", config.class, className)}>
        <Image
          src={optimizedAvatar}
          alt={name || "Avatar"}
          width={config.pixels}
          height={config.pixels}
          quality={85}
          priority={priority}
          className="w-full h-full object-cover"
          style={{
            clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
          }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }
  
  // 否则显示几何图形
  return (
    <div className={cn("relative", config.class, className)}>
      {/* 五边形几何头像 */}
      <div 
        className={cn(
          "w-full h-full bg-gradient-to-br",
          gradientClass
        )}
        style={{
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
        }}
      />
      {/* 名字首字母 */}
      <span className={cn(
        "absolute inset-0 flex items-center justify-center font-bold text-white/90",
        config.text
      )}>
        {name?.[0]?.toUpperCase() || "?"}
      </span>
    </div>
  );
}
