/**
 * 支付系统类型定义
 * Agent Story Community - 支付集成模块
 */

// ========== 支付渠道 ==========

/**
 * 支付渠道
 */
export type PaymentChannel = 
  | 'alipay'    // 支付宝
  | 'wechat';   // 微信支付

/**
 * 支付模式
 */
export type PaymentMode = 
  | 'mock'      // 模拟支付（开发测试）
  | 'sandbox'   // 沙箱环境
  | 'production'; // 生产环境

/**
 * 支付场景
 */
export type PaymentScene = 
  | 'web'       // 网页支付
  | 'h5'        // H5 支付
  | 'app'       // APP 支付
  | 'native';   // 扫码支付

// ========== 支付订单 ==========

/**
 * 支付订单
 */
export interface PaymentOrder {
  id: string;                    // 支付订单ID
  orderId: string;               // 业务订单ID
  
  // 支付信息
  channel: PaymentChannel;       // 支付渠道
  amount: number;                // 支付金额（分）
  currency: string;              // 币种（CNY）
  subject: string;               // 商品标题
  body: string;                  // 商品描述
  
  // 买家信息
  buyerId: string;               // 买家ID
  buyerName?: string;            // 买家名称
  
  // 状态
  status: PaymentOrderStatus;    // 支付状态
  
  // 渠道信息
  channelTradeNo?: string;       // 渠道交易号
  channelBuyerId?: string;       // 渠道买家ID
  channelBuyerName?: string;     // 渠道买家账号
  
  // 时间
  createdAt: Date;               // 创建时间
  expiredAt: Date;               // 过期时间
  paidAt?: Date;                 // 支付时间
  
  // 回调信息
  notifyUrl: string;             // 回调地址
  returnUrl?: string;            // 跳转地址
  
  // 额外信息
  metadata?: Record<string, string>; // 元数据
}

/**
 * 支付订单状态
 */
export type PaymentOrderStatus = 
  | 'pending'     // 待支付
  | 'paid'        // 已支付
  | 'closed'      // 已关闭
  | 'refunded'    // 已退款
  | 'failed';     // 支付失败

// ========== 支付请求 ==========

/**
 * 创建支付请求
 */
export interface CreatePaymentRequest {
  orderId: string;               // 业务订单ID
  channel: PaymentChannel;       // 支付渠道
  scene: PaymentScene;           // 支付场景
  amount: number;                // 金额（分）
  subject: string;               // 商品标题
  body?: string;                 // 商品描述
  buyerId: string;               // 买家ID
  buyerName?: string;            // 买家名称
  returnUrl?: string;            // 跳转地址
  metadata?: Record<string, string>; // 元数据
}

/**
 * 创建支付响应
 */
export interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;            // 支付订单ID
  paymentUrl?: string;           // 支付链接
  qrCode?: string;               // 二维码链接
  deepLink?: string;             // APP 深链
  expiredAt?: Date;              // 过期时间
  error?: PaymentError;
}

/**
 * 支付错误
 */
export interface PaymentError {
  code: string;
  message: string;
  detail?: string;
}

// ========== 支付回调 ==========

/**
 * 支付回调通知
 */
export interface PaymentNotify {
  paymentId: string;             // 支付订单ID
  orderId: string;               // 业务订单ID
  channel: PaymentChannel;       // 支付渠道
  channelTradeNo: string;        // 渠道交易号
  channelBuyerId?: string;       // 渠道买家ID
  amount: number;                // 支付金额（分）
  paidAt: Date;                  // 支付时间
  status: 'success' | 'failed';  // 支付状态
  rawNotify: Record<string, any>; // 原始通知数据
}

/**
 * 支付回调处理结果
 */
export interface PaymentNotifyResult {
  success: boolean;
  message: string;
  shouldRetry?: boolean;
}

// ========== 支付查询 ==========

/**
 * 支付查询响应
 */
export interface PaymentQueryResponse {
  paymentId: string;
  orderId: string;
  channel: PaymentChannel;
  status: PaymentOrderStatus;
  amount: number;
  channelTradeNo?: string;
  buyerId?: string;
  paidAt?: Date;
  closedAt?: Date;
}

// ========== 支付退款 ==========

/**
 * 退款请求
 */
export interface RefundRequest {
  paymentId: string;             // 支付订单ID
  orderId: string;               // 业务订单ID
  refundAmount: number;          // 退款金额（分）
  refundReason: string;          // 退款原因
  operator: string;              // 操作人
}

/**
 * 退款响应
 */
export interface RefundResponse {
  success: boolean;
  refundId?: string;             // 退款ID
  refundAmount?: number;         // 退款金额
  status?: 'processing' | 'success' | 'failed';
  error?: PaymentError;
}

// ========== 支付配置 ==========

/**
 * 支付宝配置
 */
export interface AlipayConfig {
  appId: string;                 // 应用ID
  privateKey: string;            // 应用私钥
  alipayPublicKey: string;       // 支付宝公钥
  notifyUrl: string;             // 异步通知地址
  returnUrl?: string;            // 同步跳转地址
  sandbox: boolean;              // 是否沙箱环境
}

/**
 * 微信支付配置
 */
export interface WechatPayConfig {
  appId: string;                 // 应用ID（公众号/小程序）
  mchId: string;                 // 商户号
  apiKey: string;                // API 密钥
  apiV3Key?: string;             // APIv3 密钥
  serialNo?: string;             // 证书序列号
  privateKey?: string;           // 商户私钥
  notifyUrl: string;             // 异步通知地址
  sandbox: boolean;              // 是否沙箱环境
}

/**
 * 支付配置
 */
export interface PaymentConfig {
  mode: PaymentMode;             // 支付模式
  alipay?: AlipayConfig;         // 支付宝配置
  wechat?: WechatPayConfig;      // 微信支付配置
}

// ========== 支付流水 ==========

/**
 * 支付流水
 */
export interface PaymentTransaction {
  id: string;                    // 流水ID
  paymentId: string;             // 支付订单ID
  orderId: string;               // 业务订单ID
  
  // 交易信息
  type: TransactionType;         // 交易类型
  channel: PaymentChannel;       // 支付渠道
  amount: number;                // 金额（分）
  
  // 状态
  status: TransactionStatus;     // 交易状态
  
  // 渠道信息
  channelTradeNo?: string;       // 渠道交易号
  
  // 时间
  createdAt: Date;               // 创建时间
  processedAt?: Date;            // 处理时间
  
  // 备注
  note?: string;
}

/**
 * 交易类型
 */
export type TransactionType = 
  | 'payment'    // 支付
  | 'refund';    // 退款

/**
 * 交易状态
 */
export type TransactionStatus = 
  | 'pending'    // 处理中
  | 'success'    // 成功
  | 'failed';    // 失败