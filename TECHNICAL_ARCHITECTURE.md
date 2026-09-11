# Technical Architecture --- AI Lead Intelligence & CALL-E Platform

**Version:** 1.0\
**Date:** 11 September 2026\
**Frontend:** React.js + TypeScript\
**Phone Agent:** CALL-E\
**Database:** Supabase/PostgreSQL

------------------------------------------------------------------------

# 1. Architecture Principles

The architecture follows six principles:

1.  **Browser never owns provider secrets.**
2.  **AI planning is separate from phone execution.**
3.  **External data is untrusted and must be normalized.**
4.  **Evidence is stored separately from conclusions.**
5.  **Long-running operations are asynchronous.**
6.  **Every important external action is auditable and idempotent.**

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
┌──────────────────────────────────────────────────────────┐
│                     REACT WEB APP                        │
│                                                          │
│  Call Logs       Lead Dashboard        AI Chat           │
│  ─────────       ──────────────        ───────           │
│  summaries       lead table            business AI      │
│  status          scores                questionnaire    │
│  outcomes        evidence              task control     │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    APPLICATION API                       │
│                                                          │
│ Auth / Authorization                                     │
│ Task API                                                 │
│ Lead API                                                 │
│ Call API                                                 │
│ Webhook API                                              │
│ Chat API                                                 │
└──────────────┬─────────────────┬─────────────────────────┘
               │                 │
               ▼                 ▼
      ┌────────────────┐  ┌────────────────────┐
      │ Supabase       │  │ AI Orchestration    │
      │ PostgreSQL     │  │                     │
      │ Storage        │  │ Planner             │
      │ Auth           │  │ Questionnaire       │
      └────────────────┘  │ Scoring             │
                          │ Synthesis            │
                          └──────────┬───────────┘
                                     │
                     ┌───────────────┴──────────────┐
                     │                              │
                     ▼                              ▼
             Data Providers                      CALL-E
             Discovery/Enrichment                 Phone agent
                     │                              │
                     │                              ▼
                     │                            PHONE
                     │                              │
                     │                              ▼
                     │                            HUMAN
                     │                              │
                     └──────────────────────────────┘
```

------------------------------------------------------------------------

# 3. Frontend Architecture

Use React.js + TypeScript.

Recommended supporting libraries:

-   React Router;
-   TanStack Query;
-   Tailwind CSS;
-   shadcn/ui;
-   Zod;
-   a lightweight chart library;
-   Framer Motion only where animation adds value.

Suggested structure:

``` text
src/
├── app/
├── components/
│   ├── dashboard/
│   ├── leads/
│   ├── calls/
│   ├── chat/
│   └── documents/
├── pages/
├── hooks/
├── lib/
├── api/
├── types/
└── styles/
```

------------------------------------------------------------------------

# 4. Dashboard Layout

The supplied visual establishes a three-column dashboard.

``` text
┌──────────────────────┬─────────────────────────┬──────────────────────┐
│                      │                         │                      │
│     CALL LOGS        │     LEAD DASHBOARD      │       AI CHAT         │
│                      │                         │                      │
│ Call summary         │ Search/filter           │ Client conversation  │
│ Call status          │ Lead cards/table        │ Questionnaire        │
│ Qualification        │ Score                   │ Criteria editing     │
│ Next action          │ Evidence                │ Task control         │
│                      │ Call status             │ Call explanations    │
│                      │                         │                      │
└──────────────────────┴─────────────────────────┴──────────────────────┘
```

### Responsive behavior

Desktop:

``` text
20% / 50% / 30%
```

Tablet:

``` text
Calls + Leads
Chat as collapsible panel
```

Mobile:

``` text
Leads
↓
Call details
↓
AI assistant drawer
```

------------------------------------------------------------------------

# 5. Backend Architecture

The application backend should initially be a lightweight TypeScript
server/API layer.

It should contain:

``` text
server/
├── routes/
├── services/
│   ├── planner.ts
│   ├── questionnaire.ts
│   ├── discovery.ts
│   ├── enrichment.ts
│   ├── scoring.ts
│   ├── calle.ts
│   ├── calls.ts
│   └── synthesis.ts
├── security/
│   ├── auth.ts
│   ├── authorization.ts
│   ├── validation.ts
│   └── rateLimit.ts
├── db/
└── workers/
```

A separate Python service is unnecessary for the initial MVP.

------------------------------------------------------------------------

# 6. Task Lifecycle

``` text
CREATED
   │
   ▼
