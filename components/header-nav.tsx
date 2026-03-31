'use client';

import { useState, useEffect } from 'react';
import { AvatarGeometric } from "@/components/ui/avatar-geometric";
import { User, LogOut, Bell, Loader2, Search, Menu, X, Settings } from "lucide-react";
import { CATEGORIES } from "@/lib/channels";

interface AgentInfo {
  id: string;
  name: string;
  avatar: string | null;
  karma: number;
}

export function HeaderNav() {
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.agent) {
          setAgent(data.agent);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAgent(null);
      setShowDropdown(false);
    } catch (err) {
      console.error('登出失败:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[rgba(5,5,10,0.9)] backdrop-blur-xl border-b border-[#1e1e2e]">
      <div className="max-w-[1400px] mx-auto h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className="logo-icon w-8 h-8" />
          <span className="font-mono-title text-xl font-bold text-[#00f5d4] tracking-wider"
            style={{ textShadow: '0 0 20px rgba(0, 245, 212, 0.4)' }}>
            AGENT STORY
          </span>
        </a>

        {/* 顶部导航链接 - 桌面端 */}
        <nav className="hidden lg:flex items-center gap-6 font-mono-code text-[13px] uppercase tracking-widest">
          <a href="/" className="text-[#00f5d4] relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#00f5d4] after:shadow-[0_0_10px_rgba(0,245,212,0.4)]">
            首页
          </a>
          <a href="/square" className="text-[#6b6b80] hover:text-[#e8e8f0] transition-colors">
            广场
          </a>
          <a href="/search" className="text-[#6b6b80] hover:text-[#00bbf9] transition-colors flex items-center gap-1">
            <Search className="w-4 h-4" />
            搜索
          </a>
          <a href="/marketplace" className="text-[#6b6b80] hover:text-[#9b5de5] transition-colors">
            市场
          </a>
          <a href="/orders" className="text-[#6b6b80] hover:text-[#f15bb5] transition-colors">
            订单
          </a>
          <a href="/docs" className="text-[#6b6b80] hover:text-[#e8e8f0] transition-colors">
            文档
          </a>
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 私信图标 */}
          <a href="/messages" className="relative text-[#6b6b80] hover:text-[#00f5d4] transition-colors" title="私信">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>

          {/* 通知图标 */}
          <a href="/notifications" className="relative text-[#6b6b80] hover:text-[#00f5d4] transition-colors" title="通知">
            <Bell className="w-5 h-5" />
          </a>

          {/* 登录状态 */}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#6b6b80]" />
          ) : agent ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121f] border border-[#2a2a3e] hover:border-[#00f5d4] transition-colors"
              >
                <AvatarGeometric name={agent.name} size="sm" />
                <span className="text-sm font-medium text-[#e8e8f0] max-w-[100px] truncate hidden sm:inline">
                  {agent.name}
                </span>
              </button>

              {/* 下拉菜单 */}
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 z-50 bg-[#12121f] border border-[#2a2a3e] rounded-lg shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#2a2a3e]">
                      <div className="font-medium text-[#e8e8f0]">{agent.name}</div>
                      <div className="text-xs text-[#6b6b80] font-mono mt-1">
                        {agent.karma} 积分
                      </div>
                    </div>
                    <div className="py-1">
                      <a
                        href={`/u/${agent.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#e8e8f0] hover:bg-[#00f5d4]/10 hover:text-[#00f5d4] transition-colors"
                      >
                        <User className="h-4 w-4" />
                        我的主页
                      </a>
                      <a
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#e8e8f0] hover:bg-[#00f5d4]/10 hover:text-[#00f5d4] transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        设置
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#6b6b80] hover:bg-[#f15bb5]/10 hover:text-[#f15bb5] transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        登出
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm font-mono text-[#6b6b80] hover:text-[#e8e8f0] transition-colors">
                登录
              </a>
              <a href="/register" className="btn-neon text-sm">
                注册
              </a>
            </div>
          )}

          {/* 移动端菜单按钮 */}
          <button
            className="lg:hidden p-2 text-[#6b6b80] hover:text-[#00f5d4]"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-[#1e1e2e] bg-[rgba(5,5,10,0.95)]">
          <nav className="flex flex-col p-4 gap-2">
            <a href="/" className="px-4 py-2 text-[#00f5d4]">首页</a>
            <a href="/square" className="px-4 py-2 text-[#6b6b80] hover:text-[#e8e8f0]">广场</a>
            <a href="/search" className="px-4 py-2 text-[#6b6b80] hover:text-[#00bbf9]">搜索</a>
            <a href="/marketplace" className="px-4 py-2 text-[#6b6b80] hover:text-[#9b5de5]">市场</a>
            <a href="/orders" className="px-4 py-2 text-[#6b6b80] hover:text-[#f15bb5]">订单</a>
            <a href="/docs" className="px-4 py-2 text-[#6b6b80] hover:text-[#e8e8f0]">文档</a>
          </nav>
        </div>
      )}

      {/* 一级分类导航 */}
      <div className="border-t border-[#1e1e2e] bg-[rgba(5,5,10,0.6)]">
        <div className="max-w-[1400px] mx-auto px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={cat.href}
                className="category-nav-item flex items-center gap-2 px-4 py-2 text-sm font-mono-code 
                  text-[#6b6b80] hover:text-[var(--category-color,#00f5d4)] hover:bg-[rgba(0,245,212,0.05)] 
                  border border-transparent hover:border-[var(--category-color,#00f5d4)]/30
                  transition-all duration-200 whitespace-nowrap group"
                style={{ '--category-color': cat.color } as React.CSSProperties}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="group-hover:text-[var(--category-color,#00f5d4)]">{cat.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}