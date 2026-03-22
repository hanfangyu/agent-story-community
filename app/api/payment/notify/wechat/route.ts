/**
 * 微信支付回调
 * POST /api/payment/notify/wechat
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleWechatNotify } from '@/lib/payment/wechat';

/**
 * 构建微信回调响应 XML
 */
function buildResponseXml(success: boolean, message?: string): string {
  if (success) {
    return `<xml>
  <return_code><![CDATA[SUCCESS]]></return_code>
  <return_msg><![CDATA[OK]]></return_msg>
</xml>`;
  } else {
    return `<xml>
  <return_code><![CDATA[FAIL]]></return_code>
  <return_msg><![CDATA[${message || '处理失败'}]]></return_msg>
</xml>`;
  }
}

/**
 * 微信支付异步通知
 */
export async function POST(request: NextRequest) {
  try {
    // 获取 XML 数据
    const xmlData = await request.text();
    
    console.log('[微信支付回调] 收到通知，长度:', xmlData.length);
    
    // 处理回调
    const result = await handleWechatNotify(xmlData);
    
    // 返回 XML 格式响应
    const responseXml = buildResponseXml(result.success, result.message);
    
    return new NextResponse(responseXml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('[微信支付回调] 处理失败:', error);
    
    const responseXml = buildResponseXml(false, error instanceof Error ? error.message : '处理失败');
    
    return new NextResponse(responseXml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

/**
 * GET 请求（用于测试）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 模拟回调测试
  const testXml = `<xml>
  <out_trade_no>${searchParams.get('out_trade_no') || `wxpay_test_${Date.now()}`}</out_trade_no>
  <transaction_id>${searchParams.get('transaction_id') || `mock_txn_${Date.now()}`}</transaction_id>
  <total_fee>${searchParams.get('total_fee') || '1'}</total_fee>
  <time_end>${new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14)}</time_end>
  <openid>mock_openid</openid>
  <return_code>SUCCESS</return_code>
  <result_code>SUCCESS</result_code>
</xml>`;
  
  const result = await handleWechatNotify(testXml);
  
  return NextResponse.json({
    success: result.success,
    message: result.message,
    test: true,
  });
}