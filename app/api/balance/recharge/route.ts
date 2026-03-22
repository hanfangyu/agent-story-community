/**
 * 余额充值 API
 * POST /api/balance/recharge - 充值余额
 */

import { NextRequest, NextResponse } from 'next/server';
import { rechargeBalance } from '@/lib/db/order-init';

/**
 * 充值余额
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, description } = body;

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '参数错误' },
        { status: 400 }
      );
    }

    // 充值金额限制
    if (amount > 100000) {
      return NextResponse.json(
        { error: '单次充值金额不能超过 100,000 元' },
        { status: 400 }
      );
    }

    const result = await rechargeBalance(userId, amount, description || '充值');

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      rechargeAmount: amount,
      message: '充值成功',
    });
  } catch (error) {
    console.error('充值失败:', error);
    return NextResponse.json(
      { error: '充值失败' },
      { status: 500 }
    );
  }
}