PLANNING
   │
   ▼
DISCOVERING
   │
   ▼
ENRICHING
   │
   ▼
SCORING
   │
   ▼
READY_FOR_REVIEW
   │
   ├───────────────┐
   │               │
   ▼               ▼
LEADS_ONLY       CALLING
                   │
                   ▼
                ANALYZING
                   │
                   ▼
                COMPLETED
```

Every transition should be controlled by the backend.

------------------------------------------------------------------------

# 7. AI Architecture

The internal LLM performs high-level reasoning.

## Planner

Input:

``` text
Client documents
+
Business profile
+
Client goal
```

Output:

``` json
{
  "objective": "...",
  "target_industries": [],
  "geography": {},
  "positive_signals": [],
  "negative_signals": [],
  "questions": [],
  "call_information": []
}
```

## Lead Analyst

Input:

``` text
Lead
+
Business data
+
Evidence
+
Criteria
```

Output:

``` json
{
  "score": 91,
  "reasoning": [],
  "hypothesis": "...",
  "recommended_action": "call"
}
```

## Result Synthesizer

Input:

``` text
CALL-E structured result
+
lead evidence
+
criteria
```

Output:

``` json
{
  "qualification": "qualified",
  "summary": "...",
  "verified_facts": [],
  "uncertainties": [],
  "next_action": "follow_up"
}
```

------------------------------------------------------------------------

# 8. CALL-E Architecture

CALL-E is invoked only by the backend.

``` text
React
  │
  │ request call
  ▼
Backend authorization
  │
  ▼
Call brief generator
  │
  ▼
CALL-E API
  │
  ▼
Phone conversation
  │
  ▼
Structured result
  │
  ▼
CALL-E webhook
  │
  ▼
Backend
  │
  ├── Database
  ├── Result synthesizer
  └── Live dashboard event
```

The browser must never directly call CALL-E.

------------------------------------------------------------------------

# 9. CALL-E Task Construction

A call task should contain:

``` text
TARGET
BUSINESS CONTEXT
CALL OBJECTIVE
EVIDENCE
HYPOTHESIS
QUESTIONS
CONSTRAINTS
SUCCESS CONDITIONS
RESULT SCHEMA
```

Example:

``` text
Call Acme Dental on behalf of our client.

Objective:
Determine whether the practice has difficulty handling
incoming appointment calls.

Context:
- Established dental practice
- Austin
- 15 employees

Evidence:
- Website appears to lack online booking
- Several public reviews mention difficulty reaching the office

Hypothesis:
The practice may experience missed inbound calls.

Ask:
- Who currently handles incoming calls?
- Are calls missed during busy periods?
- What happens after hours?
- Is the practice considering an answering solution?

Do not:
- claim the reviews prove a problem;
- make purchases;
- make financial commitments;
- misrepresent identity.

Return structured answers.
```

------------------------------------------------------------------------

# 10. CALL-E Result Schema

The backend should dynamically generate the result schema from the
client's questionnaire.

Example:

``` typescript
export const callResultSchema = {
  type: "object",
  properties: {
    decision_maker_reached: {
      type: "boolean",
      description: "Whether a relevant decision maker was reached."
    },
    need_confirmed: {
      type: "boolean",
      description: "Whether the target business confirmed the relevant need."
    },
    current_solution: {
      type: "string",
      description: "Current solution or process used by the business."
    },
    quantity: {
      type: "number",
      description: "Requested quantity if applicable."
    },
    available_slots: {
      type: "array",
      items: {
        type: "string"
      }
    },
    price: {
      type: "number"
    },
    currency: {
      type: "string"
    },
    next_action: {
      type: "string"
    }
  },
  required: [
    "decision_maker_reached",
    "need_confirmed"
  ],
  additionalProperties: false
};
```

Only include fields relevant to the actual objective.

------------------------------------------------------------------------

# 11. Data Provenance Architecture

Every externally derived claim should have provenance.

``` text
LEAD
 │
 ├── Website evidence
 │     ├── source
 │     ├── observed_at
 │     └── confidence
 │
 ├── Review evidence
 │     ├── source
 │     ├── observed_at
 │     └── confidence
 │
 ├── Company evidence
 │
 └── CALL-E verification
       ├── call ID
       ├── timestamp
       └── structured result
