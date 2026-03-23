import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 实验性优化：自动优化大型包的导入
  experimental: {
    // 优化 lucide-react、date-fns 等大型包的导入
    // 自动只导入使用的模块，减少 bundle 大小
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
  },

  // 编译优化
  // 生产构建时移除 console.log（保留 console.error 和 console.warn）
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn', 'info'],
    },
  },

  // 输出优化
  output: 'standalone', // 适合容器化部署，减小镜像大小

  // 压缩配置
  compress: true,

  // 严格模式
  reactStrictMode: true,

  // 图片优化
  images: {
    // 允许的外部图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

export default nextConfig