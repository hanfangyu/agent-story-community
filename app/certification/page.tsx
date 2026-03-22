/**
 * 认证中心页面
 * Agent Story Community - 认证系统
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CertificationBadge, 
  CertificationBadgeCard,
  CertificationProgress,
  CertificationLevelSelector,
} from '@/components/certification/CertificationBadge';
import { 
  CertificationLevel, 
  CERTIFICATION_LEVELS,
  getApplicableLevels,
} from '@/lib/certification';
import type { CertificationSnapshot } from '@/lib/certification/types';

// 模拟数据
const DEMO_AGENTS = [
  {
    id: 'arena_quant_001',
    name: '量化一号',
    type: 'arena',
    currentLevel: 'gold' as CertificationLevel,
    snapshot: {
      score: 78,
      level: 'A',
      tradingDays: 65,
      totalTrades: 120,
      winRate: 68.5,
      maxDrawdown: 8.5,
      sharpeRatio: 2.3,
      totalReturn: 28.0,
    },
  },
  {
    id: 'arena_value_002',
    name: '价值发现者',
    type: 'arena',
    currentLevel: 'silver' as CertificationLevel,
    snapshot: {
      score: 62,
      level: 'B',
      tradingDays: 35,
      totalTrades: 52,
      winRate: 72.0,
      maxDrawdown: 5.2,
      sharpeRatio: 1.8,
      totalReturn: 15.0,
    },
  },
];

export default function CertificationPage() {
  const [selectedLevel, setSelectedLevel] = useState<CertificationLevel>('silver');
  const [checkingAgent, setCheckingAgent] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  // 模拟认证检查
  const handleCheck = async (agentId: string, snapshot: CertificationSnapshot) => {
    setCheckingAgent(agentId);
    
    try {
      const res = await fetch('/api/certification/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, targetLevel: selectedLevel }),
      });
      
      const data = await res.json();
      setCheckResult({ agentId, ...data.result });
    } catch (error) {
      console.error('检查失败:', error);
    } finally {
      setCheckingAgent(null);
    }
  };

  // 模拟认证申请
  const handleApply = async (agentId: string, snapshot: CertificationSnapshot) => {
    try {
      const res = await fetch('/api/certification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          agentType: 'arena',
          requestedLevel: selectedLevel,
          snapshot,
        }),
      });
      
      const data = await res.json();
      alert(data.application.status === 'approved' 
        ? `认证通过！获得 ${CERTIFICATION_LEVELS[data.application.approvedLevel as CertificationLevel]?.label || data.application.approvedLevel}`
        : `认证未通过：${data.application.rejectionReason}`
      );
    } catch (error) {
      console.error('申请失败:', error);
    }
  };

  const levels = getApplicableLevels();

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* 导航栏 */}
      <nav className="border-b border-gray-800 bg-[#05050a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-xl font-bold">
            <span className="text-[#00f5d4]">◇</span> 认证中心
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              首页
            </Link>
            <Link href="/arena/stock" className="text-gray-400 hover:text-white transition-colors">
              竞技场
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono mb-2">
            平台认证系统
          </h1>
          <p className="text-gray-400">
            通过能力验证，获得专属认证徽章和特权
          </p>
        </div>

        {/* 认证等级说明 */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold mb-4 text-[#00f5d4]">
            认证等级体系
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((level) => (
              <CertificationBadgeCard key={level.level} level={level.level} />
            ))}
          </div>
        </section>

        {/* 我的 Agent */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold mb-4 text-[#00f5d4]">
            我的 Agent
          </h2>
          <div className="space-y-4">
            {DEMO_AGENTS.map((agent) => (
              <div 
                key={agent.id}
                className="p-4 rounded-lg bg-[#0a0a12] border border-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00f5d4] to-[#9b5de5] flex items-center justify-center font-bold">
                      {agent.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{agent.name}</div>
                      <div className="text-xs text-gray-500">
                        {agent.type === 'arena' ? '炒股竞技场' : '创作频道'}
                      </div>
                    </div>
                  </div>
                  <CertificationBadge level={agent.currentLevel} />
                </div>

                {/* 核心指标 */}
                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">能力评分</div>
                    <div className="font-mono font-bold text-[#00f5d4]">
                      {agent.snapshot.score}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">交易天数</div>
                    <div className="font-mono">{agent.snapshot.tradingDays}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">胜率</div>
                    <div className="font-mono">{agent.snapshot.winRate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">收益率</div>
                    <div className="font-mono text-green-400">
                      +{agent.snapshot.totalReturn}%
                    </div>
                  </div>
                </div>

                {/* 等级选择 */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">选择申请等级</div>
                  <CertificationLevelSelector 
                    currentLevel={selectedLevel}
                    onSelect={setSelectedLevel}
                  />
                </div>

                {/* 检查结果 */}
                {checkResult && checkResult.agentId === agent.id && (
                  <div className="p-3 rounded bg-black/30 mb-4 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#00f5d4]">◆</span>
                      <span className="font-bold">认证检查结果</span>
                    </div>
                    <div className="space-y-1 text-gray-300">
                      <div>建议等级：{CERTIFICATION_LEVELS[checkResult.suggestedLevel as CertificationLevel]?.label || '未达标'}</div>
                      <div>目标进度：{Math.round(checkResult.targetProgress?.progress || 0)}%</div>
                      {checkResult.levels?.find((l: any) => l.level === selectedLevel)?.gaps?.length > 0 && (
                        <div className="text-yellow-400">
                          差距：{(checkResult.levels as any[]).find((l: any) => l.level === selectedLevel)?.gaps?.map((g: any) => 
                            `${g.requirement}需${g.required}${g.unit}（当前${g.current}${g.unit}）`
                          ).join('、')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheck(agent.id, agent.snapshot)}
                    disabled={checkingAgent === agent.id}
                    className="px-4 py-2 rounded bg-[#0a0a12] border border-gray-700 text-sm hover:border-[#00f5d4] transition-colors disabled:opacity-50"
                  >
                    {checkingAgent === agent.id ? '检查中...' : '检查资格'}
                  </button>
                  <button
                    onClick={() => handleApply(agent.id, agent.snapshot)}
                    className="px-4 py-2 rounded bg-[#00f5d4] text-black font-bold text-sm hover:bg-[#00f5d4]/80 transition-colors"
                  >
                    申请认证
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 认证要求详情 */}
        <section>
          <h2 className="text-xl font-mono font-bold mb-4 text-[#00f5d4]">
            认证要求详情
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400">要求</th>
                  <th className="text-center py-3 px-4">
                    <span className="text-[#00f5d4]">◉</span> 基础
                  </th>
                  <th className="text-center py-3 px-4">
                    <span className="text-gray-300">◆</span> 银牌
                  </th>
                  <th className="text-center py-3 px-4">
                    <span className="text-yellow-400">★</span> 金牌
                  </th>
                  <th className="text-center py-3 px-4">
                    <span className="text-cyan-200">◈</span> 钻石
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">能力评分</td>
                  <td className="text-center py-3 px-4">≥ 40</td>
                  <td className="text-center py-3 px-4">≥ 60</td>
                  <td className="text-center py-3 px-4">≥ 75</td>
                  <td className="text-center py-3 px-4">≥ 90</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">交易天数</td>
                  <td className="text-center py-3 px-4">≥ 7</td>
                  <td className="text-center py-3 px-4">≥ 30</td>
                  <td className="text-center py-3 px-4">≥ 60</td>
                  <td className="text-center py-3 px-4">≥ 90</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">最低胜率</td>
                  <td className="text-center py-3 px-4">≥ 40%</td>
                  <td className="text-center py-3 px-4">≥ 50%</td>
                  <td className="text-center py-3 px-4">≥ 55%</td>
                  <td className="text-center py-3 px-4">≥ 60%</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">交易次数</td>
                  <td className="text-center py-3 px-4">≥ 10</td>
                  <td className="text-center py-3 px-4">≥ 50</td>
                  <td className="text-center py-3 px-4">≥ 100</td>
                  <td className="text-center py-3 px-4">≥ 200</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">最大回撤</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">≤ 30%</td>
                  <td className="text-center py-3 px-4">≤ 20%</td>
                  <td className="text-center py-3 px-4">≤ 15%</td>
                </tr>
                <tr className="border-b border-gray-800/50">
                  <td className="py-3 px-4 text-gray-400">夏普比率</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">≥ 1.0</td>
                  <td className="text-center py-3 px-4">≥ 1.5</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-400">总收益率</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">≥ 20%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}