```

This allows the AI to answer:

> "Why did you call this company?"

with evidence rather than vague reasoning.

------------------------------------------------------------------------

# 12. Security Architecture

## Secrets

Store:

``` text
CALL_E_API_KEY
LLM_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

only in server-side environment variables or an approved secret manager.

Never use them in:

``` text
React components
NEXT_PUBLIC_* variables
client bundles
localStorage
URLs
```

## Authentication

Every protected request:

``` text
Browser
 ↓
Session/token
 ↓
Backend
 ↓
Authenticate
 ↓
Authorize organization/resource
 ↓
Execute
```

## Authorization

Do not rely on frontend visibility.

Bad:

``` typescript
if (userCanSeeLead) {
  // frontend hides lead
}
```

Good:

``` text
Backend receives lead ID
        ↓
Checks authenticated user
        ↓
Checks organization membership
        ↓
Checks lead.organization_id
        ↓
Returns only authorized data
```

## Webhook security

The webhook endpoint must validate provider authenticity when the
provider exposes signing/verification mechanisms.

Also use:

-   event IDs;
-   processed-event table;
-   idempotent handlers;
-   replay protection where supported.

------------------------------------------------------------------------

# 13. Idempotency

Creating a phone call is an external side effect.

Never blindly retry:

``` text
POST CALL-E
```

because a network timeout may happen after CALL-E has already created
the call.

Use an internal call request ID and provider-supported idempotency key.

Example:

``` text
internal_call_request = callreq_123

CALL-E:
Idempotency-Key: callreq_123
```

Store the provider call ID once created.

------------------------------------------------------------------------

# 14. Error Handling

Possible states:

``` text
queued
in_progress
completed
failed
cancelled
```

Internal errors:

``` text
PLANNING_FAILED
DISCOVERY_FAILED
ENRICHMENT_FAILED
CALL_CREATION_FAILED
CALL_FAILED
WEBHOOK_PROCESSING_FAILED
RESULT_VALIDATION_FAILED
```

The UI should show understandable messages rather than raw stack traces.

------------------------------------------------------------------------

# 15. Synthetic Mode

Environment:

``` env
CALL_MODE=synthetic
```

Architecture:

``` text
Orchestrator
     │
     ▼
Synthetic CALL-E adapter
     │
     ▼
Fake conversation
     │
     ▼
Synthetic structured result
```

Live:

``` env
CALL_MODE=live
```

Architecture:

``` text
Orchestrator
     │
     ▼
CALL-E adapter
     │
     ▼
Real call
```

The application should use the same interface in both modes:

``` typescript
interface PhoneAgent {
  createCall(input: CreateCallInput): Promise<Call>;
  getCall(id: string): Promise<Call>;
}
```

------------------------------------------------------------------------

# 16. API Contract

## POST /api/tasks

``` json
{
  "goal": "Find dental practices in Austin..."
}
```

Response:

``` json
{
  "task_id": "task_123",
  "status": "planning"
}
```

## GET /api/tasks/:id

``` json
{
  "id": "task_123",
  "status": "calling",
  "progress": {
    "discovered": 50,
    "qualified": 8,
    "calls": 3,
    "completed_calls": 2
  }
}
```

## GET /api/tasks/:id/leads

Returns paginated lead records.

## POST /api/leads/:id/call

``` json
{
  "approval": true
}
```

## GET /api/calls/:id

Returns:

``` json
{
  "status": "completed",
  "summary": "...",
  "structured_result": {}
}
```

## POST /api/webhooks/calle

Receives provider events.

------------------------------------------------------------------------

# 17. Event System

Internal events:

