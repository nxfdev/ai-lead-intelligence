# MASTER PROMPT --- Build the AI Lead Intelligence + CALL-E Platform

You are the principal software engineer, product engineer, UI/UX
designer, security engineer, and technical lead responsible for building
this project.

The project is being developed rapidly by a three-person team using
AI-assisted/vibe coding. You must therefore produce production-quality
structure while keeping the architecture simple enough to understand and
maintain.

------------------------------------------------------------------------

# 1. PRODUCT

Build a polished web-based SaaS platform that helps businesses find
credible leads and optionally qualify those leads through real phone
calls using CALL-E.

The core workflow is:

``` text
Client business materials
        ↓
AI understands business
        ↓
AI creates lead questionnaire
        ↓
Client reviews/edits criteria
        ↓
Candidate businesses discovered
        ↓
Businesses enriched
        ↓
Evidence collected
        ↓
Leads scored
        ↓
Curated lead dashboard
        ↓
Client selects leads
        ↓
CALL-E calls selected leads
        ↓
Human conversation
        ↓
CALL-E structured result
        ↓
Result summarized
        ↓
Lead qualification updated
        ↓
Client sees next action
```

Do NOT build a generic "AI voice bot."

The product's central value is:

> **AI researches who is worth calling, explains why, calls the
> strongest prospects, verifies the hypothesis through conversation, and
> returns structured sales intelligence.**

------------------------------------------------------------------------

# 2. HACKATHON PRIORITY

This product is being built for a CALL-E agent-building competition.

Therefore:

-   CALL-E must be genuinely central.
-   The final demo must include an actual CALL-E phone interaction if
    possible.
-   The system must visibly demonstrate structured call results.
-   The product should show an agentic workflow rather than a simple
    chatbot.
-   Do not hide CALL-E behind an irrelevant demo feature.
-   Do not create a generic receptionist.
-   Do not create a generic "AI calls businesses" application.

The ideal demo:

``` text
Upload business context
→ AI creates qualification criteria
→ leads appear
→ AI explains why Lead #1 is strong
→ user starts call
→ CALL-E calls real business
→ conversation happens
→ structured answers return
→ lead changes from "Potential" to "Verified"
→ dashboard updates
→ AI explains what happened
```

------------------------------------------------------------------------

# 3. TECH STACK

Use:

-   React.js
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query
-   React Router
-   Supabase/PostgreSQL
-   Supabase Auth
-   Supabase Storage
-   TypeScript backend/API
-   LLM with reliable structured output
-   CALL-E API/SDK
-   Zod
-   Vercel or equivalent deployment
-   Sentry optional

Do not introduce unnecessary infrastructure.

Avoid:

-   Kubernetes
-   Kafka
-   Redis
-   LangChain
-   LangGraph
-   LiveKit
-   Twilio
-   Pinecone
-   separate Python backend

unless an explicit requirement later makes one necessary.

------------------------------------------------------------------------

# 4. SECURITY --- ABSOLUTE PRIORITY

Security is a first-class requirement.

Never expose:

``` text
CALL_E_API_KEY
LLM_API_KEY
SUPABASE_SERVICE_ROLE_KEY
```

to the browser.

Never place secrets in:

``` text
NEXT_PUBLIC_*
React components
client-side bundles
localStorage
query parameters
URLs
```

All external provider calls must happen server-side.

Every protected API request must:

1.  authenticate the user;
2.  determine organization/tenant;
3.  authorize access to the requested resource;
4.  validate input;
5.  perform the operation;
6.  return only authorized data.

Use defense in depth.

Implement:

-   input validation;
-   output validation;
-   authorization;
-   tenant isolation;
-   rate limiting;
-   audit logs;
-   safe error messages;
-   secure HTTP headers;
-   webhook verification where supported;
-   webhook replay/idempotency protection;
-   provider-call idempotency;
-   bounded retries;
-   secure secret storage;
-   minimal data retention.

Do not claim the application has "zero security issues." Instead, build
it to a high security standard and document residual risks.

------------------------------------------------------------------------

# 5. TENANCY

Treat each client organization as an isolated tenant.

A user must never be able to access another organization's:

-   documents;
-   business profile;
-   criteria;
-   leads;
-   evidence;
-   calls;
-   transcripts;
-   results;
-   API metadata.

Do not rely on frontend filtering.

