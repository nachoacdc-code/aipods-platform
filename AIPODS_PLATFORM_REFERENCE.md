# AIpods Platform — Complete Reference Document
**Version:** March 2026 (Full Thread Synthesis – Final v3)  
**Purpose:** This is the SINGLE SOURCE OF TRUTH for Cursor, the 7 autonomous agents, and every future prompt, feature, or decision. Every agent and every line of code must align 100% with this document. Any contradiction must be resolved in favor of this document.

---

## 1. Vision & Mission

AIpods is a B2B SaaS platform that delivers **fully autonomous AI agent teams** ("pods") that function as complete, self-running departments for companies.

The goal is to give any company (SMB to mid-market) an entire AI department that:
- Works 24/7
- Never forgets anything about the business
- Continuously improves
- Delivers measurable ROI from day 1
- Costs 1/10th–1/20th of human teams

**Core promise to customers:**  
"Get an entire AI department — sales, marketing, creative, research, ops — that works 24/7, gets smarter every month, and costs a fraction of a human team. Scale faster than you ever thought possible."

> **INTERNAL ONLY:** We are building a company that is almost totally autonomous (runs with only 7 AI agents + minimal human oversight from the founder). The founder's role is 10–20 min/week reviewing the Sunday CEO Report and approving big decisions only. Clients never need to know this.

---

## 2. Brand Voice & External Communication

**Everything client-facing must feel:** positive, vibrant, enthusiastic, and focused on what clients will achieve. We are excited about what we're building and what our clients can accomplish with AI pods. That energy should come through in every page, email, notification, and interaction.

### Tone Rules (for website, dashboard copy, emails, outreach, social)

- **Lead with possibility and results.** "Imagine having a full creative team that never sleeps and gets better every week." Not "Our enterprise-grade encryption ensures zero data leakage."
- **Celebrate the client's success.** The hero is the client scaling their business — AIpods is the tool that makes it happen.
- **Be direct and confident.** We know this works. No hedging, no "maybe", no "try us out." Instead: "Your AI team is ready. Let's go."
- **Use energy, not hype.** Enthusiasm grounded in real outcomes. Show ROI numbers, show time saved, show what they'll build.
- **Make upgrades feel exciting, not salesy.** "Unlock Motion — your pods can now create video ads" beats "Upgrade to access premium features."

### What We Never Say Externally

- Never mention that AIpods is run by autonomous AI agents / an AI CEO. Clients interact with "the AIpods team" or "your dedicated AI team." The autonomous layer is strictly internal.
- Never lead with security, privacy, or compliance in marketing. These are table-stakes reassurances available on a dedicated Trust/Security page — not the headline.
- Never use fear-based messaging ("your data is at risk", "other tools leak your info"). We win on excitement and results, not FUD.
- Never position against specific competitors by name in public-facing copy.

### Where Security Lives

- **Dedicated Trust & Security page** on the website (linked from footer, settings, and during onboarding)
- **Brief reassurance line** in the Knowledge Center tab: "Your data is encrypted and private — only your pods can access it."
- **Settings page** has the full privacy controls (audit trail, anonymized learning toggle, data export/deletion)
- Security is a quiet confidence, not a loud headline.

---

## 3. Core Product: AI Pods

> Client-facing descriptions of pods should follow the tone in Section 2 — lead with what they achieve, not how they work internally.

- Each pod = a team of specialized AI agents (3–15 agents) orchestrated with LangGraph.
- Pods are **modular and scalable**:
  - Start with a **Mini Pod** (3–5 agents, low price)
  - Add unlimited modules with one click (Social Ads, Motion, Presentations, Branding, AEC Signals, Funding Signals, etc.)
  - Upgrade/downgrade instantly and prorated
  - Modules are priced $29–$79 each and stack perfectly
- **Addictive upgrades**: Every module addition shows instant ROI preview, projected extra pipeline/revenue, and gives +25% bonus Task Units for the first month.
- Pods are **business-only** (sales, marketing, ops, creative, research, finance ops, recruiting, etc.). **Strictly forbidden:** personal coaching, education, legal, medical, or any regulated advice. The QA layer auto-rejects anything that could be seen as regulated advice.

### Reference Pod Architectures

