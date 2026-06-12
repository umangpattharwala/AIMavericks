'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Ticket,
  Search,
  Calendar,
  MapPin,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Send,
} from 'lucide-react';
import { UserInfo } from '@/app/page';
import RichMessageRenderer from './RichMessageRenderer';
import FloatingPanel from './FloatingPanel';

interface EmployeeProfile {
  employee_id: string;
  name: string;
  role: string;
  department: string;
  grade: string;
  location: string;
  employment_type: string;
  leave_balance?: number;
  joining_date?: string;
  work_mode?: string;
  designation?: string;
}

interface Props {
  user: UserInfo;
  onStartChat: (query?: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <motion.div
      variants={item}
      className="glass rounded-2xl p-4 shadow-card hover-lift cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-brand-900">{value}</p>
      <p className="text-xs text-brand-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-brand-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, desc, onClick }: {
  icon: any; label: string; desc: string; onClick: () => void;
}) {
  return (
    <motion.button
      variants={item}
      onClick={onClick}
      className="glass rounded-2xl p-4 text-left shadow-card hover-lift group transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition">
          <Icon size={18} />
        </div>
        <ArrowRight size={14} className="text-brand-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-800">{label}</p>
      <p className="text-xs text-brand-400 mt-0.5 leading-relaxed">{desc}</p>
    </motion.button>
  );
}

