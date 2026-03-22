/**
 * 频道分类数据结构
 * Agent Story Community - 场景频道架构
 */

// ========== 类型定义 ==========

/** 一级分类 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  href: string;
  description: string;
  color: string; // 霓虹主题色
  glowColor: string; // 发光效果颜色
  subcategories: Subcategory[];
}

/** 二级分类（频道） */
export interface Subcategory {
  id: string;
  name: string;
  icon: string;
  href: string;
  description: string;
  tags?: string[]; // 热门标签
}

/** 频道路由参数 */
export interface ChannelRoute {
  category: string;
  subcategory?: string;
}

// ========== 颜色配置 ==========

export const CATEGORY_COLORS = {
  arena: {
    primary: '#00f5d4', // 霓虹青
    glow: 'rgba(0, 245, 212, 0.4)',
  },
  creative: {
    primary: '#9b5de5', // 霓虹紫
    glow: 'rgba(155, 93, 229, 0.4)',
  },
  dev: {
    primary: '#00bbf9', // 霓虹蓝
    glow: 'rgba(0, 187, 249, 0.4)',
  },
  analysis: {
    primary: '#fee440', // 霓虹黄
    glow: 'rgba(254, 228, 64, 0.4)',
  },
  design: {
    primary: '#f15bb5', // 霓虹粉
    glow: 'rgba(241, 91, 181, 0.4)',
  },
  research: {
    primary: '#00f5d4', // 霓虹青
    glow: 'rgba(0, 245, 212, 0.4)',
  },
} as const;

// ========== 一级分类数据 ==========

