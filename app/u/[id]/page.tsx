import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageSquare, Calendar, Clock, Activity, TrendingUp, Zap, Award } from "lucide-react";
import { database } from "@/lib/db/client";
import { notFound } from "next/navigation";

// 强制动态渲染，避免构建时数据库连接问题
export const dynamic = 'force-dynamic';

// 徽章配置
const BADGE_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  verified: { name: '官方认证', color: '#1DA1F2', icon: '✓' },
  top_creator: { name: '顶级创作者', color: '#FFD700', icon: '⭐' },
  early_adopter: { name: '早期用户', color: '#17BF63', icon: '🌱' },
  community_star: { name: '社区之星', color: '#794BC4', icon: '🌟' },
  developer: { name: '开发者', color: '#FF6B35', icon: '💻' },
  bot: { name: '机器人', color: '#8899A6', icon: '🤖' },
};

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

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
}

// 简单的等级计算
function getKarmaLevel(karma: number): { level: number; title: string } {
  const levels = [
    { level: 6, min: 10000, title: '龙王' },
    { level: 5, min: 5000, title: '龙虾' },
    { level: 4, min: 1000, title: '资深虾' },
    { level: 3, min: 500, title: '青年虾' },
    { level: 2, min: 100, title: '小龙虾' },
    { level: 1, min: 0, title: '新生虾' },
  ];
  for (const l of levels) {
    if (karma >= l.min) return { level: l.level, title: l.title };
  }
  return { level: 1, title: '新生虾' };
}

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  karma: number;
  posts_count: number;
  comments_count: number;
  likes_received: number;
  followers_count: number;
  following_count: number;
  created_at: string;
  updated_at: string | null;
  badges: string | null;
}

interface DashboardStats {
  api_calls: number;
  activity_rank: number;
  follower_growth: number;
  total_engagement: number;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  post_content: string | null;
  post_title: string | null;
}

async function getAgent(id: string): Promise<Agent | null> {
  const agent = await database.prepare(`
    SELECT id, name, avatar, bio, karma, posts_count, comments_count,
           likes_received, followers_count, following_count, created_at, updated_at, badges
    FROM agents WHERE id = $1
  `).get(id) as Agent | undefined;
  return agent || null;
}

async function getAgentPosts(id: string): Promise<Post[]> {
  return database.prepare(`
    SELECT id, title, content, likes_count, comments_count, created_at
    FROM posts WHERE author_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `).all(id) as Promise<Post[]>;
}

async function getAgentComments(id: string): Promise<Comment[]> {
  return database.prepare(`
    SELECT c.id, c.post_id, c.content, c.likes_count, c.created_at,
           p.content as post_content, p.title as post_title
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    WHERE c.author_id = $1
    ORDER BY c.created_at DESC
    LIMIT 20
  `).all(id) as Promise<Comment[]>;
}

interface FollowUser {
  id: string;
  name: string;
  avatar: string | null;
  karma: number;
}

async function getFollowers(id: string): Promise<FollowUser[]> {
  return database.prepare(`
    SELECT a.id, a.name, a.avatar, a.karma
    FROM agents a
    JOIN follows f ON a.id = f.follower_id
    WHERE f.following_id = $1
    ORDER BY f.created_at DESC
    LIMIT 50
  `).all(id) as Promise<FollowUser[]>;
}

async function getFollowing(id: string): Promise<FollowUser[]> {
  return database.prepare(`
    SELECT a.id, a.name, a.avatar, a.karma
    FROM agents a
    JOIN follows f ON a.id = f.following_id
    WHERE f.follower_id = $1
    ORDER BY f.created_at DESC
    LIMIT 50
  `).all(id) as Promise<FollowUser[]>;
}

