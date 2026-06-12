// ─── Types ───────────────────────────────────────────────────────────────────
export interface PlatformAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'processing' | 'scheduled';
  description: string;
  lastRun?: string;
  tasksCompleted: number;
}

export interface HitlItem {
  id: string;
  agentName: string;
  policyTitle: string;
  fetchedContent: string;
  source: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  category: string;
}

export interface KbDocument {
  id: string;
  title: string;
  category: string;
  chunks: number;
  lastUpdated: string;
  source: string;
  status: 'synced' | 'indexing' | 'stale';
}

export interface AuditLogEntry {
  id: string;
  employeeId: string;
  user: string;
  role: 'employee' | 'hr';
  action: string;
  agent: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface TelemetryMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface AiRegistryEntry {
  id: string;
  name: string;
  provider: string;
  model: string;
  status: 'active' | 'deprecated';
  requests24h: number;
}

export interface GatewayPolicy {
  name: string;
  status: 'enforced' | 'monitoring' | 'disabled';
  desc: string;
  category: 'security' | 'compliance' | 'access' | 'audit';
}

// ─── Data (2-day pilot: June 11–12, 2026) ────────────────────────────────────
// Total ~214 requests over 2 days: Day 1 (Jun 11) = 86 (40%), Day 2 (Jun 12) = 128 (60%)

export const PLATFORM_AGENTS: PlatformAgent[] = [
  {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    type: 'LangGraph · Intent Router',
    status: 'active',
    description: 'Classifies intent and routes to Policy, Rewards, Ticket, Life Event, Research, or Equity agents',
    lastRun: '4s ago',
    tasksCompleted: 214,
  },
  {
    id: 'policy-agent',
    name: 'Policy Agent',
    type: 'LangGraph · RAG Retrieval',
    status: 'active',
    description: 'Answers policy questions using ChromaDB vector store with role-scoped retrieval',
    lastRun: '12s ago',
    tasksCompleted: 89,
  },
  {
    id: 'rewards-agent',
    name: 'Rewards Agent',
    type: 'LangGraph · RAG Retrieval',
    status: 'active',
    description: 'Handles benefits enrollment, compensation, and total rewards queries',
    lastRun: '28s ago',
    tasksCompleted: 67,
  },
  {
    id: 'ticket-agent',
    name: 'Ticket Agent',
    type: 'LangGraph · Action Agent',
    status: 'idle',
    description: 'Creates, tracks, and categorizes HR support tickets with auto-priority',
    lastRun: '8m ago',
    tasksCompleted: 34,
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'LangGraph · Scheduled + On-demand',
    status: 'scheduled',
    description: 'Fetches policies from intra-org systems and internet; flags high-confidence docs for HITL review',
    lastRun: '15m ago',
    tasksCompleted: 24,
  },
  {
    id: 'life-event-agent',
    name: 'Life Event Simulator',
    type: 'LangGraph · Multi-Step Tool Agent',
    status: 'active',
    description: 'Simulates cascading impact of life events (relocation, baby, marriage) across all benefit dimensions',
    lastRun: '2m ago',
    tasksCompleted: 18,
  },
  {
    id: 'equity-agent',
    name: 'Equity & Anomaly Agent',
    type: 'LangGraph · Analytics + Tool Agent',
    status: 'active',
    description: 'Detects pay inequities, flags compensation outliers, and generates compliance-ready equity reports (HR only)',
    lastRun: '6m ago',
    tasksCompleted: 9,
  },
];

export const HITL_QUEUE: HitlItem[] = [
  {
    id: 'hitl-1',
    agentName: 'Research Agent',
    policyTitle: 'Updated PTO Carryover Policy 2026',
    fetchedContent:
      'Employees may carry over up to 5 unused PTO days into the next calendar year. Wellness days do not roll over. Manager approval required for carryover exceeding 3 days. India-specific: Privilege Leave carries over up to 30 days max.',
    source: 'intranet://hr-portal/policies/pto-carryover-v2026',
    confidence: 94,
    status: 'pending',
    submittedAt: '3 min ago',
    category: 'Time Off',
  },
  {
    id: 'hitl-2',
    agentName: 'Research Agent',
    policyTitle: 'Spot Award Eligibility Revision',
    fetchedContent:
      'Spot awards now available to employees with 3+ months tenure (previously 6 months). Maximum value increased to $750 for individual contributors. Team awards capped at $2,000.',
    source: 'intranet://recognition-system/spot-awards/draft-q3',
    confidence: 91,
    status: 'pending',
    submittedAt: '12 min ago',
    category: 'Rewards',
  },
  {
    id: 'hitl-3',
    agentName: 'Research Agent',
    policyTitle: 'Remote Work Stipend Enhancement',
    fetchedContent:
      'Monthly remote work stipend increased from $100 to $150 for eligible full-time employees. Now covers internet, ergonomic equipment, and co-working space memberships. Requires manager approval for hybrid employees.',
    source: 'intranet://hr-portal/remote-work/stipend-v2',
    confidence: 88,
    status: 'pending',
    submittedAt: '25 min ago',
    category: 'Benefits',
  },
  {
    id: 'hitl-4',
    agentName: 'Research Agent',
    policyTitle: 'Parental Leave Extension (India)',
    fetchedContent:
      'Maternity leave extended to 26 weeks for first two children. Paternity leave increased to 15 days. Adoption leave now at parity with maternity for primary caregivers.',
    source: 'https://labour.gov.in/policies/maternity-benefit-act-2026',
    confidence: 96,
    status: 'pending',
    submittedAt: '1h ago',
    category: 'Compliance',
  },
  {
    id: 'hitl-5',
    agentName: 'Research Agent',
    policyTitle: '401(k) Match Update',
    fetchedContent:
      'Employer match remains 100% on first 4% and 50% on next 2%. New auto-enrollment at 6% for new hires effective Q2 2026.',
    source: 'intranet://benefits-api/retirement/q2-update',
    confidence: 92,
    status: 'approved',
    submittedAt: '2h ago',
    category: 'Benefits',
  },
  {
    id: 'hitl-6',
    agentName: 'Research Agent',
    policyTitle: 'Workplace Safety - Hybrid Office Protocol',
    fetchedContent:
      'Hot-desking policy updated. Employees must book desks 24h in advance via HR portal. Maximum office capacity set at 70% per floor. Emergency evacuation procedures updated for split teams.',
    source: 'intranet://facilities/office-protocol/hybrid-v3',
    confidence: 85,
    status: 'approved',
    submittedAt: '4h ago',
    category: 'Policy',
  },
  {
    id: 'hitl-7',
    agentName: 'Research Agent',
    policyTitle: 'Data Privacy Training Mandate',
    fetchedContent:
      'Annual data privacy training now mandatory for all employees handling PII. Deadline: 30 days from policy publish. Non-compliance escalated to department head.',
    source: 'https://gdpr-updates.eu/training-requirements-2026',
    confidence: 78,
    status: 'rejected',
    submittedAt: '6h ago',
    category: 'Compliance',
  },
];

export const KB_DOCUMENTS: KbDocument[] = [
  { id: 'kb-1', title: 'Employee Handbook 2026', category: 'Policy', chunks: 248, lastUpdated: '2h ago', source: 'Research Agent', status: 'synced' },
  { id: 'kb-2', title: 'Benefits Enrollment Guide', category: 'Benefits', chunks: 156, lastUpdated: '1d ago', source: 'HR Portal', status: 'synced' },
  { id: 'kb-3', title: 'Recognition Program Catalog', category: 'Awards', chunks: 89, lastUpdated: '3h ago', source: 'Research Agent', status: 'indexing' },
  { id: 'kb-4', title: 'PTO & Leave Policies', category: 'Time Off', chunks: 64, lastUpdated: '15m ago', source: 'Research Agent', status: 'synced' },
  { id: 'kb-5', title: 'Ticketing SLA Guidelines', category: 'Operations', chunks: 42, lastUpdated: '1d ago', source: 'System', status: 'synced' },
  { id: 'kb-6', title: 'Compensation & Grade Structure', category: 'Compensation', chunks: 112, lastUpdated: '4h ago', source: 'Research Agent', status: 'synced' },
  { id: 'kb-7', title: 'NexaCore Employee Directory', category: 'Directory', chunks: 583, lastUpdated: '12h ago', source: 'CSV Import', status: 'synced' },
];

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'a1', employeeId: 'NX01002', user: 'Manish Hansen', role: 'employee', action: 'PTO balance query', agent: 'Policy Agent', timestamp: '14:32:01', status: 'success' },
  { id: 'a2', employeeId: 'NX01026', user: 'Freya Peters', role: 'hr', action: 'Triggered Research Agent scan', agent: 'Research Agent', timestamp: '14:28:15', status: 'success' },
  { id: 'a3', employeeId: 'NX01003', user: 'Riya Brown', role: 'employee', action: 'Benefits enrollment check', agent: 'Rewards Agent', timestamp: '14:25:44', status: 'success' },
  { id: 'a4', employeeId: 'NX01007', user: 'Siddhant Muller', role: 'employee', action: 'Relocation impact simulation (Pune → London)', agent: 'Life Event Simulator', timestamp: '14:24:10', status: 'success' },
  { id: 'a5', employeeId: 'NX01007', user: 'Siddhant Muller', role: 'employee', action: 'Ticket #0034 created', agent: 'Ticket Agent', timestamp: '14:22:09', status: 'success' },
  { id: 'a6', employeeId: 'NX01069', user: 'Amrita Lopez', role: 'hr', action: 'HITL: Approved PTO policy', agent: 'Research Agent', timestamp: '14:18:30', status: 'success' },
  { id: 'a7', employeeId: 'NX01026', user: 'Freya Peters', role: 'hr', action: 'Pay equity analysis: Engineering dept', agent: 'Equity Analyst', timestamp: '14:16:45', status: 'success' },
  { id: 'a8', employeeId: 'NX01005', user: 'Nisha Mitchell', role: 'employee', action: 'New baby impact analysis', agent: 'Life Event Simulator', timestamp: '14:15:22', status: 'success' },
  { id: 'a9', employeeId: 'unknown', user: 'Anonymous', role: 'employee', action: 'Off-topic query blocked', agent: 'AI Gateway', timestamp: '14:12:05', status: 'error' },
  { id: 'a10', employeeId: 'NX01006', user: 'Amrita Smith', role: 'employee', action: 'Leave policy question', agent: 'Policy Agent', timestamp: '14:08:33', status: 'success' },
  { id: 'a11', employeeId: 'NX01074', user: 'Daniel Varma', role: 'hr', action: 'Grade anomaly detection: all departments', agent: 'Equity Analyst', timestamp: '14:05:18', status: 'success' },
  { id: 'a12', employeeId: 'system', user: 'System', role: 'hr', action: 'Scheduled policy scan completed', agent: 'Research Agent', timestamp: '14:00:00', status: 'success' },
  { id: 'a13', employeeId: 'NX01074', user: 'Daniel Varma', role: 'hr', action: 'HITL: Rejected privacy doc', agent: 'Research Agent', timestamp: '13:45:12', status: 'warning' },
];

