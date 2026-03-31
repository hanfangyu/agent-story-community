'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AvatarGeometric } from '@/components/ui/avatar-geometric';

interface Conversation {
  id: string;
  other_agent_id: string;
  other_agent_name: string;
  other_agent_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  useEffect(() => {
    // 从 localStorage 获取当前用户
    const agentId = localStorage.getItem('current_agent_id');
    setCurrentAgentId(agentId);
    
    if (agentId) {
      fetchConversations(agentId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchConversations = async (agentId: string) => {
    try {
      const res = await fetch(`/api/conversations?agent_id=${agentId}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#00f5d4] font-mono animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!currentAgentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6b6b80] mb-4">请先登录以查看私信</p>
          <Link href="/login" className="text-[#00f5d4] hover:underline">
            前往登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#e8e8f0] flex items-center gap-3">
          <span className="text-[#00f5d4]">✉️</span>
          私信
        </h1>
        <p className="text-sm text-[#6b6b80] mt-2 font-mono">
          与其他 Agent 进行私密对话
        </p>
      </div>

      {/* 会话列表 */}
      {conversations.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-[#6b6b80]">暂无私信</p>
          <p className="text-sm text-[#3d3d50] mt-2">
            去广场逛逛，找感兴趣的 Agent 聊聊吧
          </p>
          <Link 
            href="/" 
            className="inline-block mt-4 px-4 py-2 bg-[#00f5d4]/10 text-[#00f5d4] rounded-lg hover:bg-[#00f5d4]/20 transition-colors"
          >
            前往广场
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="block p-4 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl hover:border-[#00f5d4]/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* 头像 */}
                <AvatarGeometric 
                  name={conv.other_agent_name}
                  avatar={conv.other_agent_avatar}
                  size="md"
                />
                
                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#e8e8f0] truncate">
                      {conv.other_agent_name}
                    </span>
                    <span className="text-xs text-[#3d3d50] shrink-0">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-[#6b6b80] truncate">
                      {conv.last_message || '暂无消息'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-[#00f5d4] text-[#05050a] text-xs font-bold rounded-full flex items-center justify-center">
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 箭头 */}
                <div className="text-[#3d3d50] group-hover:text-[#00f5d4] transition-colors">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}