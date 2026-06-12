'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileSearch,
  Globe,
  GitBranch,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  PLATFORM_AGENTS,
  HITL_QUEUE,
  KB_DOCUMENTS,
  AUDIT_LOGS,
  TELEMETRY,
  AI_REGISTRY,
  GATEWAY_POLICIES,
  REQUEST_VOLUME_DAILY,
  REQUEST_VOLUME_WEEKLY,
  REQUEST_VOLUME_MONTHLY,
  type HitlItem,
} from './mockAdminData';

type AdminTab = 'dashboard' | 'agents' | 'hitl' | 'knowledge' | 'gateway';

const TABS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'agents', label: 'Agent Monitor', icon: Bot },
  { id: 'hitl', label: 'Human in Loop', icon: FileSearch },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'gateway', label: 'AI Gateway', icon: Shield },
];

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const pendingCount = HITL_QUEUE.filter((i) => i.status === 'pending').length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-surface-200 bg-white/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-brand-900">Admin Console</h1>
            <p className="text-xs text-surface-500">NexaCore Total Rewards · 2-Day Pilot (Jun 11–12, 2026)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">All Systems Live</span>
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-surface-600 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {tab.id === 'hitl' && pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <DashboardPanel />}
            {activeTab === 'agents' && <AgentMonitorPanel />}
            {activeTab === 'hitl' && <HumanInLoopPanel />}
            {activeTab === 'knowledge' && <KnowledgeBasePanel />}
            {activeTab === 'gateway' && <AIGatewayPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DASHBOARD PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function DashboardPanel() {
  const [volumeView, setVolumeView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const getVolumeData = () => {
    if (volumeView === 'daily') return REQUEST_VOLUME_DAILY.day2;
    if (volumeView === 'weekly') return REQUEST_VOLUME_WEEKLY;
    return REQUEST_VOLUME_MONTHLY;
  };

  const getVolumeLabels = () => {
    if (volumeView === 'daily') return ['9AM', '12PM', '3PM', '6PM', '11PM'];
    if (volumeView === 'weekly') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return ['Jun 1', 'Jun 4', 'Jun 7', 'Jun 10', 'Jun 12'];
  };

  const volumeData = getVolumeData();
  const maxVal = Math.max(...volumeData, 1);
  const labels = getVolumeLabels();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Telemetry metrics */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TELEMETRY.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                {m.label}
              </p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-bold text-brand-900">{m.value}</span>
                <span
                  className={`text-xs font-medium ${
                    m.trend === 'up'
                      ? 'text-emerald-600'
                      : m.trend === 'down'
                        ? 'text-brand-500'
                        : 'text-amber-600'
                  }`}
                >
                  {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Request Volume Chart */}
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-brand-900">Request Volume</h3>
              </div>
              {/* Time range pills */}
              <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5">
                {(['daily', 'weekly', 'monthly'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVolumeView(v)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition ${
                      volumeView === v
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-surface-600 hover:text-brand-700'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex h-32 items-end gap-1.5">
              {volumeData.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-brand-600/80 to-brand-400/40 transition-all hover:from-brand-500 hover:to-brand-300 relative group"
                  style={{ height: `${(h / maxVal) * 100}%`, minHeight: h > 0 ? '4px' : '0px' }}
                >
                  {h > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-surface-500 opacity-0 group-hover:opacity-100 transition">
                      {h}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-surface-500">
              {labels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>

          {/* Agent Health */}
          <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-brand-900">Agent Health</h3>
            </div>
            <div className="mt-4 space-y-3">
              {PLATFORM_AGENTS.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      agent.status === 'idle'
                        ? 'bg-emerald-300'
                        : 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                    }`}
                  />
                  <span className="flex-1 text-sm text-surface-700">{agent.name}</span>
                  <div className="flex items-center gap-1.5">
                    {agent.status === 'scheduled' && (
                      <Clock size={11} className="text-emerald-600" />
                    )}
                    <span className={`font-mono text-[10px] capitalize ${
                      agent.status === 'idle' ? 'text-emerald-500' : 'text-emerald-600'
                    }`}>
                      {agent.status === 'scheduled' ? 'scheduled ✓' : agent.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-surface-400" />
              <h3 className="text-sm font-semibold text-brand-900">Usage Audit Log</h3>
            </div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-mono text-[10px] text-brand-600">
              Live · SQLite
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-[10px] uppercase tracking-wider text-surface-500">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Employee ID</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">Agent</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="border-b border-surface-100">
                    <td className="py-2.5 pr-4 font-mono text-xs text-surface-500">{log.timestamp}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-surface-600">{log.employeeId}</td>
                    <td className="py-2.5 pr-4 text-xs text-surface-700">{log.user}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        log.role === 'hr' ? 'bg-brand-50 text-brand-700' : 'bg-surface-100 text-surface-600'
                      }`}>
                        {log.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-brand-900">{log.action}</td>
                    <td className="py-2.5 pr-4 text-xs text-brand-600">{log.agent}</td>
                    <td className="py-2.5">
                      {log.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {log.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {log.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AGENT MONITOR PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
const statusColor: Record<string, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  processing: 'border-emerald-200 bg-emerald-50 text-emerald-700 animate-pulse',
  scheduled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  idle: 'border-emerald-100 bg-emerald-50/50 text-emerald-600',
};

function AgentMonitorPanel() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        {/* Architecture flow diagram */}
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Agent Orchestration Pipeline · <span className="text-emerald-500">All Agents Live</span>
          </p>

          {/* Main flow */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <FlowNode icon={Users} label="HR / Employee" sub="Chat Interface" />
            <FlowArrow />
            <FlowNode icon={GitBranch} label="Orchestrator" sub="Intent Classifier" highlight />
            <FlowArrow />
            <div className="flex flex-col gap-2">
              <FlowNode icon={Database} label="Policy Agent" sub="RAG · ChromaDB" live />
              <FlowNode icon={Database} label="Rewards Agent" sub="RAG · ChromaDB" live />
              <FlowNode icon={Ticket} label="Ticket Agent" sub="CRUD · SQLite" live />
              <FlowNode icon={Zap} label="Life Event Simulator" sub="Sonnet · Multi-step" live />
              <FlowNode icon={TrendingUp} label="Equity Analyst" sub="Sonnet · Analytics" live />
            </div>
          </div>

          {/* Research Agent special flow */}
          <div className="mt-5 border-t border-emerald-200 pt-4">
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-brand-600">
              Research Agent Flow · HR-Triggered + Scheduled
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <FlowNode icon={Bot} label="HR Trigger / Schedule" sub="On-demand + Cron" small />
              <FlowArrow />
              <FlowNode icon={FileSearch} label="Research Agent" sub="Fetch & Analyze" small live />
              <FlowArrow />
              <div className="flex flex-col gap-2">
                <FlowNode icon={Globe} label="Internet" sub="Tavily Search" small />
                <FlowNode icon={Lock} label="Org Systems" sub="Federated Access" small />
              </div>
              <FlowArrow />
              <FlowNode icon={Shield} label="AI Gateway" sub="Security + PII Filter" small />
              <FlowArrow />
              <FlowNode icon={CheckCircle2} label="HITL Review" sub="High-Confidence Docs" small highlight />
              <FlowArrow />
              <FlowNode icon={Database} label="Knowledge Base" sub="ChromaDB" small live />
            </div>
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {PLATFORM_AGENTS.map((agent) => (
            <article
              key={agent.id}
              className="group rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-brand-900">{agent.name}</h3>
                  <p className="mt-0.5 font-mono text-[10px] text-brand-600">{agent.type}</p>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusColor[agent.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {agent.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-surface-600">{agent.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3 text-xs text-surface-500">
                <span>Last run: {agent.lastRun}</span>
                <span className="font-mono font-medium text-brand-700">{agent.tasksCompleted} tasks</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowNode({
  icon: Icon,
  label,
  sub,
  highlight,
  small,
  live,
}: {
  icon: typeof Bot;
  label: string;
  sub: string;
  highlight?: boolean;
  small?: boolean;
  live?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
        highlight
          ? 'border-brand-400 bg-brand-50 shadow-sm'
          : live
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-surface-200 bg-white'
      } ${small ? 'text-xs' : ''}`}
    >
      <Icon className={`${small ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${live ? 'text-emerald-600' : 'text-brand-500'}`} />
      <div>
        <p className={`font-medium text-brand-900 ${small ? 'text-xs' : 'text-sm'}`}>{label}</p>
        <p className="text-[10px] text-surface-500">{sub}</p>
      </div>
      {live && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
    </div>
  );
}

function FlowArrow() {
  return <ArrowRight className="h-4 w-4 shrink-0 text-emerald-400" />;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HUMAN IN THE LOOP PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
function HumanInLoopPanel() {
  const [queue, setQueue] = useState(HITL_QUEUE);

  const updateStatus = (id: string, status: HitlItem['status']) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const pending = queue.filter((i) => i.status === 'pending');
  const approved = queue.filter((i) => i.status === 'approved');
  const rejected = queue.filter((i) => i.status === 'rejected');

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Summary bar */}
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5">
            <FileSearch className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-medium text-amber-800">
              {pending.length} pending review
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{approved.length} approved</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
            <X className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-600">{rejected.length} rejected</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-xs text-brand-800">
          <strong>How it works:</strong> Research Agent fetches policies from org intranet and internet sources.
          High-confidence documents (≥80%) are flagged here for HR review before ingestion into the Knowledge Base.
        </div>

        {queue.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-5 transition shadow-sm ${
              item.status === 'pending'
                ? 'border-amber-300 bg-amber-50/30'
                : item.status === 'approved'
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-red-200 bg-red-50/20 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-brand-600">{item.agentName}</p>
                  <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[9px] font-medium text-surface-600">
                    {item.category}
                  </span>
                </div>
                <h3 className="mt-1 font-semibold text-brand-900">{item.policyTitle}</h3>
                <p className="mt-0.5 font-mono text-[10px] text-surface-500">{item.source}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                    item.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.status}
                </span>
                <span className={`text-[10px] font-mono ${
                  item.confidence >= 90 ? 'text-emerald-600' : item.confidence >= 80 ? 'text-amber-600' : 'text-surface-500'
                }`}>
                  {item.confidence}% confidence
                </span>
              </div>
            </div>

            <p className="mt-4 rounded-lg border border-surface-200 bg-white p-4 text-sm leading-relaxed text-surface-700">
              {item.fetchedContent}
            </p>

            {item.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(item.id, 'approved')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  Approve → Knowledge Base
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(item.id, 'rejected')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}

            <p className="mt-3 text-[10px] text-surface-500">Submitted {item.submittedAt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   KNOWLEDGE BASE PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
const kbStatusStyle: Record<string, string> = {
  synced: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  indexing: 'text-brand-700 bg-brand-50 border border-brand-200 animate-pulse',
  stale: 'text-amber-700 bg-amber-50 border border-amber-200',
};

function KnowledgeBasePanel() {
  const totalChunks = KB_DOCUMENTS.reduce((acc, d) => acc + d.chunks, 0);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-brand-900">{KB_DOCUMENTS.length} documents indexed</p>
              <p className="text-xs text-surface-500">ChromaDB Vector Store · {totalChunks.toLocaleString()} chunks · ONNX Embeddings</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs text-surface-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-index
          </button>
        </div>

        <div className="space-y-2">
          {KB_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <BookOpen className="h-4 w-4 text-brand-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand-900">{doc.title}</p>
                <p className="text-xs text-surface-500">
                  {doc.category} · {doc.chunks} chunks · via {doc.source}
                </p>
              </div>
              <span className="text-xs text-surface-500">{doc.lastUpdated}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${kbStatusStyle[doc.status]}`}
              >
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AI GATEWAY PANEL
   ═══════════════════════════════════════════════════════════════════════════════ */
const policyCategoryIcons: Record<string, typeof Shield> = {
  security: Lock,
  compliance: ShieldCheck,
  access: Users,
  audit: FileSearch,
};

const policyCategoryColors: Record<string, string> = {
  security: 'bg-red-50 text-red-700 border-red-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
  access: 'bg-brand-50 text-brand-700 border-brand-200',
  audit: 'bg-surface-50 text-surface-700 border-surface-200',
};

function AIGatewayPanel() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Gateway Overview */}
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-900">NexaCore AI Gateway</h3>
              <p className="text-xs text-surface-600">
                Securing all agent interactions · PII protection · Federated data access control
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
              <Zap className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">8/8 Policies Active</span>
            </div>
          </div>
        </div>

        {/* Security Architecture */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-brand-900">Security Architecture</h3>
          </div>
          <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-center">
                <p className="text-xs font-medium text-brand-900">User Request</p>
                <p className="text-[9px] text-surface-500">Employee / HR</p>
              </div>
              <ArrowRight className="h-3 w-3 text-surface-400" />
              <div className="rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-red-700">PII Filter</p>
                <p className="text-[9px] text-red-500">Redact sensitive data</p>
              </div>
              <ArrowRight className="h-3 w-3 text-surface-400" />
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-amber-700">Guardrails</p>
                <p className="text-[9px] text-amber-500">HR scope only</p>
              </div>
              <ArrowRight className="h-3 w-3 text-surface-400" />
              <div className="rounded-lg border-2 border-brand-300 bg-brand-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-brand-700">RBAC</p>
                <p className="text-[9px] text-brand-500">Role-scoped retrieval</p>
              </div>
              <ArrowRight className="h-3 w-3 text-surface-400" />
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center">
                <p className="text-xs font-medium text-emerald-700">Agent Layer</p>
                <p className="text-[9px] text-emerald-500">LangGraph Agents</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 border-t border-surface-200 pt-3">
              <Lock className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-surface-600">
                Research Agent output quarantined → HITL review required before KB ingestion
              </span>
            </div>
          </div>
        </div>

        {/* Gateway Policies */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-brand-900">Enforcement Policies</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GATEWAY_POLICIES.map((p) => {
              const CatIcon = policyCategoryIcons[p.category] || Shield;
              return (
                <div
                  key={p.name}
                  className="rounded-lg border border-surface-200 bg-surface-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className="h-3.5 w-3.5 text-surface-500" />
                      <span className="text-sm font-medium text-brand-900">{p.name}</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-surface-500">{p.desc}</p>
                  <span className={`mt-2 inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${policyCategoryColors[p.category]}`}>
                    {p.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Registry */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-brand-900">AI Model Registry</h3>
          </div>
          <div className="space-y-2">
            {AI_REGISTRY.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-lg border border-surface-200 bg-surface-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-900">{entry.name}</p>
                  <p className="font-mono text-[10px] text-surface-500">
                    {entry.provider} · {entry.model}
                  </p>
                </div>
                <span className="font-mono text-xs text-surface-500">
                  {entry.requests24h}/24h
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    entry.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-surface-200 text-surface-500'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
