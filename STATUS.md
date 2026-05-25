# Status

🟢 working · 🟡 partial · 🔵 not started · 🔴 blocked

## Core

- 🟢 React + TypeScript frontend (Vite)
- 🟢 Python Cloudflare Worker backend (Kinglet)
- 🟢 D1 database with ORM + migrations
- 🟢 Dev environment (`npm run dev` starts both servers)
- 🔵 Production deployment pipeline

## Auth

- 🟢 Magic-link email flow
- 🟢 OTP verification (dev bypass: `000000`)
- 🟢 JWT storage and refresh
- 🔵 Session persistence across tabs

## Teams & Members

- 🟢 Create / join team (invite code)
- 🟢 Team switcher, dashboard
- 🟢 Add / remove members
- 🟢 Away toggle
- 🔵 Leave team, edit team details (API done, no UI)

## Rotation

- 🟢 Points-based next-picker calculation
- 🟢 Skip away members
- 🟢 Fair rotation verified (8 weeks = 2 turns each for 4 members)
- 🔵 New members start at team average

## Voting

- 🟢 Start period, propose venues, advance to vote, complete
- 🟢 Cast / change votes
- 🟢 Voting screen UI
- 🔵 Real-time vote counts, deadline countdown

## History & Profile

- 🟢 Weekly summary screen (UI)
- 🟢 Profile screen with stats (points, wins, venues proposed)
- 🔵 History screen wired to real API
- 🔵 Leaderboard wiring

## Gamification

- 🔵 Achievement system (backend scaffolded, no UI)
- 🔵 Post-lunch ratings

## Testing

- 🟢 API unit tests — 42 passing
- 🟢 Frontend unit tests — 38+ passing
- 🟢 Playwright E2E — 15 critical-path tests, ~30s, 100% stable