Enforce authorization server-side and preferably through Supabase Row
Level Security where appropriate.

------------------------------------------------------------------------

# 6. DASHBOARD DESIGN

The dashboard is divided into three primary vertical sections.

``` text
┌──────────────────────┬─────────────────────────┬──────────────────────┐
│                      │                         │                      │
│     CALL LOGS        │     LEAD DASHBOARD      │       AI CHAT         │
│                      │                         │                      │
│ summarized calls     │ curated leads           │ client ↔ AI           │
│ call status          │ score                   │ questionnaire         │
│ outcomes             │ evidence                │ criteria editing      │
│ next action          │ qualification           │ lead explanations     │
│                      │ call status             │ call control          │
│                      │                         │                      │
└──────────────────────┴─────────────────────────┴──────────────────────┘
```

Desktop target:

``` text
20% calls
50% leads
30% chat
```

Do not copy the rough screenshot literally. Use it as the structural
reference.

The final UI should feel like a premium modern SaaS product.

Avoid:

-   generic dashboard templates;
-   excessive gradients;
-   childish visuals;
-   unnecessary cards everywhere;
-   poor typography;
-   clutter;
-   giant empty whitespace;
-   fake analytics.

------------------------------------------------------------------------

# 7. LEFT COLUMN --- CALL LOGS

Display a chronological list.

Each item:

``` text
Business Name
Status
Short summary
Qualification
Time
Next action
```

Example:

``` text
Austin Smile Center
✓ Completed

Owner confirmed the clinic misses
calls during busy periods.

Need confirmed
Follow up recommended
```

Clicking an item opens:

-   call details;
-   structured answers;
-   summary;
-   transcript if available;
-   evidence;
-   next action.

------------------------------------------------------------------------

# 8. MIDDLE COLUMN --- LEAD DASHBOARD

This is the primary work surface.

Every lead should display:

-   score;
-   company;
-   location;
-   category;
-   contact;
-   decision-maker if available;
-   evidence;
-   qualification status;
-   call status;
-   recommended action.

Example:

``` text
94
Austin Smile Center

Austin, TX
Dental Practice

Why this lead:
• ICP match
• No online booking detected
• Recent customer-accessibility signals
• Decision-maker identified
• Strong contactability

[Call] [Details]
```

Allow:

-   sorting;
-   filtering;
-   search;
-   bulk selection;
-   score filtering;
-   qualification filtering;
-   call-status filtering.

------------------------------------------------------------------------

# 9. RIGHT COLUMN --- AI CHAT

The AI assistant is not merely a chat widget.

It is the control and reasoning interface for the application.

It should be able to:

-   understand uploaded business materials;
-   explain the client's ICP;
-   generate questionnaires;
-   modify criteria;
-   explain lead scores;
-   explain evidence;
-   start research tasks;
-   prepare calls;
-   explain call outcomes;
-   recommend next actions.

Example conversation:

``` text
USER:
Don't target companies with fewer than 10 employees.

AI:
Understood. I updated the target criteria.
This will remove 18 of the current 50 candidates.
Would you like me to re-score the remaining leads?
```

The AI may propose external actions but must not bypass the
application's authorization/policy layer.

------------------------------------------------------------------------

# 10. DOCUMENT INGESTION

Allow the client to upload business materials.

Initial supported formats:

-   PDF
-   DOCX
-   TXT
-   MD

Extract text.

Generate:

``` json
{
  "company": {},
  "services": [],
  "target_market": {},
  "geography": {},
  "ideal_customer": {},
  "negative_signals": [],
  "qualification_requirements": []
}
```

Keep source references so the AI can explain where important information
came from.

------------------------------------------------------------------------

# 11. QUESTIONNAIRE ENGINE

The AI must generate a questionnaire from business context.

Example:

``` text
Target industry?
Target geography?
Minimum company size?
Preferred company size?
Required services?
Businesses to exclude?
Strong pain signals?
Strong intent signals?
What should be verified by phone?
What should the caller never do?
```

The client can edit answers through chat.

Convert the final questionnaire into a machine-readable criteria object.

Example:

``` json
{
  "industry": ["dental"],
  "location": {
    "city": "Austin",
    "radius_miles": 50
  },
  "min_employees": 10,
  "required_signals": [
    "appointment_volume",
    "phone_accessibility_problem"
  ],
  "excluded": [
    "new_businesses"
  ],
  "call_questions": [
    "Who handles inbound calls?",
    "Do you miss calls during busy periods?",
    "Are you considering an answering solution?"
  ]
}
```

