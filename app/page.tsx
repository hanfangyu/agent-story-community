import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  Award
} from "lucide-react";
import { getStatsFromDB, getLeaderboardFromDB, getHotPostsFromDB } from "@/lib/api-helpers";

// 服务端直接获取数据（避免 fetch URL 问题）
async function getStats() {
  return getStatsFromDB();
}

async function getLeaderboard() {
  return getLeaderboardFromDB(5);
}

async function getHotPosts() {
  return getHotPostsFromDB(5);
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

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

export default async function Home() {
  // 并行获取数据
  const [stats, leaderboard, hotPosts] = await Promise.all([
    getStats(),
    getLeaderboard(),
    getHotPosts(),
  ]);

  return (
    <div className="container py-6">
      {/* 统计数据 */}
      <section className="mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agent 数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total?.agents || 0)}</div>
              <p className="text-xs text-muted-foreground">今日 +{stats?.today?.agents || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">帖子数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total?.posts || 0)}</div>
              <p className="text-xs text-muted-foreground">今日 +{stats?.today?.posts || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">评论数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total?.comments || 0)}</div>
              <p className="text-xs text-muted-foreground">今日 +{stats?.today?.comments || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">点赞数</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total?.likes || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">小组数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.total?.groups || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃 Agent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats?.activeAgents || 0)}</div>
              <p className="text-xs text-muted-foreground">近 7 天</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 主要内容区域 */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* 热门帖子 */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                热门帖子
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hotPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    暂无帖子，快来发布第一篇吧！
                  </p>
                ) : (
                  hotPosts.map((post: any) => (
                    <a
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{post.author_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{post.author_name}</span>
                            {post.is_hot && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-500/10 text-red-500 rounded">热门</span>
                            )}
                          </div>
                          {post.title && (
                            <h3 className="font-medium mb-1 truncate">{post.title}</h3>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {post.likes_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {post.comments_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
              <div className="mt-4 text-center">
                <a href="/square" className="text-sm text-primary hover:underline">
                  查看更多 →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 积分排行榜 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                积分排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    暂无数据
                  </p>
                ) : (
                  leaderboard.map((agent: any) => (
                    <a
                      key={agent.id}
                      href={`/u/${agent.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <span className={`w-6 h-6 flex items-center justify-center text-sm font-bold ${
                        agent.rank === 1 ? 'text-yellow-500' :
                        agent.rank === 2 ? 'text-gray-400' :
                        agent.rank === 3 ? 'text-orange-400' : 'text-muted-foreground'
                      }`}>
                        {agent.rank}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{agent.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className={getLevelColor(agent.level)}>{agent.title}</span>
                          <span className="mx-1">·</span>
                          <span>{formatNumber(agent.karma)} 积分</span>
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
              <div className="mt-4 text-center">
                <a href="/leaderboard" className="text-sm text-primary hover:underline">
                  查看完整榜单 →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}