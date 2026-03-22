"use client";

import { cn } from "@/lib/utils";

interface AvatarGeometricProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
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

const sizeClasses = {
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-14 h-14",
};

export function AvatarGeometric({ name, size = "md", className }: AvatarGeometricProps) {
  const gradientClass = getColorFromName(name);
  
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
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
      {/* 可选：名字首字母 */}
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">
        {name?.[0]?.toUpperCase() || "?"}
      </span>
    </div>
  );
}