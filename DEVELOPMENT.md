# Development

## Prerequisites

- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Cloudflare [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Setup

```bash
npm install
npm run dev        # starts API on :3757 and web on :5173
```

To start with a fresh database seeded with test data:

```bash
npm run dev:fresh
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start API + web |
| `npm run dev:fresh` | Start + seed test data |
| `npm run dev:e2e` | Start with mock API for Playwright tests |
| `npm run kill` | Kill ports 5173 and 3757 |
| `npm run db:rebuild` | Reseed via API |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:reset` | Wipe and recreate tables |

## Tests

```bash
npm test              # Vitest unit tests + coverage
npm run test:api      # pytest (Python API)
npm run test:all      # both
npm run test:e2e      # Playwright (use dev:e2e server, not dev)
npm run test:e2e:ui   # Playwright with UI runner
```

Coverage thresholds are 80% across all included source files. Reports go to `coverage/`. See `vite.config.ts` for include/exclude configuration.

## Architecture

- **Frontend** — `src/`, React + TypeScript + Vite
- **API** — `api/`, Python Cloudflare Worker using [Kinglet](https://github.com/mitchins/Kinglet)
- **Database** — Cloudflare D1 (SQLite), accessed via Kinglet ORM
- **Auth** — magic-link email → OTP → JWT. Dev shortcut: any email, code `000000`

See `api/README.md` for backend layout and `tests/e2e/README.md` for E2E details.
