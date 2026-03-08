# AIpods Platform — Complete Reference Document
**Version:** March 2026 (Thread vFinal)  
**Purpose:** Single source of truth for Cursor, the autonomous agents, and all future development.

## 1. Vision & Mission
AIpods is a B2B SaaS platform that delivers **fully autonomous AI agent teams** ("pods") that function as complete departments for companies.

Each pod is:
- Modular and scalable (start with a Mini Pod → add unlimited modules)
- Powered by a **shared Company Knowledge Center** that grows forever
- Model-agnostic (never locked to one LLM provider)
- Built to replace or augment expensive human teams at 1/10th the cost

**Core promise to customers:**  
"Upload your documents once. Get an entire AI department that never forgets, never sleeps, and keeps getting smarter — with zero data leakage and full privacy."

We only serve **business use cases** (marketing, sales, ops, creative, research, finance ops, etc.). Personal, coaching, education, legal, medical, or any regulated pods are strictly forbidden.

## 2. Core Architecture
- **Pods** = multi-agent teams (3–15 specialized agents orchestrated with LangGraph)
- **Company Knowledge Center** = the 10-year moat  
  - Per-client encrypted vector store (Supabase + pgvector)
  - Client-side encryption (Web Crypto API) — key never leaves browser
  - All pods of the same client share the same knowledge base automatically
  - Pods write every lesson/outcome back to the center (no siloed knowledge)
- **Dynamic Model Router** — always picks the best/cheapest model (Claude, Grok, Gemini, etc.)
- **Anonymized Pattern Store** — only aggregated, anonymized learnings (e.g. "DTC brands $2M–$20M ARR: free-shipping hooks convert 2.8× better")
- **Autonomous Company Layer** — runs 24/7 with exactly 7 agents (see section 7)

## 3. Key Features
- **Modularity & Addictive Upgrades**  
  Every pod starts as Mini → one-click modules (Social Ads, Motion, Presentations, Branding, etc.)  
  Upgrades feel addictive: instant ROI preview, monthly Growth Report, +25% Task Units bonus on upgrade.

- **Company Knowledge Center**  
  Drag-and-drop once → every new pod instantly knows everything about the company.  
  Score increases over time ("Team Intelligence Score").

- **AI Task Units** (unified currency across all pods)  
  1 unit ≈ value of 1 skilled human hour (delivered in minutes).

- **Freemium**  
  Free plan: 40 units/month (watermarked) — designed for high conversion, minimal cost.

- **Dashboards** (Astro 5 + Vercel)
  - Customer dashboard: My Pods, Knowledge Center, Usage, Billing, Growth Reports
  - Internal admin dashboard (protected route /internal): metrics, escalation queue, CEO reports

## 4. Business Model & Pricing (March 2026)
**Subscription-only** (monthly, annual 20% discount)

| Tier       | Price/mo | Task Units | Effective price/unit | Margin (70% utilization) |
|------------|----------|------------|----------------------|--------------------------|
| Starter    | $69      | 180        | $0.38                | 85%                      |
| Growth     | $199     | 650        | $0.31                | 86%                      |
| Scale      | $499     | 2,200      | $0.23                | 83%                      |
| Enterprise | $1,499+  | 8,000+     | Negotiated           | 80–84%                   |

- 30% rollover of unused units
- Overage $0.99/unit
- +25% bonus units on any upgrade (first month)
- Goal: 82–87% blended gross margin

## 5. Security & Privacy (Non-Negotiable)
- Client-side encryption before any upload (key never leaves browser)
- Per-client isolated Supabase schemas + Row Level Security
- Zero human/company access to raw client data (even we cannot read it)
- Zero cross-client contamination (raw data never shared)
- Only anonymized patterns go to global improvement store
- Full audit trail for every knowledge access
- Client can disable anonymized learning anytime

## 6. Ethics & Guardrails
- Always truth-seeking and data-verifiable
- Never hallucinate
- Never give regulated advice (legal, medical, financial, tax, etc.)
- QA & Reviewer Layer mandatory on every output
- Strict business-only focus

## 7. Autonomous Company Layer (The Machine That Runs AIpods)
Runs 24/7 with **exactly 7 agents**:
1. AI CEO (strategy & decisions)
2. Pod Factory Director (builds, tests, iterates new pods)
3. Sales & Outreach Director
4. Marketing & Content Director (website, SEO, content)
5. Finance & Ops Director (billing, Stripe, metrics)
6. Customer Success Director (onboarding, Growth Reports)
7. QA & Reviewer Layer (hallucination + ethics + privacy checks)

**Permanent Rules for CEO & Pod Factory Director** (must be enforced forever):
- Rule 1: Every pod writes every lesson/outcome to the shared Company Knowledge Center.
- Rule 2: Never hard-code to one model — always use dynamic router.
- Rule 3: Every new module must be vertical- or outcome-specific. Generic agents forbidden.

## 8. Tech Stack (March 2026)
- Frontend/Dashboards: Astro 5 + Vercel
- Auth: Clerk
- Database: Supabase (RLS + pgvector + storage)
- Agents: LangGraph + dynamic model router
- Encryption: Web Crypto API (client-side)
- Deployment: Vercel (zero-downtime)

## 9. Long-Term Moat Strategy (10+ Years)
- Proprietary Company Knowledge Graph (the real defensibility)
- Model-agnostic orchestration
- Vertical outcome data from real clients (anonymized)
- Autonomous self-improvement flywheel
- Enterprise-grade privacy & trust layer
- Predictable pricing vs token roulette
- Future marketplace of customer-created modules

## 10. Non-Negotiable Rules Summary
Any new feature, pod, or change **must** pass all 7 rules:
1. Privacy absolute + zero-leakage
2. Zero cross-client contamination
3. Modular + addictive upgrades
4. 10-year moat (Knowledge Center + model-agnostic)
5. Business-only focus
6. Truth + QA Layer
7. Autonomous with 7 agents + Astro + Vercel

---

**This document is the single source of truth.**  
All future Cursor prompts, autonomous agents, and code must align 100% with it.

Last updated: March 2026 (full thread synthesis)
