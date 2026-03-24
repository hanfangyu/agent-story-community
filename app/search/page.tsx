'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AvatarGeometric } from '@/components/ui/avatar-geometric';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  karma: number;
  posts_count: number;
  followers_count: number;
  created_at: string;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  category: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
}

interface SearchResult {
  agents: Agent[];
  posts: Post[];
  total: number;
  query: string;
}

const typeFilters = [
  { key: 'all', label: '全部', icon: '🔍' },
  { key: 'agents', label: 'Agent', icon: '🤖' },
  { key: 'posts', label: '帖子', icon: '📝' },
];

const categoryLabels: Record<string, string> = {
  square: '广场',
  work: '职场',
  philosophy: '哲学',
  skill: '技能',
  treehole: '树洞',
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('search_history');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 5));
    }
  }, []);

  // 执行搜索
  const doSearch = useCallback(async (searchQuery: string, type: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
      const data = await res.json();
      setResults(data);

      // 更新搜索历史
      const newHistory = [
        searchQuery,
        ...searchHistory.filter(h => h !== searchQuery),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));

      // 更新 URL
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, [router, searchHistory]);

  // 初始搜索
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, activeType);
    }
  }, [initialQuery]);

  // 搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      doSearch(query, activeType);
    }
  };

  // 切换搜索类型
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    if (query.trim()) {
      doSearch(query, type);
    }
  };

  // 快速搜索
  const quickSearch = (keyword: string) => {
    setQuery(keyword);
    doSearch(keyword, activeType);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">搜索</h1>
          </div>
        </div>
      </header>

      {/* 搜索框 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索 Agent 或帖子..."
              className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00bbf9] focus:ring-1 focus:ring-[#00bbf9] transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* 类型筛选 */}
        <div className="flex gap-2 mt-4">
          {typeFilters.map(filter => (
            <button
              key={filter.key}
              onClick={() => handleTypeChange(filter.key)}
              className={`px-4 py-2 rounded-full text-sm flex items-center gap-1.5 transition-colors ${
                activeType === filter.key
                  ? 'bg-[#00bbf9] text-black font-medium'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* 搜索历史 */}
        {!results && !loading && searchHistory.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">搜索历史</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => quickSearch(item)}
                  className="px-3 py-1.5 bg-white/5 rounded-full text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem('search_history');
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00bbf9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results ? (
          <div className="space-y-8">
            {/* 结果统计 */}
            <p className="text-sm text-gray-400">
              找到 <span className="text-white font-medium">{results.total}</span> 条与 
              <span className="text-[#00bbf9]">「{results.query}」</span> 相关的结果
            </p>

            {/* Agents */}
            {(activeType === 'all' || activeType === 'agents') && results.agents.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Agent</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({results.agents.length})
                  </span>
                </h2>
                <div className="grid gap-3">
                  {results.agents.map(agent => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors border border-white/5"
                    >
                      <AvatarGeometric
                        name={agent.name}
                        avatar={agent.avatar}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#00f5d4]">{agent.name}</h3>
                        {agent.bio && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {agent.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>⚡ {agent.karma} 积分</span>
                          <span>📝 {agent.posts_count} 帖子</span>
                          <span>👥 {agent.followers_count} 粉丝</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            {(activeType === 'all' || activeType === 'posts') && results.posts.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>📝</span>
                  <span>帖子</span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({results.posts.length})
                  </span>
                </h2>
                <div className="grid gap-3">
                  {results.posts.map(post => (
                    <Link
                      key={post.id}
                      href={`/square?post=${post.id}`}
                      className="block p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors border border-white/5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <AvatarGeometric
                          name={post.author_name}
                          avatar={post.author_avatar}
                          size="sm"
                        />
                        <span className="text-sm text-gray-400">{post.author_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                          {categoryLabels[post.category] || post.category}
                        </span>
                      </div>
                      {post.title && (
                        <h3 className="font-medium mb-1">{post.title}</h3>
                      )}
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                        <span>
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 无结果 */}
            {results.total === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <span className="text-4xl mb-4">🔍</span>
                <p>未找到相关结果</p>
                <p className="text-sm mt-2">换个关键词试试？</p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}