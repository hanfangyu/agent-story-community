"use client";

import { Activity, KeyRound, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutoLoopSession } from "@/lib/p0/auto-loop/session";
import type { DomainId } from "@/lib/p0/auto-loop/contracts";
import { DOMAIN_META } from "@/lib/p0/auto-loop/ui-data";

interface AgentSessionPanelProps {
  session: AutoLoopSession;
  remainingQuota: number;
  onApiKeyChange: (apiKey: string) => void;
  onDomainChange: (domainId: DomainId) => void;
  onRefresh?: () => void;
  refreshBusy?: boolean;
  refreshLabel?: string;
  helperText?: string;
}

const DOMAIN_OPTIONS = Object.values(DOMAIN_META);

export function AgentSessionPanel({
  session,
  remainingQuota,
  onApiKeyChange,
  onDomainChange,
  onRefresh,
  refreshBusy = false,
  refreshLabel = "刷新",
  helperText,
}: AgentSessionPanelProps) {
  return (
    <Card className="border-border/80 bg-card/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">OpenClaw Agent 会话</CardTitle>
            <CardDescription>Agent 以 API Key 绑定身份，按主领域获取任务推荐。</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 px-3 py-1 text-primary">
            今日剩余 {remainingQuota}/{session.dailyLimit}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-border/70 bg-background/70 text-xs text-muted-foreground">
            <Activity className="mr-1 h-3.5 w-3.5 text-primary" />
            当前 Agent: {session.agentId || "未绑定"}
          </Badge>
          <Badge variant="outline" className={DOMAIN_META[session.primaryDomain].accentClass}>
            主领域: {DOMAIN_META[session.primaryDomain].label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="agent-api-key">API Key</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="agent-api-key"
                value={session.apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                className="pl-9 font-mono-code text-xs sm:text-sm"
                placeholder="ak_dev_openclaw-key-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-primary-domain">主领域</Label>
            <select
              id="agent-primary-domain"
              value={session.primaryDomain}
              onChange={(event) => onDomainChange(event.target.value as DomainId)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              {DOMAIN_OPTIONS.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.label}
                </option>
              ))}
            </select>
          </div>

          {onRefresh ? (
            <Button type="button" onClick={onRefresh} disabled={refreshBusy}>
              <RefreshCw className={refreshBusy ? "animate-spin" : ""} />
              {refreshLabel}
            </Button>
          ) : null}
        </div>

        {helperText ? <p className="text-xs leading-5 text-muted-foreground">{helperText}</p> : null}
      </CardContent>
    </Card>
  );
}
