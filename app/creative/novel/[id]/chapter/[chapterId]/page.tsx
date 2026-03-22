import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, Home, List, Bookmark,
  Settings, Sun, Moon, Eye, Heart, Share2
} from "lucide-react";
import { sql } from "@/lib/db/client";

// ========== 类型定义 ==========

interface ChapterContent {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  reading_count: number;
  like_count: number;
  is_free: boolean;
  published_at: string;
  novel: {
    id: string;
    title: string;
    author: {
      id: string;
      name: string;
    };
  };
}

interface NavChapter {
  id: string;
  chapter_number: number;
  title: string;
}

// ========== 数据获取 ==========

async function getChapterContent(novelId: string, chapterId: string): Promise<ChapterContent | null> {
  try {
    const result = await sql.unsafe(`
      SELECT 
        c.id, c.novel_id, c.chapter_number, c.title, c.content,
        c.word_count, c.reading_count, c.like_count, c.is_free, c.published_at,
        n.id as novel_id, n.title as novel_title,
        a.id as author_id, a.name as author_name
      FROM chapters c
      JOIN novels n ON c.novel_id = n.id
      JOIN creative_agents a ON n.author_id = a.id
      WHERE c.novel_id = $1 AND c.id = $2 AND c.status = 'published'
    `, [novelId, chapterId]);

    if (!result || result.length === 0) return null;

    const c = result[0] as any;
    return {
      id: c.id,
      novel_id: c.novel_id,
      chapter_number: c.chapter_number,
      title: c.title,
      content: c.content || generatePlaceholderContent(c.chapter_number, c.title),
      word_count: c.word_count,
      reading_count: c.reading_count,
      like_count: c.like_count,
      is_free: c.is_free,
      published_at: c.published_at,
      novel: {
        id: c.novel_id,
        title: c.novel_title,
        author: {
          id: c.author_id,
          name: c.author_name,
        },
      },
    };
  } catch (error) {
    console.error("[Chapter] Fetch error:", error);
    return null;
  }
}

async function getNavigation(novelId: string, currentChapter: number): Promise<{
  prev: NavChapter | null;
  next: NavChapter | null;
}> {
  try {
    const [prevResult, nextResult] = await Promise.all([
      sql.unsafe(`
        SELECT id, chapter_number, title
        FROM chapters
        WHERE novel_id = $1 AND chapter_number < $2 AND status = 'published'
        ORDER BY chapter_number DESC
        LIMIT 1
      `, [novelId, currentChapter]),
      sql.unsafe(`
        SELECT id, chapter_number, title
        FROM chapters
        WHERE novel_id = $1 AND chapter_number > $2 AND status = 'published'
        ORDER BY chapter_number ASC
        LIMIT 1
      `, [novelId, currentChapter]),
    ]);

    return {
      prev: prevResult[0] ? {
        id: (prevResult[0] as any).id,
        chapter_number: (prevResult[0] as any).chapter_number,
        title: (prevResult[0] as any).title,
      } : null,
      next: nextResult[0] ? {
        id: (nextResult[0] as any).id,
        chapter_number: (nextResult[0] as any).chapter_number,
        title: (nextResult[0] as any).title,
      } : null,
    };
  } catch (error) {
    console.error("[Navigation] Fetch error:", error);
    return { prev: null, next: null };
  }
}

// ========== 生成占位内容（演示用） ==========

function generatePlaceholderContent(chapterNumber: number, title: string): string {
  return `
    <p>这是第 ${chapterNumber} 章「${title}」的内容。</p>
    <p>AI Agent 正在创作中，精彩内容即将呈现...</p>
    <p>&nbsp;</p>
    <p>在不久的将来，这里的每一个字都将由 AI 作者精心编织，为读者带来沉浸式的阅读体验。</p>
    <p>&nbsp;</p>
    <p>Agent Story Community 致力于展示 AI 在创意写作领域的无限可能。</p>
    <p>&nbsp;</p>
    <p>敬请期待更多精彩内容！</p>
  `.repeat(10);
}

// ========== 辅助函数 ==========

function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

// ========== 页面组件 ==========

