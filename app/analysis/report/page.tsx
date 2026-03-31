"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Upload, 
  ArrowLeft, 
  Sparkles, 
  Download, 
  RefreshCw,
  ChevronRight,
  Search,
  Calendar,
  TrendingUp,
  Users,
  Building2,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// 模拟研报类型
const reportTypes = [
  { 
    id: "industry", 
    name: "行业研究报告", 
    icon: Building2, 
    color: "text-blue-500", 
    bgColor: "bg-blue-500/10",
    description: "深度分析行业发展趋势、竞争格局和投资机会",
    count: 234
  },
  { 
    id: "market", 
    name: "市场分析报告", 
    icon: PieChart, 
    color: "text-purple-500", 
    bgColor: "bg-purple-500/10",
    description: "市场规模、增长预测、细分市场分析",
    count: 189
  },
  { 
    id: "company", 
    name: "公司研究报告", 
    icon: Building2, 
    color: "text-green-500", 
    bgColor: "bg-green-500/10",
    description: "公司财务分析、业务模式和竞争优势评估",
    count: 156
  },
  { 
    id: "investment", 
    name: "投资策略报告", 
    icon: TrendingUp, 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10",
    description: "投资建议、风险评估和资产配置策略",
    count: 98
  },
  { 
    id: "user", 
    name: "用户行为报告", 
    icon: Users, 
    color: "text-cyan-500", 
    bgColor: "bg-cyan-500/10",
    description: "用户画像、行为分析和转化漏斗研究",
    count: 67
  },
];

// 模拟研报生成结果
const mockReportResult = {
  title: "2024年新能源汽车行业深度研究报告",
  summary: "本报告分析了新能源汽车行业的发展现状、竞争格局和未来趋势。",
  sections: [
    {
      title: "行业概述",
      content: "新能源汽车行业正处于快速发展阶段，2023年全球销量突破1400万辆，同比增长35%...",
      status: "completed"
    },
    {
      title: "市场分析",
      content: "中国是全球最大的新能源汽车市场，2023年销量占全球60%以上...",
      status: "completed"
    },
    {
      title: "竞争格局",
      content: "比亚迪、特斯拉和吉利占据市场主导地位，CR3达到45%...",
      status: "completed"
    },
    {
      title: "投资建议",
      content: "推荐关注产业链上游锂电池材料和下游充电桩运营企业...",
      status: "completed"
    }
  ],
  keywords: ["新能源汽车", "锂电池", "比亚迪", "特斯拉", "充电桩", "产业链"],
  pages: 45,
  createdAt: "2024-03-20"
};

// 模拟历史研报
const mockHistory = [
  { id: 1, title: "半导体行业深度报告", type: "industry", status: "completed", date: "2024-03-20", pages: 56 },
  { id: 2, title: "智能手机市场分析", type: "market", status: "completed", date: "2024-03-18", pages: 34 },
  { id: 3, title: "比亚迪投资价值分析", type: "company", status: "completed", date: "2024-03-15", pages: 42 },
  { id: 4, title: "2024 Q1投资策略", type: "investment", status: "processing", date: "2024-03-14", pages: 28 },
];

export default function ReportGenerationPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasResult(true);
      setActiveTab("result");
    }, 3000);
  };

  const filteredReports = reportTypes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/analysis" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回分析区
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">研报生成</h1>
            <p className="text-muted-foreground">输入主题，让 Agent 自动生成专业研究报告</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            创建研报
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!hasResult} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            生成结果
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            历史研报
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Types */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="搜索研报类型..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedType === type.id ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center shrink-0`}>
                          <type.icon className={`w-6 h-6 ${type.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{type.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {type.count} 篇
                            </Badge>
                            {selectedType === type.id && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Generation Form */}
            <Card className="lg:row-span-2">
              <CardHeader>
                <CardTitle>研报主题</CardTitle>
                <CardDescription>描述您想要生成的研报主题</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  placeholder="例如：分析2024年新能源汽车行业发展趋势和投资机会"
                  className="w-full h-40 p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">研报深度</label>
                  <select className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option>简报 (5-10页)</option>
                    <option>标准报告 (20-30页)</option>
                    <option>深度报告 (40-60页)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">参考数据源</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked /> 行业公开数据
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked /> 市场调研报告
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" /> 公司财报数据
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" /> 第三方数据库
                    </label>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成研报
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      正在生成大纲...
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      正在收集数据...
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在撰写内容...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速模板</CardTitle>
                <CardDescription>使用预设模板快速创建</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between" onClick={handleGenerate}>
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    年度行业总结
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={handleGenerate}>
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    竞争对手分析
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={handleGenerate}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    投资风险评估
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result">
          {hasResult && (
            <div className="space-y-6">
              {/* Report Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{mockReportResult.title}</CardTitle>
                      <CardDescription>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {mockReportResult.createdAt} · {mockReportResult.pages} 页
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        下载 PDF
                      </Button>
                      <Button>
                        <FileText className="w-4 h-4 mr-2" />
                        查看详情
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {mockReportResult.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>执行摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{mockReportResult.summary}</p>
                </CardContent>
              </Card>

              {/* Sections */}
              <div className="space-y-4">
                {mockReportResult.sections.map((section, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <Badge variant="outline" className="text-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        已完成
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{section.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>历史研报</CardTitle>
              <CardDescription>查看和管理过去生成的研报</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map((report) => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.date} · {report.pages} 页
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={report.status === "completed" ? "outline" : "secondary"}>
                        {report.status === "completed" ? "已完成" : "生成中"}
                      </Badge>
                      {report.status === "completed" && (
                        <Button variant="ghost" size="sm">
                          查看
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}