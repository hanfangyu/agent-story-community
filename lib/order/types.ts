/**
 * 订单系统类型定义
 * Agent Story Community - 交易市场模块
 */

// ========== 订单状态 ==========

/**
 * 订单状态
 */
export type OrderStatus = 
  | 'pending'      // 待支付
  | 'paid'         // 已支付
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'refunded'     // 已退款
  | 'expired';     // 已过期

/**
 * 支付方式
 */
export type PaymentMethod = 
  | 'alipay'       // 支付宝
  | 'wechat'       // 微信支付
  | 'balance'      // 余额支付
  | 'free';        // 免费

/**
 * 订单类型
 */
export type OrderType = 
  | 'purchase'     // 购买（一次性）
  | 'subscription' // 订阅
  | 'usage';       // 按次计费

// ========== 订单实体 ==========

/**
 * 订单
 */
export interface Order {
  id: string;                    // 订单ID
  
  // 买家信息
  buyerId: string;               // 买家ID
  buyerName?: string;            // 买家名称
  
  // 商品信息
  agentId: string;               // Agent ID
  agentName: string;             // Agent 名称
  agentType: string;             // Agent 类型
  
  // 订单类型
  orderType: OrderType;          // 订单类型
  
  // 价格信息
  pricingModel: string;          // 定价模型
  originalPrice: number;         // 原价
  discountAmount: number;        // 折扣金额
  finalPrice: number;            // 最终价格
  
  // 支付信息
  paymentMethod?: PaymentMethod; // 支付方式
  paymentStatus: PaymentStatus;  // 支付状态
  paidAt?: Date;                 // 支付时间
  transactionId?: string;        // 交易ID
  
  // 订单状态
  status: OrderStatus;           // 订单状态
  
  // 有效期（订阅/按次计费）
  expiresAt?: Date;              // 过期时间
  
  // 使用信息（按次计费）
  usageQuota?: number;           // 使用配额
  usageUsed?: number;            // 已使用次数
  
  // 时间戳
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
  completedAt?: Date;            // 完成时间
  cancelledAt?: Date;            // 取消时间
}

/**
 * 支付状态
 */
export interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  message?: string;
  errorCode?: string;
}

/**
 * 订单项（用于购物车）
 */
export interface OrderItem {
  agentId: string;
  agentName: string;
  agentType: string;
  pricingModel: string;
  price: number;
  quantity?: number;  // 按次计费时为购买次数
}

/**
 * 订单创建请求
 */
export interface CreateOrderRequest {
  buyerId: string;
  buyerName?: string;
  items: OrderItem[];
  couponCode?: string;
  paymentMethod: PaymentMethod;
}

/**
 * 订单查询参数
 */
export interface OrderQuery {
  buyerId?: string;
  agentId?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 订单统计
 */
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
}

// ========== 订单事件 ==========

/**
 * 订单事件类型
 */
export type OrderEventType = 
  | 'created'      // 订单创建
  | 'paid'         // 支付成功
  | 'completed'    // 订单完成
  | 'cancelled'    // 订单取消
  | 'refunded'     // 订单退款
  | 'expired';     // 订单过期

/**
 * 订单事件
 */
export interface OrderEvent {
  id: string;
  orderId: string;
  eventType: OrderEventType;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  operator: string;  // 操作人
  note?: string;
  createdAt: Date;
}