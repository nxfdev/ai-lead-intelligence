# AI Lead Intelligence

> **Autonomous B2B Lead Discovery & Voice Qualification Platform** powered by OpenRouter AI (NVIDIA Nemotron Reasoning), Next.js 16, Prisma SQLite, and CALL-E voice agents.

---

## ✨ Features

- 🤖 **Multimodal AI Copilot** — Chat with text, images, and PDFs using the NVIDIA Nemotron reasoning model via OpenRouter
- 🔍 **Autonomous Lead Discovery** — Scrapes and enriches business leads based on your ICP
- 📊 **AI Lead Scoring** — Multi-signal scoring with hypothesis generation
- 📞 **CALL-E Voice Qualification** — AI phone calls with structured outcomes
- 📄 **Document Ingestion** — Upload ICP decks, battlecards, and pitch slides to auto-extract targeting criteria
- 🧠 **Business Type Clarification** — The copilot asks smart follow-up questions to dial in your target market
- ⚡ **Real-time SSE Pipeline** — Live progress updates as leads are discovered, enriched, scored, and called

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v12+ — `npm install -g pnpm`

### 1. Clone

```bash
git clone https://github.com/nxfdev/ai-lead-intelligence.git
cd ai-lead-intelligence/app
```

### 2. Install Dependencies

```bash
pnpm install
```

> ⚠️ If you see `ERR_PNPM_IGNORED_BUILDS`, check `pnpm-workspace.yaml` — `@openrouter/sdk` should have `allowBuilds: true`.

### 3. Configure Environment

```bash
cp app/.env.example app/.env.local
```

> The shared API key is already in `.env.example`. Just copy it — no edits needed to get started.

### 4. Set up the Database

```bash
pnpm prisma db push
```

### 4. Seed Sample Data (Optional)

```bash
npx tsx prisma/seed.ts
```

### 5. Start the Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Environment Variables

The `.env` file is included with a shared OpenRouter API key for collaboration.

| Variable | Description | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API Key | Shared key (see `.env`) |
| `OPENROUTER_MODEL` | Primary LLM model | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` |
| `CALL_MODE` | `synthetic` or `live` | `synthetic` |
| `CALL_E_API_KEY` | CALL-E API key (only for live mode) | — |

> **Note:** If the shared key runs out of credits, get a free key at [https://openrouter.ai/keys](https://openrouter.ai/keys) and replace `OPENROUTER_API_KEY` in `app/.env`.

### Model Fallback Chain

The copilot automatically retries on EOF/rate-limit errors using this cascade:
1. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` — Primary (free reasoning + vision)
2. `google/gemini-2.5-flash` — Fallback (fast, multimodal)
3. `meta-llama/llama-3.3-70b-instruct:free` — Fallback (free text)

---

## 🏗️ Architecture

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/         # Multimodal AI copilot (text + image + PDF)
│   │   │   ├── documents/    # File upload & text extraction
│   │   │   ├── leads/        # Lead CRUD + CALL-E dispatch
│   │   │   ├── tasks/        # Pipeline task management
│   │   │   ├── calls/        # Call log CRUD
│   │   │   └── events/       # Real-time SSE stream
│   │   └── page.tsx          # Main dashboard
│   ├── components/
│   │   ├── chat/             # ChatPanel — multimodal copilot UI
│   │   ├── leads/            # Lead dashboard table
│   │   └── calls/            # Call log panel
│   └── server/
│       └── services/
│           ├── openrouter.ts # OpenRouter multimodal LLM service
│           ├── orchestrator.ts
│           ├── scoring.ts
│           ├── enrichment.ts
│           ├── discovery.ts
│           ├── phone-agent.ts
│           └── synthesis.ts
├── prisma/
│   └── schema.prisma         # SQLite schema (dev) / PostgreSQL (prod)
└── .env                      # Shared config with API keys
```

---

## 🤝 Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📝 License

MIT
