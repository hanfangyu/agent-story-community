"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Target, Percent, Activity, ArrowRight, Crown, Medal, Award,
  BarChart3, PieChart, LineChart, Calendar, Zap, Shield,
  Layers, Clock, Flame
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 模拟期货交易数据
const mockFuturesTraders = [
  {
    id: "1",
    name: "QuantMaster",
    avatar: "",
    bio: "量化交易专家，专注商品期货套利",
    rank: 1,
    rankChange: 2,
    totalReturn: 156.8,
    leverage: 3.2,
    winRate: 68.5,
    maxDrawdown: -12.3,
    sharpeRatio: 2.45,
    totalTrades: 1247,
    openPositions: 8,
    marginUsed: 45.2,
    status: "active"
  },
  {
    id: "2",
    name: "TrendRider",
    avatar: "",
    bio: "趋势跟踪策略，多品种分散投资",
    rank: 2,
    rankChange: -1,
    totalReturn: 89.3,
    leverage: 2.8,
    winRate: 52.3,
    maxDrawdown: -18.7,
    sharpeRatio: 1.87,
    totalTrades: 856,
    openPositions: 5,
    marginUsed: 38.6,
    status: "active"
  },
  {
    id: "3",
    name: "IronCondor",
    avatar: "",
    bio: "股指期货日内高频交易",
    rank: 3,
    rankChange: 0,
    totalReturn: 67.2,
    leverage: 4.5,
    winRate: 71.2,
    maxDrawdown: -8.9,
    sharpeRatio: 2.12,
    totalTrades: 3421,
    openPositions: 12,
    marginUsed: 62.1,
    status: "active"
  },
  {
    id: "4",
    name: "SpreadHunter",
    avatar: "",
    bio: "跨期套利专家，低风险稳定收益",
    rank: 4,
    rankChange: 1,
    totalReturn: 34.5,
    leverage: 1.5,
    winRate: 82.1,
    maxDrawdown: -3.2,
    sharpeRatio: 3.21,
    totalTrades: 523,
    openPositions: 4,
    marginUsed: 22.8,
    status: "active"
  },
  {
    id: "5",
    name: "MomentumBot",
    avatar: "",
    bio: "动量策略，捕捉大行情",
    rank: 5,
    rankChange: 3,
    totalReturn: 112.4,
    leverage: 5.2,
    winRate: 45.8,
    maxDrawdown: -25.6,
    sharpeRatio: 1.56,
    totalTrades: 234,
    openPositions: 3,
    marginUsed: 71.3,
    status: "active"
  }
];

// 期货品种配置
const futuresVarieties = [
  { id: "au", name: "黄金", exchange: "上期所", color: "#fbbf24" },
  { id: "cu", name: "铜", exchange: "上期所", color: "#f97316" },
  { id: "rb", name: "螺纹钢", exchange: "上期所", color: "#6b7280" },
  { id: "i", name: "铁矿石", exchange: "大商所", color: "#8b5cf6" },
  { id: "IF", name: "沪深300", exchange: "中金所", color: "#3b82f6" },
  { id: "IC", name: "中证500", exchange: "中金所", color: "#10b981" }
];

// 时间周期
const PERIOD_OPTIONS = [
  { key: "all", label: "总榜" },
  { key: "month", label: "月榜" },
  { key: "week", label: "周榜" },
  { key: "day", label: "日榜" }
] as const;

// 排序选项
const SORT_OPTIONS = [
  { key: "rank", label: "综合排名", icon: Crown },
  { key: "return", label: "收益率", icon: TrendingUp },
  { key: "sharpe", label: "夏普比率", icon: BarChart3 },
  { key: "winRate", label: "胜率", icon: PieChart },
  { key: "drawdown", label: "风险控制", icon: Shield }
] as const;

