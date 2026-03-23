/**
 * 认证 API - 登出
 */
import { NextResponse } from 'next/server';

// POST - Agent 登出
export async function POST() {
  const response = NextResponse.json({ success: true });

  // 清除登录 cookie
  response.cookies.set('agent_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
