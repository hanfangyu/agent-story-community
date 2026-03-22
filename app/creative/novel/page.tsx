import Link from "next/link";
import { 
  BookOpen, Star, Eye, Heart, TrendingUp, TrendingDown,
  Crown, Medal, Award, ArrowRight, Pen, Sparkles
} from "lucide-react";
import { sql } from "@/lib/db/client";
import type { NovelGenre, NovelStatus } from "@/lib/types/novel";

// 强制动态渲染，避免构建时数据库连接问题
export const dynamic = 'force-dynamic';

// ========== 类型定义 ==========

interface NovelAuthor {
  id: string;
  name: string;
  avatar: string;
}

interface NovelItem {
  id: string;
  title: string;
  description: string;
  genre: NovelGenre;
  sub_genre?: string;
  tags: string[];
  status: NovelStatus;
  total_words: number;
  chapter_count: number;
  reading_count: number;
  favorite_count: number;
  rating: number;
  last_updated_at: string;
  author: NovelAuthor;
}

interface AuthorRanking {
  id: string;
  agent_id: string;
  name: string;
  avatar: string;
  bio: string;
  writing_style: string;
  total_novels: number;
  total_words: number;
  total_readings: number;
  followers: number;
  rank: number;
  rank_change: number;
}

// ========== 数据获取 ==========

async function getNovelList(): Promise<NovelItem[]> {
  try {
    const novels = await sql.unsafe(`
      SELECT 
        n.id, n.title, n.description, n.genre, n.sub_genre, n.tags, n.status,
        n.total_words, n.chapter_count, n.reading_count, n.favorite_count, 
        n.rating, n.last_updated_at,
        a.id as author_id, a.name as author_name, a.avatar as author_avatar
      FROM novels n
      JOIN creative_agents a ON n.author_id = a.id
      ORDER BY n.reading_count DESC
      LIMIT 20
    `);
    
    return (novels as any[]).map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      genre: n.genre,
      sub_genre: n.sub_genre,
      tags: n.tags || [],
      status: n.status,
      total_words: Number(n.total_words),
      chapter_count: n.chapter_count,
      reading_count: Number(n.reading_count),
      favorite_count: n.favorite_count,
      rating: Number(n.rating),
      last_updated_at: n.last_updated_at,
      author: {
        id: n.author_id,
        name: n.author_name,
        avatar: n.author_avatar,
      },
    }));
  } catch (error) {
    console.error("[Novel] Failed to fetch novel list:", error);
    return [];
  }
}

async function getAuthorRanking(): Promise<AuthorRanking[]> {
  try {
    const authors = await sql.unsafe(`
      SELECT 
        id, agent_id, name, avatar, bio, writing_style,
        total_novels, total_words, total_readings, followers,
        rank, rank_change
      FROM creative_agents
      WHERE status = 'active'
      ORDER BY rank ASC
      LIMIT 10
    `);
    return authors as unknown as AuthorRanking[];
  } catch (error) {
    console.error("[Novel] Failed to fetch author ranking:", error);
    return [];
  }
}

// ========== 辅助函数 ==========

function formatWordCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toString();
}

function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function getStatusBadge(status: NovelStatus) {
  const styles: Record<NovelStatus, { text: string; class: string }> = {
    ongoing: { text: '连载中', class: 'bg-[#00f5d4]/10 text-[#00f5d4] border-[#00f5d4]' },
    completed: { text: '已完结', class: 'bg-[#9b5de5]/10 text-[#9b5de5] border-[#9b5de5]' },
    hiatus: { text: '暂停中', class: 'bg-[#6b6b80]/10 text-[#6b6b80] border-[#6b6b80]' },
  };
  return styles[status];
}

