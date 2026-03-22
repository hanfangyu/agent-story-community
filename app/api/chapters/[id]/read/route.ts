/**
 * 章节阅读记录 API
 * POST: 记录章节阅读行为
 * GET: 获取章节阅读统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { randomUUID } from 'crypto';

interface ChapterReadRequest {
  userId?: string;
  progressPct?: number;
  readingTime?: number;
}

function generateId(prefix: string, length: number = 12): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, length)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const body: ChapterReadRequest = await request.json();
    const { userId, progressPct = 100, readingTime = 0 } = body;

    // 获取章节信息
    const chapters = await sql.unsafe(`
      SELECT id, novel_id FROM chapters WHERE id = $1
    `, [chapterId]);

    if (chapters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const chapter = chapters[0] as unknown as { id: string; novel_id: string };
    const novelId = chapter.novel_id;
    const userIdentifier = userId || generateId('anon', 8);
    const recordId = generateId('rr', 12);

    // 1. 更新章节阅读量
    await sql.unsafe(`
      UPDATE chapters 
      SET reading_count = reading_count + 1 
      WHERE id = $1
    `, [chapterId]);

    // 2. 更新小说阅读量
    await sql.unsafe(`
      UPDATE novels 
      SET reading_count = reading_count + 1 
      WHERE id = $1
    `, [novelId]);

    // 3. 更新或创建阅读记录
    await sql.unsafe(`
      INSERT INTO reading_records (
        id, user_id, novel_id, chapter_id, progress_pct, total_reading_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, novel_id)
      DO UPDATE SET
        chapter_id = EXCLUDED.chapter_id,
        progress_pct = GREATEST(reading_records.progress_pct, EXCLUDED.progress_pct),
        total_reading_time = reading_records.total_reading_time + EXCLUDED.total_reading_time,
        last_read_at = CURRENT_TIMESTAMP
    `, [recordId, userIdentifier, novelId, chapterId, progressPct, readingTime]);

    // 4. 更新作者总阅读量
    await sql.unsafe(`
      UPDATE creative_agents 
      SET total_readings = (
        SELECT COALESCE(SUM(reading_count), 0) 
        FROM novels 
        WHERE author_id = creative_agents.id
      )
      WHERE id = (SELECT author_id FROM novels WHERE id = $1)
    `, [novelId]);

    // 获取更新后的统计
    const stats = await sql.unsafe(`
      SELECT 
        c.reading_count as chapter_readings,
        n.reading_count as novel_readings
      FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      WHERE c.id = $1
    `, [chapterId]);

    return NextResponse.json({
      success: true,
      data: {
        chapterId,
        novelId,
        stats: stats[0] || null,
      },
    });
  } catch (error) {
    console.error('[API] Failed to record chapter reading:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record chapter reading' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;

    const stats = await sql.unsafe(`
      SELECT 
        c.id,
        c.chapter_number,
        c.title,
        c.reading_count,
        c.like_count,
        n.id as novel_id,
        n.title as novel_title
      FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      WHERE c.id = $1
    `, [chapterId]);

    if (stats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('[API] Failed to get chapter stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get chapter stats' },
      { status: 500 }
    );
  }
}