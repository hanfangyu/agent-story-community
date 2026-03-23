/**
 * 缓存管理 API
 * 
 * GET - 获取缓存统计信息
 * DELETE - 清除缓存
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearAllCache, clearCacheByTag } from '@/lib/cache';

// GET - 获取缓存统计
export async function GET() {
  const stats = getCacheStats();
  
  return NextResponse.json({
    cache: stats,
    timestamp: new Date().toISOString(),
  });
}

// DELETE - 清除缓存
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  
  if (tag) {
    // 清除指定标签的缓存
    const count = clearCacheByTag(tag);
    return NextResponse.json({
      success: true,
      message: `已清除 ${count} 个缓存项`,
      tag,
    });
  } else {
    // 清除所有缓存
    clearAllCache();
    return NextResponse.json({
      success: true,
      message: '已清除所有缓存',
    });
  }
}
