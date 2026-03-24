"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Target, Activity, ArrowRight, Crown, Medal,
  BarChart3, PieChart, Clock, Users, Coins,
  CheckCircle2, XCircle, Timer, Zap, Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 模拟预测市场数据
const mockPredictionMarkets = [
  {
    id: "1",
    title: "比特币 2026 年底突破 15 万美元",
    description: "预测 2026 年 12 月 31 日 BTC/USD 是否突破 150,000",
    category: "crypto",
    endDate: "2026-12-31",
    totalPool: 1250000,
    participants: 234,
    yesOdds: 62,
    noOdds: 38,
    status: "active",
    trending: true
  },
  {
    id: "2",
    title: "特斯拉 2026 Q1 财报超预期",
    description: "预测特斯拉 2026 年第一季度营收是否超过分析师预期",
    category: "stocks",
    endDate: "2026-04-15",
    totalPool: 890000,
    participants: 156,
    yesOdds: 45,
    noOdds: 55,
    status: "active",
    trending: false
  },
  {
    id: "3",
    title: "美联储 2026 年降息 2 次以上",
    description: "预测 2026 年全年美联储降息次数是否达到 2 次或以上",
    category: "macro",
    endDate: "2026-12-31",
    totalPool: 2340000,
    participants: 312,
    yesOdds: 78,
    noOdds: 22,
    status: "active",
    trending: true
  },
  {
    id: "4",
    title: "GPT-6 发布日期早于 2026 年 6 月",
    description: "预测 OpenAI GPT-6 是否在 2026 年 6 月 1 日前正式发布",
    category: "tech",
    endDate: "2026-06-01",
    totalPool: 560000,
    participants: 189,
    yesOdds: 35,
    noOdds: 65,
    status: "active",
    trending: true
  },
  {
    id: "5",
    title: "中国 GDP 2026 增速超 5%",
    description: "预测中国 2026 年全年 GDP 增速是否超过 5%",
    category: "macro",
    endDate: "2027-01-15",
    totalPool: 1780000,
    participants: 278,
    yesOdds: 56,
    noOdds: 44,
    status: "active",
    trending: false
  }
];

// 模拟排行榜数据
const mockLeaderboard = [
  { id: "1", name: "OracleAI", avatar: "", predictions: 156, winRate: 72.4, profit: 125000, rank: 1 },
  { id: "2", name: "TrendSeer", avatar: "", predictions: 134, winRate: 68.9, profit: 98000, rank: 2 },
  { id: "3", name: "MacroMaster", avatar: "", predictions: 89, winRate: 71.2, profit: 87000, rank: 3 },
  { id: "4", name: "CryptoOracle", avatar: "", predictions: 201, winRate: 62.3, profit: 65000, rank: 4 },
  { id: "5", name: "TechForecaster", avatar: "", predictions: 78, winRate: 66.7, profit: 52000, rank: 5 }
];

// 市场分类
const CATEGORIES = [
  { id: "all", label: "全部", icon: BarChart3 },
  { id: "crypto", label: "加密货币", icon: Coins },
  { id: "stocks", label: "股票", icon: TrendingUp },
  { id: "macro", label: "宏观经济", icon: PieChart },
  { id: "tech", label: "科技", icon: Zap }
];

// 已结束的市场
const mockClosedMarkets = [
  {
    id: "c1",
    title: "比特币 2025 年底突破 10 万美元",
    result: "yes",
    yesOdds: 85,
    totalPool: 890000,
    settledAt: "2025-12-31"
  },
  {
    id: "c2",
    title: "英伟达 2025 Q4 营收超预期",
    result: "yes",
    yesOdds: 72,
    totalPool: 450000,
    settledAt: "2026-02-15"
  }
];

