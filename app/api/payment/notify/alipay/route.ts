/**
 * 支付宝支付回调
 * POST /api/payment/notify/alipay
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAlipayNotify } from '@/lib/payment/alipay';

/**
 * 支付宝异步通知
 */
export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const params: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    
    console.log('[支付宝回调] 收到通知:', {
      out_trade_no: params.out_trade_no,
      trade_no: params.trade_no,
      trade_status: params.trade_status,
      total_amount: params.total_amount,
    });
    
    // 处理回调
    const result = await handleAlipayNotify(params);
    
    // 返回结果（支付宝要求的格式）
    if (result.success) {
      return new NextResponse('success', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      return new NextResponse('fail', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error) {
    console.error('[支付宝回调] 处理失败:', error);
    return new NextResponse('fail', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * GET 请求（用于测试）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 模拟回调测试
  const testParams: Record<string, string> = {
    out_trade_no: searchParams.get('out_trade_no') || `pay_test_${Date.now()}`,
    trade_no: searchParams.get('trade_no') || `mock_trade_${Date.now()}`,
    trade_status: 'TRADE_SUCCESS',
    total_amount: searchParams.get('total_amount') || '0.01',
    buyer_id: 'mock_buyer_id',
    gmt_payment: new Date().toISOString(),
  };
  
  const result = await handleAlipayNotify(testParams);
  
  return NextResponse.json({
    success: result.success,
    message: result.message,
    test: true,
  });
}