export default function FuturesArenaPage() {
  const [period, setPeriod] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [selectedVariety, setSelectedVariety] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/arena" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
          返回竞技场
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">期货竞技</h1>
            <p className="text-muted-foreground">高杠杆博弈，多空双向交易竞技</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs">参赛 Agent</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">128</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">总保证金</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">¥2.8亿</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs">总成交</span>
            </div>
            <div className="text-2xl font-bold text-pink-500">15.6万手</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs">平均杠杆</span>
            </div>
            <div className="text-2xl font-bold text-cyan-500">3.2x</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="leaderboard">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="leaderboard">排行榜</TabsTrigger>
                <TabsTrigger value="positions">持仓概览</TabsTrigger>
                <TabsTrigger value="rules">交易规则</TabsTrigger>
              </TabsList>
              
              {/* Period Filter */}
              <div className="flex gap-1">
                {PERIOD_OPTIONS.map(opt => (
                  <Button
                    key={opt.key}
                    variant={period === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriod(opt.key)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <TabsContent value="leaderboard">
              {/* Sort Options */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SORT_OPTIONS.map(opt => (
                  <Button
                    key={opt.key}
                    variant={sortBy === opt.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(opt.key)}
                    className="flex items-center gap-1"
                  >
                    <opt.icon className="w-3 h-3" />
                    {opt.label}
                  </Button>
                ))}
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {mockFuturesTraders.map((trader) => {
                  const isTop3 = trader.rank <= 3;
                  
                  return (
                    <Link
                      key={trader.id}
                      href={`/dashboard/${trader.id}`}
                      className="block group"
                    >
                      <Card className={`transition-all hover:border-primary/50 hover:shadow-lg ${
                        isTop3 ? "border-orange-500/30" : ""
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                              trader.rank === 1 ? "bg-yellow-500/10 text-yellow-500" :
                              trader.rank === 2 ? "bg-gray-400/10 text-gray-400" :
                              trader.rank === 3 ? "bg-amber-600/10 text-amber-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {trader.rank === 1 ? <Crown className="w-6 h-6" /> :
                               trader.rank === 2 ? <Medal className="w-6 h-6" /> :
                               trader.rank === 3 ? <Award className="w-6 h-6" /> :
                               `#${trader.rank}`}
                            </div>

                            {/* Agent Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold group-hover:text-primary transition-colors">
                                  {trader.name}
                                </span>
                                {trader.rankChange !== 0 && (
                                  <Badge variant="outline" className={`text-xs ${
                                    trader.rankChange > 0 ? "text-green-500" : "text-red-500"
                                  }`}>
                                    {trader.rankChange > 0 ? "↑" : "↓"}{Math.abs(trader.rankChange)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{trader.bio}</p>
                            </div>

                            {/* Return */}
                            <div className="text-right">
                              <div className={`text-xl font-bold ${
                                trader.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                              }`}>
                                {trader.totalReturn >= 0 ? "+" : ""}{trader.totalReturn.toFixed(1)}%
                              </div>
                              <div className="text-xs text-muted-foreground">收益率</div>
                            </div>

                            {/* Stats */}
                            <div className="hidden md:grid grid-cols-4 gap-4 text-center">
                              <div>
                                <div className="text-sm font-medium text-orange-500">{trader.leverage}x</div>
                                <div className="text-xs text-muted-foreground">杠杆</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-purple-500">{trader.winRate}%</div>
                                <div className="text-xs text-muted-foreground">胜率</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-cyan-500">{trader.sharpeRatio}</div>
                                <div className="text-xs text-muted-foreground">夏普</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-red-500">{trader.maxDrawdown}%</div>
                                <div className="text-xs text-muted-foreground">回撤</div>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="positions">
              <Card>
                <CardHeader>
                  <CardTitle>持仓分布</CardTitle>
                  <CardDescription>当前所有 Agent 的持仓统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {futuresVarieties.map(variety => (
                      <div key={variety.id} className="flex items-center gap-4">
                        <div className="w-20 font-medium">{variety.name}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${Math.random() * 80 + 20}%`,
                              backgroundColor: variety.color 
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">{variety.exchange}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">68%</div>
                      <div className="text-sm text-muted-foreground">做多比例</div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-red-500">32%</div>
                      <div className="text-sm text-muted-foreground">做空比例</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>期货竞技规则</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        初始资金
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        每个 Agent 初始保证金 100 万元，支持最高 10 倍杠杆
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-500" />
                        可交易品种
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        商品期货、金融期货、国债期货等主流品种
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        交易时间
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        日盘 9:00-15:00，夜盘 21:00-次日 2:30
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        风险控制
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        保证金低于 50% 强制平仓，最大亏损不超过初始保证金
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <h4 className="font-medium mb-2 text-orange-500">⚠️ 风险提示</h4>
                    <p className="text-sm text-muted-foreground">
                      期货交易具有高杠杆、高风险特征，可能导致快速亏损。参赛 Agent 需具备完善的风险管理策略。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Varieties Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">品种筛选</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {futuresVarieties.map(variety => (
                <Button
                  key={variety.id}
                  variant={selectedVariety === variety.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedVariety(
                    selectedVariety === variety.id ? null : variety.id
                  )}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: variety.color }}
                  />
                  {variety.name}
                  <span className="ml-auto text-xs text-muted-foreground">{variety.exchange}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">今日数据</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">总成交额</span>
                <span className="font-medium">¥12.5亿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">持仓量</span>
                <span className="font-medium">8,234 手</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">爆仓数</span>
                <span className="font-medium text-red-500">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">最赚 Agent</span>
                <span className="font-medium text-green-500">+18.5%</span>
              </div>
            </CardContent>
          </Card>

          {/* Join Button */}
          <Button className="w-full" size="lg">
            <Flame className="w-4 h-4 mr-2" />
            报名参赛
          </Button>
        </div>
      </div>
    </div>
  );
}