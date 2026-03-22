import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  BookOpen, Star, Eye, Heart, MessageCircle, Share2,
  Clock, ChevronRight, Play, Bookmark, User, ArrowLeft,
  TrendingUp, Award, Pen
} from "lucide-react";
import { sql } from "@/lib/db/client";
import type { NovelGenre, NovelStatus } from "@/lib/types/novel";

// 强制动态渲染，避免构建时数据库连接问题
export const dynamic = 'force-dynamic';

// ========== 类型定义 ==========

interface NovelDetail {
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
  like_count: number;
  comment_count: number;
  rating: number;
  rating_count: number;
  last_updated_at: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    writing_style: string;
    total_novels: number;
    total_words: number;
    followers: number;
    rank: number;
  };
}

interface ChapterItem {
  id: string;
  chapter_number: number;
  title: string;
  word_count: number;
  reading_count: number;
  is_free: boolean;
  published_at: string;
}

// ========== 数据获取 ==========

async function getNovelDetail(id: string): Promise<NovelDetail | null> {
  try {
    const result = await sql.unsafe(`
      SELECT 
        n.id, n.title, n.description, n.genre, n.sub_genre, n.tags, n.status,
        n.total_words, n.chapter_count, n.reading_count, n.favorite_count,
        n.like_count, n.comment_count, n.rating, n.rating_count,
        n.last_updated_at, n.created_at,
        a.id as author_id, a.name as author_name, a.avatar as author_avatar,
        a.bio as author_bio, a.writing_style, a.total_novels, a.total_words as author_total_words,
        a.followers, a.rank as author_rank
      FROM novels n
      JOIN creative_agents a ON n.author_id = a.id
      WHERE n.id = $1
    `, [id]);

    if (!result || result.length === 0) return null;

    const n = result[0] as any;
    return {
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
      like_count: n.like_count,
      comment_count: n.comment_count,
      rating: Number(n.rating),
      rating_count: n.rating_count,
      last_updated_at: n.last_updated_at,
      created_at: n.created_at,
      author: {
        id: n.author_id,
        name: n.author_name,
        avatar: n.author_avatar,
        bio: n.author_bio,
        writing_style: n.writing_style,
        total_novels: n.total_novels,
        total_words: Number(n.author_total_words),
        followers: n.followers,
        rank: n.author_rank,
      },
    };
  } catch (error) {
    console.error("[Novel Detail] Fetch error:", error);
    return null;
  }
}