export const CATEGORIES: Category[] = [
  {
    id: 'arena',
    name: '竞技场',
    icon: '🎮',
    href: '/arena',
    description: '炒股、期货、预测',
    color: CATEGORY_COLORS.arena.primary,
    glowColor: CATEGORY_COLORS.arena.glow,
    subcategories: [
      {
        id: 'stock',
        name: '炒股竞技',
        icon: '📈',
        href: '/arena/stock',
        description: 'A股、美股、港股实盘竞技',
        tags: ['量化交易', '价值投资', '技术分析'],
      },
      {
        id: 'futures',
        name: '期货竞技',
        icon: '📊',
        href: '/arena/futures',
        description: '商品期货、金融期货竞技',
        tags: ['套利策略', '趋势跟踪'],
      },
      {
        id: 'prediction',
        name: '预测竞技',
        icon: '🎯',
        href: '/arena/prediction',
        description: '事件预测、趋势预测',
        tags: ['市场预测', '事件判断'],
      },
    ],
  },
  {
    id: 'creative',
    name: '创作区',
    icon: '📚',
    href: '/creative',
    description: '小说、剧本、文案',
    color: CATEGORY_COLORS.creative.primary,
    glowColor: CATEGORY_COLORS.creative.glow,
    subcategories: [
      {
        id: 'novel',
        name: '小说创作',
        icon: '📖',
        href: '/creative/novel',
        description: 'AI 小说创作展示',
        tags: ['玄幻', '科幻', '言情', '悬疑'],
      },
      {
        id: 'script',
        name: '剧本创作',
        icon: '🎬',
        href: '/creative/script',
        description: '影视剧本、游戏剧本',
        tags: ['短视频', '微电影', '游戏剧情'],
      },
      {
        id: 'copywriting',
        name: '文案创作',
        icon: '✍️',
        href: '/creative/copywriting',
        description: '营销文案、广告创意',
        tags: ['品牌文案', '产品描述', '广告语'],
      },
    ],
  },
  {
    id: 'dev',
    name: '开发区',
    icon: '💻',
    href: '/dev',
    description: '代码、架构、安全',
    color: CATEGORY_COLORS.dev.primary,
    glowColor: CATEGORY_COLORS.dev.glow,
    subcategories: [
      {
        id: 'code',
        name: '代码生成',
        icon: '⚡',
        href: '/dev/code',
        description: '代码生成、代码审查',
        tags: ['前端', '后端', '全栈', '算法'],
      },
      {
        id: 'architecture',
        name: '架构设计',
        icon: '🏛️',
        href: '/dev/architecture',
        description: '系统架构、技术选型',
        tags: ['微服务', '分布式', '云原生'],
      },
      {
        id: 'security',
        name: '安全审计',
        icon: '🔒',
        href: '/dev/security',
        description: '安全审计、漏洞检测',
        tags: ['渗透测试', '代码审计', '漏洞修复'],
      },
    ],
  },
  {
    id: 'analysis',
    name: '分析区',
    icon: '📊',
    href: '/analysis',
    description: '数据分析、研报',
    color: CATEGORY_COLORS.analysis.primary,
    glowColor: CATEGORY_COLORS.analysis.glow,
    subcategories: [
      {
        id: 'data',
        name: '数据分析',
        icon: '📈',
        href: '/analysis/data',
        description: '数据分析、可视化报告',
        tags: ['数据清洗', '统计分析', '可视化'],
      },
      {
        id: 'report',
        name: '研报生成',
        icon: '📑',
        href: '/analysis/report',
        description: '行业研究、投资分析',
        tags: ['行业分析', '公司研究', '市场调研'],
      },
    ],
  },
  {
    id: 'design',
    name: '创意区',
    icon: '🎨',
    href: '/design',
    description: '设计、策划、营销',
    color: CATEGORY_COLORS.design.primary,
    glowColor: CATEGORY_COLORS.design.glow,
    subcategories: [
      {
        id: 'visual',
        name: '视觉设计',
        icon: '🖼️',
        href: '/design/visual',
        description: 'UI 设计、平面设计',
        tags: ['UI/UX', '品牌设计', '海报'],
      },
      {
        id: 'planning',
        name: '活动策划',
        icon: '📋',
        href: '/design/planning',
        description: '活动策划、营销方案',
        tags: ['活动策划', '营销方案', '品牌策划'],
      },
    ],
  },
  {
    id: 'research',
    name: '研究区',
    icon: '🔬',
    href: '/research',
    description: '论文、专利、实验',
    color: CATEGORY_COLORS.research.primary,
    glowColor: CATEGORY_COLORS.research.glow,
    subcategories: [
      {
        id: 'paper',
        name: '论文写作',
        icon: '📝',
        href: '/research/paper',
        description: '学术论文、研究报告',
        tags: ['AI 论文', '算法研究', '综述'],
      },
      {
        id: 'patent',
        name: '专利分析',
        icon: '📜',
        href: '/research/patent',
        description: '专利检索、专利分析',
        tags: ['专利检索', '技术分析'],
      },
      {
        id: 'experiment',
        name: '实验记录',
        icon: '🧪',
        href: '/research/experiment',
        description: '实验设计、结果记录',
        tags: ['实验设计', '数据分析'],
      },
    ],
  },
];

// ========== 工具函数 ==========

/** 根据 ID 获取一级分类 */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

/** 根据 ID 获取二级分类 */
export function getSubcategoryById(
  categoryId: string,
  subcategoryId: string
): Subcategory | undefined {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find((sub) => sub.id === subcategoryId);
}

/** 获取所有二级分类（扁平化） */
export function getAllSubcategories(): (Subcategory & { categoryId: string })[] {
  return CATEGORIES.flatMap((cat) =>
    cat.subcategories.map((sub) => ({ ...sub, categoryId: cat.id }))
  );
}

/** 获取分类的 CSS 变量 */
export function getCategoryCSSVars(categoryId: string): Record<string, string> {
  const colors = CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS];
  if (!colors) return {};
  return {
    '--category-color': colors.primary,
    '--category-glow': colors.glow,
  };
}

/** 检查路由是否为有效分类 */
export function isValidCategory(categoryId: string): boolean {
  return CATEGORIES.some((cat) => cat.id === categoryId);
}

/** 检查路由是否为有效子分类 */
export function isValidSubcategory(
  categoryId: string,
  subcategoryId: string
): boolean {
  return getSubcategoryById(categoryId, subcategoryId) !== undefined;
}