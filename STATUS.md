# LunchSaga Development Status

## Core Infrastructure
- 🟢 Project scaffolding (Vite + React + TypeScript)
- 🟢 Tailwind CSS + shadcn/ui components
- 🟢 API client service with JWT auth
- 🟢 Backend on Cloudflare Workers (Kinglet framework)
- 🟢 D1 database with ORM models
- 🟢 Dev environment (npm run dev starts both servers)
- 🔵 Production deployment pipeline

## Authentication
- 🟢 Magic link email flow (API)
- 🟢 OTP verification with dev bypass (000000)
- 🟢 JWT token storage and refresh
- 🟢 Login screen UI
- 🔵 Session persistence across tabs
- 🔵 Logout functionality (UI wired up)

## Team Management
- 🟢 Create team (name, emoji, color)
- 🟢 Join team via invite code
- 🟢 List user's teams
- 🟢 Team selection screen
- 🟢 Team switcher component
- 🟢 Team dashboard screen
- 🔵 Leave team (API exists, needs UI)
- 🔵 Regenerate invite code (API exists, needs UI)
- 🔵 Edit team details (API exists, needs UI)

## Member Management
- 🟢 Add member by email (auto-creates user)
- 🟢 Remove member from team
- 🟢 List team members
- 🟢 Mark member as away/active
- 🔵 Edit member display name
- 🔵 Member cards with stats expansion

## Rotation System
- 🟢 Points-based next organizer calculation
- 🟢 "Up Next" indicator display
- 🟢 Points increment after completing period
- 🟢 Skip away members in rotation
- 🟢 Fair rotation (verified: 8 weeks = 2 turns each for 4 members)
- 🔵 New members start with team average points

## Voting Flow
- 🟢 Start new lunch period
- 🟢 Propose venue options
- 🟢 Advance to voting phase
- 🟢 Cast/change votes
- 🟢 Complete period and determine winner
- 🟢 Voting screen UI
- 🟢 Period history API
- 🔵 Real-time vote count display
- 🔵 Voting deadline countdown

## History & Stats
- 🟢 Weekly summary screen (UI)
- 🟢 Period history API endpoint
- 🔵 Wire history screen to real API
- 🔵 Member win count display
- 🔵 Venue history with ratings

## Profile & Settings
- 🟢 Profile screen with edit mode
- 🟢 "My Profile" navigation from header icon
- 🟢 Member stats display (points, wins, venues proposed)
- 🟡 Settings screen (UI exists, partial wiring)
    Needs: Holiday mode toggle, team settings
- 🔵 Update user profile (name, avatar via API)
- 🔵 Leaderboard screen wiring

## Gamification
- 🔵 Achievement system (backend)
- 🔵 Achievement badges display
- 🔵 Reputation score from feedback
- 🔵 Post-lunch ratings ("Great pick!")
- 🔵 Achievement titles in member cards

## Testing
- 🟢 API unit tests
    42 tests passing
- 🟢 Frontend unit tests
    4 test files, 38+ tests passing
- 🟢 E2E browser tests (Playwright)
    15 critical path tests optimized
    - Smoke tests: App boot, login flow, routing (6 tests)
    - CUJ: Voting flow (2 tests)
    - CUJ: Admin/settings (1 test)
    - UI Rendering: Page content (3 tests)
    - Accessibility: axe-core + ARIA (6 tests)
    - Execution time: ~30 seconds
    - Pass rate: 100% stable

## Polish & UX
- 🔵 Loading states for all async operations
- 🔵 Error handling with user-friendly messages
- 🔵 Toast notifications consistency
- 🔵 Mobile responsive refinements
- 🔵 Keyboard navigation
- 🔵 Accessibility audit fixes

---

## Future Features (Ideation)

### 🏠 Office/Home Lunch Mode
- 🔵 "In-house" period type (no external venue)
    Theme/cuisine voting instead of venue selection
    E.g., "Taco Tuesday", "Asian Fusion", "Comfort Food"
- 🔵 Location toggle per team
    Office address or "Remote/Home"
    Affects whether venue or theme is voted on
- 🔵 Recipe/menu suggestions (optional)
    Members can propose dishes that fit the theme

### 📅 Ad-hoc Scheduling
- 🔵 Remove weekly cadence assumption
    Periods triggered manually, not on schedule
    "Start a lunch" button instead of automatic rotation
- 🔵 Flexible deadline setting
    Organizer sets voting window (hours/days)
    Quick polls for same-day decisions
- 🔵 Optional recurring schedule
    Teams can opt-in to weekly/biweekly reminders
    Or stay fully ad-hoc

### 🥘 Potluck Mode
- 🔵 RSVP-style attendance tracking
    "I'm coming" / "Can't make it" / "Maybe"
    Headcount for planning
- 🔵 Dish signup (optional visibility)
    Members claim what they'll bring
    Categories: Main, Side, Dessert, Drinks
    Option to hide dishes for surprise element
- 🔵 Dietary info display
    Show member dietary restrictions
    Help avoid conflicts with dish assignments
- 🔵 Simplified flow
    No venue voting, just coordination
    Organizer sets date/time/location

### Architecture Notes
- Period model needs `type` field: "venue" | "theme" | "potluck"
- New `PotluckRSVP` and `DishSignup` models for potluck
- Theme voting reuses VenueOption with different semantics
- Ad-hoc: Remove `voting_deadline` requirement, make optional

---

## Legend
- 🟢 Complete and working
- 🟡 In progress
- 🔵 TODO (planned)
- 🔴 Blocked
- 🟧 Blocked in progress