export default function Dashboard({ user, onStartChat }: Props) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});
  }, [user.token]);

  const firstName = user.name.split(' ')[0];
  const tenure = profile?.joining_date
    ? `${Math.floor((Date.now() - new Date(profile.joining_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}+ years`
    : '—';

  const quickActions = user.role === 'hr'
    ? [
        { icon: Search, label: 'Policy Research', desc: 'Research government policies & benchmarks', query: 'Research current government policies on parental leave benefits' },
        { icon: TrendingUp, label: 'Equity Analysis', desc: 'Detect pay gaps & compensation anomalies', query: 'Run a pay equity analysis across Engineering department locations' },
        { icon: FileText, label: 'Policy Overview', desc: 'Browse internal policy documents', query: 'Give me an overview of all NexaCore HR policies' },
        { icon: Ticket, label: 'Ticket Review', desc: 'Review pending HR tickets', query: 'Show me the status of recent HR support tickets' },
      ]
    : [
        { icon: MessageSquare, label: 'Ask AI Assistant', desc: 'Get instant answers about your benefits', query: undefined },
        { icon: FileText, label: 'My Benefits', desc: 'Healthcare, dental, vision & more', query: 'What healthcare benefits am I eligible for?' },
        { icon: Sparkles, label: 'Life Event Planner', desc: 'Simulate impact of life changes on benefits', query: 'I\'m planning to relocate — what happens to my benefits?' },
        { icon: Ticket, label: 'Raise a Ticket', desc: 'Report issues or request changes', query: '__TICKET__' },
      ];

  const faqs = FAQ_PROMPTS[user.role] || FAQ_PROMPTS.employee;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-accent-500" />
              <span className="text-xs font-medium text-accent-600 uppercase tracking-wider">
                {user.role === 'hr' ? 'HR Professional' : 'Employee'} Portal
              </span>
            </div>
            <h1 className="text-3xl font-bold text-brand-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-brand-500 mt-1">
              I&apos;m Daisy, your Total Rewards & Benefits companion. How can I help today?
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
          >
            <StatCard icon={Briefcase} label="Grade" value={profile?.grade || '—'} sub={profile?.designation || profile?.department} color="bg-blue-50 text-blue-600" />
            <StatCard icon={Calendar} label="Leave Balance" value={profile?.leave_balance !== undefined ? `${profile.leave_balance}` : '—'} sub="days remaining" color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={MapPin} label="Location" value={profile?.location?.split(',')[0] || '—'} sub={profile?.work_mode || ''} color="bg-violet-50 text-violet-600" />
            <StatCard icon={TrendingUp} label="Tenure" value={tenure} sub={profile?.employment_type || ''} color="bg-amber-50 text-amber-600" />
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4">
            <h2 className="text-sm font-semibold text-brand-700 mb-3">Quick Actions</h2>
          </motion.div>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {quickActions.map((action) => (
              <QuickAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                desc={action.desc}
                onClick={() => onStartChat(action.query)}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Slim inline chat bar at the bottom */}
      <div className="shrink-0 border-t border-surface-200 bg-white/80 backdrop-blur-sm px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <InlineChatBar user={user} onExpandChat={onStartChat} />
        </div>
      </div>

      {/* Quick Prompts - floating panel on right */}
      <FloatingPanel title="QUICK PROMPTS" isOpen={faqOpen} onToggle={() => setFaqOpen(!faqOpen)}>
        <div className="px-3 py-2 space-y-0.5">
          {faqs.map((faq, idx) => (
            <button
              key={idx}
              onClick={() => { setFaqOpen(false); onStartChat(faq.prompt); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-[11px] text-brand-600 hover:bg-brand-50 hover:text-brand-800 transition-all"
            >
              {faq.label}
            </button>
          ))}
        </div>
      </FloatingPanel>
    </div>
  );
}

// ─── FAQ Prompts Data ───────────────────────────────────────────────────────────

const FAQ_PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  employee: [
    { label: '🌟 My manager asked me to relocate to Singapore — what changes?', prompt: 'My manager asked me to relocate to Singapore office, I am a bit sceptical, as per our policies, what kind of changes am I looking at?' },
    { label: '🌟 Is my compensation updated post my promotion?', prompt: 'Hey Daisy, can you quickly let me know if my compensation is updated post my promotion?' },
    { label: 'What healthcare benefits am I eligible for?', prompt: 'What healthcare benefits am I eligible for?' },
    { label: 'How does stock option vesting work?', prompt: 'How does the stock option vesting schedule work?' },
    { label: 'What reimbursements can I claim?', prompt: 'What reimbursements can I claim and how?' },
    { label: 'What if I switch from full-time to part-time?', prompt: 'What would happen to my benefits if I switch from full-time to part-time?' },
    { label: 'What is the parental leave policy?', prompt: 'What is the parental leave policy?' },
    { label: 'How do I raise a support ticket?', prompt: 'I want to raise a support ticket' },
  ],
  hr: [
    { label: '🌟 Grade 4 employees with pay below par?', prompt: 'Can you give me a list of grade 4 employees whose pay scale might not be up to the mark?' },
    { label: 'Run pay equity analysis', prompt: 'Analyze pay equity across Engineering department by location' },
    { label: 'Detect under-leveled employees', prompt: 'Detect grade anomalies — flag employees who may be under-leveled based on tenure' },
    { label: 'Generate compliance equity report', prompt: 'Generate a compensation equity compliance report for UK Gender Pay Gap submission' },
    { label: 'Research government parental leave policies', prompt: 'Research current government policies on parental leave' },
    { label: 'Benchmark healthcare benefits', prompt: 'Benchmark our healthcare benefits against industry' },
    { label: 'Workforce demographics breakdown', prompt: 'Give me a workforce demographics breakdown by department, grade, and location' },
    { label: 'Show recent HR support tickets', prompt: 'Show recent HR support tickets and their status' },
  ],
};

// ─── Inline Chat Bar (slim) ─────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function InlineChatBar({ user, onExpandChat }: { user: UserInfo; onExpandChat: (query?: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    // If more than 2 exchanges, push to full chat
    if (messages.length >= 4) {
      onExpandChat(msgText);
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ message: msgText, session_id: null, stream: true }),
      });

      if (!res.ok) throw new Error('Failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      const msgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: msgId, role: 'assistant', content: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6).trim());
              if (event.type === 'token') {
                content += event.content;
                setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content } : m)));
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div>
      {/* Inline response bubble (if any) */}
      {messages.length > 0 && (
        <div className="mb-2 max-h-32 overflow-y-auto space-y-2">
          {messages.slice(-2).map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[70%] px-3 py-1.5 rounded-lg rounded-br-sm bg-brand-800 text-white text-xs">{msg.content}</div>
              ) : (
                <div className="max-w-[85%] px-3 py-1.5 rounded-lg rounded-bl-sm bg-surface-50 border border-surface-100 text-xs">
                  <RichMessageRenderer content={msg.content} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 56) + 'px'; }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about benefits, policies, compensation..."
          className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-xs text-brand-800 placeholder:text-brand-300 outline-none resize-none focus:border-brand-300 transition"
          rows={1}
          disabled={loading}
          style={{ maxHeight: 56 }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-brand-800 to-brand-900 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Send size={13} />
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => onExpandChat()}
            className="text-[10px] text-brand-500 hover:text-brand-700 whitespace-nowrap px-2"
          >
            Full chat →
          </button>
        )}
      </div>
    </div>
  );
}