**LeadResearch Pod** — Universal lead research for any vertical:
- Agents: ICP & Source Strategist, Company Finder, Decision-Maker Hunter, Email Validator & Finder, Fresh Signal Analyzer, Scorer & Outreach Writer, Compiler & Learner
- Dynamic source selection per vertical (e.g., AEC → ArchDaily, Construction Dive, Google Maps; SaaS → Crunchbase, Product Hunt, G2; agencies → Clutch.co, agency directories)
- Strictly fresh buying signals only (last 7–60 days max)
- Output: outreach-ready CSV with validated emails, lead scores, and personalized first-line ideas

**CreativeForge Pod** — Full autonomous creative department replacing $3k–$13k/month human teams:
- Agents: Creative PM, Strategic Creative Partner, Brand Guardian, Specialist Designers (Ad & Social, UI/UX & Landing Pages, Presentations & Sales Decks, Email & Newsletter, Illustration, Web/Webflow), Motion + Video Agent, Reviewer & Iterater, Output & Export
- 70–80% of image generation routed to cheap models ($0.003–$0.025/image); premium models only for final high-stakes outputs
- Delivers: editable SVGs, Figma JSON, PNGs at all sizes, PDFs, Webflow-ready code, Google Slides, MP4s
- 4–12 variations per brief with automatic A/B test variants

---

## 4. Pod Creation Process & Volume Control

> **INTERNAL ONLY — clients never see this process.**

The Pod Factory Director owns creation with the AI CEO setting guardrails.

**Volume limits:**
- Maximum 3 new pod variants per month (first 6 months), then max 5/month after 200+ customers
- Small-batch MVP rule is hardcoded: never launch anything bigger than a tested mini-pod

**7-Day MVP Sprint (mandatory for every new pod):**
1. Day 1–2: Build mini-version (3–5 agents)
2. Day 3–4: Internal testing + QA layer (hallucination score must be <2%)
3. Day 5: Test on 5 simulated customers (metrics: setup time <8 min, task success >92%, user satisfaction threshold)
4. Day 6–7: Iterate based on metrics

Only launch if all metrics pass. CEO must approve before launch. Marketing publishes and Sales starts outreach only after approval.

**Decision to build a new pod comes from real data:**
- Customer Success Director reports most-requested features
- Marketing Director shows search volume / competitor gaps
- Sales Director shows which requests are closing deals
- CEO approves only if projected LTV > 6x development cost

---

## 5. The Company Knowledge Center (The 10-Year Moat)

This is the single most important feature and the primary defensibility. It is also the #1 retention mechanism — once a client has 6–12 months of data in our system, switching to any competitor feels like starting from zero.

### How It Works for Clients

- One central, encrypted knowledge base per client.
- In the customer dashboard there is a dedicated **Knowledge Center tab**.
- Client drag-and-drops files anytime: business strategy docs, ICP profiles, sales scripts, product specs, competitive intel, past campaign data, pricing sheets, process docs, brand guidelines, etc.
- The system auto-chunks, encrypts client-side (Web Crypto API), and stores everything in a per-client isolated Supabase + pgvector database.
- Clients can also type quick notes or paste feedback anytime ("Our audience hates long emails", "Always use this exact CTA").

### How Pods Use It

- Every pod the client owns (old and new) automatically has full read/write access.
- Pods write every lesson, outcome, success rate, and learning back to the center → knowledge compounds forever.
- When a client adds a new module or pod, it starts with 100% of existing knowledge — zero re-onboarding. The new pod greets them: "I already know your business. Ready to go?"

### Team Intelligence Score

- Visible in dashboard — increases every month as pods learn more.
- Visual proof that clients are getting smarter value for the same (or slightly higher) price.
- The more pods the client uses, the smarter the entire "AI team" becomes.

**Permanent Rule (INTERNAL — enforced by AI CEO & Pod Factory Director):**  
Every pod must write every lesson and outcome back to the shared Company Knowledge Center. Never let knowledge stay siloed.

---

## 6. Privacy & Security (Non-Negotiable – Zero Tolerance)

> **INTERNAL ENGINEERING STANDARD.** These are our technical commitments enforced in code. Clients see a brief reassurance in the Knowledge Center tab and a dedicated Trust & Security page — never as the lead message (see Section 2: Brand Voice).

