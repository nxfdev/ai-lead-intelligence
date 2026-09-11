# SRS --- Software Requirements Specification

**Version:** 1.0\
**Date:** 11 September 2026\
**System:** AI Lead Intelligence & CALL-E Qualification Platform

------------------------------------------------------------------------

## 1. Purpose

This document defines the functional and non-functional requirements for
a React-based SaaS platform that:

1.  understands a client's business;
2.  creates lead-selection criteria;
3.  discovers and enriches potential business leads;
4.  scores leads using evidence;
5.  allows the client to review them;
6.  optionally contacts selected leads through CALL-E;
7.  stores and summarizes call results;
8.  updates lead qualification status.

------------------------------------------------------------------------

# 2. System Actors

## 2.1 Client

A subscribed business user who:

-   uploads business materials;
-   defines objectives;
-   reviews questionnaires;
-   reviews leads;
-   authorizes calls;
-   views call outcomes.

## 2.2 Platform AI

The internal LLM-powered assistant responsible for:

-   business-context extraction;
-   questionnaire generation;
-   conversational criteria editing;
-   lead analysis;
-   evidence interpretation;
-   result synthesis.

## 2.3 Lead Data Providers

External sources used for candidate discovery and enrichment.

All integrations must comply with provider terms, applicable law, and
the technical access method being used.

## 2.4 CALL-E

Phone-agent execution service used to:

-   initiate calls;
-   converse with recipients;
-   adapt during conversations;
-   collect requested information;
-   return structured results.

## 2.5 System Administrator

Optional administrative actor responsible for:

-   system health;
-   provider configuration;
-   security monitoring;
-   user/account management.

------------------------------------------------------------------------

# 3. Functional Requirements

## FR-001 --- Authentication

The system shall allow clients to securely authenticate.

Requirements:

-   email/password or supported secure authentication;
-   session management;
-   protected routes;
-   logout;
-   tenant/user authorization.

------------------------------------------------------------------------

## FR-002 --- Business Material Upload

Clients shall be able to upload business materials.

Supported initial formats may include:

-   PDF;
-   DOCX;
-   TXT;
-   MD;
-   selected images if OCR is implemented.

The system shall extract text and create an internal business profile.

The original file should not be sent to an external model unless
required and authorized.

------------------------------------------------------------------------

## FR-003 --- Business Profile Extraction

The AI shall extract:

-   company description;
-   services;
-   industries;
-   geography;
-   ideal customer;
-   exclusions;
-   price/size indicators where provided;
-   differentiators;
-   qualification requirements.

Example:

``` json
{
  "industry": ["dental"],
  "geography": ["Texas"],
  "employee_range": "5-20",
  "services_sold": [
    "AI receptionist",
    "website development"
  ],
  "target_characteristics": [
    "established businesses",
    "multiple staff"
  ]
}
```

The system must label inferred information as inferred.

------------------------------------------------------------------------

## FR-004 --- Questionnaire Generation

The AI shall generate a questionnaire describing the target lead.

Example questions:

1.  What industries should be targeted?
2.  What geographic radius is acceptable?
3.  What minimum business size is required?
4.  What signals indicate strong fit?
5.  What businesses should be excluded?
6.  What evidence indicates potential need?
7.  What information should CALL-E verify?

The client must be able to edit the questionnaire.

------------------------------------------------------------------------

## FR-005 --- Conversational Criteria Editing

The right-side AI chat shall allow natural-language changes.

Example:

> "Don't target businesses with fewer than 10 employees."

The system shall update the criteria and explain the effect.

------------------------------------------------------------------------

## FR-006 --- Candidate Discovery

The system shall retrieve candidate businesses through configured
sources.

Each candidate shall receive:

-   stable internal ID;
-   source;
-   source identifier if available;
-   business name;
-   category;
-   location;
-   phone if available;
-   website if available;
-   source metadata.

Duplicate candidates shall be merged where identity can be established
with sufficient confidence.

------------------------------------------------------------------------

## FR-007 --- Business Enrichment

