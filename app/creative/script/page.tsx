"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Film, Sparkles, Download, RefreshCw, ChevronRight,
  BookOpen, Users, Clock, Play, Pause, Save,
  Type, MessageSquare, User, MapPin, Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// 模拟剧本类型
const scriptTypes = [
  { id: "movie", name: "电影剧本", icon: Film, color: "text-red-500", bgColor: "bg-red-500/10" },
  { id: "tv", name: "电视剧剧本", icon: Play, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "short", name: "短视频剧本", icon: Sparkles, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "ad", name: "广告剧本", icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500/10" },
  { id: "game", name: "游戏剧本", icon: User, color: "text-orange-500", bgColor: "bg-orange-500/10" }
];

// 模拟生成的剧本
const mockGeneratedScript = {
  title: "星际迷途",
  genre: "科幻冒险",
  logline: "一位迷失在宇宙边缘的宇航员，必须与一个神秘的外星生命合作才能找到回家的路。",
  characters: [
    { name: "李航", role: "主角", description: "35岁宇航员，性格沉稳，有责任感" },
    { name: "Echo", role: "配角", description: "外星生命体，以全息投影形式存在" },
    { name: "指挥官张", role: "配角", description: "50岁，地面指挥中心负责人" }
  ],
  scenes: [
    { 
      number: 1, 
      location: "太空舱内部", 
      time: "未来", 
      description: "李航在休眠舱中醒来，发现飞船偏离航线，通讯中断。",
      dialogue: [
        { character: "李航", line: "系统，报告当前状态。" },
        { character: "系统", line: "警告：导航系统故障，当前位置未知。" }
      ]
    },
    { 
      number: 2, 
      location: "太空舱观察窗", 
      time: "连续", 
      description: "李航透过观察窗，看到一片陌生的星域，一颗蓝色星球在远处闪烁。",
      dialogue: [
        { character: "李航", line: "这是...哪里？" }
      ]
    }
  ]
};

// 模拟历史剧本
const mockHistory = [
  { id: 1, title: "城市之光", type: "电影剧本", status: "completed", scenes: 45, date: "2024-03-20" },
  { id: 2, title: "恋爱季节", type: "电视剧剧本", status: "draft", scenes: 12, date: "2024-03-18" },
  { id: 3, title: "咖啡的故事", type: "短视频剧本", status: "completed", scenes: 3, date: "2024-03-15" }
];

export default function ScriptWritingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasResult(true);
      setActiveTab("result");
    }, 3000);
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">剧本创作</h1>
            <p className="text-muted-foreground">AI 辅助创作电影、电视剧、短视频剧本</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs">创作剧本</span>
            </div>
            <div className="text-2xl font-bold text-red-500">1,234</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs">活跃作者</span>
            </div>
            <div className="text-2xl font-bold text-pink-500">567</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs">今日创作</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">89</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs">热门类型</span>
            </div>
            <div className="text-2xl font-bold text-cyan-500">科幻</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            创作剧本
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!hasResult} className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            生成结果
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            我的作品
          </TabsTrigger>
        </TabsList>

        {/* Create Tab */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Script Types */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>选择剧本类型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {scriptTypes.map(type => (
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
                        <div className="text-sm font-medium">{type.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Prompt Input */}
              <Card>
                <CardHeader>
                  <CardTitle>故事构思</CardTitle>
                  <CardDescription>描述你的故事想法，AI 将帮你完善成完整剧本</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="例如：一个宇航员在太空迷路后，遇到神秘外星生命，两人合作寻找回家的路..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">科幻冒险</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">爱情喜剧</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">悬疑推理</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">历史剧</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">都市情感</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generation Panel */}
            <Card className="lg:row-span-2">
              <CardHeader>
                <CardTitle>创作设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">剧本长度</label>
                  <select className="w-full p-2 bg-background border rounded-lg">
                    <option>微剧本 (3-5 场景)</option>
                    <option>短片剧本 (10-20 场景)</option>
                    <option>标准剧本 (30-50 场景)</option>
                    <option>长篇剧本 (80+ 场景)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">风格基调</label>
                  <select className="w-full p-2 bg-background border rounded-lg">
                    <option>轻松幽默</option>
                    <option>严肃深沉</option>
                    <option>悬疑紧张</option>
                    <option>温馨治愈</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">主要角色数</label>
                  <select className="w-full p-2 bg-background border rounded-lg">
                    <option>1-2 人</option>
                    <option>3-5 人</option>
                    <option>6-10 人</option>
                    <option>群像剧 (10+ 人)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">是否包含对话</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">是</Button>
                    <Button variant="outline" size="sm" className="flex-1">否</Button>
                  </div>
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
                      开始创作
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      正在分析故事结构...
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      生成角色设定...
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      撰写场景内容...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result">
          {hasResult && (
            <div className="space-y-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{mockGeneratedScript.title}</CardTitle>
                      <CardDescription>
                        {mockGeneratedScript.genre} · {mockGeneratedScript.scenes.length} 场景
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Save className="w-4 h-4 mr-2" />
                        保存草稿
                      </Button>
                      <Button>
                        <Download className="w-4 h-4 mr-2" />
                        导出
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">故事梗概</div>
                    <p>{mockGeneratedScript.logline}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Characters */}
              <Card>
                <CardHeader>
                  <CardTitle>角色设定</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockGeneratedScript.characters.map(char => (
                      <div key={char.name} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{char.name}</span>
                          <Badge variant="outline" className="text-xs">{char.role}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{char.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scenes */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">场景列表</h2>
                {mockGeneratedScript.scenes.map(scene => (
                  <Card key={scene.number}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          场景 {scene.number}: {scene.location}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {scene.time}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{scene.description}</p>
                      
                      {scene.dialogue && scene.dialogue.length > 0 && (
                        <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                          {scene.dialogue.map((d, i) => (
                            <div key={i} className="text-sm">
                              <span className="font-medium text-primary">{d.character}:</span>
                              <span className="ml-2">"{d.line}"</span>
                            </div>
                          ))}
                        </div>
                      )}
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
              <CardTitle>我的剧本</CardTitle>
              <CardDescription>管理创作的历史剧本</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map(script => (
                  <div 
                    key={script.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <Film className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{script.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {script.type} · {script.scenes} 场景 · {script.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={script.status === "completed" ? "default" : "secondary"}>
                        {script.status === "completed" ? "已完成" : "草稿"}
                      </Badge>
                      <Button variant="ghost" size="sm">编辑</Button>
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