### Data Encryption & Isolation

- **Client-side encryption** (Web Crypto API) before any upload. The encryption key is generated in the browser and **never sent to AIpods** — we literally cannot decrypt client data even if we wanted to.
- Per-client isolated Supabase schemas + Row Level Security (RLS) + AES-256 encryption at rest + TLS 1.3 in transit.
- AIpods company (founder or autonomous agents) has **zero access** to raw client data.
- Pod actions are strictly **tool-whitelisted** — only defined safe tools, no arbitrary code execution.

### Zero Cross-Client Contamination

- No pod ever sees another client's raw data.
- Only **fully anonymized, aggregated patterns** are ever shared globally via a separate, isolated **Global Pattern Store** (different database, different encryption from client Knowledge Centers).
- Example of an anonymized pattern: "DTC brands $2M–$20M ARR: free-shipping hooks convert 2.8x better."
- QA & Reviewer Layer has a permanent hardcoded check: if any output contains a reference to another client (name, domain, campaign), block it and escalate.

### Client Controls

- Client has a dashboard toggle: **"Allow anonymized pattern learning"** (can turn off anytime with zero loss of functionality).
- Full immutable audit trail of every knowledge access (exportable anytime).
- One-click GDPR/CCPA data deletion.

### Platform Security

- WAF (Web Application Firewall) via Vercel.
- Automatic prompt injection detection (QA layer + Anthropic's built-in guardrails + custom reflection loop). Any malicious input is rejected before it reaches the pod.
- Daily automated penetration testing (Pod Factory Director runs open-source scanner nightly and patches anything).
- Internal admin dashboard has hardware key / passkey login only.
- Quarterly Transparency Reports auto-generated by the autonomous team.

These guarantees are stronger than what frontier labs offer. They live on the Trust & Security page and in our engineering standards — not in headlines or hero sections.

---

## 7. Ethics & Guardrails

The QA & Reviewer Layer has a permanent Ethical Guardrail Module (hardcoded, non-negotiable):

- Always tell the truth based on verifiable data.
- Never hallucinate or make up facts.
- Never give regulated advice (legal, medical, financial, tax).
- Respect client instructions exactly.
- Maximize client value and business results while staying 100% honest.
- Flag any potential harm immediately and pause.
- Strict business-only focus — no personal coaching, education, or regulated advice pods.

---

## 8. Business Model & Pricing

**Subscription-only** with AI Task Units (1 unit ≈ value of 1 skilled human hour, delivered in minutes).

### Client-Facing Pricing

| Tier       | Monthly Price | Task Units | Rollover | Bonus on Upgrade |
|------------|---------------|------------|----------|------------------|
| Starter    | $69           | 180        | 30%      | +25% first month |
| Growth     | $199          | 650        | 30%      | +25% first month |
| Scale      | $499          | 2,200      | 30%      | +25% first month |
| Enterprise | $1,499+       | 8,000+     | Custom   | Custom           |

- Annual billing = 20% discount
- Overage: $0.99 per extra unit

### Internal Targets (INTERNAL ONLY)

| Tier       | Target Margin |
|------------|---------------|
| Starter    | 85%           |
| Growth     | 86%           |
| Scale      | 83%           |
| Enterprise | 80–84%        |

- Goal: 82–87% blended gross margin across the portfolio
- Churn target: <8% monthly in year 1 (drops to 3–4% by year 2)

### Protective & Addictive Mechanics

- **Soft daily cap:** 80 units/day per pod (transparent, prevents runaway costs — shown clearly so no surprises)
- **Complex task multiplier:** Full brand strategy brief = 4–6 units, full website build = 8–15 units — customer sees exact cost before running
- **Auto-notify at 85% usage** + one-click upgrade prompt
- **Overage auto-upgrade prompt:** "You're crushing it! Upgrade to Growth for 5x more tasks at better rate?"
- **Monthly Growth Report** (auto-generated inside dashboard): Shows exact ROI + proactive upgrade suggestion. Example: "You used 420/650 units and generated $47k pipeline. Adding the Social Ads module would unlock ~380 extra units of value next month for only $49 more."

### Module Add-Ons (90%+ margin)

- Motion/Video Pack: +$99/mo
- White-Label Export: +$79/mo
- Vertical Template Pack (e-com, SaaS, DTC): +$49/mo
- Individual modules: $29–$79 each, stack perfectly

---

## 9. Free Plan & Conversion Funnel

**Free Plan ($0 forever):**
- 1 Mini Pod (3 agents only)
- 40 AI Task Units per month
- Basic memory (last 30 days only)
- Watermarked outputs + "Upgrade for full power" banners
- No custom modules, no rollover

**Economics:**
- COGS per free user: ~$25/month
- Expected conversion to paid: 78–85% within 14–21 days (industry benchmark for this value clarity in 2026)
- Auto-pause inactive free accounts after 30 days of zero usage
- Automatic "Free → Paid" nurture sequences run continuously (INTERNAL: owned by Marketing Director)

**Conversion path:**
1. Sign up (no credit card required)
2. Knowledge Center → upload 3–5 key docs
3. Activate first Mini Pod → immediate value
4. Pod + Growth Report surface upgrade opportunity naturally
5. One-click upgrade to Starter ($69)

---

## 10. COGS & Unit Economics

> **INTERNAL ONLY — never share cost structures or margin targets externally.**

### Cost Per AI Task Unit (March 2026, blended)

| Component | Cost per task |
|-----------|--------------|
| LLM orchestration (with 80%+ caching + cheap routing) | $0.058 |
| Tools (web search, email validation, light scraping) | $0.012 |
| Variable hosting/queue/DB (Supabase + Vercel serverless) | $0.003 |
| **Total COGS per standard task** | **$0.073** |

Low-complexity pod: $0.042 | High-complexity pod (creative/video): $0.14

**Average COGS per AI Task Unit across all pod types:** ~$0.62  
(Mix of lead-research at ~$0.07 and creative/ops pods at ~$0.68–$1.10)

### Sensitivity Analysis

| Scenario | Blended Gross Margin |
|----------|---------------------|
| Base case (optimized routing + caching) | 82–87% |
| LLM prices rise 30% | 76% (still healthy) |
| Average task cost hits $0.12 (very complex pods dominate) | 78% |
| 30% of customers are heavy users | 80% (overages save us) |
| Worst case (no caching, all mid-tier models) | 62% → immediately tighten routing |

Costs only decrease in 2026–2027 as models get cheaper and our routing gets smarter.

---

## 11. Autonomous Company Layer (The Machine That Builds & Runs AIpods)

> **STRICTLY INTERNAL ONLY. Clients must never know the company is operated by AI agents. Externally, clients interact with "the AIpods team." No marketing, copy, social post, or support message should ever reference the autonomous layer, the AI CEO, or the 7-agent structure.**

The entire business runs 24/7 with **exactly 7 agents**:

1. **AI CEO** — strategy, decisions, weekly reports to founder, allocates "budget" (API credits), routes work to Directors
2. **Pod Factory Director** — creates, tests, iterates all new pods (7-day MVP sprints), runs monthly Self-Improvement Sprints, runs nightly security scans
3. **Sales & Outreach Director** — email/LinkedIn/X campaigns, personalized outreach, demo coordination
4. **Marketing & Content Director** (website, SEO, content, social) — includes a **Web Ops Specialist sub-tool** that auto-publishes new pod landing pages, updates pricing tables, SEO meta tags, blog posts, and conversion copy; runs weekly SEO audits
5. **Finance & Ops Director** (Stripe, billing, metrics, invoicing, expense tracking, MRR dashboard)
6. **Customer Success Director** (onboarding, monthly Growth Reports, upgrade nudges, feedback collection)
7. **QA & Reviewer Layer** — mandatory on every output (hallucination detection, ethics, privacy, brand consistency)

Executors (web search, email sending, code generation, Stripe API calls) are lightweight tools inside the graph — not separate agents.

**Permanent Rules for AI CEO & Pod Factory Director** (must be hardcoded forever):
- **Rule 1:** Every pod writes every lesson/outcome to the shared Company Knowledge Center. Never let knowledge stay siloed.
- **Rule 2:** Never hard-code to one model. Always use the dynamic router. Never become dependent on any single provider.
- **Rule 3:** Every new module must be vertical- or outcome-specific. Generic agents forbidden.

---

## 12. Dynamic Model Router & Auto-Upgrade System

> **INTERNAL ONLY — model routing details are never exposed to clients.**

The entire company uses a **single intelligent router** that decides per-task which model to call. This is the March 2026 standard.

### Default Model Assignments

| Role | Default Model | Fallback (Cheap) |
|------|--------------|------------------|
| AI CEO | Claude Opus 4.6 ($5/$25) | Sonnet 4.6 |
| Pod Factory Director | Claude Sonnet 4.6 ($3/$15) | Grok 4.1 Fast ($0.20/$0.50) |
| Sales & Outreach Director | Grok 4 ($3/$15) or Sonnet | Grok 4.1 Fast |
| Marketing & Content Director | Claude Sonnet 4.6 | Gemini Flash ($0.30/$2.50) |
| Finance & Ops Director | Claude Haiku 4.5 or Grok Fast | Grok 4.1 Fast |
| Customer Success Director | Sonnet 4.6 | Haiku |
| QA & Reviewer Layer | Claude Sonnet 4.6 | — (always uses strong model) |

Average blended cost: ~$2–$4 per million tokens (70–80% routing to cheap/fast models + 85%+ prompt caching).

### Auto-Upgrade: Weekly "Model Scout" Routine

Every Sunday the Pod Factory Director runs a 5-minute routine:
1. Queries all providers' APIs (Anthropic, OpenAI, xAI, Google) for new models/releases
2. Runs a benchmark (10 test tasks the company already knows correct answers for)
3. If a new model is 10%+ better or 20%+ cheaper → auto-updates router config
4. Tests on a shadow run before going live
5. QA layer validates the upgrade
6. Logs the change in the Sunday CEO Report ("We upgraded CEO to Opus 4.7 — +14% strategy quality")

### Monthly Self-Improvement Sprints

The Pod Factory Director adds new tools, new pod templates, and better prompts based on real customer data. All upgrades are versioned and reversible. The founder can force a specific model anytime via the internal dashboard.

---

## 13. Founder's Role & Human Oversight Protocol

> **INTERNAL ONLY.**

The founder is the **Human Oversight Layer** — the "supervised autonomy" pattern proven in 2026.

### Weekly (10–20 minutes)
- Review the Sunday CEO Report + internal dashboard
- Approve: big spends (>$500), new pod launches, pricing changes, legal contracts
- Give high-level direction ("Focus on AEC vertical next quarter")

### Daily
- Almost nothing — unless the QA layer escalates (rare)
- Built-in "Human Veto" button on every big action in the internal dashboard

### Legal Reality
- No AI can be the legal CEO (Delaware law requires a human director)
- The AI CEO is the operational brain; the founder remains the legal CEO with final veto
- Founder signs tax filings and collects the profits

---

## 14. Dashboards (Astro 5 + Vercel)

Both dashboards run independently of Cursor after deployment. Changes are pushed via GitHub → Vercel auto-deploys in <60 seconds with zero downtime.

### Customer Dashboard

- **My Pods** — active pods, modules, one-click add/remove/upgrade
- **Knowledge Center** — drag-and-drop file upload, list current files with dates, "Re-index All" button, quick notes input
- **Usage & Billing** — real-time units consumed, rollover balance, upgrade prompts, Stripe billing
- **Growth Reports** — monthly ROI summary, proactive upgrade suggestions with projected value
- **Team Intelligence Score** — visual metric that increases every month as pods learn
- **Settings** — anonymized pattern learning toggle, data export, account management

### Internal Admin Dashboard (/internal — protected, hardware key / passkey login)

> **INTERNAL ONLY — this dashboard is never shown to or mentioned to clients.**

- **Real-time metrics:** MRR, active pods, churn rate, upgrade velocity, gross margin %
- **Escalation Queue:** Only items needing founder approval (new pod launch, >$500 spend, legal-risk flag, pricing change)
- **Sunday CEO Report:** Weekly summary with "Approve All" or "Modify X" buttons
- **Pod Factory Status:** Pods in sprint, current metrics, QA scores
- **Customer Health Map:** Who is upgrading, who might churn, at-risk accounts
- **Model Upgrade Log:** Which models were auto-switched, performance delta

---

## 15. Tech Stack (March 2026)

> **INTERNAL ONLY.**

- **Frontend/Dashboards:** Astro 5 + Vercel (marketing site + customer dashboard + internal admin dashboard)
- **Auth:** Clerk
- **Database:** Supabase (RLS + pgvector + storage + per-client encrypted schemas)
- **Agent Orchestration:** LangGraph + dynamic model router
- **Client-Side Encryption:** Web Crypto API (key never leaves browser)
- **Payments:** Stripe
- **Anonymized Pattern Store:** Separate isolated Supabase database (never co-located with client data)
- **Deployment:** Vercel (zero-downtime, edge caching, automatic preview deployments)

---

## 16. Long-Term Moat Strategy (10–15+ Years)

> **INTERNAL ONLY — competitive strategy is never shared externally.**

### The 7 Durable Moats

1. **Proprietary Company Knowledge Graph** — the real defensibility. Compounds forever. Once a client has 6–12 months of data, switching feels like starting from zero.
2. **Model-agnostic orchestration** — we dynamically route to whatever model wins (Grok 12, Claude 15, whatever comes in 2032). Clients never get locked into one provider's pricing or outages. Labs can't offer this because they want lock-in.
3. **Vertical outcome data from real clients** — anonymized patterns (e.g., "best ad hooks for DTC in 2027") that improve all pods. No single lab can replicate this.
4. **Autonomous self-improvement flywheel** — Pod Factory Director continuously creates, tests, and deploys new modules at startup speed. Labs move slowly because they serve millions.
5. **Enterprise-grade privacy & trust layer** — per-client encrypted isolation, full audit trails, zero human access. Stronger than frontier labs.
6. **Predictable pricing vs token roulette** — fixed monthly subscription with visible ROI. Direct LLM usage still feels unpredictable even in 2035.
7. **Future marketplace of customer-created modules** — by year 3–4, clients and agencies publish/sell specialized modules (we take 20%). Network effects make the library more valuable over time.

### Future Competitive Scenarios

- **2028: Claude launches "Claude Teams"** → We win because clients already have 18 months of their company's brain in AIpods. Starting over = massive switching cost.
- **2032: OpenAI offers full business OS** → We become the neutral "multi-model orchestration + memory" layer that sits on top (like Shopify on AWS). Many companies prefer independence.
- **Worst case (they copy everything):** We pivot to white-labeling our orchestration + Knowledge Center to the big labs themselves (high-margin licensing play).

**We are not competing with Claude or Grok. We are building the layer that makes them 10x more valuable for a specific business — and we own that layer.**

---

## 17. Non-Negotiable Rules Summary

Any new feature, pod, module, or change **must** pass all these rules:

1. **Privacy absolute + zero-leakage** — client-side encryption, key never leaves browser, we cannot read client data
2. **Zero cross-client contamination** — raw data never shared, only anonymized patterns via isolated Global Pattern Store
3. **Modular + addictive upgrades** — ROI visible, +25% bonus, Growth Reports, instant upgrade path
4. **10-year moat** — Knowledge Center + model-agnostic orchestration, always compounding
5. **Business-only focus** — no personal, no coaching, no education, no legal, no medical, no regulated advice
6. **Truth + QA Layer on every output** — never hallucinate, never make up facts, never give regulated advice
7. **Autonomous operation (INTERNAL)** — exactly 7 agents + Astro + Vercel, founder 10–20 min/week only. Never disclosed to clients.
8. **Brand voice** — all client-facing communication is positive, vibrant, results-focused. Lead with what clients achieve, never with fear or internal architecture.

---

## 18. Inspiration Sources

- **LatAm Scalers Managed Creative Teams model** — capacity-based pricing, strategic partnership positioning, compounding brand knowledge as a retention moat, dedicated team that gets better over time, modular creative capabilities
- **All conversations in this thread** — modularity, privacy, autonomy, addictive upgrades, 80%+ margins, AI Task Units, dynamic model routing, supervised autonomy pattern

---

**This document is the single source of truth.**  
Cursor, the autonomous agents, and all future code must read and obey it completely. Any contradiction must be resolved in favor of this document.

Last updated: March 2026 (full thread synthesis v3)
