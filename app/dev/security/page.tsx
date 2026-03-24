import { Metadata } from "next";
import Link from "next/link";
import { Shield, AlertTriangle, CheckCircle, Bug, Lock, FileSearch, Zap, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "安全审计 - 开发区 - Agent Story",
  description: "Agent 自动化代码安全审计、漏洞扫描和安全报告生成",
};

const securityScans = [
  {
    id: 1,
    name: "SQL 注入检测",
    description: "检测 SQL 注入漏洞，防止数据库被攻击",
    icon: Bug,
    severity: "high",
    lastScan: "2 小时前",
    issues: 3,
  },
  {
    id: 2,
    name: "XSS 漏洞扫描",
    description: "检测跨站脚本攻击漏洞",
    icon: Eye,
    severity: "high",
    lastScan: "1 天前",
    issues: 1,
  },
  {
    id: 3,
    name: "认证安全检测",
    description: "检测认证机制的安全性",
    icon: Lock,
    severity: "medium",
    lastScan: "3 天前",
    issues: 0,
  },
  {
    id: 4,
    name: "敏感数据泄露",
    description: "检测敏感信息是否被意外暴露",
    icon: FileSearch,
    severity: "high",
    lastScan: "5 小时前",
    issues: 2,
  },
];

const recentReports = [
  {
    id: 1,
    project: "agent-story-api",
    date: "2026-03-24",
    score: 85,
    critical: 0,
    high: 2,
    medium: 5,
    low: 12,
  },
  {
    id: 2,
    project: "pixelpal-threejs",
    date: "2026-03-23",
    score: 92,
    critical: 0,
    high: 0,
    medium: 3,
    low: 8,
  },
  {
    id: 3,
    project: "openclaw-gateway",
    date: "2026-03-22",
    score: 78,
    critical: 1,
    high: 3,
    medium: 7,
    low: 15,
  },
];

const securityTemplates = [
  {
    id: 1,
    title: "OWASP Top 10 检测",
    description: "基于 OWASP Top 10 的全面安全检测",
    scans: 10,
    time: "约 15 分钟",
  },
  {
    id: 2,
    title: "API 安全审计",
    description: "专门针对 REST API 的安全审计",
    scans: 6,
    time: "约 10 分钟",
  },
  {
    id: 3,
    title: "前端安全检查",
    description: "检测前端代码中的安全隐患",
    scans: 5,
    time: "约 8 分钟",
  },
];

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  return "text-red-500";
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">高危</Badge>;
    case "medium":
      return <Badge variant="secondary">中危</Badge>;
    case "low":
      return <Badge variant="outline">低危</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
}

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">安全审计</h1>
            <p className="text-muted-foreground">Agent 自动化代码安全审计、漏洞扫描和安全报告生成</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="text-2xl font-bold">156</div>
            </div>
            <div className="text-sm text-muted-foreground">安全扫描</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div className="text-2xl font-bold">23</div>
            </div>
            <div className="text-sm text-muted-foreground">待处理问题</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <div className="text-2xl font-bold">89%</div>
            </div>
            <div className="text-sm text-muted-foreground">平均安全分</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div className="text-2xl font-bold">45</div>
            </div>
            <div className="text-sm text-muted-foreground">活跃 Agent</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scans" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="scans">安全扫描</TabsTrigger>
          <TabsTrigger value="reports">审计报告</TabsTrigger>
          <TabsTrigger value="templates">审计模板</TabsTrigger>
        </TabsList>

        <TabsContent value="scans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityScans.map((scan) => (
              <Card key={scan.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <scan.icon className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{scan.name}</CardTitle>
                        <CardDescription className="text-sm">{scan.description}</CardDescription>
                      </div>
                    </div>
                    {getSeverityBadge(scan.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>上次扫描: {scan.lastScan}</span>
                      {scan.issues > 0 && (
                        <span className="text-red-500 font-medium">{scan.issues} 个问题</span>
                      )}
                    </div>
                    <Button size="sm">开始扫描</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>最近审计报告</CardTitle>
              <CardDescription>查看历史安全审计报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                        {report.score}
                      </div>
                      <div>
                        <div className="font-medium">{report.project}</div>
                        <div className="text-sm text-muted-foreground">{report.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {report.critical > 0 && (
                          <Badge variant="destructive">{report.critical} 严重</Badge>
                        )}
                        {report.high > 0 && (
                          <Badge className="bg-red-500">{report.high} 高危</Badge>
                        )}
                        {report.medium > 0 && (
                          <Badge className="bg-yellow-500">{report.medium} 中危</Badge>
                        )}
                        {report.low > 0 && (
                          <Badge variant="outline">{report.low} 低危</Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline">查看详情</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {securityTemplates.map((template) => (
              <Card key={template.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{template.scans} 项扫描</span>
                    <span>{template.time}</span>
                  </div>
                  <Button className="w-full">使用模板</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">快速扫描</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  一键执行所有安全扫描，快速获取安全状态概览
                </p>
                <Button size="sm">立即扫描</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">安全修复建议</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  让 Agent 自动生成修复建议和代码补丁
                </p>
                <Button size="sm">获取建议</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-red-500/10 to-purple-500/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">开始安全审计</h2>
          <p className="text-muted-foreground mb-4">
            选择扫描类型或使用模板，让 Agent 为你全面检测代码安全
          </p>
          <Button asChild size="lg">
            <Link href="/dev/security/new">创建新审计</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}