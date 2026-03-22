'use client';

import React from 'react';
import type { ScoreResult, ScoreDimension } from '@/lib/scoring/types';

interface ScoreDisplayProps {
  score: ScoreResult;
  suggestions?: string[];
  compact?: boolean;
}

/**
 * 能力评分展示组件
 */
export function ScoreDisplay({ score, suggestions, compact = false }: ScoreDisplayProps) {
  if (compact) {
    return <ScoreDisplayCompact score={score} />;
  }
  
  return (
    <div className="space-y-6">
      {/* 总分展示 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span 
              className="text-3xl font-mono font-bold"
              style={{ color: score.levelInfo.color }}
            >
              {score.levelInfo.label}
            </span>
            <span className="text-gray-400 text-sm">
              {score.levelInfo.desc}
            </span>
          </div>
          <div className="text-5xl font-mono font-bold mt-2 text-white">
            {score.totalScore.toFixed(1)}
            <span className="text-lg text-gray-500">/100</span>
          </div>
        </div>
        {score.rank && (
          <div className="text-right">
            <div className="text-gray-400 text-sm">排名</div>
            <div className="text-2xl font-mono text-[#00f5d4]">#{score.rank}</div>
            {score.percentile && (
              <div className="text-xs text-gray-500">前 {score.percentile}%</div>
            )}
          </div>
        )}
      </div>
      
      {/* 维度得分 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          能力维度
        </h3>
        {score.dimensions.map((dim, index) => (
          <DimensionBar key={index} dimension={dim} />
        ))}
      </div>
      
      {/* 改进建议 */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-[#0a0a12] rounded-lg border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">提升建议</h3>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-gray-300 text-sm">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * 维度得分条
 */
function DimensionBar({ dimension }: { dimension: ScoreDimension }) {
  const percentage = Math.round(dimension.score);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-white font-medium">{dimension.name}</span>
          <span className="text-gray-500 text-sm ml-2">
            (权重 {(dimension.weight * 100).toFixed(0)}%)
          </span>
        </div>
        <span className="font-mono text-sm">
          <span className="text-white">{percentage}</span>
          <span className="text-gray-500">/100</span>
        </span>
      </div>
      
      <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, #00f5d4, #9b5de5)`,
          }}
        />
      </div>
      
      <p className="text-xs text-gray-500">{dimension.description}</p>
    </div>
  );
}

/**
 * 紧凑型评分展示
 */
function ScoreDisplayCompact({ score }: { score: ScoreResult }) {
  return (
    <div className="flex items-center gap-3">
      <span 
        className="px-2 py-1 rounded text-sm font-mono font-bold"
        style={{ 
          backgroundColor: `${score.levelInfo.color}20`,
          color: score.levelInfo.color,
        }}
      >
        {score.levelInfo.label}
      </span>
      <span className="font-mono text-white">
        {score.totalScore.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * 能力等级徽章
 */
export function AbilityBadge({ 
  level, 
  score,
  size = 'md' 
}: { 
  level: string; 
  score: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const colors: Record<string, string> = {
    SSS: '#00f5d4',
    SS: '#00f5d4',
    S: '#9b5de5',
    A: '#9b5de5',
    B: '#fee440',
    C: '#fee440',
    D: '#f15bb5',
  };
  
  const color = colors[level] || '#fee440';
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span 
      className={`rounded font-mono font-bold ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {level}
    </span>
  );
}

export default ScoreDisplay;