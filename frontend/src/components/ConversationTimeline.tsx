'use client';

import { motion } from 'framer-motion';
import FloatingPanel from './FloatingPanel';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TimelineEntry {
  id: string;
  messageId: string;
  summary: string;
  keywords: string[];
  timestamp: Date;
  type: 'question' | 'answer' | 'insight';
}

interface Props {
  entries: TimelineEntry[];
  onNavigate: (messageId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ─── Summary Generator ──────────────────────────────────────────────────────────

export function generateTimelineEntry(
  messageId: string,
  content: string,
  role: 'user' | 'assistant'
): TimelineEntry {
  const summary = extractSummary(content, role);
  const keywords = extractKeywords(content);
  const type: TimelineEntry['type'] = role === 'user' ? 'question' : content.length > 200 ? 'insight' : 'answer';

  return {
    id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    messageId,
    summary,
    keywords,
    timestamp: new Date(),
    type,
  };
}

function extractSummary(content: string, role: 'user' | 'assistant'): string {
  if (role === 'user') {
    // For user messages, use the first sentence or first 60 chars
    const firstSentence = content.split(/[.?!]\s/)[0];
    return firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence;
  }

  // For assistant messages, try to extract the key point
  const lines = content.split('\n').filter((l) => l.trim());
  
  // Look for a heading
  const heading = lines.find((l) => l.startsWith('#'));
  if (heading) return heading.replace(/^#+\s*/, '').slice(0, 60);

  // Look for bold text as key point
  const boldMatch = content.match(/\*\*(.+?)\*\*/);
  if (boldMatch && boldMatch[1].length < 60) return boldMatch[1];

  // Use first meaningful line
  const firstLine = lines.find((l) => l.length > 10 && !l.startsWith('|') && !l.startsWith('-'));
  if (firstLine) return firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;

  return content.slice(0, 57) + '...';
}

function extractKeywords(content: string): string[] {
  // Extract keywords from bold text, headings, and key terms
  const keywords: string[] = [];
  
  // From bold text
  const bolds = content.match(/\*\*(.+?)\*\*/g);
  if (bolds) {
    bolds.slice(0, 3).forEach((b) => {
      const word = b.replace(/\*\*/g, '').trim();
      if (word.length <= 20 && !keywords.includes(word)) keywords.push(word);
    });
  }

  // From headings
  const headings = content.match(/^#{1,3}\s+(.+)/gm);
  if (headings) {
    headings.slice(0, 2).forEach((h) => {
      const word = h.replace(/^#+\s*/, '').trim();
      if (word.length <= 20 && !keywords.includes(word)) keywords.push(word);
    });
  }

  // HR-specific keywords
  const hrTerms = ['leave', 'benefits', 'insurance', 'compensation', 'policy', 'reimbursement', 'ticket', 'vesting', 'stock', 'health', 'dental', 'vision', 'maternity', 'paternity', 'PTO', 'salary', 'bonus', 'CTC', 'grade'];
  const lower = content.toLowerCase();
  for (const term of hrTerms) {
    if (lower.includes(term.toLowerCase()) && !keywords.some((k) => k.toLowerCase() === term.toLowerCase())) {
      keywords.push(term);
      if (keywords.length >= 4) break;
    }
  }

  return keywords.slice(0, 4);
}

// ─── Timeline Component ─────────────────────────────────────────────────────────

export default function ConversationTimeline({ entries, onNavigate, isOpen, onToggle }: Props) {
  if (entries.length === 0) return null;

  return (
    <FloatingPanel title="TIMELINE" isOpen={isOpen} onToggle={onToggle}>
      <div className="px-4 py-3">
        <div className="relative">
          {/* Cyan connecting line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-[2px] overflow-hidden">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full h-full"
              style={{
                background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.5) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(6, 182, 212, 0.5) 100%)',
                backgroundSize: '100% 200%',
                animation: 'timelinePulse 3s ease-in-out infinite',
              }}
            />
          </div>

          {/* Entries */}
          <div className="space-y-1">
            {entries.map((entry, idx) => (
              <TimelineNode
                key={entry.id}
                entry={entry}
                index={idx}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-surface-100 bg-surface-50/50 mt-auto">
        <p className="text-[10px] text-brand-400 text-center">
          {entries.length} point{entries.length !== 1 ? 's' : ''} · Click to navigate
        </p>
      </div>
    </FloatingPanel>
  );
}

// ─── Timeline Node ──────────────────────────────────────────────────────────────

function TimelineNode({ entry, index, onNavigate }: { entry: TimelineEntry; index: number; onNavigate: (id: string) => void }) {
  const typeConfig = {
    question: { dot: 'bg-brand-500', label: 'Q' },
    answer: { dot: 'bg-cyan-500', label: 'A' },
    insight: { dot: 'bg-amber-500', label: '★' },
  };
  const cfg = typeConfig[entry.type];

  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onNavigate(entry.messageId)}
      className="w-full flex items-start gap-3 py-2 px-1 text-left rounded-xl hover:bg-cyan-50/50 transition-all group relative"
    >
      {/* Dot */}
      <div className="relative z-10 mt-0.5 shrink-0">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${cfg.dot} shadow-sm ring-2 ring-white`}>
          {cfg.label}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-brand-700 leading-snug group-hover:text-brand-900 transition line-clamp-2">
          {entry.summary}
        </p>
        {entry.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-100"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
        <p className="text-[9px] text-brand-300 mt-1">
          {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.button>
  );
}
