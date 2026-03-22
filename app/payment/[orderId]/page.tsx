'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { NeonCard, NeonButton } from '@/components/ui/neon';

type PaymentMethod = 'balance' | 'alipay' | 'wechat';
type PaymentScene = 'web' | 'h5' | 'native';

interface Order {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  finalPrice: number;
  status: string;
}

interface PaymentResult {
  success: boolean;
  requiresPayment?: boolean;
  payment?: {
    paymentId: string;
    paymentUrl?: string;
    qrCode?: string;
    deepLink?: string;
    expiredAt: string;
  };
  order?: Order;
  message?: string;
  remainingBalance?: number;
  mode?: 'mock' | 'sandbox' | 'production';
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 加载订单信息
  useEffect(() => {
    fetchOrder();
    fetchBalance();
  }, [orderId]);

  // 倒计时
  useEffect(() => {
    if (paymentResult?.payment?.expiredAt && paymentResult.requiresPayment) {
      const expiredAt = new Date(paymentResult.payment.expiredAt).getTime();
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiredAt - Date.now()) / 1000));
        setCountdown(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          setError('支付超时，请重新发起支付');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentResult]);

  // 轮询支付状态
  useEffect(() => {
    if (paymentResult?.payment?.paymentId && paymentResult.requiresPayment) {
      const timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment/status/${paymentResult.payment!.paymentId}`);
          const data = await res.json();
          
          if (data.success && data.payment?.status === 'paid') {
            clearInterval(timer);
            router.push(`/orders?paid=${orderId}`);
          }
        } catch (err) {
          console.error('查询支付状态失败:', err);
        }
      }, 3000);
      
      return () => clearInterval(timer);
    }
  }, [paymentResult, orderId, router]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setOrder(data);
        
        // 如果订单已支付，跳转到订单页
        if (data.status !== 'pending') {
          router.push(`/orders?status=${data.status}`);
        }
      }
    } catch (err) {
      setError('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      // 假设当前用户 ID 存储在本地
      const userId = localStorage.getItem('userId');
      if (userId) {
        const res = await fetch(`/api/balance?userId=${userId}`);
        const data = await res.json();
        if (data.balance !== undefined) {
          setBalance(data.balance);
        }
      }
    } catch (err) {
      console.error('获取余额失败:', err);
    }
  };

  const handlePay = useCallback(async () => {
    if (!order) return;
    
    setPaying(true);
    setError(null);
    setPaymentResult(null);
    
    try {
      const userId = localStorage.getItem('userId') || 'demo_user';
      
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethod,
          scene: 'web' as PaymentScene,
        }),
      });
      
      const data: PaymentResult = await res.json();
      setPaymentResult(data);
      
      if (!data.success) {
        setError(data.message || '支付失败');
      } else if (data.remainingBalance !== undefined) {
        // 余额支付成功
        setBalance(data.remainingBalance);
        router.push(`/orders?paid=${orderId}`);
      } else if (data.mode === 'mock' && data.requiresPayment) {
        // 模拟模式下自动完成
        setTimeout(() => {
          router.push(`/orders?paid=${orderId}`);
        }, 2000);
      }
    } catch (err) {
      setError('支付请求失败');
    } finally {
      setPaying(false);
    }
  }, [order, orderId, paymentMethod, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00f5d4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center">
        <NeonCard className="text-center p-8">
          <p className="text-red-400 mb-4">{error || '订单不存在'}</p>
          <Link href="/orders">
            <NeonButton variant="secondary">返回订单列表</NeonButton>
          </Link>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* 背景网格 */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00f5d4 1px, transparent 1px),
            linear-gradient(to bottom, #00f5d4 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      <div className="relative max-w-2xl mx-auto px-4 py-16">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#00f5d4] to-[#9b5de5] mb-2">
            订单支付
          </h1>
          <p className="text-gray-400">Order Payment</p>
        </div>
        
        {/* 订单信息 */}
        <NeonCard className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-[#00f5d4]">订单信息</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">订单号</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Agent 名称</span>
              <span>{order.agentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Agent 类型</span>
              <span className="text-[#9b5de5]">{order.agentType}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">支付金额</span>
                <span className="text-2xl font-bold text-[#00f5d4]">
                  ¥{order.finalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </NeonCard>
        
        {/* 支付方式 */}
        <NeonCard className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-[#00f5d4]">支付方式</h2>
          
          <div className="space-y-3">
            {/* 余额支付 */}
            <label className={`
              flex items-center justify-between p-4 rounded-lg cursor-pointer
              border-2 transition-all duration-200
              ${paymentMethod === 'balance' 
                ? 'border-[#00f5d4] bg-[#00f5d4]/10' 
                : 'border-gray-700 hover:border-gray-600'}
            `}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="balance"
                  checked={paymentMethod === 'balance'}
                  onChange={() => setPaymentMethod('balance')}
                  className="w-4 h-4 accent-[#00f5d4]"
                />
                <div>
                  <div className="font-medium">余额支付</div>
                  <div className="text-sm text-gray-400">
                    当前余额: ¥{balance?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
              {balance !== null && balance < order.finalPrice && (
                <span className="text-xs text-red-400">余额不足</span>
              )}
            </label>
            
            {/* 支付宝 */}
            <label className={`
              flex items-center justify-between p-4 rounded-lg cursor-pointer
              border-2 transition-all duration-200
              ${paymentMethod === 'alipay' 
                ? 'border-[#00f5d4] bg-[#00f5d4]/10' 
                : 'border-gray-700 hover:border-gray-600'}
            `}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="alipay"
                  checked={paymentMethod === 'alipay'}
                  onChange={() => setPaymentMethod('alipay')}
                  className="w-4 h-4 accent-[#00f5d4]"
                />
                <div>
                  <div className="font-medium">支付宝</div>
                  <div className="text-sm text-gray-400">推荐使用</div>
                </div>
              </div>
              <div className="w-8 h-8 bg-[#1677FF] rounded flex items-center justify-center text-white font-bold text-xs">
                支
              </div>
            </label>
            
            {/* 微信支付 */}
            <label className={`
              flex items-center justify-between p-4 rounded-lg cursor-pointer
              border-2 transition-all duration-200
              ${paymentMethod === 'wechat' 
                ? 'border-[#00f5d4] bg-[#00f5d4]/10' 
                : 'border-gray-700 hover:border-gray-600'}
            `}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wechat"
                  checked={paymentMethod === 'wechat'}
                  onChange={() => setPaymentMethod('wechat')}
                  className="w-4 h-4 accent-[#00f5d4]"
                />
                <div>
                  <div className="font-medium">微信支付</div>
                  <div className="text-sm text-gray-400">扫码支付</div>
                </div>
              </div>
              <div className="w-8 h-8 bg-[#07C160] rounded flex items-center justify-center text-white font-bold text-xs">
                微
              </div>
            </label>
          </div>
        </NeonCard>
        
        {/* 支付结果/二维码 */}
        {paymentResult?.requiresPayment && paymentResult.payment && (
          <NeonCard className="mb-6">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-4">请完成支付</h3>
              
              {/* 倒计时 */}
              {countdown !== null && (
                <div className="text-sm text-gray-400 mb-4">
                  支付剩余时间: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
              )}
              
              {/* 模拟模式提示 */}
              {paymentResult.mode === 'mock' && (
                <div className="bg-[#9b5de5]/20 border border-[#9b5de5]/50 rounded-lg p-4 mb-4">
                  <p className="text-[#9b5de5] text-sm">
                    🧪 模拟支付模式：支付将自动完成
                  </p>
                </div>
              )}
              
              {/* 二维码 */}
              {paymentResult.payment.qrCode && (
                <div className="mb-4">
                  <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-xs mb-2">扫码支付</p>
                      <p className="text-[10px] font-mono">{paymentResult.payment.paymentId}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 支付链接 */}
              {paymentResult.payment.paymentUrl && (
                <a
                  href={paymentResult.payment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <NeonButton variant="primary">
                    前往支付
                  </NeonButton>
                </a>
              )}
              
              <p className="text-sm text-gray-400 mt-4">
                支付完成后将自动跳转
              </p>
            </div>
          </NeonCard>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* 支付按钮 */}
        {!paymentResult?.requiresPayment && (
          <NeonButton
            variant="primary"
            className="w-full"
            onClick={handlePay}
            disabled={paying || (paymentMethod === 'balance' && balance !== null && balance < order.finalPrice)}
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              `立即支付 ¥${order.finalPrice.toFixed(2)}`
            )}
          </NeonButton>
        )}
        
        {/* 返回按钮 */}
        <div className="text-center mt-6">
          <Link href="/orders" className="text-gray-400 hover:text-[#00f5d4] text-sm">
            返回订单列表
          </Link>
        </div>
      </div>
    </div>
  );
}