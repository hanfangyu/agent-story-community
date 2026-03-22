/**
 * 订单系统数据库初始化
 * Agent Story Community - 交易市场模块
 */

import { sql } from './client';
import type {
  Order,
  OrderStatus,
  PaymentMethod,
  OrderType,
  PaymentStatus,
  OrderEvent,
} from '../order/types';

// ========== 初始化函数 ==========

/**
 * 初始化订单相关表
 */
export async function initOrderTables(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('开始初始化订单表...');
    
    // 创建订单主表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        
        -- 买家信息
        buyer_id TEXT NOT NULL,
        buyer_name TEXT,
        
        -- 商品信息
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        
        -- 订单类型
        order_type TEXT NOT NULL,
        
        -- 价格信息
        pricing_model TEXT NOT NULL,
        original_price DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0.00,
        final_price DECIMAL(10, 2) NOT NULL,
        
        -- 支付信息
        payment_method TEXT,
        payment_status JSONB DEFAULT '{"status": "pending"}',
        paid_at TIMESTAMP,
        transaction_id TEXT,
        
        -- 订单状态
        status TEXT DEFAULT 'pending',
        
        -- 有效期
        expires_at TIMESTAMP,
        
        -- 使用信息
        usage_quota INTEGER,
        usage_used INTEGER DEFAULT 0,
        
        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP
      )
    `);
    
    // 创建订单事件表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS order_events (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        operator TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户余额表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS user_balances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        frozen_balance DECIMAL(15, 2) DEFAULT 0.00,
        total_recharge DECIMAL(15, 2) DEFAULT 0.00,
        total_spent DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建余额变动记录表
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS balance_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        balance_after DECIMAL(15, 2) NOT NULL,
        order_id TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建索引
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agent_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
      CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
    `);
    
    console.log('订单表初始化完成');
    return { success: true, message: '订单表初始化成功' };
  } catch (error) {
    console.error('订单表初始化失败:', error);
    return { success: false, message: `初始化失败: ${error}` };
  }
}

// ========== CRUD 操作 ==========

/**
 * 创建订单
 */
export async function createOrder(order: Order): Promise<Order> {
  const result = await sql.unsafe(`
    INSERT INTO orders (
      id, buyer_id, buyer_name,
      agent_id, agent_name, agent_type,
      order_type, pricing_model,
      original_price, discount_amount, final_price,
      payment_method, payment_status,
      status, expires_at, usage_quota, usage_used,
      created_at, updated_at
    ) VALUES (
      '${order.id}',
      '${order.buyerId}',
      ${order.buyerName ? `'${order.buyerName}'` : 'NULL'},
      '${order.agentId}',
      '${order.agentName}',
      '${order.agentType}',
      '${order.orderType}',
      '${order.pricingModel}',
      ${order.originalPrice},
      ${order.discountAmount},
      ${order.finalPrice},
      ${order.paymentMethod ? `'${order.paymentMethod}'` : 'NULL'},
      '${JSON.stringify(order.paymentStatus)}'::jsonb,
      '${order.status}',
      ${order.expiresAt ? `'${order.expiresAt.toISOString()}'` : 'NULL'},
      ${order.usageQuota || 'NULL'},
      ${order.usageUsed || 0},
      '${order.createdAt.toISOString()}',
      '${order.updatedAt.toISOString()}'
    )
    RETURNING *
  `);
  
  // 记录订单创建事件
  await createOrderEvent({
    id: `oe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderId: order.id,
    eventType: 'created',
    fromStatus: 'pending' as OrderStatus,
    toStatus: order.status,
    operator: order.buyerId,
    note: '订单创建',
    createdAt: new Date(),
  });
  
  return mapRowToOrder(result[0]);
}

/**
 * 获取订单
 */
export async function getOrder(id: string): Promise<Order | null> {
  const result = await sql.unsafe(`
    SELECT * FROM orders WHERE id = '${id}'
  `);
  
  return result[0] ? mapRowToOrder(result[0]) : null;
}

/**
 * 根据交易ID获取订单
 */
export async function getOrderByTransactionId(transactionId: string): Promise<Order | null> {
  const result = await sql.unsafe(`
    SELECT * FROM orders WHERE transaction_id = '${transactionId}'
  `);
  
  return result[0] ? mapRowToOrder(result[0]) : null;
}

/**
 * 获取用户订单列表
 */
export async function getOrdersByBuyer(
  buyerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> {
  const result = await sql.unsafe(`
    SELECT * FROM orders 
    WHERE buyer_id = '${buyerId}'
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return result.map(mapRowToOrder);
}

/**
 * 获取 Agent 订单列表
 */
export async function getOrdersByAgent(
  agentId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Order[]> {
  const result = await sql.unsafe(`
    SELECT * FROM orders 
    WHERE agent_id = '${agentId}'
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);
  
  return result.map(mapRowToOrder);
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  operator: string,
  note?: string,
  paymentInfo?: {
    transactionId?: string;
    paidAt?: Date;
    paymentStatus?: PaymentStatus;
  }
): Promise<Order | null> {
  const updates: string[] = [
    `status = '${status}'`,
    `updated_at = '${new Date().toISOString()}'`,
  ];
  
  if (paymentInfo?.transactionId) {
    updates.push(`transaction_id = '${paymentInfo.transactionId}'`);
  }
  if (paymentInfo?.paidAt) {
    updates.push(`paid_at = '${paymentInfo.paidAt.toISOString()}'`);
  }
  if (paymentInfo?.paymentStatus) {
    updates.push(`payment_status = '${JSON.stringify(paymentInfo.paymentStatus)}'::jsonb`);
  }
  if (status === 'completed') {
    updates.push(`completed_at = '${new Date().toISOString()}'`);
  }
  if (status === 'cancelled') {
    updates.push(`cancelled_at = '${new Date().toISOString()}'`);
  }
  
  // 先获取当前订单状态
  const currentOrder = await getOrder(id);
  if (!currentOrder) return null;
  
  const result = await sql.unsafe(`
    UPDATE orders
    SET ${updates.join(', ')}
    WHERE id = '${id}'
    RETURNING *
  `);
  
  // 记录状态变更事件
  if (result[0]) {
    const eventType = status as any;
    await createOrderEvent({
      id: `oe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: id,
      eventType: eventType,
      fromStatus: currentOrder.status,
      toStatus: status,
      operator,
      note: note || `订单状态更新为 ${status}`,
      createdAt: new Date(),
    });
  }
  
  return result[0] ? mapRowToOrder(result[0]) : null;
}

/**
 * 创建订单事件
 */
export async function createOrderEvent(event: OrderEvent): Promise<void> {
  await sql.unsafe(`
    INSERT INTO order_events (
      id, order_id, event_type, from_status, to_status, operator, note, created_at
    ) VALUES (
      '${event.id}',
      '${event.orderId}',
      '${event.eventType}',
      '${event.fromStatus}',
      '${event.toStatus}',
      '${event.operator}',
      ${event.note ? `'${event.note}'` : 'NULL'},
      '${event.createdAt.toISOString()}'
    )
  `);
}

/**
 * 获取订单事件列表
 */
export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const result = await sql.unsafe(`
    SELECT * FROM order_events 
    WHERE order_id = '${orderId}'
    ORDER BY created_at ASC
  `);
  
  return result.map(mapRowToEvent);
}

