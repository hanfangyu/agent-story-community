"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES, getCategoryById } from "@/lib/channels";

interface ChannelSwitcherProps {
  currentCategory?: string;
  currentSubcategory?: string;
  className?: string;
  compact?: boolean;
}

export function ChannelSwitcher({ 
  currentCategory, 
  currentSubcategory,
  className,
  compact = false 
}: ChannelSwitcherProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    currentCategory || null
  );

  return (
    <div className={cn("bg-[#0a0a12] border border-[#1e1e2e]", className)}>
      {/* 一级分类导航 */}
      <div className={cn(
        "grid grid-cols-3 md:grid-cols-6 gap-0",
        compact && "grid-cols-6"
      )}>
        {CATEGORIES.map((category) => {
          const isActive = currentCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
              className={cn(
                "relative flex flex-col items-center justify-center py-4 px-2 transition-all duration-300 border-b-2",
                isActive 
                  ? "border-current bg-current/5" 
                  : "border-transparent hover:bg-[#1e1e2e]/50",
              )}
              style={{
                color: category.color,
              }}
            >
              {/* 图标 */}
              <span className="text-2xl mb-1">{category.icon}</span>
              
              {/* 名称 */}
              <span className={cn(
                "font-mono text-xs uppercase tracking-wider",
                isActive ? "font-bold" : "text-[#6b6b80]"
              )}>
                {category.name}
              </span>

              {/* 霓虹发光效果 */}
              {isActive && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 30px ${category.glowColor}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 二级分类展开 */}
      {expandedCategory && (
        <div 
          className="border-t border-[#1e1e2e] p-4 animate-in slide-in-from-top-2 duration-200"
          style={{
            background: `linear-gradient(180deg, ${
              getCategoryById(expandedCategory)?.glowColor || 'transparent'
            } 0%, transparent 100%)`,
          }}
        >
          <div className="flex flex-wrap gap-2">
            {getCategoryById(expandedCategory)?.subcategories.map((sub) => {
              const isActive = currentSubcategory === sub.id;
              
              return (
                <Link
                  key={sub.id}
                  href={sub.href}
                  className={cn(
                    "px-4 py-2 font-mono text-sm transition-all duration-300 border",
                    isActive
                      ? "bg-current/15 border-current text-current"
                      : "bg-transparent border-[#1e1e2e] text-[#6b6b80] hover:border-current hover:text-current"
                  )}
                  style={{
                    color: isActive ? getCategoryById(expandedCategory)?.color : undefined,
                    borderColor: isActive ? getCategoryById(expandedCategory)?.color : undefined,
                  }}
                >
                  <span className="mr-2">{sub.icon}</span>
                  {sub.name}
                </Link>
              );
            })}
          </div>

          {/* 热门标签 */}
          {getCategoryById(expandedCategory)?.subcategories.find(
            s => s.id === currentSubcategory
          )?.tags && (
            <div className="mt-4 pt-4 border-t border-[#1e1e2e]">
              <span className="font-mono text-xs text-[#3d3d50] uppercase tracking-wider mr-3">
                热门标签:
              </span>
              <div className="inline-flex flex-wrap gap-2 mt-2">
                {getCategoryById(expandedCategory)?.subcategories.find(
                  s => s.id === currentSubcategory
                )?.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-mono bg-[#05050a] border border-[#1e1e2e] text-[#6b6b80] hover:text-current cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 紧凑版频道选择器（用于顶部导航）
export function ChannelNav({ currentCategory }: { currentCategory?: string }) {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {CATEGORIES.map((category) => {
        const isActive = currentCategory === category.id;
        
        return (
          <Link
            key={category.id}
            href={category.href}
            className={cn(
              "relative px-4 py-2 font-mono text-sm uppercase tracking-wider transition-all duration-300",
              isActive 
                ? "text-current font-bold" 
                : "text-[#6b6b80] hover:text-[#e8e8f0]"
            )}
            style={{
              color: isActive ? category.color : undefined,
            }}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
            
            {/* 活动指示器 */}
            {isActive && (
              <span 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: category.color }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// 移动端频道菜单
export function ChannelMobileMenu({ 
  currentCategory,
  isOpen,
  onClose 
}: { 
  currentCategory?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-[#05050a]/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 菜单内容 */}
      <div className="absolute top-16 left-0 right-0 bg-[#0a0a12] border-b border-[#1e1e2e] max-h-[80vh] overflow-y-auto">
        {CATEGORIES.map((category) => {
          const isActive = currentCategory === category.id;
          
          return (
            <div key={category.id} className="border-b border-[#1e1e2e]">
              {/* 一级分类 */}
              <Link
                href={category.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 transition-all duration-300",
                  isActive ? "bg-current/10" : "hover:bg-[#1e1e2e]/50"
                )}
                style={{
                  color: isActive ? category.color : undefined,
                }}
              >
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <div className={cn(
                    "font-semibold",
                    !isActive && "text-[#e8e8f0]"
                  )}>
                    {category.name}
                  </div>
                  <div className="text-xs text-[#6b6b80] font-mono">
                    {category.description}
                  </div>
                </div>
              </Link>
              
              {/* 二级分类 */}
              {isActive && (
                <div className="bg-[#05050a] py-2">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={sub.href}
                      onClick={onClose}
                      className="flex items-center gap-2 px-8 py-2 text-sm text-[#6b6b80] hover:text-current transition-colors"
                      style={{
                        color: undefined,
                      }}
                    >
                      <span>{sub.icon}</span>
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}