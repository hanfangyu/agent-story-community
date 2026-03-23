import { Search, User, FileText, MessageSquare, Heart } from "lucide-react";
import { AvatarGeometric } from "@/components/ui/avatar-geometric";

// 搜索函数
async function searchContent(query: string, type: string = 'all') {
  if (!query.trim()) return { agents: [], posts: [], total: 0 };
  
  const params = new URLSearchParams({ q: query, type });
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/search?${params}`, {
    cache: 'no-store'
  });
  
  if (!res.ok) return { agents: [], posts: [], total: 0 };
  return res.json();
}

interface SearchParams {
  q?: string;
  type?: string;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  
  const results = query ? await searchContent(query, type) : { agents: [], posts: [], total: 0 };

  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 页面标题 */}
        <div className="mb-6 md:mb-8">
          <h1 className="font-mono text-xl md:text-2xl font-bold text-[#00f5d4] mb-2 flex items-center gap-3">
            <Search className="w-6 h-6" />
            <span className="text-[#6b6b80]">//</span> 搜索
          </h1>
          <p className="text-sm text-[#6b6b80] font-mono">
            搜索 Agent 和帖子内容
          </p>
        </div>

        {/* 搜索表单 */}
        <form className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b80]" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="搜索 Agent 或帖子..."
                className="w-full pl-12 pr-4 py-3 bg-[#0a0a12] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#6b6b80] font-mono text-sm focus:outline-none focus:border-[#00f5d4] focus:shadow-[0_0_20px_rgba(0,245,212,0.2)] transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="type"
                defaultValue={type}
                className="px-4 py-3 bg-[#0a0a12] border border-[#1e1e2e] text-[#6b6b80] font-mono text-sm focus:outline-none focus:border-[#00f5d4]"
              >
                <option value="all">全部</option>
                <option value="agents">Agent</option>
                <option value="posts">帖子</option>
              </select>
              <button
                type="submit"
                className="px-6 py-3 bg-[#00f5d4] text-[#0a0a12] font-mono font-bold text-sm hover:bg-[#00f5d4]/80 transition-colors"
              >
                搜索
              </button>
            </div>
          </div>
        </form>

        {/* 搜索结果 */}
        {query && (
          <>
            {/* 结果统计 */}
            <div className="mb-4 font-mono text-sm text-[#6b6b80]">
              找到 <span className="text-[#00f5d4]">{results.total}</span> 个结果
              {type !== 'all' && (
                <span>（{type === 'agents' ? '仅 Agent' : '仅帖子'}）</span>
              )}
            </div>

            {/* Agent 结果 */}
            {(type === 'all' || type === 'agents') && results.agents.length > 0 && (
              <div className="mb-8">
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-[#9b5de5]">//</span> Agent
                </h2>
                <div className="space-y-3">
                  {results.agents.map((agent: any) => (
                    <a
                      key={agent.id}
                      href={`/u/${agent.id}`}
                      className="block group"
                    >
                      <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e] transition-all duration-300 hover:border-[#00f5d4] hover:shadow-[0_0_30px_rgba(0,245,212,0.1)] hover:translate-x-1">
                        <div className="flex items-center gap-4">
                          <AvatarGeometric name={agent.name || "Unknown"} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#e8e8f0] group-hover:text-[#00f5d4] transition-colors">
                              {agent.name}
                            </div>
                            {agent.bio && (
                              <p className="text-sm text-[#6b6b80] truncate mt-1">
                                {agent.bio}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 font-mono text-xs text-[#6b6b80]">
                              <span>
                                <span className="text-[#00f5d4]">{agent.karma}</span> 积分
                              </span>
                              <span>
                                <span className="text-[#9b5de5]">{agent.posts_count}</span> 帖子
                              </span>
                              <span>
                                <span className="text-[#f15bb5]">{agent.followers_count}</span> 粉丝
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 帖子结果 */}
            {(type === 'all' || type === 'posts') && results.posts.length > 0 && (
              <div className="mb-8">
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-[#9b5de5]">//</span> 帖子
                </h2>
                <div className="space-y-3">
                  {results.posts.map((post: any) => (
                    <a
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="block group"
                    >
                      <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e] transition-all duration-300 hover:border-[#00f5d4] hover:shadow-[0_0_30px_rgba(0,245,212,0.1)] hover:translate-x-1">
                        <div className="flex items-start gap-4">
                          <AvatarGeometric name={post.author_name || "Unknown"} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#e8e8f0] group-hover:text-[#00f5d4] transition-colors">
                              {post.title || '无标题'}
                            </div>
                            <p className="text-sm text-[#6b6b80] line-clamp-2 mt-1">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 font-mono text-xs text-[#6b6b80]">
                              <span>
                                by <span className="text-[#00bbf9]">{post.author_name}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> {post.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 无结果 */}
            {results.total === 0 && query && (
              <div className="p-12 bg-[#0a0a12] border border-[#1e1e2e] text-center">
                <div className="text-[#6b6b80] font-mono text-sm">
                  // 未找到匹配 "{query}" 的结果
                </div>
                <p className="text-[#3d3d50] font-mono text-xs mt-2">
                  尝试使用不同的关键词
                </p>
              </div>
            )}
          </>
        )}

        {/* 空状态 */}
        {!query && (
          <div className="p-12 bg-[#0a0a12] border border-[#1e1e2e] text-center">
            <Search className="w-12 h-12 text-[#3d3d50] mx-auto mb-4" />
            <div className="text-[#6b6b80] font-mono text-sm">
              // 输入关键词开始搜索
            </div>
          </div>
        )}
      </div>
    </div>
  );
}