// ========== 用户余额操作 ==========

/**
 * 获取用户余额
 */
export async function getUserBalance(userId: string): Promise<{
  balance: number;
  frozenBalance: number;
} | null> {
  const result = await sql.unsafe(`
    SELECT balance, frozen_balance FROM user_balances WHERE user_id = '${userId}'
  `);
  
  return result[0] ? {
    balance: parseFloat(result[0].balance),
    frozenBalance: parseFloat(result[0].frozen_balance),
  } : null;
}

/**
 * 创建或更新用户余额
 */
export async function initUserBalance(userId: string, initialBalance: number = 0): Promise<void> {
  await sql.unsafe(`
    INSERT INTO user_balances (id, user_id, balance, created_at, updated_at)
    VALUES ('ub_${userId}', '${userId}', ${initialBalance}, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
  `);
}

/**
 * 充值余额
 */
export async function rechargeBalance(
  userId: string,
  amount: number,
  description: string = '充值'
): Promise<{ success: boolean; newBalance: number }> {
  // 先获取当前余额
  const current = await getUserBalance(userId);
  const currentBalance = current?.balance || 0;
  const newBalance = currentBalance + amount;
  
  await sql.unsafe(`
    INSERT INTO user_balances (id, user_id, balance, total_recharge, created_at, updated_at)
    VALUES ('ub_${userId}', '${userId}', ${newBalance}, ${amount}, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET 
      balance = ${newBalance},
      total_recharge = user_balances.total_recharge + ${amount},
      updated_at = NOW()
  `);
  
  // 记录余额变动
  await sql.unsafe(`
    INSERT INTO balance_transactions (id, user_id, type, amount, balance_after, description, created_at)
    VALUES ('bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}', '${userId}', 'recharge', ${amount}, ${newBalance}, '${description}', NOW())
  `);
  
  return { success: true, newBalance };
}

/**
 * 扣除余额
 */
export async function deductBalance(
  userId: string,
  amount: number,
  orderId: string,
  description: string = '支付'
): Promise<{ success: boolean; newBalance: number }> {
  // 先获取当前余额
  const current = await getUserBalance(userId);
  if (!current || current.balance < amount) {
    return { success: false, newBalance: current?.balance || 0 };
  }
  
  const newBalance = current.balance - amount;
  
  await sql.unsafe(`
    UPDATE user_balances SET 
      balance = ${newBalance},
      total_spent = total_spent + ${amount},
      updated_at = NOW()
    WHERE user_id = '${userId}'
  `);
  
  // 记录余额变动
  await sql.unsafe(`
    INSERT INTO balance_transactions (id, user_id, type, amount, balance_after, order_id, description, created_at)
    VALUES ('bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}', '${userId}', 'deduct', ${amount}, ${newBalance}, '${orderId}', '${description}', NOW())
  `);
  
  return { success: true, newBalance };
}

// ========== 辅助函数 ==========

function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    agentId: row.agent_id,
    agentName: row.agent_name,
    agentType: row.agent_type,
    orderType: row.order_type as OrderType,
    pricingModel: row.pricing_model,
    originalPrice: parseFloat(row.original_price),
    discountAmount: parseFloat(row.discount_amount),
    finalPrice: parseFloat(row.final_price),
    paymentMethod: row.payment_method as PaymentMethod,
    paymentStatus: row.payment_status as PaymentStatus,
    paidAt: row.paid_at,
    transactionId: row.transaction_id,
    status: row.status as OrderStatus,
    expiresAt: row.expires_at,
    usageQuota: row.usage_quota,
    usageUsed: row.usage_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

function mapRowToEvent(row: any): OrderEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    eventType: row.event_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    operator: row.operator,
    note: row.note,
    createdAt: row.created_at,
  };
}