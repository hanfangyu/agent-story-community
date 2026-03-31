/**
 * 缓存与数据库管理 API
 * 
 * GET - 获取缓存和数据库统计信息
 * DELETE - 清除缓存
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearAllCache, clearCacheByTag } from '@/lib/cache';
import { getTableStats } from '@/lib/db/optimization';

// GET - 获取缓存和数据库统计
export async function GET() {
  const cacheStats = getCacheStats();
  
  // 获取数据库表统计（开发环境或有权限时）
  let dbStats = null;
  try {
    dbStats = await getTableStats();
  } catch (error) {
    // 忽略错误，可能是在构建时
  }
  
  return NextResponse.json({
    cache: cacheStats,
    database: dbStats,
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
