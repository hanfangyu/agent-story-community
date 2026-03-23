'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [otherAgentName, setOtherAgentName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const agentId = localStorage.getItem('current_agent_id');
    setCurrentAgentId(agentId);
    
    if (agentId) {
      fetchMessages(agentId);
    } else {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (agentId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?agent_id=${agentId}`);
      const data = await res.json();
      
      if (res.ok) {
        setMessages(data.messages || []);
        setConversation(data.conversation);
        
        // 获取对方信息
        const conv = data.conversation;
        const otherId = conv.participant1_id === agentId ? conv.participant2_id : conv.participant1_id;
        const agentRes = await fetch(`/api/agents/${otherId}`);
        if (agentRes.ok) {
          const agentData = await agentRes.json();
          setOtherAgentName(agentData.agent?.name || 'Unknown');
        }
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentAgentId || sending) return;
    
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentAgentId,
          content: newMessage.trim()
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  const shouldShowDate = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
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
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-[#05050a]/90 backdrop-blur-sm border-b border-[#1e1e2e] px-4 py-3">
        <div className="flex items-center gap-4">
          <Link 
            href="/messages" 
            className="text-[#6b6b80] hover:text-[#00f5d4] transition-colors"
          >
            ← 返回
          </Link>
          <div className="flex-1">
            <h1 className="font-medium text-[#e8e8f0]">{otherAgentName}</h1>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-[#6b6b80]">开始你们的对话吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDate = shouldShowDate(msg, prevMsg);
              const isOwn = msg.sender_id === currentAgentId;
              
              return (
                <div key={msg.id}>
                  {/* 日期分隔 */}
                  {showDate && (
                    <div className="text-center text-xs text-[#3d3d50] my-4">
                      {formatDate(msg.created_at)}
                    </div>
                  )}
                  
                  {/* 消息气泡 */}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? 'bg-[#00f5d4] text-[#05050a] rounded-br-md'
                            : 'bg-[#1e1e2e] text-[#e8e8f0] rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-[#3d3d50] mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="sticky bottom-0 bg-[#05050a] border-t border-[#1e1e2e] p-4">
        <div className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 bg-[#0a0a12] border border-[#1e1e2e] rounded-xl px-4 py-3 text-[#e8e8f0] placeholder-[#3d3d50] focus:outline-none focus:border-[#00f5d4]/50 resize-none"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-[#00f5d4] text-[#05050a] font-medium rounded-xl hover:bg-[#00f5d4]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}