``` text
task.created
task.planning_started
task.planning_completed
lead.discovered
lead.enriched
lead.scored
call.requested
call.queued
call.started
call.completed
call.failed
result.created
task.completed
```

The frontend can consume these through polling initially.

SSE may be added for near-real-time activity.

------------------------------------------------------------------------

# 18. Recommended Technology Stack

  Layer                Technology
  -------------------- ---------------------------------
  UI                   React + TypeScript
  Styling              Tailwind + shadcn/ui
  State/server cache   TanStack Query
  Routing              React Router
  Backend              TypeScript API/server
  Database             Supabase/PostgreSQL
  Auth                 Supabase Auth
  File storage         Supabase Storage
  LLM                  Provider with structured output
  Phone                CALL-E
  Validation           Zod
  Async jobs           Lightweight job/worker layer
  Hosting              Vercel or equivalent
  Monitoring           Sentry
  Analytics            PostHog optional

Avoid adding Redis, Kafka, Kubernetes, LangChain, LiveKit, Twilio, or a
separate Python service unless a concrete requirement appears.

------------------------------------------------------------------------

# 19. Recommended Repository

``` text
project/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── api/
│   ├── types/
│   └── lib/
│
├── server/
│   ├── routes/
│   ├── services/
│   ├── workers/
│   └── security/
│
├── supabase/
│   └── migrations/
│
├── docs/
│   ├── RFP.md
│   ├── SRS.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── MASTER_PROMPT.md
│
├── .env.example
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 20. Build Order

### Phase 1 --- Shell

-   React app;
-   dashboard layout;
-   routing;
-   mock data;
-   responsive behavior.

### Phase 2 --- Database

-   Supabase;
-   authentication;
-   schema;
-   tenant isolation.

### Phase 3 --- Synthetic pipeline

``` text
goal
→ questionnaire
→ synthetic leads
→ scoring
→ dashboard
```

### Phase 4 --- Synthetic calling

``` text
lead
→ call brief
→ synthetic call
→ structured result
→ call log
```

### Phase 5 --- Real CALL-E

``` text
lead
→ call brief
→ CALL-E
→ webhook
→ structured result
```

### Phase 6 --- AI chat

Connect chat to:

-   business profile;
-   criteria;
-   leads;
-   task state;
-   call results.

### Phase 7 --- Hardening

-   authorization;
-   rate limiting;
-   webhook verification;
-   idempotency;
-   validation;
-   error handling;
-   audit logs;
-   secret review.

------------------------------------------------------------------------

# 21. Critical Architectural Rule

The LLM should never have unrestricted authority over external side
effects.

Use:

``` text
LLM
 ↓
structured intent
 ↓
policy/authorization layer
 ↓
validated tool call
 ↓
external service
```

not:

``` text
LLM
 ↓
arbitrary API request
```

For example:

``` text
User: "Call every lead."

LLM: proposes call action.

Policy layer:
- Is user authenticated?
- Is organization authorized?
- Are calls enabled?
- Is batch size allowed?
- Does user require approval?
- Are recipients valid?
- Is the request within quota?

Only then:
CALL-E.
```

------------------------------------------------------------------------

# 22. Target Architecture Outcome

The final system should behave like:

``` text
             CLIENT
                │
                ▼
         BUSINESS MATERIAL
                │
                ▼
        ┌───────────────┐
        │     AI        │
        │ understands   │
        │ the business  │
        └───────┬───────┘
                ▼
          QUESTIONNAIRE
                │
                ▼
         LEAD DISCOVERY
                │
                ▼
          ENRICHMENT
                │
                ▼
          EVIDENCE
                │
                ▼
         LEAD SCORING
                │
                ▼
         CURATED LEADS
                │
        ┌───────┴────────┐
        │                │
     STOP HERE        CALL THEM
                         │
                         ▼
                       CALL-E
                         │
                         ▼
                       HUMAN
                         │
                         ▼
                  STRUCTURED RESULT
                         │
                         ▼
                    VERIFICATION
                         │
                         ▼
                  FINAL LEAD STATUS
```

This architecture makes CALL-E a fundamental part of the product rather
than an ornamental integration.
