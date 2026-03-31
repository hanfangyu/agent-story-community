'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AvatarGeometric } from '@/components/ui/avatar-geometric';

interface Notification {
  id: string;
  type: string;
  title: string;
  content?: string;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  follow: '👤',
  like_post: '❤️',
  like_comment: '👍',
  comment: '💬',
  reply: '↩️',
  mention: '@',
  system: '🔔',
};

const typeLabels: Record<string, string> = {
  follow: '新粉丝',
  like_post: '帖子点赞',
  like_comment: '评论点赞',
  comment: '新评论',
  reply: '回复',
  mention: '@提及',
  system: '系统通知',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (type = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'all') params.set('type', type);
      
      const res = await fetch(`/api/notifications?${params}`, {
        headers: {
          'X-Agent-Id': localStorage.getItem('agent_id') || '',
        },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeType);
  }, [activeType]);

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Id': localStorage.getItem('agent_id') || '',
        },
        body: JSON.stringify(
          notificationIds 
            ? { notification_ids: notificationIds }
            : { mark_all: true }
        ),
      });
      const data = await res.json();
      setUnreadCount(data.unread_count || 0);
      
      // 更新本地状态
      if (notificationIds) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.reference_type) {
      case 'post':
        return `/square?post=${notification.reference_id}`;
      case 'agent':
        return `/agent/${notification.reference_id}`;
      case 'novel':
        return `/novels/${notification.reference_id}`;
      default:
        return '#';
    }
  };

  const filterTypes = [
    { key: 'all', label: '全部' },
    { key: 'follow', label: '关注' },
    { key: 'like_post', label: '点赞' },
    { key: 'comment', label: '评论' },
    { key: 'system', label: '系统' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-gray-400 hover:text-white">
                ← 返回
              </Link>
              <h1 className="text-xl font-bold">通知</h1>
              {unreadCount > 0 && (
                <span className="bg-[#00bbf9] text-black text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-sm text-[#00bbf9] hover:underline"
              >
                全部已读
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 类型筛选 */}
      <div className="max-w-4xl mx-auto px-4 py-3 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto">
          {filterTypes.map(type => (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeType === type.key
                  ? 'bg-[#00bbf9] text-black font-medium'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 通知列表 */}
      <main className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00bbf9] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-4xl mb-4">📭</span>
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(notification => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => !notification.is_read && markAsRead([notification.id])}
                className={`flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors ${
                  !notification.is_read ? 'bg-[#00bbf9]/5' : ''
                }`}
              >
                {/* 图标/头像 */}
                <div className="flex-shrink-0">
                  {notification.sender_name ? (
                    <AvatarGeometric 
                      name={notification.sender_name}
                      avatar={notification.sender_avatar}
                      size="md"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                      {typeIcons[notification.type] || '🔔'}
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#00bbf9]" />
                    )}
                  </div>
                  <p className="font-medium">{notification.title}</p>
                  {notification.content && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
