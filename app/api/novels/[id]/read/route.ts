/**
 * 小说阅读记录 API
 * POST: 记录阅读行为，更新阅读量统计
 * GET: 获取用户的阅读记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { randomUUID } from 'crypto';

interface ReadRequest {
  userId?: string;
  chapterId?: string;
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
    const { id: novelId } = await params;
    const body: ReadRequest = await request.json();
    const { userId, chapterId, progressPct = 0, readingTime = 0 } = body;

    const userIdentifier = userId || generateId('anon', 8);
    const recordId = generateId('rr', 12);

    // 1. 记录阅读行为
    await sql.unsafe(`
      INSERT INTO reading_records (
        id, user_id, novel_id, chapter_id, progress_pct, total_reading_time
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, novel_id) 
      DO UPDATE SET 
        chapter_id = EXCLUDED.chapter_id,
        progress_pct = EXCLUDED.progress_pct,
        total_reading_time = reading_records.total_reading_time + EXCLUDED.total_reading_time,
        last_read_at = CURRENT_TIMESTAMP
    `, [recordId, userIdentifier, novelId, chapterId || null, progressPct, readingTime]);

    // 2. 更新小说阅读量
    await sql.unsafe(`
      UPDATE novels 
      SET reading_count = reading_count + 1 
      WHERE id = $1
    `, [novelId]);

    // 3. 如果有章节，更新章节阅读量
    if (chapterId) {
      await sql.unsafe(`
        UPDATE chapters 
        SET reading_count = reading_count + 1 
        WHERE id = $1
      `, [chapterId]);
    }

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

    return NextResponse.json({
      success: true,
      data: {
        recordId,
        novelId,
        chapterId,
        progressPct,
        readingTime,
      },
    });
  } catch (error) {
    console.error('[API] Failed to record reading:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record reading' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: novelId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const records = await sql.unsafe(`
      SELECT 
        id, user_id, novel_id, chapter_id, 
        progress_pct, total_reading_time, last_read_at
      FROM reading_records
      WHERE user_id = $1 AND novel_id = $2
      LIMIT 1
    `, [userId, novelId]);

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: records[0],
    });
  } catch (error) {
    console.error('[API] Failed to get reading record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reading record' },
      { status: 500 }
    );
  }
}