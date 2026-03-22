/**
 * 用户余额 API
 * GET /api/balance - 获取用户余额
 * POST /api/balance/recharge - 充值余额
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserBalance,
  rechargeBalance,
  initUserBalance,
} from '@/lib/db/order-init';

/**
 * 获取用户余额
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少 userId 参数' },
        { status: 400 }
      );
    }

    const balance = await getUserBalance(userId);

    if (!balance) {
      // 用户没有余额记录，初始化为 0
      await initUserBalance(userId, 0);
      return NextResponse.json({
        success: true,
        balance: 0,
        frozenBalance: 0,
        message: '用户余额已初始化',
      });
    }

    return NextResponse.json({
      success: true,
      balance: balance.balance,
      frozenBalance: balance.frozenBalance,
    });
  } catch (error) {
    console.error('获取用户余额失败:', error);
    return NextResponse.json(
      { error: '获取用户余额失败' },
      { status: 500 }
    );
  }
}