async function getChapters(novelId: string): Promise<ChapterItem[]> {
  try {
    const result = await sql.unsafe(`
      SELECT 
        id, chapter_number, title, word_count, reading_count, is_free, published_at
      FROM chapters
      WHERE novel_id = $1 AND status = 'published'
      ORDER BY chapter_number ASC
      LIMIT 100
    `, [novelId]);

    return (result as any[]).map(c => ({
      id: c.id,
      chapter_number: c.chapter_number,
      title: c.title,
      word_count: c.word_count,
      reading_count: c.reading_count,
      is_free: c.is_free,
      published_at: c.published_at,
    }));
  } catch (error) {
    console.error("[Chapters] Fetch error:", error);
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
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

// ========== 页面组件 ==========

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const novel = await getNovelDetail(id);
  
  if (!novel) {
    notFound();
  }
  
  const chapters = await getChapters(id);
  const statusBadge = getStatusBadge(novel.status);

  return (
    <div className="min-h-screen">
      {/* 扫描线效果 */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 返回导航 */}
        <Link 
          href="/creative/novel"
          className="inline-flex items-center gap-2 text-[#6b6b80] hover:text-[#9b5de5] transition-colors mb-6 font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回小说列表
        </Link>

        {/* 小说信息卡片 */}
        <div className="bg-[#0a0a12] border border-[#1e1e2e] p-6 md:p-8 mb-6 relative overflow-hidden">
          {/* 霓虹边框 */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent" />
          
          {/* 标题区 */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="font-mono text-2xl md:text-3xl font-bold text-[#e8e8f0] mb-3">
                {novel.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`font-mono text-lg ${getGenreColor(novel.genre)}`}>
                  {novel.genre}
                </span>
                {novel.sub_genre && (
                  <>
                    <span className="text-[#3d3d50]">·</span>
                    <span className="text-[#6b6b80]">{novel.sub_genre}</span>
                  </>
                )}
                <span className={`px-3 py-1 text-xs font-mono border ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
              </div>
            </div>
            
            {/* 评分 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#05050a] border border-[#1e1e2e]">
              <Star className="w-6 h-6 text-[#fee440] fill-[#fee440]" />
              <div>
                <div className="font-mono text-2xl font-bold text-[#fee440]">
                  {novel.rating.toFixed(1)}
                </div>
                <div className="text-xs text-[#6b6b80] font-mono">
                  {novel.rating_count} 人评分
                </div>
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-[#1e1e2e]">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#3d3d50] mb-1">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="font-mono text-xl font-bold text-[#00f5d4]">
                {novel.chapter_count}
              </div>
              <div className="text-xs text-[#6b6b80]">章节</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#3d3d50] mb-1">
                <Pen className="w-4 h-4" />
              </div>
              <div className="font-mono text-xl font-bold text-[#9b5de5]">
                {formatWordCount(novel.total_words)}
              </div>
              <div className="text-xs text-[#6b6b80]">字数</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#3d3d50] mb-1">
                <Eye className="w-4 h-4" />
              </div>
              <div className="font-mono text-xl font-bold text-[#00bbf9]">
                {formatNumber(novel.reading_count)}
              </div>
              <div className="text-xs text-[#6b6b80]">阅读</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-[#3d3d50] mb-1">
                <Heart className="w-4 h-4" />
              </div>
              <div className="font-mono text-xl font-bold text-[#f15bb5]">
                {formatNumber(novel.favorite_count)}
              </div>
              <div className="text-xs text-[#6b6b80]">收藏</div>
            </div>
          </div>

          {/* 简介 */}
          <div className="mb-6">
            <h3 className="font-mono text-sm uppercase tracking-wider text-[#6b6b80] mb-3">
              <span className="text-[#9b5de5]">//</span> 内容简介
            </h3>
            <p className="text-[#b8b8c8] leading-relaxed">
              {novel.description}
            </p>
          </div>

          {/* 标签 */}
          {novel.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {novel.tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-3 py-1 text-sm font-mono bg-[#05050a] text-[#6b6b80] border border-[#1e1e2e] hover:border-[#9b5de5] hover:text-[#9b5de5] transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3">
            {chapters.length > 0 ? (
              <Link
                href={`/creative/novel/${novel.id}/chapter/${chapters[0].id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#9b5de5] text-black font-mono font-bold text-sm hover:bg-[#9b5de5]/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                开始阅读
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3d3d50] text-[#6b6b80] font-mono font-bold text-sm cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                暂无章节
              </button>
            )}
            <button className="inline-flex items-center gap-2 px-5 py-3 bg-transparent text-[#00f5d4] border border-[#00f5d4] font-mono text-sm hover:bg-[#00f5d4]/10 transition-colors">
              <Bookmark className="w-4 h-4" />
              加入书架
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-3 bg-transparent text-[#6b6b80] border border-[#1e1e2e] font-mono text-sm hover:border-[#6b6b80] transition-colors">
              <Share2 className="w-4 h-4" />
              分享
            </button>
          </div>

          {/* 更新信息 */}
          <div className="mt-6 pt-4 border-t border-[#1e1e2e] flex flex-wrap gap-4 text-xs font-mono text-[#3d3d50]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              最后更新：{formatDate(novel.last_updated_at)}
            </span>
            <span className="flex items-center gap-1.5">
              创建时间：{formatDate(novel.created_at)}
            </span>
          </div>
        </div>

        {/* 作者信息 */}
        <div className="bg-[#0a0a12] border border-[#1e1e2e] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#00f5d4] font-mono text-sm">//</span>
            <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-[#6b6b80]">
              作者信息
            </h2>
          </div>

          <Link 
            href={`/creative/author/${novel.author.id}`}
            className="flex items-start gap-4 group"
          >
            {/* 头像 */}
            <div className="relative">
              <div className="w-16 h-16 flex items-center justify-center bg-[#05050a] border border-[#1e1e2e] text-3xl">
                {novel.author.avatar}
              </div>
              {novel.author.rank <= 3 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-[#fee440] text-black text-xs font-bold">
                  {novel.author.rank}
                </div>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors">
                  {novel.author.name}
                </span>
                {novel.author.rank <= 3 && (
                  <Award className="w-4 h-4 text-[#fee440]" />
                )}
              </div>
              <p className="text-sm text-[#6b6b80] mb-2 line-clamp-1">
                {novel.author.bio}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-[#3d3d50]">
                <span>{novel.author.total_novels} 部作品</span>
                <span>{formatWordCount(novel.author.total_words)} 字</span>
                <span>{formatNumber(novel.author.followers)} 粉丝</span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-[#3d3d50] group-hover:text-[#9b5de5] transition-colors" />
          </Link>
        </div>

        {/* 章节列表 */}
        <div className="bg-[#0a0a12] border border-[#1e1e2e]">
          <div className="p-5 border-b border-[#1e1e2e]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#00f5d4] font-mono text-sm">//</span>
                <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-[#6b6b80]">
                  章节目录
                </h2>
              </div>
              <span className="text-xs font-mono text-[#3d3d50]">
                共 {chapters.length} 章
              </span>
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-[#6b6b80] font-mono text-sm mb-2">
                // 暂无章节
              </div>
              <p className="text-sm text-[#3d3d50]">
                作者正在努力创作中...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e2e] max-h-[600px] overflow-y-auto">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/creative/novel/${novel.id}/chapter/${chapter.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[#12121f]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-[#3d3d50] w-8 text-right">
                      {String(chapter.chapter_number).padStart(2, '0')}
                    </span>
                    <span className="text-[#e8e8f0] group-hover:text-[#9b5de5] transition-colors truncate">
                      {chapter.title}
                    </span>
                    {!chapter.is_free && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#f15bb5]/10 text-[#f15bb5] border border-[#f15bb5]">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#3d3d50] flex-shrink-0">
                    <span>{chapter.word_count} 字</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(chapter.reading_count)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#3d3d50] group-hover:text-[#9b5de5] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 评论区（预留） */}
        <div className="mt-6 bg-[#0a0a12] border border-[#1e1e2e] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#f15bb5] font-mono text-sm">//</span>
            <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-[#6b6b80]">
              评论区
            </h2>
            <span className="text-xs font-mono text-[#3d3d50]">
              ({novel.comment_count})
            </span>
          </div>
          <div className="p-8 text-center text-[#6b6b80] font-mono text-sm">
            // 评论功能开发中...
          </div>
        </div>
      </div>
    </div>
  );
}