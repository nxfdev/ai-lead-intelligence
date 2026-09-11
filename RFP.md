# RFP --- AI Lead Intelligence & Autonomous Calling Platform

**Version:** 1.0\
**Date:** 11 September 2026\
**Project:** CALL-E Hackathon Product\
**Document Type:** Request for Proposal (RFP)

------------------------------------------------------------------------

## 1. Executive Summary

We propose a web-based AI lead intelligence platform for businesses that
need to identify credible prospects and optionally contact those
prospects through the CALL-E phone-agent platform.

The product is not intended to be a generic AI voice bot or a basic
Google Maps scraper. Its core value proposition is:

> **Understand a client's business, identify what makes a prospect
> genuinely relevant, discover and enrich potential businesses, curate
> and score credible leads, and optionally use CALL-E to verify/qualify
> those leads through real phone conversations.**

A client supplies business documents, service descriptions,
target-market information, and other relevant materials. The platform
uses an LLM to understand those materials and generate a structured
lead-qualification questionnaire. The client can review or modify the
criteria through a chat interface.

The system then discovers potential leads, enriches them using permitted
data sources, evaluates evidence and lead quality, and presents a
curated list in the client's dashboard.

The client may stop at lead collection or authorize the platform to call
selected leads. When calling is enabled, CALL-E conducts the phone
conversation according to a controlled task and returns structured
information such as yes/no answers, availability, quantities, prices,
order capacity, timelines, and other requested fields.

The primary hackathon objective is to demonstrate a robust, technically
credible CALL-E application in which phone calls are an integral part of
a larger useful workflow.

------------------------------------------------------------------------

## 2. Problem Statement

Traditional lead generation often produces large quantities of low-value
records:

-   businesses copied from map listings;
-   generic contact information;
-   outdated websites;
-   irrelevant companies;
-   no indication of buying need;
-   no evidence for why the business should be contacted;
-   no verification of the information;
-   no structured outcome after outreach.

Cold-calling such lists wastes time and produces poor conversion rates.

The proposed platform addresses this by treating lead generation as a
multi-stage intelligence and verification problem.

### Desired transformation

``` text
Raw business list
        ↓
Relevant business
        ↓
Evidence-backed prospect
        ↓
Decision-maker/contactable prospect
        ↓
Lead hypothesis
        ↓
CALL-E verification
        ↓
Verified sales opportunity
```

------------------------------------------------------------------------

## 3. Project Objectives

### Primary objectives

1.  Allow a business client to provide documents and business context.
2.  Convert business context into a structured ideal-customer/lead
    questionnaire.
3.  Allow the client to review and edit the criteria conversationally.
4.  Discover candidate businesses from permitted sources.
5.  Enrich and normalize candidate records.
6.  Score candidates using transparent evidence-based criteria.
7.  Present a curated lead dashboard.
8.  Allow clients to select leads for phone qualification.
9.  Use CALL-E for real outbound phone conversations.
10. Convert call outcomes into structured, summarized results.
11. Preserve evidence and provenance for lead decisions.
12. Provide a secure, auditable architecture.

### Secondary objectives

-   Provide a compelling real-time demo.
-   Support synthetic/demo mode before live calling is enabled.
-   Make the system extensible to additional data providers.
-   Keep the initial system simple enough for rapid development.

------------------------------------------------------------------------

## 4. Proposed Product Scope

### In scope

#### Client onboarding

-   Account creation/authentication.
-   Business document upload.
-   Business profile/context.
-   Lead objective definition.
-   AI-generated questionnaire.
-   Human review and editing.

#### Lead intelligence

-   Candidate discovery.
-   Business normalization.
-   Website analysis.
-   Public business information enrichment.
-   Review/signal analysis where legally and technically permitted.
-   Decision-maker discovery where permitted.
-   Evidence collection.
-   Lead scoring.
-   Duplicate detection.
-   Lead status management.

#### CALL-E

-   Select leads for calling.
-   Generate call briefs.
-   Generate CALL-E tasks.
-   Supply structured result schemas.
-   Start outbound calls.
-   Track call status.
-   Receive call completion events/webhooks.
-   Store structured call results.
-   Generate concise summaries.
-   Display call logs.
-   Update lead qualification state.

#### Dashboard

The primary dashboard follows the supplied three-column concept:

``` text
┌────────────────────┬────────────────────────────┬────────────────────┐
│                    │                            │                    │
│   CALL LOGS        │      LEAD DASHBOARD       │    AI CHAT          │
│                    │                            │                    │
│ summarized calls   │ curated lead list         │ client ↔ AI         │
│ status             │ score                     │                    │
│ outcome            │ evidence                   │ criteria editing    │
│                    │ call status                │ task control        │
│                    │                            │ CALL-E interaction │
│                    │                            │                    │
└────────────────────┴────────────────────────────┴────────────────────┘
```

------------------------------------------------------------------------

## 5. Product Vision

The platform should feel like an **AI sales-research and qualification
operator**, not a CRM with a voice button.

The user should be able to say:

> "Find businesses like these that are likely to need our service, and
> call the strongest prospects to determine whether they are actually a
> fit."

The system should then:

1.  understand;
2.  research;
3.  filter;
4.  explain;
5.  call;
6.  verify;
7.  summarize;
8.  recommend the next action.

------------------------------------------------------------------------

## 6. Lead Quality Requirements

The product shall prioritize lead quality over raw lead count.

A lead should ideally contain multiple independent signals:

-   ICP fit;
-   geographic fit;
-   business legitimacy;
-   business size/characteristics;
-   service relevance;
-   website/business evidence;
-   potential pain point;
-   recent trigger;
-   decision-maker/contact information;
-   recency;
-   contactability.