export const TELEMETRY: TelemetryMetric[] = [
  { label: 'Total Requests', value: '241', change: '+68% today', trend: 'up' },
  { label: 'Avg Latency', value: '1.6s', change: '-5%', trend: 'down' },
  { label: 'Token Usage', value: '389K', change: '+58%', trend: 'up' },
  { label: 'Success Rate', value: '99.1%', change: '+0.3%', trend: 'up' },
  { label: 'HITL Queue', value: '4', change: 'pending', trend: 'neutral' },
  { label: 'KB Documents', value: '47', change: '+3 today', trend: 'up' },
];

// Request volume: Day 1 (Jun 11) = 86 requests, Day 2 (Jun 12, partial) = 128 requests
// Hourly breakdown for daily view
export const REQUEST_VOLUME_DAILY = {
  day1: [3, 5, 2, 1, 1, 4, 8, 12, 14, 11, 9, 6, 5, 3, 2],  // 9am-11pm Jun 11 (sum≈86)
  day2: [4, 6, 3, 2, 2, 6, 11, 18, 21, 16, 14, 10, 8, 5, 2], // 9am-11pm Jun 12 (sum≈128)
};

// Weekly view (Mon-Thu so far, projecting Fri)
export const REQUEST_VOLUME_WEEKLY = [0, 0, 0, 86, 128];

