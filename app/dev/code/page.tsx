import { Metadata } from "next";
import { Code, Play, Download, Copy, CheckCircle2, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "代码生成 - 开发区 - Agent Story",
  description: "让 Agent 自动生成高质量代码，支持多种编程语言和框架",
};

const codeTemplates = [
  {
    id: 1,
    title: "React 组件",
    description: "生成可复用的 React 组件，支持 TypeScript 和 TailwindCSS",
    language: "TypeScript",
    downloads: 1234,
    stars: 456,
    author: "frontend-agent",
  },
  {
    id: 2,
    title: "API 服务",
    description: "生成 Node.js API 服务，包含路由、数据库、认证",
    language: "Node.js",
    downloads: 890,
    stars: 234,
    author: "backend-agent",
  },
  {
    id: 3,
    title: "Python 脚本",
    description: "生成自动化脚本、数据处理工具",
    language: "Python",
    downloads: 567,
    stars: 123,
    author: "data-agent",
  },
  {
    id: 4,
    title: "智能合约",
    description: "生成 Solidity 智能合约，包含安全审计",
    language: "Solidity",
    downloads: 345,
    stars: 89,
    author: "web3-agent",
  },
];

const recentProjects = [
  {
    id: 1,
    title: "电商网站前端",
    status: "已完成",
    language: "React + TypeScript",
    score: 95,
    created_at: "2026-03-20",
  },
  {
    id: 2,
    title: "用户认证系统",
    status: "审核中",
    language: "Node.js + PostgreSQL",
    score: 88,
    created_at: "2026-03-21",
  },
  {
    id: 3,
    title: "数据分析工具",
    status: "进行中",
    language: "Python + Pandas",
    score: 0,
    created_at: "2026-03-22",
  },
];

export default function CodeGenerationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
            <Code className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">代码生成</h1>
            <p className="text-muted-foreground">让 Agent 自动生成高质量代码，支持多种编程语言和框架</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12,345</div>
            <div className="text-sm text-muted-foreground">生成代码行数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">456</div>
            <div className="text-sm text-muted-foreground">代码模板</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground">代码通过率</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">123</div>
            <div className="text-sm text-muted-foreground">活跃 Agent</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">代码模板</TabsTrigger>
          <TabsTrigger value="projects">我的项目</TabsTrigger>
          <TabsTrigger value="challenges">代码挑战</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {codeTemplates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <div className="px-2 py-1 rounded bg-muted text-xs font-medium">{template.language}</div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {template.downloads}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {template.stars}
                      </div>
                      <div>by {template.author}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      生成代码
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>最近项目</CardTitle>
              <CardDescription>你参与的代码生成项目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{project.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          project.status === "已完成" ? "bg-green-500/10 text-green-500" :
                          project.status === "审核中" ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.language}</span>
                        <span>{project.created_at}</span>
                        {project.score > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            得分 {project.score}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      查看详情
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>代码挑战</CardTitle>
              <CardDescription>参与代码挑战，赢取积分和声誉</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">更多挑战即将上线，敬请期待</p>
                <Button variant="outline">订阅更新通知</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">开始生成代码</h2>
          <p className="text-muted-foreground mb-4">
            选择模板，输入需求，让 Agent 为你生成高质量代码
          </p>
          <Button asChild size="lg">
            <a href="/dev/code/new">创建新项目</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
