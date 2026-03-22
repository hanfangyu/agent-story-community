# TOOLS.md - 股神小 K

## 可用工具

### 数据获取
- `get_stock_info(symbol)`: 获取股票基本信息（名称、行业、市值等）
- `get_realtime_quote(symbol)`: 获取实时行情（价格、涨跌幅、成交量等）
- `get_historical_data(symbol, period)`: 获取历史 K 线数据
- `get_financial_data(symbol)`: 获取财务数据（营收、利润、ROE 等）

### 分析工具
- `calculate_indicators(data, indicators)`: 计算技术指标
- `backtest_strategy(symbol, strategy, period)`: 策略回测
- `risk_analysis(portfolio)`: 风险评估
- `market_sentiment()`: 市场情绪分析

### 交易工具（需授权）
- `place_order(symbol, type, quantity, price)`: 下单交易
- `cancel_order(order_id)`: 撤销订单
- `get_positions()`: 获取持仓信息

## API 配置

### 新浪财经 API
- **Endpoint**: `https://hq.sinajs.cn/list={symbol}`
- **用途**: 实时行情数据（免费）
- **频率限制**: 无明确限制，建议每分钟 <100 次
- **示例**: `https://hq.sinajs.cn/list=sh000001,sz000001`

### Tushare API
- **Endpoint**: `https://api.tushare.pro/`
- **用途**: 历史数据、财务数据、指数数据
- **频率限制**: 每分钟 200-500 次（根据积分等级）
- **认证**: 需要申请 Token

### 东方财富 API
- **Endpoint**: `https://push2.eastmoney.com/`
- **用途**: 资金流向、板块数据
- **频率限制**: 建议每分钟 <50 次

## 使用规则

1. **缓存优先**: 相同数据 5 分钟内使用缓存，避免重复请求
2. **批量查询**: 一次请求多个股票代码，减少 API 调用次数
3. **错误重试**: 失败后等待 1 秒重试，最多 3 次
4. **降级策略**: 主要数据源失败时自动切换备用源

## 使用示例

### 获取股票实时行情

```typescript
import { get_realtime_quote } from '@/lib/stock';

const quote = await get_realtime_quote('000001.SZ');
console.log(quote);
// {
//   symbol: '000001.SZ',
//   name: '平安银行',
//   price: 10.52,
//   change: 0.12,
//   changePercent: 1.15,
//   volume: 125000000,
//   turnover: 1315000000,
//   ...
// }
```

### 计算技术指标

```typescript
import { calculate_indicators } from '@/lib/stock';

const data = await get_historical_data('000001.SZ', '1y');
const indicators = calculate_indicators(data, ['MACD', 'RSI', 'KDJ']);

console.log(indicators);
// {
//   MACD: { DIF: 0.15, DEA: 0.12, MACD: 0.06, signal: '金叉' },
//   RSI: { value: 58, status: '正常' },
//   KDJ: { K: 62, D: 55, J: 76, signal: '看涨' }
// }
```

### 策略回测

```typescript
import { backtest_strategy } from '@/lib/stock';

const result = await backtest_strategy('000001.SZ', {
  entry: 'MACD金叉 AND RSI < 70',
  exit: 'MACD死叉 OR RSI > 80',
  stopLoss: 0.05,  // 5% 止损
  takeProfit: 0.15, // 15% 止盈
}, '1y');

console.log(result);
// {
//   totalReturn: 0.23,     // 总收益率 23%
//   maxDrawdown: 0.08,     // 最大回撤 8%
//   winRate: 0.65,         // 胜率 65%
//   sharpeRatio: 1.85,     // 夏普比率
//   trades: 12,            // 交易次数
//   ...
// }
```