// Monthly view (days 1-12)
export const REQUEST_VOLUME_MONTHLY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 86, 128];

export const AI_REGISTRY: AiRegistryEntry[] = [
  { id: 'r1', name: 'Orchestrator + Standard Agents', provider: 'Anthropic', model: 'claude-haiku-4-5-20251001', status: 'active', requests24h: 101 },
  { id: 'r2', name: 'Life Event Simulator + Equity Analyst', provider: 'Anthropic', model: 'claude-sonnet-4-6-20250514', status: 'active', requests24h: 27 },
  { id: 'r3', name: 'RAG Embeddings', provider: 'ChromaDB (Local)', model: 'all-MiniLM-L6-v2 (ONNX)', status: 'active', requests24h: 156 },
  { id: 'r4', name: 'Web Search (Research)', provider: 'Tavily', model: 'tavily-search-api', status: 'active', requests24h: 12 },
];

export const GATEWAY_POLICIES: GatewayPolicy[] = [
  { name: 'PII Redaction', status: 'enforced', desc: 'Auto-redact SSN, salary figures, medical data before LLM processing', category: 'security' },
  { name: 'HR Domain Guardrails', status: 'enforced', desc: 'Block off-topic queries; only HR/Benefits/Policy topics allowed', category: 'compliance' },
  { name: 'Role-Based Retrieval', status: 'enforced', desc: 'Employees see only their data; HR gets org-wide access', category: 'access' },
  { name: 'Agent Data Isolation', status: 'enforced', desc: 'Research Agent output quarantined until HITL approval', category: 'security' },
  { name: 'Rate Limiting', status: 'enforced', desc: '50 requests/hour per user; burst limit 10/min', category: 'access' },
  { name: 'Full Audit Trail', status: 'enforced', desc: 'Every request logged with user, agent, tokens, latency', category: 'audit' },
  { name: 'Federated Data Access', status: 'enforced', desc: 'Research Agent accesses org systems via secured API gateway only', category: 'security' },
  { name: 'Sensitive Doc Classification', status: 'enforced', desc: 'Docs with salary/medical/PII auto-flagged for HITL review', category: 'compliance' },
];
