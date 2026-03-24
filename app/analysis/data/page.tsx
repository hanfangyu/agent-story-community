"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  PieChart,
  ArrowLeft,
  Sparkles,
  Database,
  FileText,
  Download,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 模拟数据分析结果
const mockAnalysisResult = {
  summary: {
    rows: 1250,
    columns: 8,
    missingValues: 23,
    duplicates: 5,
  },
  columns: [
    { name: "日期", type: "date", unique: 365, missing: 0 },
    { name: "销售额", type: "number", unique: 892, missing: 3 },
    { name: "客户数", type: "number", unique: 456, missing: 2 },
    { name: "产品类别", type: "category", unique: 12, missing: 0 },
    { name: "地区", type: "category", unique: 8, missing: 5 },
    { name: "利润率", type: "number", unique: 723, missing: 8 },
    { name: "退货率", type: "number", unique: 234, missing: 5 },
    { name: "备注", type: "text", unique: 156, missing: 0 },
  ],
  insights: [
    { type: "trend", title: "销售额上升趋势", description: "过去30天销售额增长15.3%，预计下月继续增长", confidence: 92 },
    { type: "anomaly", title: "异常退货率", description: "3月15日退货率异常高达8.5%，建议关注产品质量", confidence: 87 },
    { type: "correlation", title: "强相关发现", description: "客户数与销售额相关系数0.89，建议增加获客投入", confidence: 95 },
    { type: "seasonality", title: "季节性规律", description: "周末销售额平均比工作日高23%，可优化促销策略", confidence: 88 },
  ],
};

// 模拟历史分析记录
const mockHistory = [
  { id: 1, name: "销售数据_2024Q1.csv", date: "2024-03-20", status: "completed", insights: 4 },
  { id: 2, name: "用户行为分析.json", date: "2024-03-18", status: "completed", insights: 7 },
  { id: 3, name: "市场份额数据.xlsx", date: "2024-03-15", status: "completed", insights: 5 },
];

export default function DataAnalysisPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const handleUpload = () => {
    setIsAnalyzing(true);
    // 模拟分析过程
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasResult(true);
      setActiveTab("results");
    }, 2000);
  };

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
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">数据分析</h1>
            <p className="text-muted-foreground">上传数据，让 Agent 自动分析并生成洞察报告</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            上传数据
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!hasResult}>
            <Sparkles className="w-4 h-4" />
            分析结果
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            历史记录
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传数据文件
                </CardTitle>
                <CardDescription>
                  支持 CSV、JSON、Excel 格式，文件大小不超过 50MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={handleUpload}
                >
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">拖拽文件到此处或点击上传</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    支持 .csv, .json, .xlsx, .xls 格式
                  </p>
                  <Button disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        选择文件
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速分析</CardTitle>
                <CardDescription>使用预设模板快速开始</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={handleUpload}>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    销售趋势分析
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={handleUpload}>
                  <span className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-blue-500" />
                    用户画像分析
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={handleUpload}>
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" />
                    数据质量检查
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">分析选项</CardTitle>
                <CardDescription>自定义分析参数</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">自动检测数据类型</span>
                  <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">已启用</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">智能洞察生成</span>
                  <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">已启用</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">异常值检测</span>
                  <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">已启用</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">相关性分析</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">可选</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          {hasResult && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{mockAnalysisResult.summary.rows.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">数据行数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{mockAnalysisResult.summary.columns}</div>
                    <div className="text-sm text-muted-foreground">数据列数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-500">{mockAnalysisResult.summary.missingValues}</div>
                    <div className="text-sm text-muted-foreground">缺失值</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500">{mockAnalysisResult.summary.duplicates}</div>
                    <div className="text-sm text-muted-foreground">重复行</div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Agent 洞察
                  </CardTitle>
                  <CardDescription>基于数据分析自动生成的洞察和建议</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalysisResult.insights.map((insight, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.confidence >= 90 ? "bg-green-500/10 text-green-500" :
                            insight.confidence >= 80 ? "bg-blue-500/10 text-blue-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            置信度 {insight.confidence}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Column Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>列数据分析</CardTitle>
                  <CardDescription>每列数据的详细信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2">列名</th>
                          <th className="text-left p-2">类型</th>
                          <th className="text-left p-2">唯一值</th>
                          <th className="text-left p-2">缺失值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAnalysisResult.columns.map((col, index) => (
                          <tr key={index} className="border-b border-border/50">
                            <td className="p-2 font-medium">{col.name}</td>
                            <td className="p-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                col.type === "number" ? "bg-blue-500/10 text-blue-500" :
                                col.type === "date" ? "bg-green-500/10 text-green-500" :
                                col.type === "category" ? "bg-purple-500/10 text-purple-500" :
                                "bg-gray-500/10 text-gray-500"
                              }`}>
                                {col.type}
                              </span>
                            </td>
                            <td className="p-2">{col.unique}</td>
                            <td className="p-2">
                              {col.missing > 0 ? (
                                <span className="text-orange-500">{col.missing}</span>
                              ) : (
                                <span className="text-green-500">0</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  导出报告
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新分析
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>历史分析记录</CardTitle>
              <CardDescription>查看过去的分析任务和结果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.date} · {item.insights} 条洞察
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        已完成
                      </span>
                      <Button variant="ghost" size="sm">
                        查看
                      </Button>
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