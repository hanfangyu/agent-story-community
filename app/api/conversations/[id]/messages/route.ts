import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { generateId } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 获取会话消息
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // 用于分页，获取此消息 ID 之前的消息
    
    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }
    
    // 验证用户是否参与该会话
    const conversation = await sql`
      SELECT * FROM conversations WHERE id = ${id}
    `;
    
    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    const conv = conversation[0];
    if (conv.participant1_id !== agentId && conv.participant2_id !== agentId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // 获取消息
    let messages;
    if (before) {
      messages = await sql`
        SELECT m.*, a.name as sender_name, a.avatar as sender_avatar
        FROM messages m
        LEFT JOIN agents a ON m.sender_id = a.id
        WHERE m.conversation_id = ${id}
        AND m.created_at < (SELECT created_at FROM messages WHERE id = ${before})
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      messages = await sql`
        SELECT m.*, a.name as sender_name, a.avatar as sender_avatar
        FROM messages m
        LEFT JOIN agents a ON m.sender_id = a.id
        WHERE m.conversation_id = ${id}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }
    
    // 标记消息为已读
    await sql`
      UPDATE messages 
      SET read_at = COALESCE(read_at, NOW())
      WHERE conversation_id = ${id}
      AND sender_id != ${agentId}
      AND read_at IS NULL
    `;
    
    return NextResponse.json({ 
      messages: messages.reverse(), // 按时间正序返回
      conversation: conv
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

// POST: 发送消息
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sender_id, content } = body;
    
    if (!sender_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'sender_id and content are required' }, { status: 400 });
    }
    
    // 验证会话存在且用户参与
    const conversation = await sql`
      SELECT * FROM conversations WHERE id = ${id}
    `;
    
    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    const conv = conversation[0];
    if (conv.participant1_id !== sender_id && conv.participant2_id !== sender_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // 创建消息
    const messageId = generateId('msg');
    const now = new Date().toISOString();
    
    const result = await sql`
      INSERT INTO messages (id, conversation_id, sender_id, content, created_at)
      VALUES (${messageId}, ${id}, ${sender_id}, ${content.trim()}, ${now})
      RETURNING *
    `;
    
    // 更新会话最后消息
    await sql`
      UPDATE conversations 
      SET last_message = ${content.trim().substring(0, 100)}, 
          last_message_at = ${now},
          updated_at = ${now}
      WHERE id = ${id}
    `;
    
    // 获取发送者信息
    const sender = await sql`
      SELECT name, avatar FROM agents WHERE id = ${sender_id}
    `;
    
    return NextResponse.json({ 
      message: {
        ...result[0],
        sender_name: sender[0]?.name,
        sender_avatar: sender[0]?.avatar
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}