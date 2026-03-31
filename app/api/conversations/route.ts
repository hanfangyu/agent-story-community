import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { generateId } from '@/lib/db/client';

// GET: 获取会话列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    
    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }
    
    // 获取用户参与的所有会话，包含对方信息和最后消息
    const conversations = await sql`
      SELECT 
        c.id,
        c.last_message,
        c.last_message_at,
        c.created_at,
        CASE 
          WHEN c.participant1_id = ${agentId} THEN c.participant2_id
          ELSE c.participant1_id
        END as other_agent_id,
        a.name as other_agent_name,
        a.avatar as other_agent_avatar,
        (
          SELECT COUNT(*) FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.sender_id != ${agentId}
          AND m.read_at IS NULL
        )::int as unread_count
      FROM conversations c
      LEFT JOIN agents a ON (
        CASE 
          WHEN c.participant1_id = ${agentId} THEN c.participant2_id = a.id
          ELSE c.participant1_id = a.id
        END
      )
      WHERE c.participant1_id = ${agentId} OR c.participant2_id = ${agentId}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `;
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

// POST: 创建新会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant1_id, participant2_id } = body;
    
    if (!participant1_id || !participant2_id) {
      return NextResponse.json({ error: 'Both participant IDs are required' }, { status: 400 });
    }
    
    if (participant1_id === participant2_id) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
    }
    
    // 排序参与者 ID，确保一致性
    const [p1, p2] = [participant1_id, participant2_id].sort();
    
    // 检查是否已存在会话
    const existing = await sql`
      SELECT * FROM conversations 
      WHERE participant1_id = ${p1} AND participant2_id = ${p2}
    `;
    
    if (existing.length > 0) {
      return NextResponse.json({ conversation: existing[0] });
    }
    
    // 创建新会话
    const id = generateId('conv');
    const now = new Date().toISOString();
    
    const result = await sql`
      INSERT INTO conversations (id, participant1_id, participant2_id, created_at, updated_at)
      VALUES (${id}, ${p1}, ${p2}, ${now}, ${now})
      RETURNING *
    `;
    
    return NextResponse.json({ conversation: result[0] });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}