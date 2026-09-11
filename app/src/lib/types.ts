import { z } from "zod/v4";

// ─── Business Profile ───────────────────────────────────────

export const BusinessProfileSchema = z.object({
  company: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
  services: z.array(z.string()).default([]),
  targetMarket: z.object({
    industries: z.array(z.string()).default([]),
    geography: z.array(z.string()).default([]),
    companySize: z.string().optional(),
    characteristics: z.array(z.string()).default([]),
  }).optional(),
  geography: z.object({
    regions: z.array(z.string()).default([]),
    radius: z.number().optional(),
  }).optional(),
  idealCustomer: z.object({
    traits: z.array(z.string()).default([]),
    painPoints: z.array(z.string()).default([]),
    budget: z.string().optional(),
  }).optional(),
  negativeSignals: z.array(z.string()).default([]),
  qualificationRequirements: z.array(z.string()).default([]),
});

export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

// ─── Lead Criteria ──────────────────────────────────────────

export const LeadCriteriaSchema = z.object({
  industry: z.array(z.string()).default([]),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    radiusMiles: z.number().optional(),
  }).optional(),
  minEmployees: z.number().optional(),
  maxEmployees: z.number().optional(),
  requiredSignals: z.array(z.string()).default([]),
  excluded: z.array(z.string()).default([]),
  callQuestions: z.array(z.string()).default([]),
});

export type LeadCriteria = z.infer<typeof LeadCriteriaSchema>;

// ─── Questionnaire ──────────────────────────────────────────

export const QuestionnaireItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().optional(),
  type: z.enum(["text", "select", "multiselect", "number"]),
  options: z.array(z.string()).optional(),
});

export const QuestionnaireSchema = z.object({
  items: z.array(QuestionnaireItemSchema),
  completed: z.boolean().default(false),
});

export type QuestionnaireItem = z.infer<typeof QuestionnaireItemSchema>;
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;

// ─── Raw Lead (from discovery) ──────────────────────────────

export const RawLeadSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  source: z.string(),
  sourceId: z.string().optional(),
  employeeCount: z.number().optional(),
  decisionMaker: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type RawLead = z.infer<typeof RawLeadSchema>;

// ─── Lead Enrichment ────────────────────────────────────────

export const LeadEnrichmentSchema = z.object({
  website: z.string().optional(),
  description: z.string().optional(),
  services: z.array(z.string()).default([]),
  hours: z.string().optional(),
  reviewSignals: z.array(z.string()).default([]),
  technologyIndicators: z.array(z.string()).default([]),
  decisionMaker: z.string().optional(),
  decisionMakerTitle: z.string().optional(),
  employeeCount: z.number().optional(),
});

export type LeadEnrichment = z.infer<typeof LeadEnrichmentSchema>;

// ─── Evidence ───────────────────────────────────────────────

