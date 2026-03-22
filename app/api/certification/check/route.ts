/**
 * 认证检查 API
 * POST /api/certification/check - 检查认证资格
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkAllLevels,
  autoCheckLevel,
  getLevelInfo,
  getCertificationProgress,
} from '@/lib/certification';
import type { CertificationSnapshot } from '@/lib/certification/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { snapshot, targetLevel } = body;

    if (!snapshot) {
      return NextResponse.json(
        { error: '缺少数据快照' },
        { status: 400 }
      );
    }

    // 自动检查可达到的最高等级
    const autoResult = autoCheckLevel(snapshot as CertificationSnapshot);
    
    // 全面检查所有等级
    const fullCheck = checkAllLevels(snapshot as CertificationSnapshot);
    
    // 计算目标等级进度
    let progress = 0;
    if (targetLevel) {
      progress = getCertificationProgress(
        snapshot as CertificationSnapshot,
        targetLevel
      );
    }

    // 格式化差距信息
    const gapsInfo = Object.entries(fullCheck.gaps)
      .filter(([level]) => level !== 'none')
      .map(([level, gaps]) => ({
        level,
        levelInfo: getLevelInfo(level as any),
        met: gaps.length === 0,
        gaps: gaps.map(g => ({
          requirement: g.requirement,
          current: g.current,
          required: g.required,
          gap: g.gap,
          unit: g.unit,
          progress: Math.min(100, (g.current / g.required) * 100),
        })),
      }));

    return NextResponse.json({
      success: true,
      result: {
        eligible: autoResult.eligible,
        suggestedLevel: autoResult.suggestedLevel,
        suggestedLevelInfo: getLevelInfo(autoResult.suggestedLevel),
        currentScore: snapshot.score,
        canApply: fullCheck.canApply,
        eligibleLevels: fullCheck.eligibleLevels,
        targetProgress: targetLevel ? {
          targetLevel,
          targetLevelInfo: getLevelInfo(targetLevel),
          progress,
        } : null,
        levels: gapsInfo,
      },
    });
  } catch (error) {
    console.error('认证检查失败:', error);
    return NextResponse.json(
      { error: '认证检查失败' },
      { status: 500 }
    );
  }
}