------------------------------------------------------------------------

# 12. LEAD DISCOVERY

Build a provider abstraction.

Do not hard-code the application around one external data source.

Use:

``` typescript
interface LeadDiscoveryProvider {
  search(criteria: SearchCriteria): Promise<RawLead[]>;
}
```

The MVP can use synthetic data.

Production adapters may later connect to permitted business data
providers.

Important:

-   respect source terms;
-   do not pretend that scraped data is automatically credible;
-   retain provenance;
-   deduplicate businesses;
-   normalize phone numbers and domains.

------------------------------------------------------------------------

# 13. ENRICHMENT

Use separate enrichment services.

``` typescript
interface LeadEnrichmentProvider {
  enrich(lead: RawLead): Promise<LeadEnrichment>;
}
```

Possible enrichment:

-   website;
-   services;
-   public business information;
-   reviews/signals where permitted;
-   company references;
-   decision-maker information where permitted.

Do not treat social engagement as proof of purchase intent.

Distinguish:

``` text
weak signal:
like/follow/generic comment

medium signal:
specific question/repeated engagement

strong signal:
explicitly seeking a solution/problem/pricing
```

------------------------------------------------------------------------

# 14. EVIDENCE MODEL

Every meaningful lead claim should have evidence.

Use:

``` typescript
type Evidence = {
  type: string;
  claim: string;
  source: string;
  sourceReference?: string;
  observedAt: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
};
```

The UI should distinguish:

``` text
OBSERVED
INFERRED
VERIFIED BY CALL
```

Example:

``` text
OBSERVED
Website has no online booking detected.

HYPOTHESIS
This may indicate an opportunity for
appointment automation.

VERIFIED
Office manager stated that calls are
frequently missed during peak hours.
```

------------------------------------------------------------------------

# 15. LEAD SCORING

Default:

``` text
ICP FIT             25
BUSINESS QUALITY    15
PAIN SIGNAL         25
INTENT              20
RECENCY             10
CONTACTABILITY       5
-----------------------
TOTAL              100
```

Return both:

``` json
{
  "score": 94,
  "components": {},
  "evidence": [],
  "hypothesis": "...",
  "recommended_action": "call"
}
```

Do not make unexplained AI scores.

------------------------------------------------------------------------

# 16. CALL-E INTEGRATION

Create a dedicated server-side adapter.

``` typescript
interface PhoneAgent {
  createCall(input: CreateCallInput): Promise<Call>;
  getCall(id: string): Promise<Call>;
}
```

Implement:

``` text
SyntheticPhoneAgent
CALL-EPhoneAgent
```

Both must implement the same interface.

This makes development possible without consuming live calls.

------------------------------------------------------------------------

# 17. CALL BRIEF

Before CALL-E is invoked, generate:

``` json
{
  "target": {},
  "objective": "...",
  "business_context": {},
  "evidence": [],
  "hypothesis": "...",
  "questions": [],
  "constraints": [],
  "success_conditions": []
}
```

Convert this into CALL-E's natural-language task.

Example:

``` text
Call Acme Dental on behalf of our client.

Objective:
Determine whether the practice currently has difficulty
handling inbound appointment calls.

Evidence:
The website does not appear to provide online booking.

This is an observation, not a confirmed problem.

Ask:
1. Who currently handles inbound calls?
2. Are calls missed during busy periods?
3. What happens after hours?
4. Are they considering improving the process?
5. Who makes the relevant decision?

Do not make commitments or purchases.
Do not misrepresent identity.
Do not claim uncertain information as fact.
Return structured answers.
```

------------------------------------------------------------------------

# 18. CALL-E STRUCTURED RESULT

Always provide a structured result schema.

Example:

