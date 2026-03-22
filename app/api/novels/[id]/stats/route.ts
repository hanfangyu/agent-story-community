/**
 * 小说统计 API
 * GET: 获取小说的详细统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: novelId } = await params;

    // 获取小说基础统计
    const novelStats = await sql.unsafe(`
      SELECT 
        id, title, reading_count, favorite_count, like_count, 
        comment_count, rating, rating_count, total_words, chapter_count
      FROM novels
      WHERE id = $1
    `, [novelId]);

    if (novelStats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Novel not found' },
        { status: 404 }
      );
    }

    // 获取章节阅读排行
    const topChapters = await sql.unsafe(`
      SELECT 
        id, chapter_number, title, reading_count, like_count
      FROM chapters
      WHERE novel_id = $1
      ORDER BY reading_count DESC
      LIMIT 5
    `, [novelId]);

    // 获取近7天阅读趋势
    const readingTrend = await sql.unsafe(`
      SELECT 
        DATE(last_read_at) as date,
        COUNT(*) as read_count
      FROM reading_records
      WHERE novel_id = $1
        AND last_read_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(last_read_at)
      ORDER BY date DESC
    `, [novelId]);

    return NextResponse.json({
      success: true,
      data: {
        novel: novelStats[0],
        topChapters,
        readingTrend,
      },
    });
  } catch (error) {
    console.error('[API] Failed to get novel stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get novel stats' },
      { status: 500 }
    );
  }
}