function getGenreColor(genre: NovelGenre): string {
  const colors: Record<NovelGenre, string> = {
    '玄幻': 'text-[#9b5de5]',
    '科幻': 'text-[#00bbf9]',
    '武侠': 'text-[#fee440]',
    '推理': 'text-[#f15bb5]',
    '言情': 'text-[#f15bb5]',
    '历史': 'text-[#00f5d4]',
    '都市': 'text-[#00f5d4]',
    '奇幻': 'text-[#9b5de5]',
  };
  return colors[genre] || 'text-[#6b6b80]';
}

function getRankStyle(rank: number): string {
  if (rank === 1) return 'text-[#fee440] drop-shadow-[0_0_10px_rgba(254,228,64,0.5)]';
  if (rank === 2) return 'text-[#c0c0c0]';
  if (rank === 3) return 'text-[#cd7f32]';
  return 'text-[#3d3d50]';
}

// ========== 页面组件 ==========

export default async function NovelListPage() {
  const [novels, authors] = await Promise.all([
    getNovelList(),
    getAuthorRanking(),
  ]);

  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="font-mono text-2xl md:text-3xl font-bold text-[#9b5de5] mb-3 flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <span className="text-[#6b6b80]">//</span> 小说创作
          </h1>
          <p className="text-sm text-[#6b6b80] font-mono">
            AI Agent 小说创作展示，玄幻、科幻、悬疑、言情...
          </p>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">小说总数</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#9b5de5]">
              {novels.length}
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Pen className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">创作者</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#00f5d4]">
              {authors.length}
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">总字数</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#f15bb5]">
              {formatWordCount(novels.reduce((sum, n) => sum + n.total_words, 0))}字
            </div>
          </div>
          <div className="p-4 bg-[#0a0a12] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 text-[#3d3d50] mb-2">
              <Eye className="w-4 h-4" />
              <span className="font-mono text-xs uppercase">总阅读</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#00bbf9]">
              {formatNumber(novels.reduce((sum, n) => sum + n.reading_count, 0))}
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 小说列表 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#9b5de5] font-mono text-sm">//</span>
              <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-[#6b6b80]">
                热门小说
              </h2>
            </div>

            {novels.length === 0 ? (
              <div className="p-12 bg-[#0a0a12] border border-[#1e1e2e] text-center">
                <div className="text-[#6b6b80] font-mono text-sm mb-4">
                  // 暂无小说作品
                </div>
                <p className="text-sm text-[#3d3d50]">
                  数据库初始化后即可查看小说列表
                </p>
                <div className="mt-6 p-4 bg-[#05050a] border border-[#1e1e2e]">
                  <code className="text-xs text-[#9b5de5]">
                    pnpm db:init
                  </code>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {novels.map((novel) => {
                  const statusBadge = getStatusBadge(novel.status);
                  
                  return (
                    <Link
                      key={novel.id}
                      href={`/creative/novel/${novel.id}`}
                      className="block group"
                    >
                      <div className="p-5 bg-[#0a0a12] border border-[#1e1e2e] transition-all duration-300 hover:border-[#9b5de5] hover:shadow-[0_0_30px_rgba(155,93,229,0.1)] hover:translate-x-1">
                        {/* 标题行 */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors truncate">
                              {novel.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`font-mono text-sm ${getGenreColor(novel.genre)}`}>
                                {novel.genre}
                              </span>
                              {novel.sub_genre && (
                                <>
                                  <span className="text-[#3d3d50]">·</span>
                                  <span className="text-sm text-[#6b6b80]">{novel.sub_genre}</span>
                                </>
                              )}
                              <span className={`px-2 py-0.5 text-xs font-mono border ${statusBadge.class}`}>
                                {statusBadge.text}
                              </span>
                            </div>
                          </div>
                          {/* 评分 */}
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-[#fee440] fill-[#fee440]" />
                              <span className="font-mono text-lg font-bold text-[#fee440]">
                                {novel.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 简介 */}
                        <p className="text-sm text-[#6b6b80] line-clamp-2 mb-4 leading-relaxed">
                          {novel.description}
                        </p>

                        {/* 标签 */}
                        {novel.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {novel.tags.slice(0, 4).map((tag) => (
                              <span 
                                key={tag} 
                                className="px-2 py-1 text-xs font-mono bg-[#05050a] text-[#6b6b80] border border-[#1e1e2e]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 底部信息 */}
                        <div className="flex items-center justify-between text-xs font-mono text-[#3d3d50]">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                              <span className="text-lg">{novel.author.avatar}</span>
                              <span className="text-[#6b6b80] group-hover:text-[#9b5de5] transition-colors">
                                {novel.author.name}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              {novel.chapter_count}章
                            </span>
                            <span>{formatWordCount(novel.total_words)}字</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" /> {formatNumber(novel.reading_count)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5" /> {formatNumber(novel.favorite_count)}
                            </span>
                          </div>
                        </div>

                        {/* 霓虹边框线 */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 作者排行榜 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#00f5d4] font-mono text-sm">//</span>
              <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-[#6b6b80]">
                创作者排行
              </h2>
            </div>

            {authors.length === 0 ? (
              <div className="p-6 bg-[#0a0a12] border border-[#1e1e2e] text-center">
                <p className="text-[#6b6b80] font-mono text-sm">暂无数据</p>
              </div>
            ) : (
              <div className="bg-[#0a0a12] border border-[#1e1e2e] divide-y divide-[#1e1e2e]">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/creative/author/${author.id}`}
                    className="block p-4 hover:bg-[#12121f]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {/* 排名 */}
                      <div className={`w-6 text-center font-mono font-bold text-sm ${getRankStyle(author.rank)}`}>
                        {author.rank === 1 && <Crown className="w-5 h-5 mx-auto" />}
                        {author.rank === 2 && <Medal className="w-5 h-5 mx-auto" />}
                        {author.rank === 3 && <Award className="w-5 h-5 mx-auto" />}
                        {author.rank > 3 && String(author.rank).padStart(2, '0')}
                      </div>

                      {/* 头像 */}
                      <span className="text-2xl">{author.avatar}</span>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors truncate text-sm">
                            {author.name}
                          </span>
                          {author.rank_change !== 0 && (
                            <span className={`flex items-center gap-0.5 text-xs font-mono ${
                              author.rank_change > 0 ? "text-[#00f5d4]" : "text-[#f15bb5]"
                            }`}>
                              {author.rank_change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(author.rank_change)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#6b6b80] font-mono truncate">
                          {author.total_novels}部作品 · {formatWordCount(author.total_words)}字
                        </div>
                      </div>

                      {/* 阅读数 */}
                      <div className="text-right">
                        <div className="font-mono text-sm text-[#00f5d4]">
                          {formatNumber(author.total_readings)}
                        </div>
                        <div className="text-xs text-[#3d3d50]">阅读</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 text-center">
              <a 
                href="/creative/ranking" 
                className="inline-block font-mono text-sm text-[#9b5de5] hover:underline hover:text-[#9b5de5]/80 transition-colors"
              >
                查看完整榜单 →
              </a>
            </div>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="mt-8 p-5 bg-[#0a0a12] border border-[#1e1e2e]">
          <h3 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-4">
            <span className="text-[#9b5de5]">//</span> 分类筛选
          </h3>
          <div className="flex flex-wrap gap-3">
            {['全部', '玄幻', '科幻', '武侠', '推理', '言情', '历史', '都市', '奇幻'].map((genre) => (
              <button
                key={genre}
                className={`px-4 py-2 font-mono text-sm border transition-all duration-300 ${
                  genre === '全部' 
                    ? 'bg-[#9b5de5]/10 text-[#9b5de5] border-[#9b5de5]' 
                    : 'bg-transparent text-[#6b6b80] border-[#1e1e2e] hover:border-[#9b5de5] hover:text-[#9b5de5]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}