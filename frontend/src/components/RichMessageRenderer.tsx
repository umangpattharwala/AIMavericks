'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  ChevronDown,
  ArrowUpDown,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ContentBlock {
  type: 'heading' | 'table' | 'kv-cards' | 'steps' | 'metrics' | 'prose';
  heading?: string;
  headingLevel?: number;
  content: string;
  data?: Record<string, string>[];
  kvPairs?: { key: string; value: string }[];
  steps?: { title: string; description: string }[];
  metrics?: { label: string; value: number; unit?: string; max?: number }[];
}

// ─── Parse markdown into structured blocks ──────────────────────────────────────

function parseContentBlocks(markdown: string): ContentBlock[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split('\n');
  const blocks: ContentBlock[] = [];
  let currentLines: string[] = [];
  let currentHeading: string | undefined;
  let currentHeadingLevel: number | undefined;

  const flushBlock = () => {
    if (currentLines.length === 0) return;
    const text = currentLines.join('\n').trim();
    if (!text) { currentLines = []; return; }

    const block = classifyBlock(text, currentHeading, currentHeadingLevel);
    if (block) blocks.push(block);
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushBlock();
      currentHeading = headingMatch[2].trim();
      currentHeadingLevel = headingMatch[1].length;
      continue;
    }
    currentLines.push(line);
  }
  flushBlock();

  return blocks;
}

function classifyBlock(text: string, heading?: string, headingLevel?: number): ContentBlock | null {
  // Check for markdown table
  const tableData = parseTable(text);
  if (tableData && tableData.length > 0) {
    return { type: 'table', heading, headingLevel, content: text, data: tableData };
  }

  // Check for key-value pairs (bullet list with bold key: value)
  const kvPairs = parseKVPairs(text);
  if (kvPairs && kvPairs.length >= 2) {
    // Check if values contain numbers/percentages → metrics
    const metrics = extractMetrics(kvPairs);
    if (metrics && metrics.length >= 2) {
      return { type: 'metrics', heading, headingLevel, content: text, metrics };
    }
    return { type: 'kv-cards', heading, headingLevel, content: text, kvPairs };
  }

  // Check for numbered steps (1. **Title** - description)
  const steps = parseSteps(text);
  if (steps && steps.length >= 2) {
    return { type: 'steps', heading, headingLevel, content: text, steps };
  }

  // Default: prose
  return { type: 'prose', heading, headingLevel, content: text };
}

function parseTable(text: string): Record<string, string>[] | null {
  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 3) return null;

  // Validate separator line
  const sepLine = lines[1];
  if (!sepLine.match(/\|[\s\-:]+\|/)) return null;

  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);
  if (headers.length === 0) return null;

  const rows: Record<string, string>[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });
    rows.push(row);
  }

  return rows.length > 0 ? rows : null;
}

function parseKVPairs(text: string): { key: string; value: string }[] | null {
  const lines = text.split('\n');
  const pairs: { key: string; value: string }[] = [];

  for (const line of lines) {
    // Pattern: - **Key**: Value or • **Key**: Value or * **Key**: Value
    const match = line.match(/^[-•*]\s+\*\*(.+?)\*\*[:\s]+(.+)/);
    if (match) {
      pairs.push({ key: match[1].trim(), value: match[2].trim() });
      continue;
    }
    // Pattern: - Key: Value (without bold)
    const match2 = line.match(/^[-•*]\s+([^:]+?):\s+(.+)/);
    if (match2 && !match2[1].includes('http')) {
      pairs.push({ key: match2[1].trim(), value: match2[2].trim() });
    }
  }

  return pairs.length >= 2 ? pairs : null;
}

function extractMetrics(pairs: { key: string; value: string }[]): { label: string; value: number; unit?: string; max?: number }[] | null {
  const metrics: { label: string; value: number; unit?: string; max?: number }[] = [];

  for (const pair of pairs) {
    // Match patterns like "20 days", "₹5,00,000", "85%", "$1,200"
    const numMatch = pair.value.match(/([\d,]+\.?\d*)\s*(days?|%|months?|years?|hours?|lakhs?|lakh|cr|crore)?/i);
    const currencyMatch = pair.value.match(/[₹$€£]([\d,]+\.?\d*)/);
    
    if (currencyMatch) {
      const val = parseFloat(currencyMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) {
        metrics.push({ label: pair.key, value: val, unit: pair.value.match(/[₹$€£]/)?.[0] || '' });
      }
    } else if (numMatch) {
      const val = parseFloat(numMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) {
        const unit = numMatch[2] || '';
        const max = unit === '%' ? 100 : undefined;
        metrics.push({ label: pair.key, value: val, unit, max });
      }
    }
  }

  return metrics.length >= 2 ? metrics : null;
}

function parseSteps(text: string): { title: string; description: string }[] | null {
  const lines = text.split('\n');
  const steps: { title: string; description: string }[] = [];

  for (const line of lines) {
    // Pattern: 1. **Title** - Description or 1. **Title**: Description
    const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*[\s\-:]+(.+)/);
    if (match) {
      steps.push({ title: match[1].trim(), description: match[2].trim() });
    }
  }

  return steps.length >= 2 ? steps : null;
}

// ─── Render Components ──────────────────────────────────────────────────────────

const CHART_COLORS = ['#0072CE', '#003A70', '#0891b2', '#059669', '#d97706', '#7c3aed', '#dc2626'];

