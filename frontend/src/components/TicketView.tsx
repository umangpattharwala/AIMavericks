'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserInfo } from '@/app/page';
import RichMessageRenderer from './RichMessageRenderer';
import {
  Ticket,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TicketData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

interface Props {
  user: UserInfo;
  onBack: () => void;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'form';
  content: string;
  formData?: FormField[];
}

interface FormField {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: string[];
  value: string;
  required: boolean;
}

const CATEGORIES = ['Benefits', 'Compliance', 'Leave', 'Onboarding', 'Payroll', 'Reimbursement'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_ICON: Record<string, { icon: typeof Clock; color: string }> = {
  Open: { icon: AlertCircle, color: 'text-blue-500' },
  'In Progress': { icon: Loader2, color: 'text-amber-500' },
  'Pending Info': { icon: Clock, color: 'text-orange-500' },
  Resolved: { icon: CheckCircle2, color: 'text-emerald-500' },
  Closed: { icon: CheckCircle2, color: 'text-gray-400' },
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function TicketView({ user, onBack }: Props) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('new');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Describe your issue or request in a few sentences. I\'ll categorize it and create a ticket for you. If I need more information, I\'ll ask.',
    },
  ]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets/my', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch { /* skip */ }
    finally { setLoadingTickets(false); }
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || submitting) return;

    setInput('');
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);

    // If ticket was already created, this is a follow-up - just acknowledge
    if (ticketCreated) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Your ticket has already been submitted. You can view it in the "My Tickets" tab. Would you like to raise another ticket?' },
      ]);
      return;
    }

    setSubmitting(true);

    try {
      // Send the description to create a ticket
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ description: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setTicketCreated(true);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Your ticket has been created successfully!\n\n- **Ticket ID**: ${data.ticket_id}\n- **Category**: ${data.category}\n- **Priority**: ${data.priority}\n- **Status**: Open\n\nI've inferred the category and priority from your description. If you'd like to adjust these, use the form below.`,
          },
          {
            id: (Date.now() + 2).toString(),
            role: 'form',
            content: '',
            formData: [
              { key: 'category', label: 'Category', type: 'select', options: CATEGORIES, value: data.category, required: true },
              { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES, value: data.priority, required: true },
            ],
          },
        ]);
        fetchTickets();
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I couldn\'t create the ticket. Please try again.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-surface-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-brand-500 hover:text-brand-700 transition">← Back</button>
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-brand-600" />
            <h1 className="text-sm font-bold text-brand-800">Support Tickets</h1>
          </div>
        </div>
        <div className="flex gap-1 bg-surface-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'new' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
          >
            <Plus size={11} className="inline mr-1" />New Ticket
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${activeTab === 'list' ? 'bg-white shadow-sm text-brand-800' : 'text-brand-500 hover:text-brand-700'}`}
          >
            My Tickets {tickets.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-brand-100 text-brand-600 rounded text-[9px]">{tickets.length}</span>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'new' ? (
          <div className="h-full flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {submitting && (
                  <div className="flex gap-1.5 items-center py-2">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full typing-dot" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 px-6 py-3 border-t border-surface-200">
              <div className="max-w-2xl mx-auto flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ticketCreated ? 'Anything else?' : 'Describe your issue or request...'}
                  className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 text-sm text-brand-800 placeholder:text-brand-300 outline-none resize-none focus:border-brand-300 transition"
                  rows={2}
                  disabled={submitting}
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-brand-800 to-brand-900 text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <TicketList tickets={tickets} loading={loadingTickets} />
        )}
      </div>
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-gradient-to-r from-brand-800 to-brand-900 text-white">
          <p className="text-sm leading-relaxed">{msg.content}</p>
        </div>
      </div>
    );
  }

  if (msg.role === 'form' && msg.formData) {
    return <InlineForm fields={msg.formData} />;
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-surface-50 border border-surface-100">
        <div className="chat-prose text-sm">
          <RichMessageRenderer content={msg.content} />
        </div>
      </div>
    </div>
  );
}

// ─── Inline Form ────────────────────────────────────────────────────────────────

function InlineForm({ fields }: { fields: FormField[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-brand-100 shadow-card"
    >
      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">Adjust if needed</p>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-[10px] font-medium text-brand-600 mb-0.5 block">{field.label}</label>
            {field.type === 'select' ? (
              <div className="relative">
                <select
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  disabled={saved}
                  className="w-full appearance-none bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-xs text-brand-800 outline-none focus:border-brand-300 transition pr-7"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-300 pointer-events-none" />
              </div>
            ) : (
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                disabled={saved}
                className="w-full bg-surface-50 border border-surface-200 rounded-lg px-3 py-1.5 text-xs text-brand-800 outline-none focus:border-brand-300 transition"
              />
            )}
          </div>
        ))}
      </div>
      {!saved && (
        <button
          onClick={() => setSaved(true)}
          className="mt-3 px-3 py-1.5 rounded-lg bg-brand-800 text-white text-[11px] font-medium hover:bg-brand-900 transition"
        >
          Confirm
        </button>
      )}
      {saved && (
        <p className="mt-2 text-[10px] text-emerald-600 font-medium">✓ Updated</p>
      )}
    </motion.div>
  );
}

// ─── Ticket List ────────────────────────────────────────────────────────────────

function TicketList({ tickets, loading }: { tickets: TicketData[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <Ticket size={32} className="text-brand-200 mb-3" />
        <p className="text-sm font-medium text-brand-600">No tickets yet</p>
        <p className="text-xs text-brand-400 mt-1">Create your first ticket using the "New Ticket" tab</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto px-6 py-4">
      <div className="max-w-2xl mx-auto space-y-2">
        {tickets.map((ticket) => {
          const statusCfg = STATUS_ICON[ticket.status] || STATUS_ICON.Open;
          const Icon = statusCfg.icon;
          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 rounded-xl border border-surface-200 bg-white hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-brand-400">{ticket.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-50 text-brand-600">{ticket.category}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      ticket.priority === 'Critical' ? 'bg-red-50 text-red-600' :
                      ticket.priority === 'High' ? 'bg-orange-50 text-orange-600' :
                      ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>{ticket.priority}</span>
                  </div>
                  <p className="text-xs font-medium text-brand-800 leading-relaxed line-clamp-2">{ticket.title}</p>
                  <p className="text-[10px] text-brand-400 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className={`flex items-center gap-1 ${statusCfg.color}`}>
                  <Icon size={12} />
                  <span className="text-[10px] font-medium">{ticket.status}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
