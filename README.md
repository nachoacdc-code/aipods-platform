# AIpods Platform

B2B SaaS platform delivering fully autonomous AI agent teams ("pods") that function as complete, self-running departments for companies.

See `AIPODS_PLATFORM_REFERENCE.md` for the full product reference.

## Tech Stack

- **Frontend**: Astro 5 + React + Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (SSR)
- **Auth**: Clerk (deferred for MVP — simple password auth)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Agent Orchestration**: LangGraph + dynamic model router
- **Encryption**: Web Crypto API (client-side)

## Commands

| Command         | Action                                 |
|:----------------|:---------------------------------------|
| `npm install`   | Install dependencies                   |
| `npm run dev`   | Start dev server at `localhost:4321`   |
| `npm run build` | Build for production                   |
| `npm run check` | Run Astro type checker                 |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. See the example file for all required variables.