The system shall enrich candidates using permitted sources.

Possible enrichment:

-   website;
-   business description;
-   services;
-   opening hours;
-   public reviews;
-   technology indicators;
-   public social/company references;
-   decision-maker information where permitted.

Every enrichment field should retain provenance.

------------------------------------------------------------------------

## FR-008 --- Evidence Model

The system shall represent evidence separately from conclusions.

Example:

``` json
{
  "type": "website_observation",
  "claim": "No online booking detected",
  "source": "https://example.com",
  "observed_at": "2026-09-11T00:00:00Z",
  "confidence": 0.82
}
```

The system shall avoid presenting uncertain observations as facts.

------------------------------------------------------------------------

## FR-009 --- Lead Scoring

The system shall calculate a lead score from configured criteria.

The score shall be explainable.

Example:

``` json
{
  "score": 91,
  "components": {
    "icp_fit": 24,
    "business_quality": 14,
    "pain_signal": 24,
    "intent": 17,
    "recency": 8,
    "contactability": 4
  }
}
```

------------------------------------------------------------------------

## FR-010 --- Lead Dashboard

The middle dashboard section shall show:

-   lead score;
-   company;
-   category;
-   location;
-   contact;
-   decision-maker;
-   evidence;
-   status;
-   CALL-E status;
-   qualification state.

Filtering shall support:

-   score;
-   location;
-   category;
-   status;
-   qualification;
-   call status.

------------------------------------------------------------------------

## FR-011 --- Lead Selection

Clients shall be able to:

-   select individual leads;
-   select multiple leads;
-   exclude leads;
-   mark leads as reviewed;
-   request calls.

Calls must not begin merely because a lead was discovered.

------------------------------------------------------------------------

## FR-012 --- Call Brief Generation

Before calling, the AI shall create a structured brief.

Required fields:

``` json
{
  "objective": "...",
  "business_context": {},
  "evidence": [],
  "hypothesis": "...",
  "questions": [],
  "constraints": [],
  "desired_result": {}
}
```

------------------------------------------------------------------------

## FR-013 --- CALL-E Integration

The backend shall create CALL-E calls using the provider API/SDK.

The integration shall:

-   use server-side authentication;
-   pass a natural-language task;
-   specify recipient;
-   provide a structured result schema;
-   attach internal task/lead metadata;
-   provide a webhook endpoint where supported;
-   use idempotency protection.

------------------------------------------------------------------------

## FR-014 --- Structured Call Results

The platform shall accept structured call results.

Example:

``` json
{
  "qualified": true,
  "decision_maker_reached": true,
  "need_confirmed": true,
  "available_slots": [
    "Tuesday 2 PM",
    "Wednesday 11 AM"
  ],
  "quantity": 500,
  "price": 22500,
  "currency": "BDT",
  "next_action": "Schedule follow-up"
}
```

The actual schema shall be generated according to the client's
questionnaire.

------------------------------------------------------------------------

## FR-015 --- Call Summary

The system shall generate a concise human-readable summary from the
CALL-E result.

The summary shall distinguish:

-   what was confirmed;
-   what was uncertain;
-   what the recipient said;
-   recommended next action.

------------------------------------------------------------------------

## FR-016 --- Call Logs

The left dashboard section shall show:

-   call status;
-   recipient;
-   time;
-   summary;
-   qualification result;
-   confidence;
-   next action.

------------------------------------------------------------------------

## FR-017 --- AI Chat

The right dashboard section shall support:

-   criteria discussion;
-   questionnaire editing;
-   lead explanations;
-   call preparation;
-   call-result questions;
-   task status;
-   recommendations.

The chat must not bypass authorization controls.

A user request such as:

> "Call all leads"

must pass through the application's authorization and policy layer
before external calls are created.

------------------------------------------------------------------------

## FR-018 --- Human Approval

The system should support explicit approval for high-impact actions.

Recommended MVP policy:

``` text
Discover → Analyze → Prepare calls → Human approval → Call
```

Automatic calling may be enabled only through an explicit client
setting.

------------------------------------------------------------------------

