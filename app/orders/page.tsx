/**
 * 订单页面
 * /orders - 我的订单
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  buyerId: string;
  buyerName?: string;
  agentId: string;
  agentName: string;
  agentType: string;
  orderType: string;
  pricingModel: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  paymentMethod?: string;
  paymentStatus: { status: string; message?: string };
  status: string;
  expiresAt?: string;
  usageQuota?: number;
  usageUsed?: number;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '待支付', color: 'text-[#fee440]', icon: '⏳' },
  paid: { label: '已支付', color: 'text-[#00f5d4]', icon: '✓' },
  completed: { label: '已完成', color: 'text-green-400', icon: '✅' },
  cancelled: { label: '已取消', color: 'text-gray-400', icon: '✕' },
  refunded: { label: '已退款', color: 'text-[#f15bb5]', icon: '↩' },
  expired: { label: '已过期', color: 'text-red-400', icon: '⏰' },
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  purchase: '一次性购买',
  subscription: '订阅',
  usage: '按次计费',
};

const PRICING_LABELS: Record<string, string> = {
  free: '免费',
  one_time: '一次性',
  subscription: '订阅',
  usage_based: '按次',
};

const PAYMENT_LABELS: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  balance: '余额支付',
  free: '免费',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 模拟用户ID（实际应从登录状态获取）
  const mockUserId = 'user_001';

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?buyerId=${mockUserId}`);
      const data = await response.json();
      
      if (data.success) {
        let filtered = data.orders;
        if (statusFilter) {
          filtered = filtered.filter((o: Order) => o.status === statusFilter);
        }
        setOrders(filtered);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mockUserId,
          paymentMethod: 'balance',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('支付成功！');
        fetchOrders();
      } else {
        alert(data.error || '支付失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      alert('支付失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '免费';
    return `¥${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* 背景网格 */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10">
        {/* 页面标题 */}
        <div className="border-b border-white/10 bg-[#05050a]/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold font-mono tracking-tight">
                <span className="text-[#9b5de5]">◆</span> 我的订单
              </h1>
              <Link 
                href="/marketplace"
                className="px-4 py-2 bg-[#00f5d4] text-black rounded-lg font-mono text-sm hover:bg-[#00f5d4]/80 transition-colors"
              >
                去购买
              </Link>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                statusFilter === null
                  ? 'bg-[#00f5d4] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              全部
            </button>
            {Object.entries(STATUS_LABELS).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  statusFilter === status
                    ? 'bg-[#00f5d4] text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {loading ? (
            <div className="text-center py-20 text-gray-500">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-gray-500">暂无订单</div>
              <Link 
                href="/marketplace"
                className="inline-block mt-4 text-[#00f5d4] hover:underline"
              >
                去市场逛逛 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                return (
                  <div
                    key={order.id}
                    className="bg-[#0a0a12] border border-white/10 rounded-xl p-6 hover:border-[#00f5d4]/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* 订单信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`font-mono text-sm ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                          <span className="text-xs text-gray-500 font-mono px-2 py-1 bg-white/5 rounded">
                            {ORDER_TYPE_LABELS[order.orderType]}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold font-mono mb-1">
                          {order.agentName}
                        </h3>
                        
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>订单号: {order.id}</div>
                          <div>创建时间: {formatDate(order.createdAt)}</div>
                          {order.expiresAt && (
                            <div>到期时间: {formatDate(order.expiresAt)}</div>
                          )}
                          {order.usageQuota && (
                            <div>使用次数: {order.usageUsed || 0} / {order.usageQuota}</div>
                          )}
                        </div>
                      </div>

                      {/* 价格和操作 */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          {order.discountAmount > 0 && (
                            <div className="text-sm text-gray-500 line-through">
                              {formatPrice(order.originalPrice)}
                            </div>
                          )}
                          <div className="text-xl font-bold text-[#00f5d4]">
                            {formatPrice(order.finalPrice)}
                          </div>
                        </div>

                        {order.status === 'pending' && order.finalPrice > 0 && (
                          <button
                            onClick={() => handlePay(order)}
                            className="px-6 py-2 bg-[#f15bb5] text-white rounded-lg font-mono text-sm hover:bg-[#f15bb5]/80 transition-colors"
                          >
                            立即支付
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-sm text-gray-400 hover:text-[#00f5d4] transition-colors"
                        >
                          查看详情 →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-[#0a0a12] border border-white/10 rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold font-mono mb-4">订单详情</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">订单号</span>
                <span className="font-mono">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">商品</span>
                <span>{selectedOrder.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">类型</span>
                <span>{ORDER_TYPE_LABELS[selectedOrder.orderType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">原价</span>
                <span>{formatPrice(selectedOrder.originalPrice)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#00f5d4]">
                  <span>优惠</span>
                  <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-3">
                <span>实付</span>
                <span className="text-[#00f5d4]">{formatPrice(selectedOrder.finalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">支付方式</span>
                <span>{selectedOrder.paymentMethod ? PAYMENT_LABELS[selectedOrder.paymentMethod] : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">状态</span>
                <span className={STATUS_LABELS[selectedOrder.status]?.color}>
                  {STATUS_LABELS[selectedOrder.status]?.icon} {STATUS_LABELS[selectedOrder.status]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">创建时间</span>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              {selectedOrder.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">完成时间</span>
                  <span>{formatDate(selectedOrder.completedAt)}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-2 bg-white/5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}