``` typescript
const resultSchema = {
  type: "object",
  properties: {
    decision_maker_reached: {
      type: "boolean"
    },
    need_confirmed: {
      type: "boolean"
    },
    current_solution: {
      type: "string"
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
    quantity: {
      type: "number"
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

Only request fields that make sense for the current task.

------------------------------------------------------------------------

# 19. CALL-E API IMPLEMENTATION

Use the official CALL-E API/SDK according to the current documentation.

The conceptual server-side REST integration is:

``` typescript
const response = await fetch(
  `${CALLE_API_URL}/calls`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.CALLE_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      task: callTask,
      recipients: [
        {
          phone_number: lead.phone
        }
      ],
      result_schema: resultSchema,
      metadata: {
        organization_id: organizationId,
        lead_id: lead.id,
        task_id: task.id
      },
      webhook_url:
        `${APP_URL}/api/webhooks/calle`
    })
  }
);
```

Do not hard-code provider URLs or fields without checking the current
CALL-E API documentation during implementation.

------------------------------------------------------------------------

# 20. WEBHOOK

Create:

``` text
POST /api/webhooks/calle
```

Flow:

``` text
CALL-E
 ↓
webhook
 ↓
authenticate/verify
 ↓
deduplicate event
 ↓
update call
 ↓
retrieve result if required
 ↓
validate structured result
 ↓
store result
 ↓
update lead
 ↓
emit dashboard event
```

Never trust arbitrary webhook payloads.

------------------------------------------------------------------------

# 21. CALL-E RESULT PROCESSING

When the result arrives:

``` text
CALL-E structured result
        ↓
schema validation
        ↓
database
        ↓
result synthesizer
        ↓
human-readable summary
        ↓
lead qualification update
        ↓
UI
```

Example final state:

``` json
{
  "qualification": "verified",
  "need_confirmed": true,
  "decision_maker_reached": true,
  "summary": "The office manager confirmed..."
}
```

------------------------------------------------------------------------

# 22. SYNTHETIC MODE

Implement first.

Environment:

``` env
CALL_MODE=synthetic
```

Synthetic flow:

``` text
Lead
 ↓
Call brief
 ↓
Fake CALL-E adapter
 ↓
2–5 second simulated conversation
 ↓
Structured result
 ↓
Dashboard
```

Example:

``` typescript
async function createSyntheticCall(input: CreateCallInput) {
  await delay(2000);

  return {
    id: `sim_${crypto.randomUUID()}`,
    status: "completed",
    structuredResult: {
      decision_maker_reached: true,
      need_confirmed: true,
      current_solution: "Receptionist",
      next_action: "Follow up"
    }
  };
}
```

The UI must make synthetic/live state clear to developers, while the
product demo should use a visually coherent experience.

------------------------------------------------------------------------

# 23. API ROUTES

Implement:

``` text
POST   /api/tasks
GET    /api/tasks/:id
POST   /api/tasks/:id/cancel

GET    /api/tasks/:id/leads
GET    /api/tasks/:id/events

POST   /api/leads/:id/call
GET    /api/calls/:id

POST   /api/webhooks/calle

POST   /api/chat
POST   /api/documents
```

Keep provider-specific logic out of React components.

------------------------------------------------------------------------

# 24. DATABASE

Create:

``` text
organizations
organization_members
business_documents
business_profiles
lead_criteria
leads
evidence
calls
call_results
events
tasks
processed_webhook_events
audit_logs
```

Use UUIDs.

Add indexes for:

``` text
organization_id
task_id
lead_id
call_id
status
created_at
```

Use Row Level Security where appropriate.

------------------------------------------------------------------------

# 25. AUDIT LOGGING

Record important events:

``` text
document_uploaded
criteria_changed
lead_created
lead_selected
call_authorized
call_created
call_completed
call_failed
result_created
task_completed
```

Do not log secrets or unnecessary sensitive information.

------------------------------------------------------------------------

# 26. AI TOOL SECURITY

The LLM may produce an action proposal.

Never directly execute arbitrary LLM-generated API calls.

Use:

``` text
LLM
 ↓
Structured action
 ↓
Zod validation
 ↓
Authorization
 ↓
Policy check
 ↓
