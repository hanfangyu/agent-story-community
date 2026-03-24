"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  PenTool, Sparkles, Download, RefreshCw, ChevronRight,
  FileText, Clock, Copy, Check, ThumbsUp, Eye,
  Type, MessageSquare, Target, Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// 文案类型
const copywritingTypes = [
  { id: "marketing", name: "营销文案", icon: Target, color: "text-red-500", bgColor: "bg-red-500/10", description: "产品推广、活动宣传" },
  { id: "brand", name: "品牌文案", icon: Zap, color: "text-purple-500", bgColor: "bg-purple-500/10", description: "品牌故事、企业介绍" },
  { id: "social", name: "社媒文案", icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500/10", description: "微博、小红书、抖音" },
  { id: "seo", name: "SEO 文案", icon: Type, color: "text-green-500", bgColor: "bg-green-500/10", description: "搜索引擎优化内容" },
  { id: "email", name: "邮件文案", icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/10", description: "EDM、通知邮件" },
  { id: "ad", name: "广告文案", icon: Sparkles, color: "text-pink-500", bgColor: "bg-pink-500/10", description: "信息流、SEM 广告" }
];

// 模拟生成的文案
const mockGeneratedCopy = {
  title: "智能手表新品上市",
  content: `⌚ 重新定义时间，遇见更高效的自己

忙碌生活中，每一秒都值得被珍视。
全新智能手表，让科技与美学完美融合。

✨ 核心亮点：
• 超长续航 14 天，告别电量焦虑
• 100+ 运动模式，专业数据监测
• 血氧心率实时追踪，守护健康每一天
• 智能语音助手，抬手即可操控

不是所有科技，都懂你的节奏。
这一次，让时间为你所用。

#智能生活 #科技美学 #健康守护`,
  wordCount: 156,
  readability: 92,
  engagement: 88,
  suggestions: [
    "可添加限时优惠信息提升转化",
    "建议在黄金时段发布（早8-9点/晚7-9点）",
    "配合产品图片效果更佳"
  ]
};

// 模拟历史文案
const mockHistory = [
  { id: 1, title: "咖啡品牌宣传", type: "品牌文案", status: "completed", date: "2024-03-20", views: 1234 },
  { id: 2, title: "618 促销活动", type: "营销文案", status: "completed", date: "2024-03-18", views: 5678 },
  { id: 3, title: "APP 新功能介绍", type: "社媒文案", status: "draft", date: "2024-03-15", views: 0 }
];

// 热门模板
const hotTemplates = [
  { id: 1, name: "产品发布", usage: 2345 },
  { id: 2, name: "节日营销", usage: 1890 },
  { id: 3, name: "用户故事", usage: 1567 },
  { id: 4, name: "品牌宣言", usage: 1234 }
];

export default function CopywritingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasResult(true);
      setActiveTab("result");
    }, 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mockGeneratedCopy.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/creative" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          返回创作区
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">文案撰写</h1>
            <p className="text-muted-foreground">AI 辅助创作营销、品牌、社媒文案</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs">生成文案</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">12,345</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-xs">平均阅读</span>
            </div>
            <div className="text-2xl font-bold text-pink-500">3.2K</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs">好评率</span>
            </div>
            <div className="text-2xl font-bold text-green-500">94%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs">今日创作</span>
            </div>
            <div className="text-2xl font-bold text-cyan-500">567</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            创作文案
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!hasResult} className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            生成结果
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            历史记录
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Type Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Types Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>选择文案类型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {copywritingTypes.map(type => (
                      <div
                        key={type.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedType === type.id 
                            ? "border-primary bg-primary/5" 
                            : "border-transparent bg-muted/50 hover:border-muted"
                        }`}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg ${type.bgColor} flex items-center justify-center mb-2`}>
                          <type.icon className={`w-5 h-5 ${type.color}`} />
                        </div>
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Input */}
              <Card>
                <CardHeader>
                  <CardTitle>创作需求</CardTitle>
                  <CardDescription>描述你的文案需求，AI 将为你量身定制</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="例如：为一款智能手表写一篇新品上市的宣传文案，目标用户是 25-35 岁的都市白领，强调科技感和健康功能..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">科技感</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">文艺风</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">幽默风</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">专业严谨</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">亲切温暖</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>创作设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">文案长度</label>
                    <select className="w-full p-2 bg-background border rounded-lg">
                      <option>短文案 (50-100字)</option>
                      <option>中文案 (100-200字)</option>
                      <option>长文案 (200-500字)</option>
                      <option>超长文案 (500字+)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">发布平台</label>
                    <select className="w-full p-2 bg-background border rounded-lg">
                      <option>通用</option>
                      <option>微信公众号</option>
                      <option>小红书</option>
                      <option>微博</option>
                      <option>抖音</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">语气风格</label>
                    <select className="w-full p-2 bg-background border rounded-lg">
                      <option>正式专业</option>
                      <option>轻松活泼</option>
                      <option>文艺优雅</option>
                      <option>简洁直接</option>
                    </select>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        创作中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成文案
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Hot Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">热门模板</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hotTemplates.map(template => (
                    <Button 
                      key={template.id} 
                      variant="outline" 
                      className="w-full justify-between"
                      onClick={handleGenerate}
                    >
                      <span>{template.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {template.usage} 次使用
                      </Badge>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result">
          {hasResult && (
            <div className="space-y-6">
              {/* Generated Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{mockGeneratedCopy.title}</CardTitle>
                      <CardDescription>{mockGeneratedCopy.wordCount} 字</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setActiveTab("create")}>
                        重新生成
                      </Button>
                      <Button onClick={handleCopy}>
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap font-medium leading-relaxed">
                    {mockGeneratedCopy.content}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">文案分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">可读性</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${mockGeneratedCopy.readability}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{mockGeneratedCopy.readability}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">互动性</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full" 
                              style={{ width: `${mockGeneratedCopy.engagement}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{mockGeneratedCopy.engagement}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">优化建议</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mockGeneratedCopy.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>历史文案</CardTitle>
              <CardDescription>查看和管理创作的历史文案</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map(copy => (
                  <div 
                    key={copy.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{copy.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {copy.type} · {copy.date}
                          {copy.views > 0 && ` · ${copy.views} 次查看`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={copy.status === "completed" ? "default" : "secondary"}>
                        {copy.status === "completed" ? "已完成" : "草稿"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
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