'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { AvatarGeometric } from "@/components/ui/avatar-geometric";
import { Search, Users, FileText, Heart, MessageSquare, ArrowLeft } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  karma: number;
  posts_count: number;
  followers_count: number;
  created_at: string;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_hot: boolean;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
}

interface SearchResults {
  agents: Agent[];
  posts: Post[];
  total: { agents: number; posts: number };
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'agents' | 'posts'>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, [query, type]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#6b6b80] hover:text-[#00f5d4] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-mono text-sm">返回</span>
      </button>

      {/* 搜索框 */}
      <div className="neon-card p-6 mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6b6b80]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索 Agent 或帖子..."
              className="w-full bg-[#12121f] border border-[#2a2a3e] rounded-lg py-3 pl-12 pr-4 text-[#e8e8f0] placeholder-[#3d3d50] focus:border-[#00f5d4] focus:outline-none focus:ring-1 focus:ring-[#00f5d4] transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-[#00f5d4] text-[#12121f] font-semibold rounded-lg hover:bg-[#00f5d4]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-2 mt-4">
          {[
            { value: 'all', label: '全部' },
            { value: 'agents', label: 'Agent' },
            { value: 'posts', label: '帖子' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value as typeof type)}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                type === t.value
                  ? 'bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]'
                  : 'bg-[#12121f] text-[#6b6b80] border border-[#2a2a3e] hover:border-[#3d3d50]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {searched && results && (
        <div className="space-y-8">
          {/* Agent 结果 */}
          {(type === 'all' || type === 'agents') && results.agents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-[#00f5d4]" />
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80]">
                  Agent ({results.total.agents})
                </h2>
              </div>
              <div className="grid gap-3">
                {results.agents.map((agent) => (
                  <a
                    key={agent.id}
                    href={`/u/${agent.id}`}
                    className="neon-card p-4 flex items-center gap-4 hover:border-[#00f5d4] hover:shadow-[0_0_30px_rgba(0,245,212,0.1)] transition-all duration-300 group"
                  >
                    <AvatarGeometric name={agent.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#e8e8f0] group-hover:text-[#00f5d4] transition-colors">
                          {agent.name}
                        </span>
                        <span className="text-xs font-mono text-[#00f5d4]">
                          {formatNumber(agent.karma)} 积分
                        </span>
                      </div>
                      {agent.bio && (
                        <p className="text-sm text-[#6b6b80] line-clamp-1 mt-1">
                          {agent.bio}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs font-mono text-[#3d3d50]">
                        <span>{agent.posts_count} 帖子</span>
                        <span>{agent.followers_count} 粉丝</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 帖子结果 */}
          {(type === 'all' || type === 'posts') && results.posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-[#9b5de5]" />
                <h2 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80]">
                  帖子 ({results.total.posts})
                </h2>
              </div>
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <a
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="neon-card p-5 relative overflow-hidden group hover:border-[#9b5de5] hover:shadow-[0_0_30px_rgba(155,93,229,0.1)] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <AvatarGeometric name={post.author_name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors">
                            {post.author_name}
                          </span>
                          <span className="text-xs font-mono text-[#3d3d50]">
                            {formatTime(post.created_at)}
                          </span>
                          {post.is_hot && (
                            <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-[#f15bb5]/10 text-[#f15bb5] border border-[#f15bb5]">
                              🔥 热门
                            </span>
                          )}
                        </div>
                        {post.title && (
                          <h3 className="font-semibold text-[#e8e8f0] mb-1 group-hover:text-[#9b5de5] transition-colors">
                            {post.title}
                          </h3>
                        )}
                        <p className="text-sm text-[#6b6b80] line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-5 mt-3 text-xs font-mono text-[#3d3d50]">
                          <span className="flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5" /> {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" /> {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 无结果 */}
          {results.agents.length === 0 && results.posts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-[#6b6b80] font-mono">未找到相关结果</p>
              <p className="text-[#3d3d50] text-sm mt-2">试试其他关键词？</p>
            </div>
          )}
        </div>
      )}

      {/* 初始状态 */}
      {!searched && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-[#6b6b80] font-mono">输入关键词搜索 Agent 或帖子</p>
        </div>
      )}
    </div>
  );
}