## FR-019 --- Task State

A task shall move through controlled states:

``` text
created
planning
discovering
enriching
scoring
ready_for_review
calling
analyzing
completed
failed
cancelled
```

Invalid state transitions shall be rejected.

------------------------------------------------------------------------

## FR-020 --- Webhooks

CALL-E events shall be processed through a dedicated server endpoint.

Webhook handling shall be:

-   authenticated/verified where supported;
-   idempotent;
-   logged;
-   safe to retry.

------------------------------------------------------------------------

# 4. Non-Functional Requirements

## NFR-001 --- Security

-   No provider secrets in browser code.
-   Server-side secret management.
-   Authentication on protected endpoints.
-   Authorization on every tenant-scoped resource.
-   Input validation.
-   Output validation.
-   Rate limiting.
-   Audit logging.
-   Secure headers.
-   HTTPS in production.
-   No unnecessary sensitive-data retention.

## NFR-002 --- Multi-Tenancy

A client shall never be able to read another client's:

-   documents;
-   leads;
-   calls;
-   transcripts;
-   results;
-   prompts;
-   API metadata.

All database queries must be scoped by authenticated tenant/user
identity.

## NFR-003 --- Reliability

External calls may fail.

The system shall support:

-   retries with bounded backoff;
-   idempotency;
-   failure states;
-   partial task completion;
-   recovery from webhook duplication.

## NFR-004 --- Performance

Initial targets:

-   UI interactions: \<500 ms excluding external operations.
-   Task creation: \<2 seconds excluding asynchronous AI/provider
    processing.
-   Dashboard updates: near-real-time where practical.
-   External discovery/calling shall be asynchronous.

## NFR-005 --- Explainability

Every high-value lead should be accompanied by:

-   score;
-   score components;
-   evidence;
-   source;
-   timestamp;
-   confidence where applicable.

## NFR-006 --- Usability

The main dashboard must allow a user to understand:

> What is happening? Why is this lead here? What did the call discover?
> What should I do next?

without reading raw JSON.

------------------------------------------------------------------------

# 5. Core Data Model

## users

``` text
id
email
created_at
```

## organizations

``` text
id
name
created_at
```

## organization_members

``` text
organization_id
user_id
role
```

## business_documents

``` text
id
organization_id
filename
storage_path
mime_type
extracted_text
created_at
```

## business_profiles

``` text
id
organization_id
profile_json
version
created_at
```

## lead_criteria

``` text
id
organization_id
criteria_json
version
created_at
```

## leads

``` text
id
organization_id
name
phone
website
location
category
score
status
profile_json
created_at
updated_at
```

## evidence

``` text
id
lead_id
type
claim
source
source_reference
observed_at
confidence
metadata
```

## calls

``` text
id
organization_id
lead_id
calle_call_id
status
task
started_at
completed_at
```

## call_results

``` text
id
call_id
structured_result
summary
confidence
created_at
```

## events

``` text
id
organization_id
task_id
type
data
created_at
```

------------------------------------------------------------------------

# 6. API Requirements

## POST /api/tasks

Creates a lead-research task.

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

Returns task state and progress.

## GET /api/tasks/:id/leads

Returns curated leads.

## GET /api/tasks/:id/events

Returns task progress/events.

## POST /api/leads/:id/call

Requests a CALL-E call after authorization.

## GET /api/calls/:id

Returns call state and summary.

## POST /api/webhooks/calle

Receives provider events.

------------------------------------------------------------------------

# 7. Acceptance Test

A complete demo task shall be able to perform:

``` text
1. Upload business profile
2. Extract business context
3. Generate questionnaire
4. Client modifies criteria
5. Discover synthetic candidates
6. Score candidates
7. Display lead dashboard
8. Select one lead
9. Generate call brief
10. Start CALL-E call
11. Receive completion event
12. Retrieve structured result
13. Generate summary
14. Update lead
15. Display call log
16. Ask AI "What happened?"
17. AI answers using stored evidence
```

The synthetic mode must run the same application flow without a live
phone call.
