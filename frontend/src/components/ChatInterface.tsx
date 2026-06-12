'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RichMessageRenderer from './RichMessageRenderer';
import ConversationTimeline, { TimelineEntry, generateTimelineEntry } from './ConversationTimeline';
import { UserInfo } from '@/app/page';
import {
  Send,
  FileText,
  Download,
  BookOpen,
  Ticket,
  Search,
  HelpCircle,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SourceDoc {
  filename: string;
  category: string;
  download_url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentUsed?: string;
  intent?: string;
  sources?: SourceDoc[];
  suggestions?: string[];
  timestamp: Date;
}

interface Props {
  user: UserInfo;
  sessionId: string | null;
  setSessionId: (id: string) => void;
  initialQuery?: string;
  onConversationUpdate: () => void;
}

// ─── Sub Components ─────────────────────────────────────────────────────────────

function AgentBadge({ agent }: { agent: string }) {
  const config: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    policy_agent: { label: 'Policy Expert', bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', icon: <BookOpen size={11} /> },
    rewards_agent: { label: 'Rewards Advisor', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: <FileText size={11} /> },
    ticket_agent: { label: 'Support Desk', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: <Ticket size={11} /> },
    research_agent: { label: 'HR Research', bg: 'bg-violet-50 border-violet-100', text: 'text-violet-700', icon: <Search size={11} /> },
    life_event_agent: { label: 'Life Event Simulator', bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', icon: <Sparkles size={11} /> },
    equity_agent: { label: 'Equity Analyst', bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', icon: <TrendingUp size={11} /> },
  };
  const c = config[agent] || { label: agent, bg: 'bg-gray-50 border-gray-100', text: 'text-gray-600', icon: <HelpCircle size={11} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function SourceCard({ source, token, index }: { source: SourceDoc; token: string; index: number }) {
  const fileIcon = (filename: string) => {
    if (filename.endsWith('.docx')) return '📄';
    if (filename.endsWith('.xlsx')) return '📊';
    if (filename.endsWith('.csv')) return '📋';
    return '📎';
  };

  const categoryLabels: Record<string, string> = {
    benefits: 'Benefits', compensation: 'Compensation',
    leave_attendance: 'Leave & Attendance', reimbursement: 'Reimbursement',
    onboarding: 'Onboarding', compliance: 'Compliance',
    general: 'General', hr_support: 'HR Support', lifecycle: 'Lifecycle',
  };

  const handleDownload = () => {
    fetch(source.download_url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = source.filename;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-50 border border-surface-200 hover:border-brand-200 hover:shadow-card transition-all group"
    >
      <span className="text-base shrink-0">{fileIcon(source.filename)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-brand-800 truncate">{source.filename}</p>
        <p className="text-[10px] text-brand-400">{categoryLabels[source.category] || source.category}</p>
      </div>
      <button
        onClick={handleDownload}
        className="p-1.5 rounded-lg text-brand-300 hover:text-brand-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
        title="Download"
      >
        <Download size={13} />
      </button>
    </motion.div>
  );
}

function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={copyToClipboard}
        className="p-1.5 rounded-lg text-brand-300 hover:text-brand-600 hover:bg-surface-100 transition"
        title="Copy response"
      >
        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      </button>
      <button
        onClick={() => setFeedback('up')}
        className={`p-1.5 rounded-lg transition ${feedback === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-brand-300 hover:text-brand-600 hover:bg-surface-100'}`}
        title="Helpful"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        onClick={() => setFeedback('down')}
        className={`p-1.5 rounded-lg transition ${feedback === 'down' ? 'text-red-500 bg-red-50' : 'text-brand-300 hover:text-brand-600 hover:bg-surface-100'}`}
        title="Not helpful"
      >
        <ThumbsDown size={13} />
      </button>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 py-3"
    >
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 border border-amber-200/50">
        <span className="text-sm">🌼</span>
      </div>
      <div className="flex gap-1.5 items-center pt-2">
        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
        <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
      </div>
    </motion.div>
  );
}

// ─── Main Chat Component ────────────────────────────────────────────────────────

export default function ChatInterface({
  user,
  sessionId,
  setSessionId,
  initialQuery,
  onConversationUpdate,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialQuerySent = useRef(false);

  // Restore chat history from localStorage
  useEffect(() => {
    if (sessionId) {
      try {
        const saved = localStorage.getItem(`chat-${sessionId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed.messages?.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })) || []);
          setTimelineEntries(parsed.timeline?.map((t: TimelineEntry) => ({ ...t, timestamp: new Date(t.timestamp) })) || []);
        }
      } catch { /* skip */ }
    }
  }, [sessionId]);

  // Persist chat history to localStorage
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      try {
        localStorage.setItem(`chat-${sessionId}`, JSON.stringify({ messages, timeline: timelineEntries }));
      } catch { /* quota exceeded, skip */ }
    }
  }, [messages, timelineEntries, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial query from dashboard
  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      initialQuerySent.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    // Add user message to timeline
    const userEntry = generateTimelineEntry(userMessage.id, messageText, 'user');
    setTimelineEntries((prev) => [...prev, userEntry]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error('Request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let agentUsed = '';
      let sources: SourceDoc[] = [];
      let suggestions: string[] = [];
      const msgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: msgId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

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
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              switch (event.type) {
                case 'session':
                  setSessionId(event.session_id);
                  break;
                case 'metadata':
                  agentUsed = event.agent_used;
                  break;
                case 'token':
                  content += event.content;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === msgId ? { ...m, content } : m))
                  );
                  break;
                case 'sources':
                  sources = event.sources || [];
                  break;
                case 'suggestions':
                  suggestions = event.suggestions || [];
                  break;
                case 'done':
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === msgId
                        ? { ...m, agentUsed, sources: sources.length > 0 ? sources : undefined, suggestions: suggestions.length > 0 ? suggestions : undefined }
                        : m
                    )
                  );
                  // Add timeline entries for this exchange
                  if (content) {
                    const assistantEntry = generateTimelineEntry(msgId, content, 'assistant');
                    setTimelineEntries((prev) => [...prev, assistantEntry]);
                    setTimelineOpen(true);
                  }
                  onConversationUpdate();
                  break;
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleTimelineNavigate = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-cyan-300', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-cyan-300', 'ring-offset-2'), 2000);
    }
  };

  const isEmptyState = messages.length === 0;
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            <EmptyState user={user} onSend={sendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-4 rounded-xl transition-all duration-500"
                  >
                    {msg.role === 'user' ? (
                      <UserBubble content={msg.content} name={user.name} />
                    ) : (
                      <AssistantBubble
                        message={msg}
                        token={user.token}
                        isLatest={idx === messages.length - 1}
                        onSuggestionClick={handleSuggestionClick}
                        loading={loading && idx === messages.length - 1 && !msg.content}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && !messages[messages.length - 1]?.content && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 p-4 pb-5">
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-2xl shadow-glass p-1.5 focus-ring transition-all">
              <div className="flex items-end gap-2 px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Daisy about benefits, policies, compensation..."
                  className="flex-1 bg-transparent outline-none text-sm text-brand-800 placeholder:text-brand-300 resize-none leading-relaxed"
                  rows={1}
                  disabled={loading}
                  style={{ maxHeight: 120 }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-brand-800 to-brand-900 text-white hover:from-brand-900 hover:to-brand-950 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-brand-300 mt-2 text-center">
              AI-powered answers from NexaCore policy documents · Always verify with HR for critical decisions
            </p>
          </div>
        </div>
      </div>

      {/* Conversation Timeline (floating) */}
      <ConversationTimeline
        entries={timelineEntries}
        onNavigate={handleTimelineNavigate}
        isOpen={timelineOpen}
        onToggle={() => setTimelineOpen(!timelineOpen)}
      />
    </div>
  );
}

// ─── User Bubble ────────────────────────────────────────────────────────────────

function UserBubble({ content, name }: { content: string; name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-md bg-gradient-to-r from-brand-800 to-brand-900 text-white shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700 shrink-0 mt-1">
        {initials}
      </div>
    </div>
  );
}

// ─── Assistant Bubble ───────────────────────────────────────────────────────────

function AssistantBubble({ message, token, isLatest, onSuggestionClick, loading }: {
  message: Message; token: string; isLatest: boolean; onSuggestionClick: (s: string) => void; loading: boolean;
}) {
  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-amber-200/50">
        <span className="text-sm">🌼</span>
      </div>
      <div className="flex-1 min-w-0">
        {/* Agent badge */}
        {message.agentUsed && (
          <div className="mb-1.5">
            <AgentBadge agent={message.agentUsed} />
          </div>
        )}

        {/* Content */}
        <div className="chat-prose">
          <RichMessageRenderer content={message.content} />
        </div>

        {/* Sources inline */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-surface-100">
            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={11} />
              Referenced Documents
            </p>
            <div className="space-y-1.5">
              {message.sources.map((src, idx) => (
                <SourceCard key={idx} source={src} token={token} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {message.content && <MessageActions content={message.content} />}

        {/* Follow-up suggestions */}
        {isLatest && message.suggestions && message.suggestions.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {message.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(suggestion)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-50 border border-surface-200 text-brand-600 hover:bg-white hover:border-brand-300 hover:shadow-card transition-all group/chip"
              >
                <span>{suggestion}</span>
                <ArrowRight size={11} className="text-brand-300 group-hover/chip:text-brand-500 transition" />
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ user, onSend }: { user: UserInfo; onSend: (q: string) => void }) {
  const suggestions = user.role === 'hr'
    ? [
        'Can you give me a list of grade 4 employees whose pay scale might not be up to the mark?',
        'Run a pay equity analysis across Engineering locations',
        'Research current government parental leave policies',
        'Benchmark our health benefits against competitors',
      ]
    : [
        'My manager asked me to relocate to Singapore office, what kind of changes am I looking at?',
        'Hey Daisy, can you quickly let me know if my compensation is updated post my promotion?',
        'What healthcare benefits am I eligible for?',
        'How does the stock option vesting work?',
      ];

  return (
    <div className="h-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center mx-auto mb-5 shadow-glow-accent">
          <span className="text-2xl">🌼</span>
        </div>
        <h2 className="text-xl font-bold text-brand-900 mb-1.5">
          Hey, I&apos;m Daisy! 👋
        </h2>
        <p className="text-sm text-brand-400 mb-8">
          Your Total Rewards companion. Ask me anything about benefits, policies, or compensation — I&apos;ve got you covered.
        </p>

        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="text-left px-4 py-3 rounded-xl border border-surface-200 hover:border-brand-200 hover:bg-surface-50 hover:shadow-card transition-all group"
            >
              <span className="text-sm text-brand-600 group-hover:text-brand-800 transition">{s}</span>
              <ArrowRight size={13} className="inline ml-2 text-brand-200 group-hover:text-brand-400 transition" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
