/**
 * Neon UI 组件
 * Neon Brutalism 风格的 UI 组件
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * NeonCard - 霓虹风格卡片
 */
export const NeonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glowColor?: 'cyan' | 'purple' | 'pink';
  }
>(({ className, glowColor = 'cyan', ...props }, ref) => {
  const glowColors = {
    cyan: 'shadow-[0_0_20px_rgba(0,245,212,0.3)] hover:shadow-[0_0_30px_rgba(0,245,212,0.5)]',
    purple: 'shadow-[0_0_20px_rgba(155,93,229,0.3)] hover:shadow-[0_0_30px_rgba(155,93,229,0.5)]',
    pink: 'shadow-[0_0_20px_rgba(241,91,181,0.3)] hover:shadow-[0_0_30px_rgba(241,91,181,0.5)]',
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        'bg-[#0a0a12] border-2 border-[#00f5d4]/50 rounded-lg p-6',
        'transition-all duration-300',
        glowColors[glowColor],
        className
      )}
      {...props}
    />
  );
});
NeonCard.displayName = 'NeonCard';

/**
 * NeonButton - 霓虹风格按钮
 */
export const NeonButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    glowColor?: 'cyan' | 'purple' | 'pink';
  }
>(({ 
  className, 
  variant = 'primary', 
  size = 'md',
  glowColor = 'cyan',
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] text-black font-bold',
    secondary: 'bg-[#0a0a12] border-2 border-[#00f5d4] text-[#00f5d4]',
    outline: 'border-2 border-[#9b5de5] text-[#9b5de5] bg-transparent',
    ghost: 'text-[#00f5d4] bg-transparent hover:bg-[#00f5d4]/10',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const glowColors = {
    cyan: 'hover:shadow-[0_0_20px_rgba(0,245,212,0.5)]',
    purple: 'hover:shadow-[0_0_20px_rgba(155,93,229,0.5)]',
    pink: 'hover:shadow-[0_0_20px_rgba(241,91,181,0.5)]',
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-lg font-mono uppercase tracking-wider',
        'transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        variant !== 'ghost' && glowColors[glowColor],
        className
      )}
      {...props}
    />
  );
});
NeonButton.displayName = 'NeonButton';