Provider call
```

Example:

``` json
{
  "action": "create_call",
  "lead_id": "lead_123"
}
```

The backend independently verifies:

``` text
lead exists
lead belongs to organization
user has permission
lead has valid phone
calling is enabled
quota allows call
approval requirement satisfied
```

Only then create the CALL-E call.

------------------------------------------------------------------------

# 27. CHAT CONTEXT

The AI chat should receive controlled context:

``` text
Current organization
Business profile
Current criteria
Current task
Selected lead
Relevant evidence
Call result
```

Do not dump the entire database into the model.

Use scoped retrieval.

The AI should not be able to see another tenant's information.

------------------------------------------------------------------------

# 28. UI STATES

Every asynchronous action needs visible state.

Examples:

``` text
Analyzing documents...
Building your lead criteria...
Searching for businesses...
Analyzing 37 candidates...
8 strong leads found.
Preparing call...
Calling...
Waiting for response...
Call completed.
Verifying result...
```

Never leave the user staring at a spinner with no explanation.

------------------------------------------------------------------------

# 29. ERROR STATES

Design explicitly for:

``` text
No leads found
No qualifying leads
Provider unavailable
CALL-E call failed
Recipient unavailable
Invalid phone number
Webhook delayed
AI failed
Document unreadable
Quota exceeded
Unauthorized action
```

The UI should explain what happened and what can be done next.

------------------------------------------------------------------------

# 30. BUILD STRATEGY

Do not attempt the entire product at once.

Build in this order:

## Step 1

React dashboard shell.

## Step 2

Synthetic lead data.

## Step 3

Supabase schema.

## Step 4

Document → synthetic business profile.

## Step 5

Business profile → questionnaire.

## Step 6

Questionnaire → synthetic leads.

## Step 7

Lead scoring/evidence.

## Step 8

Synthetic phone agent.

## Step 9

Call logs/result summaries.

## Step 10

Replace synthetic phone adapter with CALL-E.

## Step 11

AI chat.

## Step 12

Security hardening.

## Step 13

Real demo call.

------------------------------------------------------------------------

# 31. CODING RULES

When generating code:

-   TypeScript strict mode.
-   No `any` unless unavoidable and documented.
-   Validate external data.
-   Keep components small.
-   Separate UI from business logic.
-   Separate provider adapters.
-   Use typed API responses.
-   Use environment variables for secrets.
-   Never duplicate provider logic.
-   Write reusable functions.
-   Handle errors explicitly.
-   Avoid unnecessary dependencies.
-   Do not rewrite working architecture without reason.

Before adding a package, ask whether the feature can be implemented with
the existing stack.

------------------------------------------------------------------------

# 32. DESIGN RULES

The product should look premium, restrained, and credible.

Use:

-   strong typography;
-   clear hierarchy;
-   compact data density;
-   subtle motion;
-   clear statuses;
-   evidence chips;
-   meaningful empty states;
-   clean tables/cards;
-   strong spacing;
-   responsive behavior.

Do not use:

-   excessive gradients;
-   meaningless charts;
-   stock illustrations;
-   fake AI sparkle effects everywhere;
-   generic CRM aesthetics;
-   unnecessary modal overload.

------------------------------------------------------------------------

# 33. DEMO EXPERIENCE

The demo should tell a story.

### Scene 1

Client uploads:

> "We sell AI receptionists to dental practices."

### Scene 2

AI creates:

``` text
Target:
Dental practices
Austin + 50 miles
10+ employees

Strong signals:
Missed calls
No online booking
Hiring reception staff
After-hours demand
```

### Scene 3

Lead dashboard appears.

Top lead:

``` text
94 / 100
Austin Smile Center

Why:
No online booking
Phone accessibility signals
15 employees
Owner identified
```

### Scene 4

User asks:

> "Why should we call them?"

AI explains the evidence and hypothesis.

### Scene 5

User clicks:

> Call lead

### Scene 6

CALL-E makes the actual phone call.

### Scene 7

CALL-E returns:

``` text
Need confirmed: YES
Decision maker reached: YES
Current solution: Receptionist
Pain: Missed calls
Next action: Follow-up
```

### Scene 8

Lead becomes:

``` text
VERIFIED OPPORTUNITY
```

The AI summarizes:

> "The office manager confirmed they miss calls during peak periods and
> are currently evaluating automated answering options. Follow-up is
> recommended."

This is the core product moment.

------------------------------------------------------------------------

# 34. FINAL ENGINEERING PRINCIPLE

Do not optimize for the number of AI features.

Optimize for:

``` text
Evidence
   +
Reasoning
   +
Action
   +
Verification
   +
Structured outcome
```

The finished product should make a judge think:

> "This isn't just an AI that calls people. It understands why someone
> is worth calling, gathers evidence, forms a hypothesis, uses CALL-E to
> test that hypothesis in the real world, and turns the conversation
> into useful business intelligence."

Build toward that experience above all else.
