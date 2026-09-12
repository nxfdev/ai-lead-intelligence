# CALL-E AI Agent Pipeline - Complete Guide

## Overview

The CALL-E AI Agent Pipeline is a complete system for making AI-powered phone calls to leads, conducting structured conversations, and recording results. This document explains the entire pipeline and what you need to provide to use it.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CALL-E AI Agent Pipeline                 │
├─────────────────────────────────────────────────────────────┤
│  1. Lead Discovery → 2. Enrichment → 3. Scoring → 4. Calls │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| **Call Brief Generator** | `server/services/call-brief.ts` | Creates structured call briefs from lead data |
| **Phone Agent** | `server/services/phone-agent.ts` | Executes calls via synthetic or CALL-E |
| **Synthesis Service** | `server/services/synthesis.ts` | Processes call results into summaries |
| **Orchestrator** | `server/services/orchestrator.ts` | Coordinates the full pipeline |

## Pipeline Flow

### Step 1: Lead Discovery
The system discovers leads based on your criteria:
- Industry (dental, medical, etc.)
- Location (city, state, radius)
- Employee count
- Required signals (pain points, business signals)

### Step 2: Enrichment
Each lead is enriched with:
- Website analysis
- Social profiles
- Email verification (SMTP handshake)
- Review analysis
- Business hours

### Step 3: Scoring
Leads are scored based on:
- ICP Fit (25 points)
- Business Quality (15 points)
- Pain Signal (25 points)
- Intent (20 points)
- Recency (10 points)
- Contactability (5 points)

### Step 4: CALL-E Calls

#### Call Brief Generation
For each qualified lead, the system generates a structured call brief:

```text
OBJECTIVE:
Determine whether the business currently has difficulty handling inbound calls.

COLLECT:
- who handles calls
- whether calls are missed
- current answering system
- interest in improving the process
- decision-maker identity
- appropriate next step

DO NOT:
- make purchases or financial commitments
- misrepresent identity
- claim uncertain information as fact
```

#### Conversation Flow

The AI agent conducts a structured conversation:

```
AGENT: "Hello, is this [Business Name]? I'm calling from AI Lead Intelligence..."
LEAD: "Yes, this is [Name] speaking."
AGENT: "Great. Could you tell me who typically handles incoming calls during business hours?"
LEAD: "We have a receptionist, but during busy mornings it can get overwhelming."
AGENT: "What happens to the calls that come in during those busy periods?"
LEAD: "Most go to voicemail, and we try to return them when we can."
AGENT: "How many calls would you estimate you're missing during peak hours?"
LEAD: "Probably 5-10 per day, especially between 8-11 AM."
AGENT: "What would happen if you had an automated system that could answer those calls, take messages, and even schedule appointments?"
LEAD: "That would be incredible, honestly. We've been looking for a solution."
AGENT: "Could I get the best email address to send you some information?"
LEAD: "Sure, it's dr.mitchell@austinsmilecenter.com."
```

#### Result Processing

After the call, the system:
1. Extracts structured data (decision maker reached, need confirmed, etc.)
2. Synthesizes a human-readable summary
3. Determines qualification (qualified, not_qualified, needs_follow_up)
4. Updates the lead record with verified evidence

## What You Need to Provide

### 1. OpenRouter API Key (Required)

Set your OpenRouter API key in `.env`:

```bash
OPENROUTER_API_KEY=sk-your-openrouter-api-key-here
```

Get your key at: https://openrouter.ai/keys

### 2. CALL-E API Key (For Live Calls)

If you want to make real phone calls (not synthetic), set:

```bash
CALL_E_API_KEY=your-calle-api-key-here
CALL_MODE=live
```

**Default Mode:** `synthetic` (simulated calls for testing)

### 3. Database

The system uses SQLite by default. The database file is at:
```
app/prisma/dev.db
```

To initialize:
```bash
cd app
pnpm prisma migrate dev
```

### 4. Environment Variables

Create `.env` file in `app/` directory:

```bash
# Required for LLM
OPENROUTER_API_KEY=sk-your-key-here

# Optional: Choose model (default: google/gemini-3.6-flash)
OPENROUTER_MODEL=google/gemini-3.6-flash

# Optional: CALL-E integration
CALL_MODE=synthetic  # or "live"
CALL_E_API_KEY=your-calle-key-here

# Optional: App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Running the Pipeline

### Test Script

Run the comprehensive test script:

```bash
cd app
pnpm tsx scripts/test-calle-pipeline.ts
```

This will:
1. Create test leads in the database
2. Generate call briefs
3. Simulate conversations
4. Process results
5. Update lead records

### API Endpoints

#### Trigger a Call
```bash
POST /api/leads/{leadId}/call
```

#### Get All Calls
```bash
GET /api/calls
```

#### Get Lead Details
```bash
GET /api/leads/{leadId}
```

## Database Schema

The system uses these main tables:

- **leads** - Lead information and qualification status
- **calls** - Call records with briefs and results
- **call_results** - Structured call outcomes
- **evidence** - Verified facts from calls
- **tasks** - Pipeline task tracking

## Example Output

When you run the test script, you'll see output like:

```
🚀 Starting CALL-E Pipeline Test

================================================================================

📞 Testing lead: Austin Smile Center
------------------------------------------------------------

1️⃣  Creating lead in database...
   ✅ Created lead: abc123...

2️⃣  Adding evidence records...
   ✅ Added 3 evidence items

3️⃣  Generating call brief...
   📋 Call Brief Generated:
      Target: Austin Smile Center
      Phone: +15125551234
      Objective: Determine whether Austin Smile Center currently has difficulty...
      Questions: 5
      Constraints: 5

4️⃣  Converting to CALL-E task...
   📝 CALL-E Task:
   ------------------------------------------------
   Call Austin Smile Center at +15125551234.

   Objective:
   Determine whether Austin Smile Center currently has difficulty handling...

   Questions to ask:
   1. Who currently handles incoming calls?
   2. Do you experience missed calls during busy periods?
   ...
   ------------------------------------------------

5️⃣  Generating result schema...
   📊 Schema fields: decision_maker_reached, need_confirmed, current_solution...

6️⃣  Simulating conversation flow...
   🤖 Agent: "Hello, is this Austin Smile Center?..."
   👤 Lead: "Yes, this is Dr. Mitchell speaking."
   ...
```

## Customization

### Modifying Conversation Questions

Edit the `callQuestions` array in `server/services/call-brief.ts`:

```typescript
const defaultQuestions = [
  "Who currently handles incoming calls?",
  "Do you experience missed calls during busy periods?",
  "What happens with after-hours calls?",
  // Add your custom questions here
];
```

### Changing Lead Criteria

Edit the criteria in `lib/types.ts` or use the API:

```bash
POST /api/criteria
{
  "industry": ["dental", "medical"],
  "location": { "city": "Austin", "state": "TX", "radiusMiles": 50 },
  "minEmployees": 5,
  "maxEmployees": 50
}
```

### Custom Synthesis Rules

Modify `server/services/synthesis.ts` to change how results are processed.

## Troubleshooting

### "OPENROUTER_API_KEY not configured"
- Set your OpenRouter API key in `.env`

### "CALL_E_API_KEY not set"
- This is expected if using synthetic mode
- For live calls, set your CALL-E API key

### Database errors
- Run `pnpm prisma migrate dev` to initialize
- Check `prisma/dev.db` exists

### LLM errors
- Verify your OpenRouter key is valid
- Check you have credits available
- Try a different model in `.env`

## Next Steps

1. Set your OpenRouter API key
2. Run the test script
3. Review the generated data in the database
4. Configure CALL-E for live calls (optional)
5. Integrate with your frontend

## Support

For issues or questions:
- Check the existing API routes in `app/api/`
- Review the database schema in `prisma/schema.prisma`
- Look at the type definitions in `lib/types.ts`
