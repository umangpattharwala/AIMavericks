'use client';

import { useState, useEffect, useCallback } from 'react';
import LoginScreen from '@/components/LoginScreen';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ChatInterface from '@/components/ChatInterface';
import TicketView from '@/components/TicketView';
import AdminConsole from '@/components/admin/AdminConsole';

export interface UserInfo {
  token: string;
  employeeId: string;
  name: string;
  role: 'employee' | 'hr';
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('nexacore-user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [view, setView] = useState<'dashboard' | 'chat' | 'tickets' | 'admin'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  // Persist user session
  useEffect(() => {
    if (user) {
      localStorage.setItem('nexacore-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nexacore-user');
    }
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const handleStartChat = (query?: string) => {
    if (query === '__TICKET__') {
      setView('tickets');
      return;
    }
    setView('chat');
    setSessionId(null);
    setInitialQuery(query);
  };

  const handleNewChat = () => {
    setView('chat');
    setSessionId(null);
    setInitialQuery(undefined);
  };

  const handleSelectConversation = (id: string) => {
    setView('chat');
    setSessionId(id);
    setInitialQuery(undefined);
  };

  const handleGoHome = () => {
    setView('dashboard');
    setInitialQuery(undefined);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-mesh">
      <Sidebar
        user={user}
        conversations={conversations}
        activeSessionId={sessionId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onGoHome={handleGoHome}
        onLogout={() => setUser(null)}
        onAdmin={() => setView('admin')}
        activeView={view}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {view === 'dashboard' ? (
          <Dashboard user={user} onStartChat={handleStartChat} />
        ) : view === 'tickets' ? (
          <TicketView user={user} onBack={() => setView('dashboard')} />
        ) : view === 'admin' ? (
          <AdminConsole />
        ) : (
          <ChatInterface
            key={sessionId || 'new'}
            user={user}
            sessionId={sessionId}
            setSessionId={setSessionId}
            initialQuery={initialQuery}
            onConversationUpdate={fetchConversations}
          />
        )}
      </main>
    </div>
  );
}
