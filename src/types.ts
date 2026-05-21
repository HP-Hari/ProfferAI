export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  logoColor: string;
  industry: string;
  size: string;
  employees: number;
  relationshipHealth: 'good' | 'fair' | 'poor';
  likelyPainPoints: string[];
  competitorMentions: string[];
  suggestedOutreach: string;
  summary: string;
}

export interface Deal {
  id: string;
  name: string;
  accountId: string;
  stage: 'Discovery' | 'Evaluation' | 'Proposal' | 'Negotiation' | 'Late stage' | 'Stalled' | 'Closed Won' | 'Closed Lost';
  value: number;
  closeDate: string;
  healthScore: number;
  owner: string;
  topRisk: string;
  lastActivity: string;
  nextStep: string;
  summary: string;
  unresolvedObjectionsCount: number;
  stakeholderIds: string[];
  objectionIds: string[];
  taskIds: string[];
  timelineIds: string[];
  competitiorList: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'Champion' | 'Decision Maker' | 'Influencer' | 'Blocker' | 'Gatekeeper';
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Unknown';
  alignmentPercent: number;
  accountId: string;
}

export interface Activity {
  id: string;
  dealId: string;
  type: 'call_summary' | 'email_sent' | 'objection_logged' | 'stage_change' | 'note_created' | 'agent_reflection';
  timestamp: string;
  title: string;
  description: string;
  badge?: string;
  details?: string;
}

export interface Objection {
  id: string;
  dealId: string;
  stakeholderId: string;
  text: string;
  type: 'pricing' | 'competitor' | 'features' | 'timeline' | 'security' | 'legal';
  status: 'unresolved' | 'resolved';
  resolution?: string;
  recordedDate: string;
}

export interface TeamTask {
  id: string;
  dealId: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  owner: string;
  suggestedMessage?: string;
}

export interface MemoryEvent {
  id: string;
  dealId: string;
  timestamp: string;
  summary: string;
  type: 'commitment' | 'stakeholder' | 'objection' | 'competitor' | 'milestone';
  score: number; // Importance
}

export interface Reflection {
  id: string;
  timestamp: string;
  insight: string;
  category: 'product' | 'relationship' | 'process' | 'pricing';
  severity: 'high' | 'medium' | 'low';
}

export interface SavedDraft {
  id: string;
  dealId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  text: string;
  type: string;
  createdAt: string;
}

export interface DBState {
  accounts: Account[];
  deals: Deal[];
  stakeholders: Stakeholder[];
  activities: Activity[];
  objections: Objection[];
  tasks: TeamTask[];
  memories: MemoryEvent[];
  reflections: Reflection[];
  savedDrafts: SavedDraft[];
}
