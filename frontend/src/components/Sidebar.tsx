'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  LayoutDashboard,
  LogOut,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { UserInfo } from '@/app/page';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Props {
  user: UserInfo;
  conversations: Conversation[];
  activeSessionId: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onGoHome: () => void;
  onLogout: () => void;
  onAdmin: () => void;
  activeView: 'dashboard' | 'chat' | 'tickets' | 'admin';
}

export default function Sidebar({
  user,
  conversations,
  activeSessionId,
  collapsed,
  onToggle,
  onNewChat,
  onSelectConversation,
  onGoHome,
  onLogout,
  onAdmin,
  activeView,
}: Props) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="h-full bg-sidebar flex flex-col overflow-hidden shrink-0 relative"
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white shadow-md border border-surface-200 flex items-center justify-center text-brand-500 hover:text-brand-700 transition"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 shadow-sm border border-amber-200/30">
          <span className="text-lg">🌼</span>
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="min-w-0"
          >
            <p className="text-sm font-bold text-white tracking-tight">Daisy</p>
            <p className="text-[10px] text-brand-400 font-medium uppercase tracking-widest">
              NexaCore · Rewards AI
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-2 mt-2 space-y-1">
        <button
          onClick={onGoHome}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'dashboard'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-brand-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'chat' && !activeSessionId
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-brand-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Plus size={18} className="shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>

        {user.role === 'hr' && (
          <button
            onClick={onAdmin}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeView === 'admin'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-brand-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} className="shrink-0" />
            {!collapsed && <span>Admin</span>}
          </button>
        )}
      </div>

      {/* Conversation History */}
      {!collapsed && (
        <div className="flex-1 mt-6 px-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-brand-500 uppercase tracking-widest mb-2">
            History
          </p>
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-brand-500">No conversations yet</p>
            ) : (
              conversations.slice(0, 25).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all truncate ${
                    activeSessionId === conv.id
                      ? 'bg-white/10 text-white'
                      : 'text-brand-400 hover:bg-white/5 hover:text-brand-200'
                  }`}
                >
                  <MessageSquare size={13} className="shrink-0 opacity-50" />
                  <span className="truncate">{conv.title || 'Untitled'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-brand-400 truncate">{user.employeeId}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-brand-400 hover:text-white hover:bg-white/10 transition"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