The platform must distinguish between:

### Evidence

A source-backed observation.

Example:

> Website has no online booking mechanism detected.

### Hypothesis

An inference that may indicate a sales opportunity.

Example:

> Lack of online booking may indicate an opportunity for appointment
> automation.

### Verified fact

A claim confirmed during the CALL-E interaction.

Example:

> Staff member stated that calls are frequently missed during busy
> periods.

The UI should not present an inference as a verified fact.

------------------------------------------------------------------------

## 7. Lead Scoring

A default scoring model may use:

  Dimension               Weight
  -------------------- ---------
  ICP fit                     25
  Business quality            15
  Pain/need evidence          25
  Intent/trigger              20
  Recency                     10
  Contactability               5
  **Total**              **100**

The scoring engine must preserve the underlying evidence used to produce
the score.

Scores are recommendations, not claims of guaranteed purchase intent.

------------------------------------------------------------------------

## 8. CALL-E Role

CALL-E is the phone execution and conversation layer.

The platform should not use CALL-E merely to make arbitrary sales calls.

Before each call, the system generates a controlled call brief
containing:

-   target business;
-   available public business context;
-   reason for contacting;
-   evidence/hypothesis;
-   exact information to collect;
-   conversational constraints;
-   prohibited actions;
-   desired structured result.

Example:

``` text
OBJECTIVE:
Determine whether the business currently experiences
difficulty handling inbound customer calls.

COLLECT:
- who handles calls;
- whether calls are missed;
- current answering system;
- interest in improving the process;
- decision-maker identity;
- appropriate next step.

DO NOT:
- make purchases;
- make financial commitments;
- misrepresent identity;
- claim unverified review information as fact.
```

CALL-E's structured result becomes part of the lead record.

------------------------------------------------------------------------

## 9. Dashboard Requirements

### Left column --- Call Log

Each call entry should show:

-   business name;
-   call status;
-   date/time;
-   duration if available;
-   short summary;
-   qualification result;
-   confidence;
-   next action.

Example:

``` text
Austin Smile Center
✓ Completed

"Owner confirmed the clinic misses calls
during peak periods and is evaluating
automated answering options."

Qualified: YES
```

### Middle column --- Lead Dashboard

Each lead should show:

-   lead score;
-   company;
-   location;
-   category;
-   decision-maker if available;
-   contact information;
-   reason for score;
-   evidence;
-   current qualification state;
-   call status;
-   recommended next action.

### Right column --- AI Chat

The AI assistant should:

-   understand the client's business;
-   explain lead criteria;
-   propose a questionnaire;
-   allow criteria changes;
-   start research;
-   explain why leads were selected;
-   answer questions about evidence;
-   initiate or prepare CALL-E tasks;
-   summarize calls;
-   recommend next actions.

------------------------------------------------------------------------

## 10. Non-Goals

The MVP will not attempt to build:

-   a full CRM;
-   a universal web crawler;
-   unrestricted social-media scraping;
-   an autonomous purchasing agent;
-   autonomous financial commitments;
-   a general-purpose voice assistant;
-   a complete sales-email platform;
-   a full marketing automation suite.

------------------------------------------------------------------------

## 11. Security and Privacy Expectations

Security is a first-class product requirement.

The system must:

-   keep CALL-E/API secrets server-side;
-   never expose provider API keys in browser code;
-   validate all client inputs;
-   authenticate every protected API request;
-   authorize access to tenant-owned data;
-   isolate client data by tenant/user;
-   verify webhook authenticity where the provider supports
    verification;
-   use idempotency for external call creation;
-   prevent duplicate call execution;
-   avoid storing unnecessary sensitive information;
-   log security-relevant events;
-   use HTTPS in deployed environments;
-   use environment secrets rather than source-code credentials;
-   enforce rate limits and abuse controls;
-   sanitize rendered external content;
-   treat external content as untrusted data;
-   provide deletion/export controls where appropriate.

The project should target a **security-first implementation**. No
software system should be described as having literally zero security
risk.

------------------------------------------------------------------------

## 12. Success Criteria

The MVP is successful when a judge can observe:

``` text
Client context
    ↓
AI understands business
    ↓
Questionnaire generated
    ↓
Lead criteria approved
    ↓
Candidates discovered
    ↓
Evidence analyzed
    ↓
Curated leads appear
    ↓
User selects lead(s)
    ↓
CALL-E makes real call
    ↓
Human conversation occurs
    ↓
Structured result returned
    ↓
Dashboard updates
    ↓
AI explains recommendation
```

The system should make the CALL-E integration visibly necessary to the
product.

------------------------------------------------------------------------

## 13. Evaluation Criteria

The product should optimize for:

1.  **Real-world usefulness**
2.  **Strength of lead intelligence**
3.  **Quality of CALL-E integration**
4.  **Agentic behavior**
5.  **Structured results**
6.  **Evidence transparency**
7.  **Product polish**
8.  **Security**
9.  **Reliability**
10. **Demo clarity**

------------------------------------------------------------------------

## 14. Deliverables

-   React web application.
-   Secure backend/API layer.
-   Supabase/Postgres database.
-   AI business-understanding/questionnaire module.
-   Lead discovery/enrichment pipeline.
-   Lead scoring/evidence engine.
-   CALL-E integration.
-   Call log and result system.
-   Dashboard.
-   AI chat interface.
-   Synthetic demo mode.
-   Production/live CALL-E mode.
-   Technical documentation.
-   Demo script.