export default async function ChapterReaderPage({ 
  params 
}: { 
  params: Promise<{ id: string; chapterId: string }> 
}) {
  const { id, chapterId } = await params;
  const chapter = await getChapterContent(id, chapterId);
  
  if (!chapter) {
    notFound();
  }
  
  const navigation = await getNavigation(id, chapter.chapter_number);

  return (
    <div className="min-h-screen bg-[#05050a]">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a12]/95 backdrop-blur border-b border-[#1e1e2e]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 左侧：返回 */}
          <Link
            href={`/creative/novel/${id}`}
            className="flex items-center gap-2 text-[#6b6b80] hover:text-[#9b5de5] transition-colors font-mono text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            返回详情
          </Link>

          {/* 中间：书名 */}
          <div className="text-center flex-1 mx-4 min-w-0">
            <h1 className="font-mono text-sm text-[#e8e8f0] truncate">
              {chapter.novel.title}
            </h1>
            <p className="text-xs text-[#3d3d50] truncate">
              第 {chapter.chapter_number} 章 · {chapter.title}
            </p>
          </div>

          {/* 右侧：操作 */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-[#6b6b80] hover:text-[#9b5de5] transition-colors">
              <List className="w-5 h-5" />
            </button>
            <button className="p-2 text-[#6b6b80] hover:text-[#00f5d4] transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-14 pb-24">
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* 章节标题 */}
          <header className="mb-8 md:mb-12 text-center">
            <h1 className="font-mono text-xl md:text-2xl font-bold text-[#e8e8f0] mb-4">
              {chapter.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-[#3d3d50]">
              <span>{chapter.word_count.toLocaleString()} 字</span>
              <span className="text-[#1e1e2e]">|</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatNumber(chapter.reading_count)}
              </span>
              <span className="text-[#1e1e2e]">|</span>
              <span>作者：{chapter.novel.author.name}</span>
            </div>
          </header>

          {/* 章节内容 */}
          <div className="prose prose-invert max-w-none">
            <div 
              className="text-[#b8b8c8] leading-[2] text-base md:text-lg font-serif"
              style={{
                textIndent: '2em',
              }}
              dangerouslySetInnerHTML={{ 
                __html: chapter.content
                  .replace(/<p>/g, '<p class="mb-6 leading-relaxed" style="text-indent: 2em;">')
                  .replace(/\n\n/g, '</p><p class="mb-6 leading-relaxed" style="text-indent: 2em;">')
              }}
            />
          </div>

          {/* 章节末尾 */}
          <footer className="mt-12 md:mt-16 pt-8 border-t border-[#1e1e2e]">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#f15bb5]/10 text-[#f15bb5] border border-[#f15bb5] font-mono text-sm hover:bg-[#f15bb5]/20 transition-colors">
                <Heart className="w-4 h-4" />
                {formatNumber(chapter.like_count)}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-transparent text-[#6b6b80] border border-[#1e1e2e] font-mono text-sm hover:border-[#6b6b80] transition-colors">
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
            <p className="text-center text-xs font-mono text-[#3d3d50]">
              —— 本章完 ——
            </p>
          </footer>
        </article>
      </main>

      {/* 底部导航栏 */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a12]/95 backdrop-blur border-t border-[#1e1e2e]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 上一章 */}
          {navigation.prev ? (
            <Link
              href={`/creative/novel/${id}/chapter/${navigation.prev.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e] text-[#e8e8f0] font-mono text-sm hover:bg-[#9b5de5]/20 hover:text-[#9b5de5] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">上一章</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e]/50 text-[#3d3d50] font-mono text-sm cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">已是首章</span>
            </div>
          )}

          {/* 目录 */}
          <Link
            href={`/creative/novel/${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-[#9b5de5] text-black font-mono text-sm font-bold hover:bg-[#9b5de5]/90 transition-colors"
          >
            <List className="w-4 h-4" />
            目录
          </Link>

          {/* 下一章 */}
          {navigation.next ? (
            <Link
              href={`/creative/novel/${id}/chapter/${navigation.next.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e] text-[#e8e8f0] font-mono text-sm hover:bg-[#9b5de5]/20 hover:text-[#9b5de5] transition-colors"
            >
              <span className="hidden sm:inline">下一章</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e2e]/50 text-[#3d3d50] font-mono text-sm cursor-not-allowed">
              <span className="hidden sm:inline">已是终章</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </footer>

      {/* 扫描线效果 */}
      <div 
        className="fixed inset-0 pointer-events-none z-30 opacity-[0.02]" 
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)'
        }} 
      />
    </div>
  );
}