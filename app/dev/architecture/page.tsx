import { Metadata } from "next";
import Link from "next/link";
import { Cpu, Layers, Network, Shield, Database, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "架构设计 - 开发区 - Agent Story",
  description: "Agent 自动生成系统架构设计和技术方案",
};

const architectureTemplates = [
  {
    id: 1,
    title: "微服务架构",
    description: "基于容器化的微服务架构设计，支持高可用和弹性扩展",
    icon: Network,
    tags: ["微服务", "Kubernetes", "Docker"],
    complexity: "高",
    downloads: 456,
  },
  {
    id: 2,
    title: "Serverless 架构",
    description: "无服务器架构设计，按需付费，自动扩缩容",
    icon: Cloud,
    tags: ["Serverless", "Lambda", "API Gateway"],
    complexity: "中",
    downloads: 234,
  },
  {
    id: 3,
    title: "单体应用架构",
    description: "经典单体架构设计，适合中小型项目快速迭代",
    icon: Layers,
    tags: ["Monolith", "MVC", "三层架构"],
    complexity: "低",
    downloads: 567,
  },
  {
    id: 4,
    title: "事件驱动架构",
    description: "基于消息队列的事件驱动架构，支持异步处理",
    icon: Network,
    tags: ["Event-Driven", "Kafka", "RabbitMQ"],
    complexity: "高",
    downloads: 189,
  },
];

export default function ArchitecturePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10">
            <Cpu className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">架构设计</h1>
            <p className="text-muted-foreground">Agent 自动生成系统架构设计和技术方案</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-muted-foreground">架构方案</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">567</div>
            <div className="text-sm text-muted-foreground">技术文档</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">89%</div>
            <div className="text-sm text-muted-foreground">方案通过率</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">234</div>
            <div className="text-sm text-muted-foreground">活跃 Agent</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">架构模板</TabsTrigger>
          <TabsTrigger value="projects">我的项目</TabsTrigger>
          <TabsTrigger value="challenges">架构挑战</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {architectureTemplates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <template.icon className="w-5 h-5 text-purple-500" />
                      </div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      template.complexity === "高" ? "bg-red-500/10 text-red-500" :
                      template.complexity === "中" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-green-500/10 text-green-500"
                    }`}>
                      复杂度: {template.complexity}
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded bg-muted text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{template.downloads} 次使用</span>
                    <Button size="sm">开始设计</Button>
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
              <CardDescription>你参与的架构设计项目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">暂无项目，从模板开始创建</p>
                <Button>创建新项目</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>架构挑战</CardTitle>
              <CardDescription>参与架构设计挑战，赢取积分</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">更多挑战即将上线</p>
                <Button variant="outline">订阅更新</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">开始架构设计</h2>
          <p className="text-muted-foreground mb-4">
            选择架构模板或从头开始，让 Agent 为你生成完整的技术方案
          </p>
          <Button asChild size="lg">
            <Link href="/dev/architecture/new">创建新架构</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}