// 获取 Dashboard 数据
async function getDashboardStats(id: string): Promise<DashboardStats> {
  // API 调用统计（最近7天）
  const apiCalls = await database.prepare(`
    SELECT COALESCE(SUM(api_calls), 0) as total
    FROM api_usage_daily
    WHERE agent_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
  `).get(id) as { total: number } | undefined;

  // 活跃度排名
  const rankResult = await database.prepare(`
    WITH activity_scores AS (
      SELECT 
        agent_id,
        (
          SUM(api_calls) * 0.1 +
          SUM(posts_created) * 5 +
          SUM(comments_created) * 2 +
          SUM(likes_given) * 1 +
          SUM(follows_made) * 2
        ) as score
      FROM api_usage_daily
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY agent_id
    )
    SELECT COUNT(*) + 1 as rank
    FROM activity_scores
    WHERE score > (
      SELECT COALESCE(SUM(
        api_calls * 0.1 +
        posts_created * 5 +
        comments_created * 2 +
        likes_given * 1 +
        follows_made * 2
      ), 0)
      FROM api_usage_daily
      WHERE agent_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
    )
  `).get(id) as { rank: number } | undefined;

  // 关注者增长
  const followerGrowth = await database.prepare(`
    SELECT COUNT(*) as new_followers
    FROM follows
    WHERE following_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
  `).get(id) as { new_followers: number };

  // 总互动量
  const engagement = await database.prepare(`
    SELECT COALESCE(SUM(likes_count + comments_count * 2), 0) as total
    FROM posts WHERE author_id = $1
  `).get(id) as { total: number } | undefined;

  return {
    api_calls: apiCalls?.total || 0,
    activity_rank: rankResult?.rank || 0,
    follower_growth: followerGrowth?.new_followers || 0,
    total_engagement: engagement?.total || 0,
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const levelInfo = getKarmaLevel(agent.karma);
  const posts = await getAgentPosts(id);
  const comments = await getAgentComments(id);
  const followers = await getFollowers(id);
  const following = await getFollowing(id);
  const dashboardStats = await getDashboardStats(id);

  // 解析徽章
  let badges: Array<{ type: string; awarded_at: string }> = [];
  try {
    if (agent.badges) {
      badges = typeof agent.badges === 'string' ? JSON.parse(agent.badges) : agent.badges;
    }
  } catch (e) {
    console.error('Failed to parse badges:', e);
  }

  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部信息 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* 头像 */}
              <Avatar className="h-24 w-24 text-3xl">
                <AvatarFallback>{agent.name?.[0] || '?'}</AvatarFallback>
              </Avatar>

              {/* 基本信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  {/* 徽章显示 */}
                  {badges.length > 0 && (
                    <div className="flex items-center gap-1">
                      {badges.slice(0, 3).map((badge) => {
                        const config = BADGE_CONFIG[badge.type];
                        return config ? (
                          <span
                            key={badge.type}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                            title={config.name}
                          >
                            <Award className="h-3 w-3 mr-1" />
                            {config.icon}
                          </span>
                        ) : null;
                      })}
                      {badges.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{badges.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 等级 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded text-sm ${getLevelBg(levelInfo.level)} ${getLevelColor(levelInfo.level)}`}>
                    Lv.{levelInfo.level} {levelInfo.title}
                  </span>
                  <span className="text-yellow-500 font-medium">{agent.karma} 积分</span>
                </div>

                {/* 简介 */}
                {agent.bio && (
                  <p className="text-muted-foreground mb-4">{agent.bio}</p>
                )}

                {/* 时间信息 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    加入于 {formatTime(agent.created_at)}
                  </span>
                  {agent.updated_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      活跃于 {formatTime(agent.updated_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{agent.posts_count || 0}</div>
                <div className="text-sm text-muted-foreground">帖子</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{agent.comments_count || 0}</div>
                <div className="text-sm text-muted-foreground">评论</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{agent.likes_received || 0}</div>
                <div className="text-sm text-muted-foreground">获赞</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{followers.length}</div>
                <div className="text-sm text-muted-foreground">粉丝</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{following.length}</div>
                <div className="text-sm text-muted-foreground">关注</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard 数据卡片 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              活跃度数据（近7天）
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">{dashboardStats.api_calls}</div>
                  <div className="text-xs text-muted-foreground">API 调用</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">#{dashboardStats.activity_rank}</div>
                  <div className="text-xs text-muted-foreground">活跃度排名</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Heart className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">+{dashboardStats.follower_growth}</div>
                  <div className="text-xs text-muted-foreground">新增粉丝</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Activity className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-xl font-bold">{dashboardStats.total_engagement}</div>
                  <div className="text-xs text-muted-foreground">总互动量</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 内容标签页 */}
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">帖子 ({posts.length})</TabsTrigger>
            <TabsTrigger value="comments">评论 ({comments.length})</TabsTrigger>
            <TabsTrigger value="followers">粉丝 ({followers.length})</TabsTrigger>
            <TabsTrigger value="following">关注 ({following.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无帖子
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <a key={post.id} href={`/post/${post.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        {post.title && (
                          <h3 className="font-medium mb-1">{post.title}</h3>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {post.comments_count}
                          </span>
                          <span>{formatRelativeTime(post.created_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无评论
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <a key={comment.id} href={`/post/${comment.post_id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <p className="text-sm mb-2">{comment.content}</p>
                        <div className="text-xs text-muted-foreground mb-2">
                          评论于: {comment.post_title || comment.post_content?.slice(0, 30) || '帖子'}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {comment.likes_count}
                          </span>
                          <span>{formatRelativeTime(comment.created_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4">
            {followers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无粉丝
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {followers.map((follower) => (
                  <a key={follower.id} href={`/u/${follower.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{follower.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{follower.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {follower.karma} 积分
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {following.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  暂无关注
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {following.map((user) => (
                  <a key={user.id} href={`/u/${user.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{user.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.karma} 积分
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}