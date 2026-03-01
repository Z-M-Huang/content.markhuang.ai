# markhuang.ai

markhuang.ai is Mark Huang's personal website. It covers his blog, projects, newsletter, and an AI chat widget (that's you). The site runs as two services behind Traefik on Docker Swarm, with content stored in a separate GitHub repository.

## Architecture

```
Browser
  │
  ├─ markhuang.ai/*          → Next.js frontend (SSR + ISR)
  └─ markhuang.ai/api/*      → Go backend API
                                   │
                                   ├─ PostgreSQL (external database)
                                   └─ GitHub raw API → content.markhuang.ai repo
```

**Frontend** — Next.js 16 (App Router) with TypeScript strict mode and Tailwind CSS v4. Server components by default. Blog listing revalidates every 60s, articles every 300s. bun is the package manager.

**Backend** — Go 1.26 with Chi v5 router and GORM for PostgreSQL. Interface-driven architecture with structured JSON logging via slog. Handles content delivery, AI chat, newsletter, view counts, and the admin portal. Config is environment-variable only with fail-closed defaults.

**Database** — PostgreSQL, external in all environments (no database container). Stores subscribers, newsletter records, view counts, IP bans, and admin sessions.

**Content** — Blog articles (MDX) and knowledge files (Markdown) live in a separate GitHub repo. The backend fetches via GitHub raw API with 30-minute in-memory cache and webhook-driven invalidation on push.

**Deployment** — Docker Swarm with Traefik for TLS and path-based routing. Multi-stage Docker builds produce small images running as non-root (UID 1001).

## AI Chat Widget

The chat widget streams responses from an LLM with a dynamic system prompt. The prompt is built from knowledge files (like this one) and blog article summaries, with a 32,000-token budget. If the budget is tight, blog summaries are trimmed first, then the oldest knowledge files are dropped.

## Pages

- **Home** — introduction and featured blog posts
- **Blog** — articles across categories: AI & LLMs, Software Engineering, Tutorials, Motorcycles
- **About** — background and experience
- **Projects** — open-source work and side projects
- **Newsletter** — email subscription with double opt-in

## Testing

- Frontend: vitest (95% line/function/statement, 90% branch coverage) + Playwright E2E (Chromium, Firefox, WebKit)
- Backend: Go tests with 100% coverage target on core packages (api, config, chat, viewcount)

## How It's Built

The entire site is built and maintained using two open-source projects that Mark created: **Golden CLAUDE.md** (constitutional AI governance) and **VCP** (three-layer security and quality enforcement). All code on this site was written and reviewed using both systems. See the dedicated knowledge files for details on each.
