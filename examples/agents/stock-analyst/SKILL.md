---
name: stock-analysis
description: 股票综合分析，输出技术面、基本面和风险评估报告
---

# 股票综合分析

## 功能说明

对指定股票进行全面分析，输出包含以下内容的综合报告：

1. **技术面分析**: MACD、RSI、KDJ 等指标解读
2. **基本面分析**: 财务数据、估值水平、行业地位
3. **风险评估**: 最大回撤、波动率、风险等级
4. **操作建议**: 买入/卖出/持有建议及理由

## 参数

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| symbol | string | 是 | 股票代码，格式如 `000001.SZ` | - |
| period | string | 否 | 分析周期 | `30d` |
| includeFinancials | boolean | 否 | 是否包含财务分析 | `true` |
| riskLevel | string | 否 | 用户风险偏好 | `conservative` |

### 参数说明

**period 可选值**:
- `7d` - 近 1 周
- `30d` - 近 1 月
- `90d` - 近 3 月
- `1y` - 近 1 年

**riskLevel 可选值**:
- `conservative` - 保守型（风险敏感）
- `balanced` - 稳健型（风险中性）
- `aggressive` - 激进型（风险偏好）

## 使用示例

### 基础用法

```typescript
const analysis = await analyze_stock({
  symbol: '000001.SZ'
});

console.log(analysis);
```

### 完整参数

```typescript
const analysis = await analyze_stock({
  symbol: '600519.SH',  // 贵州茅台
  period: '90d',
  includeFinancials: true,
  riskLevel: 'balanced'
});
```

### 响应示例

```json
{
  "symbol": "000001.SZ",
  "name": "平安银行",
  "timestamp": "2026-03-23T15:00:00+08:00",
  
  "technical": {
    "trend": "震荡上行",
    "support": 10.20,
    "resistance": 11.00,
    "indicators": {
      "MACD": { "signal": "金叉", "strength": "中等" },
      "RSI": { "value": 58, "status": "正常区间" },
      "KDJ": { "signal": "看涨", "J值": 72 }
    }
  },
  
  "fundamental": {
    "PE": 5.2,
    "PB": 0.55,
    "ROE": 10.5,
    "totalValue": "2100亿",
    "industryRank": 3
  },
  
  "risk": {
    "level": "中等",
    "maxDrawdown": "15%",
    "volatility": "28%",
    "beta": 1.2
  },
  
  "recommendation": {
    "action": "持有",
    "reason": "技术面偏强，估值合理，适合稳健投资者",
    "targetPrice": 11.50,
    "stopLoss": 9.80,
    "position": "建议仓位 10-15%"
  },
  
  "warnings": [
    "⚠️ 近期银行板块整体调整",
    "⚠️ 关注美联储加息影响"
  ]
}
```

## 注意事项

1. **仅支持 A 股**: 港股、美股暂不支持
2. **数据延迟**: 实时数据可能有 3-5 分钟延迟
3. **仅供参考**: 分析结果不构成投资建议
4. **交易时间**: 非交易时间部分数据可能不可用

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| 股票代码无效 | 返回错误提示，建议检查代码格式 |
| 数据获取失败 | 重试 3 次后返回错误信息 |
| 股票已停牌 | 返回停牌提示，建议更换股票 |
| ST/退市风险股 | 返回风险警示，不提供建议 |