export const EvidenceItemSchema = z.object({
  type: z.enum(["OBSERVED", "INFERRED", "VERIFIED"]),
  claim: z.string(),
  source: z.string(),
  sourceReference: z.string().optional(),
  observedAt: z.string(),
  confidence: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// ─── Lead Score ─────────────────────────────────────────────

export const ScoreComponentsSchema = z.object({
  icpFit: z.number().min(0).max(25),
  businessQuality: z.number().min(0).max(15),
  painSignal: z.number().min(0).max(25),
  intent: z.number().min(0).max(20),
  recency: z.number().min(0).max(10),
  contactability: z.number().min(0).max(5),
});

export const LeadScoreSchema = z.object({
  score: z.number().min(0).max(100),
  components: ScoreComponentsSchema,
  evidence: z.array(EvidenceItemSchema),
  hypothesis: z.string(),
  recommendedAction: z.enum(["call", "research", "skip", "follow_up"]),
});

export type ScoreComponents = z.infer<typeof ScoreComponentsSchema>;
export type LeadScore = z.infer<typeof LeadScoreSchema>;

// ─── Call Brief ─────────────────────────────────────────────

export const CallBriefSchema = z.object({
  target: z.object({
    name: z.string(),
    phone: z.string(),
    location: z.string().optional(),
    category: z.string().optional(),
  }),
  objective: z.string(),
  businessContext: z.record(z.string(), z.unknown()),
  evidence: z.array(EvidenceItemSchema),
  hypothesis: z.string(),
  questions: z.array(z.string()),
  constraints: z.array(z.string()),
  successConditions: z.array(z.string()),
});

export type CallBrief = z.infer<typeof CallBriefSchema>;

// ─── Call Result ────────────────────────────────────────────

export const CallStructuredResultSchema = z.object({
  decisionMakerReached: z.boolean(),
  needConfirmed: z.boolean(),
  currentSolution: z.string().optional(),
  availableSlots: z.array(z.string()).optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  quantity: z.number().optional(),
  nextAction: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type CallStructuredResult = z.infer<typeof CallStructuredResultSchema>;

// ─── Call Synthesis ─────────────────────────────────────────

export const CallSynthesisSchema = z.object({
  qualification: z.enum(["qualified", "not_qualified", "needs_follow_up", "inconclusive"]),
  summary: z.string(),
  verifiedFacts: z.array(z.string()),
  uncertainties: z.array(z.string()),
  nextAction: z.string(),
});

export type CallSynthesis = z.infer<typeof CallSynthesisSchema>;

// ─── Phone Agent Interface ──────────────────────────────────

export interface CreateCallInput {
  leadId: string;
  organizationId: string;
  phone: string;
  task: string;
  resultSchema: Record<string, unknown>;
  metadata: Record<string, unknown>;
  idempotencyKey: string;
}

export interface PhoneCallResult {
  id: string;
  status: "completed" | "failed" | "in_progress" | "queued";
  structuredResult?: CallStructuredResult;
  duration?: number;
  transcript?: string;
}

export interface PhoneAgent {
  createCall(input: CreateCallInput): Promise<PhoneCallResult>;
  getCall(id: string): Promise<PhoneCallResult>;
}

// ─── Lead Discovery Provider ────────────────────────────────

export interface SearchCriteria {
  industry: string[];
  location?: { city?: string; state?: string; radiusMiles?: number };
  minEmployees?: number;
  maxEmployees?: number;
  requiredSignals?: string[];
  excluded?: string[];
}

export interface LeadDiscoveryProvider {
  search(criteria: SearchCriteria): Promise<RawLead[]>;
}

// ─── Lead Enrichment Provider ───────────────────────────────

export interface LeadEnrichmentProvider {
  enrich(lead: RawLead): Promise<LeadEnrichment>;
}

// ─── Chat ───────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: "update_criteria" | "start_research" | "call_lead" | "explain_lead" | "explain_call";
  label: string;
  payload?: Record<string, unknown>;
}

// ─── Chat Context ───────────────────────────────────────────

export interface ChatContext {
  organizationId: string;
  businessProfile?: BusinessProfile;
  criteria?: LeadCriteria;
  taskId?: string;
  selectedLeadId?: string;
  recentEvents?: Array<{ type: string; data: unknown }>;
}

// ─── API Response Types ─────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── WebSocket Event Types ──────────────────────────────────

export type WSEventType =
  | "task.created"
  | "task.planning_started"
  | "task.planning_completed"
  | "task.discovering"
  | "task.enriching"
  | "task.scoring"
  | "task.ready_for_review"
  | "task.completed"
  | "task.failed"
  | "lead.discovered"
  | "lead.enriched"
  | "lead.scored"
  | "call.requested"
  | "call.queued"
  | "call.started"
  | "call.completed"
  | "call.failed"
  | "result.created";

export interface WSEvent {
  type: WSEventType;
  organizationId: string;
  taskId?: string;
  leadId?: string;
  callId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ─── Task Progress ──────────────────────────────────────────

export interface TaskProgress {
  discovered: number;
  enriched: number;
  scored: number;
  qualified: number;
  calls: number;
  completedCalls: number;
  failedCalls: number;
}