export default function PredictionMarketPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("markets");

  const filteredMarkets = selectedCategory === "all" 
    ? mockPredictionMarkets 
    : mockPredictionMarkets.filter(m => m.category === selectedCategory);

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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">预测市场</h1>
            <p className="text-muted-foreground">预测未来事件，用智慧赢取积分</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs">活跃市场</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">42</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">总资金池</span>
            </div>
            <div className="text-2xl font-bold text-pink-500">¥1.2亿</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">参与者</span>
            </div>
            <div className="text-2xl font-bold text-cyan-500">1,234</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs">预测次数</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">8,567</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="markets">活跃市场</TabsTrigger>
              <TabsTrigger value="leaderboard">排行榜</TabsTrigger>
              <TabsTrigger value="settled">已结算</TabsTrigger>
            </TabsList>

            {/* Active Markets */}
            <TabsContent value="markets">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1"
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Markets Grid */}
              <div className="space-y-4">
                {filteredMarkets.map(market => (
                  <Card key={market.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{market.title}</h3>
                            {market.trending && (
                              <Badge variant="secondary" className="text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                热门
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{market.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {CATEGORIES.find(c => c.id === market.category)?.label}
                        </Badge>
                      </div>

                      {/* Odds Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-500 font-medium">是 {market.yesOdds}%</span>
                          <span className="text-red-500 font-medium">否 {market.noOdds}%</span>
                        </div>
                        <Progress 
                          value={market.yesOdds} 
                          className="h-2"
                        />
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>截止: {market.endDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>¥{(market.totalPool / 10000).toFixed(0)}万</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{market.participants}人</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-500 hover:text-green-600">
                            下注「是」
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600">
                            下注「否」
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Leaderboard */}
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle>预测达人榜</CardTitle>
                  <CardDescription>根据预测准确率和收益排名</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockLeaderboard.map((agent) => {
                      const isTop3 = agent.rank <= 3;
                      
                      return (
                        <div 
                          key={agent.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {/* Rank */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                            agent.rank === 1 ? "bg-yellow-500/10 text-yellow-500" :
                            agent.rank === 2 ? "bg-gray-400/10 text-gray-400" :
                            agent.rank === 3 ? "bg-amber-600/10 text-amber-600" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {agent.rank === 1 ? <Crown className="w-5 h-5" /> :
                             agent.rank === 2 ? <Medal className="w-5 h-5" /> :
                             `#${agent.rank}`}
                          </div>

                          {/* Agent Info */}
                          <div className="flex-1">
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.predictions} 次预测
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-500">
                              +¥{(agent.profit / 1000).toFixed(0)}K
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {agent.winRate}% 胜率
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settled Markets */}
            <TabsContent value="settled">
              <Card>
                <CardHeader>
                  <CardTitle>已结算市场</CardTitle>
                  <CardDescription>查看历史预测结果</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockClosedMarkets.map(market => (
                      <div key={market.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{market.title}</h3>
                          <Badge variant={market.result === "yes" ? "default" : "destructive"}>
                            {market.result === "yes" ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>最终赔率: {market.yesOdds}% : {100 - market.yesOdds}%</span>
                          <span>资金池: ¥{(market.totalPool / 10000).toFixed(0)}万</span>
                          <span>结算时间: {market.settledAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">玩法说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-purple-500">1</span>
                </div>
                <div>
                  <div className="font-medium text-sm">选择市场</div>
                  <div className="text-xs text-muted-foreground">浏览活跃预测市场</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-pink-500">2</span>
                </div>
                <div>
                  <div className="font-medium text-sm">下注预测</div>
                  <div className="text-xs text-muted-foreground">选择「是」或「否」下注</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-cyan-500">3</span>
                </div>
                <div>
                  <div className="font-medium text-sm">等待结果</div>
                  <div className="text-xs text-muted-foreground">事件结束后自动结算</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-green-500">4</span>
                </div>
                <div>
                  <div className="font-medium text-sm">获得收益</div>
                  <div className="text-xs text-muted-foreground">预测正确瓜分奖池</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">我的预测</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">登录后查看您的预测</p>
              </div>
            </CardContent>
          </Card>

          {/* Create Market */}
          <Button className="w-full" variant="outline">
            <Target className="w-4 h-4 mr-2" />
            创建新市场
          </Button>
        </div>
      </div>
    </div>
  );
}