function InteractiveTable({ data, heading }: { data: Record<string, string>[]; heading?: string }) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const headers = useMemo(() => Object.keys(data[0] || {}), [data]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey] || '';
      const bVal = b[sortKey] || '';
      // Try numeric sort
      const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
      const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-xl border border-surface-200 overflow-hidden shadow-card"
    >
      {heading && (
        <div className="px-4 py-2.5 bg-surface-50 border-b border-surface-100">
          <h4 className="text-xs font-semibold text-brand-700">{heading}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-brand-50/50">
              {headers.map((h) => (
                <th
                  key={h}
                  onClick={() => toggleSort(h)}
                  className="px-3 py-2.5 text-left font-semibold text-brand-700 cursor-pointer hover:bg-brand-100/50 transition select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {h}
                    <ArrowUpDown size={10} className={`${sortKey === h ? 'text-brand-500' : 'text-brand-200'}`} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={i}
                className={`border-t border-surface-100 transition hover:bg-brand-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/30'}`}
              >
                {headers.map((h) => (
                  <td key={h} className="px-3 py-2.5 text-brand-700">
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 bg-surface-50 border-t border-surface-100 text-[10px] text-brand-300">
        {data.length} row{data.length !== 1 ? 's' : ''} · Click column header to sort
      </div>
    </motion.div>
  );
}

function KVCards({ pairs, heading }: { pairs: { key: string; value: string }[]; heading?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3"
    >
      {heading && (
        <h4 className="text-xs font-semibold text-brand-700 mb-2 flex items-center gap-1.5">
          <Info size={12} className="text-brand-400" />
          {heading}
        </h4>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pairs.map((pair, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="px-3.5 py-2.5 rounded-xl border border-surface-200 bg-white hover:border-brand-200 hover:shadow-card transition-all"
          >
            <p className="text-[10px] font-medium text-brand-400 uppercase tracking-wide">{pair.key}</p>
            <p className="text-sm font-semibold text-brand-800 mt-0.5">{pair.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function MetricsDisplay({ metrics, heading }: { metrics: { label: string; value: number; unit?: string; max?: number }[]; heading?: string }) {
  const [showChart, setShowChart] = useState(false);

  // Check if data makes sense for a bar chart (similar units)
  const hasConsistentUnits = metrics.every((m) => m.unit === metrics[0].unit);
  const chartData = metrics.map((m) => ({ name: m.label, value: m.value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3"
    >
      {heading && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
            <TrendingUp size={12} className="text-brand-400" />
            {heading}
          </h4>
          {hasConsistentUnits && metrics.length >= 2 && (
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-[10px] font-medium text-brand-500 hover:text-brand-700 transition px-2 py-0.5 rounded-md hover:bg-brand-50"
            >
              {showChart ? 'Show Cards' : 'Show Chart'}
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showChart ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 180 }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-surface-200 bg-white p-3 overflow-hidden"
          >
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }}
                  formatter={(value) => [`${value} ${metrics[0].unit || ''}`, '']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:shadow-card transition-all"
              >
                <p className="text-[10px] font-medium text-brand-400 uppercase tracking-wide truncate">{m.label}</p>
                <p className="text-base font-bold text-brand-800 mt-0.5">
                  {m.unit && ['₹', '$', '€', '£'].includes(m.unit) && m.unit}
                  {m.value.toLocaleString()}
                  {m.unit && !['₹', '$', '€', '£'].includes(m.unit) && ` ${m.unit}`}
                </p>
                {m.max && (
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepCards({ steps, heading }: { steps: { title: string; description: string }[]; heading?: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3"
    >
      {heading && (
        <h4 className="text-xs font-semibold text-brand-700 mb-2">{heading}</h4>
      )}
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-surface-200 bg-white overflow-hidden hover:border-brand-200 transition-all"
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-xs font-semibold text-brand-800">{step.title}</span>
              <motion.span
                animate={{ rotate: expanded === i ? 180 : 0 }}
                className="text-brand-300"
              >
                <ChevronDown size={13} />
              </motion.span>
            </button>
            <AnimatePresence>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3 pl-11">
                    <p className="text-xs text-brand-600 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function CollapsibleSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="my-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 transition mb-1"
      >
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
        </motion.span>
        {heading}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Renderer ──────────────────────────────────────────────────────────────

export default function RichMessageRenderer({ content }: { content: string }) {
  const blocks = useMemo(() => parseContentBlocks(content), [content]);

  // If no structured blocks detected, just render markdown
  if (blocks.length === 0) {
    return (
      <div className="chat-prose">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Check if it's just one prose block (nothing structured)
  if (blocks.length === 1 && blocks[0].type === 'prose' && !blocks[0].heading) {
    return (
      <div className="chat-prose">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'table':
            return <InteractiveTable key={idx} data={block.data!} heading={block.heading} />;

          case 'kv-cards':
            return <KVCards key={idx} pairs={block.kvPairs!} heading={block.heading} />;

          case 'metrics':
            return <MetricsDisplay key={idx} metrics={block.metrics!} heading={block.heading} />;

          case 'steps':
            return <StepCards key={idx} steps={block.steps!} heading={block.heading} />;

          case 'prose':
            if (block.heading && block.content) {
              return (
                <CollapsibleSection key={idx} heading={block.heading}>
                  <div className="chat-prose pl-4">
                    <ReactMarkdown>{block.content}</ReactMarkdown>
                  </div>
                </CollapsibleSection>
              );
            }
            if (block.heading && !block.content) {
              return null; // heading with no content
            }
            return (
              <div key={idx} className="chat-prose">
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            );

          default:
            return (
              <div key={idx} className="chat-prose">
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            );
        }
      })}
    </div>
  );
}
