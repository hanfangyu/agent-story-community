/**
 * 上架市场页面
 * /marketplace - Agent 交易市场
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ListedAgent {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  pricingModel: string;
  pricingPrice: number | null;
  pricingSubscription: number | null;
  viewCount: number;
  purchaseCount: number;
  avgRating: number;
  totalReviews: number;
  listedAt: string;
}

const AGENT_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  arena: { label: '竞技场', icon: '🎮', color: 'text-[#00f5d4]' },
  creative: { label: '创作区', icon: '📚', color: 'text-[#9b5de5]' },
  dev: { label: '开发区', icon: '💻', color: 'text-[#f15bb5]' },
  analysis: { label: '分析区', icon: '📊', color: 'text-[#fee440]' },
  design: { label: '创意区', icon: '🎨', color: 'text-[#00bbf9]' },
  research: { label: '研究区', icon: '🔬', color: 'text-[#ff6b6b]' },
};

const PRICING_LABELS: Record<string, string> = {
  free: '免费',
  one_time: '一次性购买',
  subscription: '订阅',
  usage_based: '按次计费',
};

export default function MarketplacePage() {
  const [agents, setAgents] = useState<ListedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  useEffect(() => {
    fetchAgents();
  }, [selectedType, sortBy]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // 模拟数据
      const mockAgents: ListedAgent[] = [
        {
          id: 'la_1',
          agentId: 'agent_stock_001',
          agentName: '股神小 K',
          agentType: 'arena',
          pricingModel: 'subscription',
          pricingPrice: null,
          pricingSubscription: 99,
          viewCount: 15234,
          purchaseCount: 1234,
          avgRating: 4.8,
          totalReviews: 567,
          listedAt: '2026-03-15T10:00:00Z',
        },
        {
          id: 'la_2',
          agentId: 'agent_novel_001',
          agentName: '小说家小 N',
          agentType: 'creative',
          pricingModel: 'usage_based',
          pricingPrice: null,
          pricingSubscription: null,
          viewCount: 8921,
          purchaseCount: 2345,
          avgRating: 4.6,
          totalReviews: 234,
          listedAt: '2026-03-10T10:00:00Z',
        },
        {
          id: 'la_3',
          agentId: 'agent_code_001',
          agentName: '代码助手 CodeX',
          agentType: 'dev',
          pricingModel: 'free',
          pricingPrice: null,
          pricingSubscription: null,
          viewCount: 25678,
          purchaseCount: 5678,
          avgRating: 4.9,
          totalReviews: 890,
          listedAt: '2026-03-01T10:00:00Z',
        },
        {
          id: 'la_4',
          agentId: 'agent_analysis_001',
          agentName: '数据分析师 DA',
          agentType: 'analysis',
          pricingModel: 'one_time',
          pricingPrice: 299,
          pricingSubscription: null,
          viewCount: 6543,
          purchaseCount: 456,
          avgRating: 4.5,
          totalReviews: 123,
          listedAt: '2026-03-18T10:00:00Z',
        },
      ];

      let filtered = mockAgents;
      if (selectedType) {
        filtered = mockAgents.filter(a => a.agentType === selectedType);
      }

      let sorted = [...filtered];
      switch (sortBy) {
        case 'popular':
          sorted.sort((a, b) => b.purchaseCount - a.purchaseCount);
          break;
        case 'rating':
          sorted.sort((a, b) => b.avgRating - a.avgRating);
          break;
        case 'newest':
          sorted.sort((a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime());
          break;
      }

      setAgents(sorted);
    } catch (error) {
      console.error('获取市场列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (agent: ListedAgent) => {
    switch (agent.pricingModel) {
      case 'free':
        return <span className="text-[#00f5d4] font-bold">免费</span>;
      case 'one_time':
        return <span className="text-[#9b5de5] font-bold">¥{agent.pricingPrice}</span>;
      case 'subscription':
        return <span className="text-[#f15bb5] font-bold">¥{agent.pricingSubscription}/月</span>;
      case 'usage_based':
        return <span className="text-[#fee440] font-bold">按次计费</span>;
      default:
        return <span>-</span>;
    }
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
            <h1 className="text-3xl font-bold font-mono tracking-tight">
              <span className="text-[#00f5d4]">◆</span> Agent 市场
            </h1>
            <p className="text-gray-400 mt-2">发现和购买高质量 Agent 提示词</p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 类型筛选 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  selectedType === null
                    ? 'bg-[#00f5d4] text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                全部
              </button>
              {Object.entries(AGENT_TYPE_LABELS).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                    selectedType === type
                      ? 'bg-[#00f5d4] text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {config.icon} {config.label}
                </button>
              ))}
            </div>

            {/* 排序 */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-500 text-sm">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:border-[#00f5d4] outline-none"
              >
                <option value="popular">最受欢迎</option>
                <option value="rating">评分最高</option>
                <option value="newest">最新上架</option>
              </select>
            </div>
          </div>
        </div>

        {/* Agent 列表 */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {loading ? (
            <div className="text-center py-20 text-gray-500">加载中...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">暂无上架 Agent</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const typeConfig = AGENT_TYPE_LABELS[agent.agentType] || AGENT_TYPE_LABELS.arena;
                return (
                  <Link
                    key={agent.id}
                    href={`/marketplace/${agent.agentId}`}
                    className="group bg-[#0a0a12] border border-white/10 rounded-xl p-6 hover:border-[#00f5d4]/50 transition-all"
                  >
                    {/* 类型标签 */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-sm font-mono ${typeConfig.color}`}>
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {PRICING_LABELS[agent.pricingModel]}
                      </span>
                    </div>

                    {/* 名称 */}
                    <h3 className="text-xl font-bold font-mono mb-2 group-hover:text-[#00f5d4] transition-colors">
                      {agent.agentName}
                    </h3>

                    {/* 统计 */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <span className="text-[#fee440]">★</span>
                        {agent.avgRating.toFixed(1)}
                      </span>
                      <span>{agent.purchaseCount} 次购买</span>
                      <span>{agent.viewCount} 次查看</span>
                    </div>

                    {/* 价格 */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-gray-500 text-sm">价格</span>
                      {formatPrice(agent)}
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // 模拟购买流程
                        alert(`即将购买: ${agent.agentName}`);
                      }}
                      className="mt-4 w-full py-2 bg-[#f15bb5] text-white rounded-lg font-mono text-sm hover:bg-[#f15bb5]/80 transition-colors"
                    >
                      {agent.pricingModel === 'free' ? '立即获取' : '立即购买'}
                    </button>

                    {/* 扫描线动画 */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{
                        background: 'linear-gradient(transparent 50%, rgba(0, 245, 212, 0.03) 50%)',
                        backgroundSize: '100% 4px',
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}