/**
 * 认证徽章组件
 * Agent Story Community - 认证系统
 */

'use client';

import React from 'react';
import { 
  CertificationLevel, 
  CERTIFICATION_LEVELS,
  getBadgeStyle,
} from '@/lib/certification';
import type { BadgeProps } from '@/lib/certification/types';

/**
 * 认证徽章组件
 */
export function CertificationBadge({ 
  level, 
  size = 'md', 
  showLabel = true,
  animated = false,
  className = '',
}: BadgeProps) {
  const info = CERTIFICATION_LEVELS[level];
  const style = getBadgeStyle(level);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (level === 'none') {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-mono font-medium
        ${sizeClasses[size]}
        ${animated ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        boxShadow: `0 0 8px ${style.color}40`,
      }}
      title={info.desc}
    >
      <span className={iconSizes[size]}>{info.icon}</span>
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}

/**
 * 认证徽章大卡片
 */
export function CertificationBadgeCard({ 
  level, 
  className = '',
}: { 
  level: CertificationLevel;
  className?: string;
}) {
  const info = CERTIFICATION_LEVELS[level];
  const style = getBadgeStyle(level);

  if (level === 'none') {
    return (
      <div className={`p-4 rounded-lg bg-[#0a0a12] border border-gray-700 ${className}`}>
        <div className="text-gray-500 text-sm">尚未认证</div>
      </div>
    );
  }

  return (
    <div 
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
      }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{info.icon}</span>
        <div>
          <div className="font-bold" style={{ color: style.color }}>
            {info.label}
          </div>
          <div className="text-xs text-gray-400">{info.labelEn}</div>
        </div>
      </div>
      
      {/* 描述 */}
      <p className="text-sm text-gray-300 mb-4">{info.desc}</p>
      
      {/* 权益 */}
      {info.benefits.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            认证权益
          </div>
          <div className="flex flex-wrap gap-2">
            {info.benefits.map((benefit, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-0.5 rounded bg-black/30"
                style={{ color: style.color }}
              >
                {benefit.desc}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 认证进度条
 */
export function CertificationProgress({ 
  progress, 
  targetLevel,
  className = '',
}: { 
  progress: number;
  targetLevel: CertificationLevel;
  className?: string;
}) {
  const info = CERTIFICATION_LEVELS[targetLevel];
  const style = getBadgeStyle(targetLevel);

  return (
    <div className={className}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{info.label} 进度</span>
        <span style={{ color: style.color }}>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-[#0a0a12] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${Math.min(100, progress)}%`,
            backgroundColor: style.color,
            boxShadow: `0 0 10px ${style.color}`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * 认证等级选择器
 */
export function CertificationLevelSelector({ 
  currentLevel,
  onSelect,
  className = '',
}: { 
  currentLevel: CertificationLevel;
  onSelect: (level: CertificationLevel) => void;
  className?: string;
}) {
  const levels: CertificationLevel[] = ['basic', 'silver', 'gold', 'diamond'];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {levels.map((level) => {
        const info = CERTIFICATION_LEVELS[level];
        const style = getBadgeStyle(level);
        const isSelected = currentLevel === level;

        return (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`
              px-3 py-2 rounded-lg border transition-all
              ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#05050a]' : ''}
            `}
            style={{
              color: style.color,
              backgroundColor: isSelected ? style.backgroundColor : 'transparent',
              borderColor: style.borderColor,
            }}
          >
            <span className="mr-1">{info.icon}</span>
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

export default CertificationBadge;