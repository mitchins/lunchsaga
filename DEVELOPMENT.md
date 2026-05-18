# Development Guide

## Prerequisites

- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Getting Started

```bash
npm install
npm run dev          # starts API (port 3757) + web (port 5173) together
```

To also seed fresh test data on startup:

```bash
npm run dev:fresh
```

## Common Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start API + web dev servers |
| `npm run dev:fresh` | Start + seed test data |
| `npm run kill` | Kill ports 5173 and 3757 |
| `npm run db:rebuild` | Reseed test data via API |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:reset` | Reset database |

## Testing

```bash
npm test               # unit tests (Vitest) with coverage
npm run test:api       # Python API tests (pytest)
npm run test:all       # both
npm run test:e2e       # Playwright E2E tests (needs running dev server)
npm run test:e2e:ui    # Playwright with UI
```

E2E tests use a mock API — run `npm run dev:e2e` instead of `npm run dev` when running Playwright tests locally.

Unit test coverage thresholds (lines/functions/branches/statements): **80%**, applied only to files that have tests. Coverage reports land in `coverage/`.

## Architecture

- **Frontend**: React + TypeScript + Vite, served from `src/`
- **API**: Python Cloudflare Worker using [Kinglet](https://github.com/mitchins/Kinglet), served from `api/`
- **Database**: Cloudflare D1 (SQLite) via Kinglet ORM
- **Auth**: Magic-link email → OTP → JWT. Dev bypass: any email, code `000000`

See `api/README.md` for backend structure and `tests/e2e/README.md` for E2E test details.
