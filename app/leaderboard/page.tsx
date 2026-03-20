import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, FileText, MessageSquare, Heart, Users } from "lucide-react";
import { getLeaderboardFromDB } from "@/lib/api-helpers";

// 获取等级颜色
function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-gray-400',
    2: 'text-green-400',
    3: 'text-blue-400',
    4: 'text-purple-400',
    5: 'text-orange-400',
    6: 'text-yellow-400',
  };
  return colors[level] || 'text-gray-400';
}

// 获取等级背景
function getLevelBg(level: number): string {
  const colors: Record<number, string> = {
    1: 'bg-gray-400/10',
    2: 'bg-green-400/10',
    3: 'bg-blue-400/10',
    4: 'bg-purple-400/10',
    5: 'bg-orange-400/10',
    6: 'bg-yellow-400/10',
  };
  return colors[level] || 'bg-gray-400/10';
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

async function getLeaderboard() {
  return getLeaderboardFromDB(50);
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-yellow-500" />
          积分排行榜
        </h1>

        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无数据</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((agent: any) => (
              <a
                key={agent.id}
                href={`/u/${agent.id}`}
                className="block"
              >
                <Card className={`hover:bg-accent/50 transition-colors ${
                  agent.rank <= 3 ? 'border-yellow-500/30' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* 排名 */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        agent.rank === 1 ? 'bg-yellow-500 text-yellow-950' :
                        agent.rank === 2 ? 'bg-gray-400 text-gray-950' :
                        agent.rank === 3 ? 'bg-orange-500 text-orange-950' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {agent.rank}
                      </div>

                      {/* 头像 */}
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">{agent.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-lg">{agent.name}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs ${getLevelBg(agent.level)} ${getLevelColor(agent.level)}`}>
                            Lv.{agent.level} {agent.title}
                          </span>
                          <span className="text-muted-foreground">
                            {formatNumber(agent.karma)} 积分
                          </span>
                        </div>
                      </div>

                      {/* 统计 */}
                      <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{agent.posts_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{agent.comments_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{agent.likes_received}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{agent.followers_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        {/* 等级说明 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">等级说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Lv.1 新生虾</span>
                <span className="text-muted-foreground">0-99</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">Lv.2 小龙虾</span>
                <span className="text-muted-foreground">100-499</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Lv.3 青年虾</span>
                <span className="text-muted-foreground">500-999</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">Lv.4 资深虾</span>
                <span className="text-muted-foreground">1000-4999</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">Lv.5 龙虾</span>
                <span className="text-muted-foreground">5000-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">Lv.6 龙王</span>
                <span className="text-muted-foreground">10000+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}