# LunchSaga Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2025-11-20  
**Document Owner:** Product Owner  
**Status:** Approved for MVP Development

---

## 1. Executive Summary

LunchSaga is a zero-friction team ritual webapp that automates weekly lunch rotation management for small teams (3-15 members). It eliminates the administrative overhead of tracking turns, coordinating venue selection, and maintaining fairness through an automated points-based rotation system with democratic voting.

**Core Value Proposition:** Replace broken spreadsheets and Slack threads with a dedicated, delightful micro-ritual platform that ensures fairness, encourages participation, and celebrates great picks.

**Target Market:** Small to medium workplace teams (startups, agencies, corporate squads) who share regular team lunches or similar recurring group activities.

**Success Metrics:**
- Teams complete 4+ consecutive weekly rotations without abandonment (measured after 30 days)
- Average member participation rate >80% in voting (baseline: 0%, measured weekly)
- Weekly active teams grow 15% month-over-month (measured at end of each month)
- Average team size: 5-10 members (measured continuously, reported monthly)
- Multi-team adoption: 40% of users belong to 2+ teams (measured after 60 days)

**Key Differentiators:**
- **Zero setup friction:** Magic-link auth eliminates password barriers
- **Multi-team native:** Users participate in unlimited teams (work squad, coffee club, project team)
- **Automatic fairness:** Points-based rotation ensures equitable distribution with zero manual tracking
- **Ritual-focused UX:** Weekly rhythm with "Up Next" clarity makes participation effortless

---

## 2. MVP Feature List

### MUST HAVE (MVP Blockers)

**Authentication & Identity**
- Magic-link email authentication with OTP fallback (passwordless)
  - Users receive both a clickable magic link AND a 6-digit code in the same email
  - Either method completes authentication
- Persistent session management
- Multi-device support

**Team Management**
- Create team with name, emoji, and color
- Generate shareable invite code (6-character alphanumeric)
- Join team via invite code
- Team switcher for multi-team users
- View team member roster

**Member Management**
- Add member to team (name only, no email required)
- Remove member from team
- Mark member as away/on holiday (skips rotation)
- Display member status (active, away)

**Rotation Logic**
- Points-based automatic rotation (lowest points = next picker)
- Fair distribution across all active members
- Automatic point increment after organizing turn
- New members start with average team points
- Visual "Up Next" indicator
- Manual override ("Force-start week" button)

**Venue Voting**
- Organizer proposes venue for upcoming week
- Team members cast votes
- One vote per member
- Real-time vote count display
- Automatic winner determination
- Voting period closure

**Status & Context**
- Persistent status bar showing current week, next picker, active team
- Current week number display
- Team name and member count always visible

**Data Persistence**
- All team, member, rotation, and voting data persists across sessions
- State recovery after browser closure

### SHOULD HAVE (High Value, Post-Launch Week 1-2)

**Enhanced Voting**
- Post-lunch feedback ("Great pick!" ★ or "Pass")
- Venue quality ratings (5-star scale)
- Organizer reputation score based on feedback

**Achievements & Gamification**
- Achievement titles for top organizers ("🏆 Legendary Curator", "⭐ Master Chef")
- Leaderboard showing reputation scores
- Win count tracking
- Seasonal stat resets

**Team Features**
- Team-wide holiday mode (pause rotation during breaks)
- Expandable member cards showing detailed stats
- Member edit capabilities (rename)
- Team owner designation

**History & Analytics**
- View past weeks and picks
- Historical voting results
- Member rotation history

### WON'T HAVE (Explicitly Out of Scope for MVP)

**Integrations**
- Slack/Teams bot notifications
- Calendar integrations
- Email notifications beyond magic link

**Advanced Features**
- AI-powered venue suggestions
- Location-based venue recommendations
- Photo uploads for venues
- Comments or chat features
- Mobile native apps
- Multiple venue types (lunch vs coffee vs other)
- Budget tracking or expense splitting
- Restaurant menus or dietary preference matching
- Social sharing to external platforms

**Admin Tooling**
- Team analytics dashboard beyond basic leaderboard
- Member activity tracking/monitoring
- Bulk import of members
- Team templates or presets

---

## 3. User Roles

### Member (Default Role)

**Permissions:**
- View team roster and member details
- Vote on venue proposals
- See rotation schedule and point totals
- View leaderboards and achievements
- Mark self as away/on holiday
- Join additional teams via invite code
- Leave team

**Restrictions:**
- Cannot add/remove other members
- Cannot delete team
- Cannot modify team settings (name, emoji, color)
- Cannot force-start new week (admin only)

### Admin (Team Creator + Designated Admins)

**Permissions:**
- All Member permissions, plus:
- Add new members to team
- Remove members from team
- Edit team settings (name, emoji, color)
- Mark any member as away/on holiday
- Force-start new rotation week
- Enable/disable team holiday mode
- Regenerate invite code
- Designate additional admins
- Delete team

**Auto-assignment:**
- User who creates a team automatically becomes admin
- Admins can promote other members to admin

**Restrictions:**
- Cannot remove themselves as last admin (must designate successor)
- Cannot delete team with active members without confirmation

---

## 4. User Stories with Acceptance Criteria

### Epic 1: Authentication & Onboarding

#### US-101: Magic Link Authentication with OTP Fallback
**As a** first-time user  
**I want to** log in using only my email address with either a magic link or code  
**So that** I can access the app without creating a password

**Acceptance Criteria:**
- **GIVEN** I am not logged in
- **WHEN** I enter my email address and click "Send Magic Link"
- **THEN** I receive an email within 30 seconds
- **AND** the email contains a clickable magic login link
- **AND** the email contains a 6-digit one-time code for manual entry
- **AND** clicking the magic link logs me in directly and redirects to team selection
- **AND** OR I can enter the 6-digit code on the verification screen to log in
- **AND** upon successful authentication (either method), my session persists for 30 days or until I log out
- **AND** both the magic link and code expire after 10 minutes

#### US-102: Return User Session
**As a** returning user  
**I want to** remain logged in across browser sessions  
**So that** I don't have to re-authenticate every time I visit

**Acceptance Criteria:**
- **GIVEN** I previously logged in successfully
- **WHEN** I return to the app within 30 days
- **THEN** I am automatically logged in
- **AND** I see my last-viewed team or team selection screen
- **AND** my authentication token is securely stored (httpOnly cookie)

### Epic 2: Team Management

#### US-201: Create Team
**As an** authenticated user  
**I want to** create a new team with a name, emoji, and color  
**So that** I can start organizing lunch rotations with my colleagues

**Acceptance Criteria:**
- **GIVEN** I am logged in and on the team selection screen
- **WHEN** I click "Create Team"
- **THEN** I see a dialog with fields for team name (required, 3-50 characters), emoji picker, and color picker
- **AND** I can preview how my team will appear
- **AND** upon submission, a unique 6-character invite code is generated
- **AND** I am designated as team admin
- **AND** I am redirected to the new team's roster view

#### US-202: Join Team
**As an** authenticated user  
**I want to** join an existing team using an invite code  
**So that** I can participate in that team's lunch rotation

**Acceptance Criteria:**
- **GIVEN** I am logged in and have a valid invite code
- **WHEN** I click "Join Team" and enter the 6-character code
- **THEN** the system validates the code
- **AND** if valid, I am added to that team as a member
- **AND** I see a success message with the team name
- **AND** I am redirected to that team's roster view
- **AND** if invalid, I see an error message "Invalid invite code. Please check and try again."

#### US-203: Switch Between Teams
**As a** user belonging to multiple teams  
**I want to** easily switch between my teams  
**So that** I can manage participation in different groups

**Acceptance Criteria:**
- **GIVEN** I belong to 2 or more teams
- **WHEN** I am viewing any team
- **THEN** I see a team switcher (sidebar or dropdown)
- **AND** it displays all my teams with emoji, color, and name
- **AND** the current team is visually highlighted
- **AND** clicking a different team instantly switches context
- **AND** all data (roster, votes, history) updates to the selected team

#### US-204: Share Invite Code
**As a** team admin  
**I want to** copy my team's invite code  
**So that** I can share it with new members via Slack, email, or message

**Acceptance Criteria:**
- **GIVEN** I am a team admin viewing my team
- **WHEN** I click the "Invite" button
- **THEN** I see the 6-character invite code
- **AND** a "Copy to Clipboard" button is available
- **AND** clicking it copies the code
- **AND** I see a confirmation toast "Invite code copied!"

### Epic 3: Member Management

#### US-301: Add Team Member
**As a** team admin  
**I want to** add a new member by name  
**So that** they are included in the rotation schedule

**Acceptance Criteria:**
- **GIVEN** I am a team admin
- **WHEN** I click "Add Member" and enter a name (2-50 characters)
- **THEN** a new member is created with default avatar (initials)
- **AND** their starting points equal the average of existing members (or 0 for first member)
- **AND** they appear in the roster immediately
- **AND** they are eligible for next rotation assignment

#### US-302: Remove Team Member
**As a** team admin  
**I want to** remove a member from the team  
**So that** they no longer participate in rotations

**Acceptance Criteria:**
- **GIVEN** I am a team admin
- **WHEN** I click remove on a member card
- **THEN** I see a confirmation dialog "Remove [Name] from team?"
- **AND** upon confirmation, the member is deleted
- **AND** if they were "Up Next", the next lowest-points member becomes the new "Up Next"
- **AND** their historical data remains in past weeks

#### US-303: Mark Member Away
**As a** team admin or member (for self)  
**I want to** mark a member as away/on holiday  
**So that** they are temporarily skipped in rotation without being removed

**Acceptance Criteria:**
- **GIVEN** I have permission to edit a member's status
- **WHEN** I toggle the "Away" switch on their member card
- **THEN** their status changes to "Away"
- **AND** they are visually indicated with muted styling
- **AND** they are excluded from "Up Next" calculation
- **AND** their points do not increase while away
- **AND** when toggled back to active, they rejoin rotation immediately

### Epic 4: Rotation & Scheduling

#### US-401: View Next Picker
**As a** team member  
**I want to** see who is assigned to organize the next lunch  
**So that** I know who is responsible this week

**Acceptance Criteria:**
- **GIVEN** I am viewing my team roster
- **WHEN** the page loads
- **THEN** the member with the lowest points is designated "Up Next"
- **AND** they have a prominent badge with accent color and pulse animation
- **AND** the status bar shows "Up Next: [Name]"
- **AND** if multiple members are tied for lowest points, alphabetical order breaks the tie

#### US-402: Automatic Points Increment
**As a** team member  
**I want** points to automatically increase after I organize a week  
**So that** rotation remains fair without manual tracking

**Acceptance Criteria:**
- **GIVEN** I am the current week's organizer
- **WHEN** the week completes (voting closes or admin force-starts next week)
- **THEN** my points increase by 1
- **AND** the next "Up Next" is recalculated
- **AND** I am no longer eligible until others catch up in points

#### US-403: Fair Distribution for New Members
**As a** team admin adding a new member  
**I want** them to start with average team points  
**So that** they don't immediately get assigned multiple turns

**Acceptance Criteria:**
- **GIVEN** I add a new member to a team with existing members
- **WHEN** the member is created
- **THEN** their points = average of all current members' points (rounded)
- **AND** they are included in the next rotation calculation
- **AND** for the first member in a new team, points = 0

#### US-404: Force-Start New Week
**As a** team admin  
**I want to** manually advance to the next week  
**So that** I can override stuck states or skip ahead

**Acceptance Criteria:**
- **GIVEN** I am a team admin
- **WHEN** I click "Force-Start Week"
- **THEN** I see a confirmation dialog
- **AND** upon confirmation, current organizer's points increase by 1
- **AND** any active voting closes immediately
- **AND** new "Up Next" is calculated
- **AND** week number increments by 1

### Epic 5: Venue Voting

#### US-501: Propose Venue
**As the** current organizer  
**I want to** suggest a venue for this week's lunch  
**So that** my team can vote on it

**Acceptance Criteria:**
- **GIVEN** I am designated "Up Next"
- **WHEN** I click "Propose Venue"
- **THEN** I see a dialog to enter venue name (required, 3-100 characters)
- **AND** optional fields for description, address
- **AND** upon submission, the venue appears in the voting section
- **AND** voting opens immediately for all team members

#### US-502: Cast Vote
**As a** team member  
**I want to** vote for my preferred venue option  
**So that** our lunch location is democratically chosen

**Acceptance Criteria:**
- **GIVEN** there is an active voting period with venue proposals
- **WHEN** I view the voting section
- **THEN** I see all proposed venues
- **AND** I can select one option
- **AND** my vote is recorded immediately
- **AND** I see real-time vote counts update
- **AND** I cannot vote again (vote button disabled)
- **AND** I can change my vote before voting closes

#### US-503: Automatic Winner Determination
**As a** team member  
**I want** the venue with most votes to be automatically selected  
**So that** we know where to go without manual tally

**Acceptance Criteria:**
- **GIVEN** voting period has closed
- **WHEN** all votes are tallied
- **THEN** the venue with highest vote count is marked as winner
- **AND** it is visually highlighted (winner badge, different styling)
- **AND** in case of tie, first-submitted venue wins
- **AND** the result is visible to all team members

### Epic 6: Status & Context

#### US-601: Persistent Status Bar
**As a** team member  
**I want to** always see the current week, next picker, and team name  
**So that** I have context regardless of which section I'm viewing

**Acceptance Criteria:**
- **GIVEN** I am viewing any section of a team (roster, voting, history)
- **WHEN** the page renders
- **THEN** I see a status bar (top or bottom)
- **AND** it displays: current week number, "Up Next: [Name]", team name, team emoji
- **AND** it remains visible when scrolling
- **AND** it updates in real-time when data changes

---

## 5. Non-Functional Requirements

### Performance
- **Page Load Time:** Initial page load <2 seconds on 3G connection (3G defined as ~400 Kbps, 400ms RTT; measured via Chrome DevTools throttling, WebPageTest.org)
- **Time to Interactive:** <3 seconds (measured via Lighthouse TTI metric)
- **API Response Time:** <200ms for read operations, <500ms for write operations (measured at p95; monitored via Cloudflare Analytics)
- **Real-time Updates:** Vote counts update within 1 second of casting (measured end-to-end from vote submission to UI update)
- **Concurrent Users:** Support 1000+ concurrent users without degradation (measured via load testing with k6 or Artillery)

### Security
- **Authentication:** Token-based auth with httpOnly cookies, 30-day expiration
- **Magic Link Codes:** 6-digit codes expire after 10 minutes
- **Invite Codes:** Cryptographically random 6-character alphanumeric, unique per team
- **Data Isolation:** Teams have complete data separation, no cross-team leakage
- **Input Validation:** All user inputs sanitized and validated server-side
- **HTTPS Only:** All traffic encrypted in transit (enforced by Cloudflare Pages)

### Usability
- **Mobile-First:** Fully responsive, optimized for mobile screens (375px+)
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Accessibility:** WCAG 2.1 AA compliance (color contrast 4.5:1+, keyboard navigation, screen reader support)
- **Progressive Enhancement:** Core functionality works without JavaScript (where possible)
- **Error Messages:** Clear, actionable error messages in plain language
- **Zero-State UX:** Helpful prompts when teams are empty or no data exists

### Reliability
- **Uptime:** 99.5% availability target
- **Data Durability:** No data loss in case of system failure (persistent storage)
- **Graceful Degradation:** Core voting/rotation functions remain available during partial outages
- **State Recovery:** Application recovers from page reload without losing in-progress actions

### Scalability
- **Team Size:** Support teams up to 50 members (optimal 3-15)
- **Teams per User:** Unlimited team memberships per user
- **Total Teams:** Support 10,000+ teams on platform
- **Storage:** Efficient data models, minimal overhead per team/member

### Browser Support
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 14+
- **No IE Support:** Internet Explorer explicitly not supported

### Deployment
- **Platform:** Cloudflare Pages (static hosting + serverless functions)
- **CDN:** Global edge distribution via Cloudflare
- **Build Time:** <2 minutes for full production build
- **Zero Downtime Deploys:** Atomic deployments with instant rollback capability

---

## 6. System Flows

### 6.1 Authentication Flow (Magic Link + OTP Fallback)

**Implementation Note:** LunchSaga uses magic-link authentication with an optional OTP fallback. Users receive both a clickable link AND a 6-digit code in the same email. Either method completes authentication.

```
[User visits app]
    ↓
[Check existing session]
    ↓
    ├─[Valid session]─→[Load team selection or last viewed team]
    └─[No session]─→[Show login screen]
                      ↓
                   [User enters email]
                      ↓
                   [System generates magic link token + 6-digit code]
                      ↓
                   [Email sent with BOTH link and code (10-min expiry)]
                      ↓
                      ├─[User clicks magic link in email]
                      │        ↓
                      │    [Validate token]
                      │        ↓
                      │    [Create session token]
                      │        ↓
                      │    [Set httpOnly cookie (30-day)]
                      │        ↓
                      │    [Redirect to team selection]
                      │
                      └─[User enters 6-digit code on verification screen]
                               ↓
                               ├─[Valid code]─→[Create session token]
                               │                    ↓
                               │                [Set httpOnly cookie (30-day)]
                               │                    ↓
                               │                [Redirect to team selection]
                               │
                               └─[Invalid code]─→[Show error: "Invalid code. Try again."]
                                                   ↓
                                                [Allow retry or resend]
```

**Edge Cases:**
- Email delivery failure: Show "Didn't receive code? Resend" after 60 seconds
- Code/link expiry: Prompt to request new authentication email
- Multiple login attempts: Rate limit to 5 attempts per email per hour
- Session expiry: Silent re-auth or redirect to login
- Magic link clicked on different device: Works seamlessly, creates session on that device

---

### 6.2 Team Creation & Join Flow

```
[User authenticated]
    ↓
[Team selection screen]
    ↓
    ├─[Click "Create Team"]
    │    ↓
    │ [Enter name, select emoji, select color]
    │    ↓
    │ [Submit]
    │    ↓
    │ [Generate unique 6-char invite code]
    │    ↓
    │ [Create team record]
    │    ↓
    │ [Assign user as admin]
    │    ↓
    │ [Redirect to team roster]
    │    ↓
    │ [Show invite code with copy button]
    │
    └─[Click "Join Team"]
         ↓
      [Enter 6-character invite code]
         ↓
      [Validate code]
         ↓
         ├─[Valid]─→[Add user to team as member]
         │              ↓
         │           [Redirect to team roster]
         │              ↓
         │           [Show success: "Joined [Team Name]!"]
         │
         └─[Invalid]─→[Show error: "Invalid invite code"]
                          ↓
                       [Allow retry]
```

**Edge Cases:**
- Duplicate team name: Allow (teams are identified by unique ID, not name)
- User already in team: Show "You're already a member of this team"
- Invite code collision: Regenerate if collision detected (extremely rare)
- Team at capacity: Not applicable (no hard limit in MVP)

---

### 6.3 Weekly Rotation Cycle

```
[Week begins]
    ↓
[Calculate next organizer]
    ↓
[Find all active members (not away)]
    ↓
[Get member with lowest points]
    ↓
    ├─[Single member]─→[Designate as "Up Next"]
    └─[Multiple tied]─→[Sort alphabetically, pick first]
                          ↓
                       [Designate as "Up Next"]
                          ↓
                       [Display in roster with badge]
                          ↓
                       [Show in status bar]
                          ↓
                       [Organizer proposes venue]
                          ↓
                       [Voting opens]
                          ↓
                       [Members cast votes]
                          ↓
                       [Voting period ends]
                          ↓
                          ├─[Admin force-starts]
                          └─[Automatic timer (future)]
                                ↓
                             [Close voting]
                                ↓
                             [Determine winner]
                                ↓
                             [Increment organizer's points by 1]
                                ↓
                             [Recalculate next "Up Next"]
                                ↓
                             [Increment week number]
                                ↓
                             [Record history entry]
                                ↓
                             [Week complete]
```

**Edge Cases:**
- All members away: Show "No active members. Enable members to continue rotation."
- Organizer removed mid-week: Auto-assign to next lowest-points member
- New member added mid-week: Eligible for next week, not current
- Points overflow: No limit (accumulates indefinitely)

---

### 6.4 Voting Flow

```
[Organizer designated "Up Next"]
    ↓
[Organizer clicks "Propose Venue"]
    ↓
[Enter venue details: name (required), description (optional), address (optional)]
    ↓
[Submit venue]
    ↓
[Venue appears in voting section]
    ↓
[All team members see venue card]
    ↓
[Member clicks "Vote" button]
    ↓
[Vote recorded for member + venue]
    ↓
[Vote count updates in real-time]
    ↓
[Vote button disabled for that member]
    ↓
[Member can change vote before close]
    ↓
[Voting closes (admin force-start or timer)]
    ↓
[Tally all votes]
    ↓
[Determine winner]
    ↓
    ├─[Clear winner]─→[Mark venue as winner]
    └─[Tie]─→[First-submitted venue wins]
                ↓
             [Display winner badge on venue card]
                ↓
             [Record in history]
```

**Edge Cases:**
- No votes cast: First venue or organizer's choice wins
- Organizer doesn't propose venue: Week can still be force-started (no venue recorded)
- Single venue option: Voting still occurs (democratic affirmation)
- Vote retraction: Allow before close, simply update count

---

## 7. Data Model

### 7.1 Entity Relationship Diagram (ERD)

```
User ─────< Membership >───── Team
  │                             │
  │                             └───< Week
  │                                   │
  │                                   ├───< Vote
  │                                   └─── VenueProposal
  │
  └─────< PickerHistory >─── Team
```

### 7.2 Entities & Relationships

#### **User**
Represents an authenticated person who can belong to multiple teams.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `email` (string, unique, required): Email address for magic link auth
- `created_at` (timestamp): Account creation date
- `last_login` (timestamp): Last authentication timestamp
- `session_token` (string, nullable): Current session token (hashed)
- `session_expires` (timestamp, nullable): Token expiration time

**Relationships:**
- One-to-Many → Membership (a user can belong to many teams)
- One-to-Many → PickerHistory (a user can be organizer for many weeks)

**Indexes:**
- `email` (unique)
- `session_token` (for fast session lookup)

---

#### **Team**
Represents a group that shares a rotation schedule.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `name` (string, required, 3-50 chars): Team display name
- `emoji` (string, required): Single emoji character
- `color` (string, required): Hex color code (e.g., "#FF5733")
- `invite_code` (string, unique, required, 6 chars): Alphanumeric join code
- `created_at` (timestamp): Team creation date
- `created_by` (UUID, FK → User): User who created the team
- `current_week` (integer, default: 1): Current rotation week number
- `is_holiday_mode` (boolean, default: false): Whether rotation is paused
- `holiday_mode_enabled_at` (timestamp, nullable): When holiday mode was activated

**Relationships:**
- Many-to-One → User (via `created_by`)
- One-to-Many → Membership (a team has many members)
- One-to-Many → Week (a team has many rotation weeks)
- One-to-Many → PickerHistory (a team has historical picks)

**Indexes:**
- `invite_code` (unique)
- `created_by` (for finding user's owned teams)

---

#### **Membership**
Junction table linking users to teams with role and status information.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `user_id` (UUID, FK → User, nullable): Reference to authenticated user (nullable for non-user members)
- `team_id` (UUID, FK → Team, required): Reference to team
- `name` (string, required, 2-50 chars): Display name within this team
- `role` (enum: 'member' | 'admin', default: 'member'): Permission level
- `points` (integer, default: 0): Accumulated rotation points
- `is_away` (boolean, default: false): Whether member is temporarily inactive
- `joined_at` (timestamp): When member joined team
- `avatar_url` (string, nullable): Profile image URL (future)

**Relationships:**
- Many-to-One → User (optional, for authenticated members)
- Many-to-One → Team
- One-to-Many → Vote (a member can cast many votes)

**Unique Constraints:**
- `(user_id, team_id)` where `user_id IS NOT NULL` (prevent duplicate membership for authenticated users)
  - **Implementation Note:** PostgreSQL supports partial unique indexes: `CREATE UNIQUE INDEX ON Membership (user_id, team_id) WHERE user_id IS NOT NULL;`
  - For databases without partial indexes (e.g., MySQL <8.0), use application-level validation or unique constraint on nullable column
- `(name, team_id)` (prevent duplicate names in same team)

**Indexes:**
- `(team_id, points)` (for fast "next picker" queries)
- `(team_id, is_away)` (for filtering active members)

**Business Rules:**
- New member's initial points = ROUND(AVG(existing members' points)) OR 0 if first member
- Cannot delete last admin (must designate successor first)

---

#### **Week**
Represents a rotation period within a team.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `team_id` (UUID, FK → Team, required): Reference to team
- `week_number` (integer, required): Sequential week counter (1, 2, 3...)
- `organizer_id` (UUID, FK → Membership, required): Who organized this week
- `started_at` (timestamp): Week start time
- `completed_at` (timestamp, nullable): Week end time (null if in progress)
- `winning_venue_id` (UUID, FK → VenueProposal, nullable): Selected venue
- `forced_start` (boolean, default: false): Whether admin manually started this week

**Relationships:**
- Many-to-One → Team
- Many-to-One → Membership (via `organizer_id`)
- One-to-Many → Vote (votes cast during this week)
- One-to-Many → VenueProposal (venues proposed for this week)

**Unique Constraints:**
- `(team_id, week_number)` (each team has unique sequential weeks)

**Indexes:**
- `(team_id, started_at)` (for historical queries)

---

#### **VenueProposal**
Represents a venue option proposed for a specific week.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `week_id` (UUID, FK → Week, required): Associated rotation week
- `proposed_by` (UUID, FK → Membership, required): Member who proposed it
- `name` (string, required, 3-100 chars): Venue name
- `description` (text, nullable): Optional details
- `address` (string, nullable): Optional location
- `proposed_at` (timestamp): Submission time
- `vote_count` (integer, default: 0): Cached vote total (for performance)

**Relationships:**
- Many-to-One → Week
- Many-to-One → Membership (via `proposed_by`)
- One-to-Many → Vote (votes for this venue)

**Indexes:**
- `(week_id, proposed_at)` (for tie-breaking by submission order)
- `week_id` (for fetching week's proposals)

---

#### **Vote**
Represents a member's vote for a venue in a specific week.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `membership_id` (UUID, FK → Membership, required): Who voted
- `venue_id` (UUID, FK → VenueProposal, required): What they voted for
- `week_id` (UUID, FK → Week, required): When they voted
- `voted_at` (timestamp): Vote cast time

**Relationships:**
- Many-to-One → Membership
- Many-to-One → VenueProposal
- Many-to-One → Week

**Unique Constraints:**
- `(membership_id, week_id)` (one vote per member per week)

**Indexes:**
- `(venue_id)` (for vote counting)
- `(week_id, membership_id)` (for checking if member voted)

**Business Rules:**
- Member can change vote by updating existing record (not creating new)
- Vote count on VenueProposal is incremented/decremented atomically

---

#### **PickerHistory**
Tracks all-time organizer assignments for leaderboard and reputation (post-MVP).

**Fields:**
- `id` (UUID, PK): Unique identifier
- `team_id` (UUID, FK → Team, required): Which team
- `membership_id` (UUID, FK → Membership, required): Who organized
- `week_id` (UUID, FK → Week, required): Which week
- `venue_id` (UUID, FK → VenueProposal, nullable): Winning venue (if any)
- `total_votes` (integer, default: 0): How many members voted
- `feedback_score` (float, nullable): Post-lunch rating (1-5 stars, future feature)
- `organized_at` (timestamp): Week completion date

**Relationships:**
- Many-to-One → Team
- Many-to-One → Membership
- Many-to-One → Week
- Many-to-One → VenueProposal (nullable)

**Indexes:**
- `(team_id, organized_at)` (for historical queries)
- `(membership_id, team_id)` (for member stats)

**Business Rules:**
- Created when week completes (voting closes)
- Used for calculating achievements and leaderboards
- `feedback_score` is average of post-lunch ratings (future feature)

---

### 7.3 Data Model Summary

**Total Entities:** 7 (User, Team, Membership, Week, VenueProposal, Vote, PickerHistory)

**Key Design Decisions:**
1. **Membership as Junction:** Allows users to have different names/roles per team
2. **Non-user Members:** `Membership.user_id` nullable to support adding members by name only
3. **Points in Membership:** Points are team-specific, not global
4. **Denormalized Vote Count:** `VenueProposal.vote_count` cached for performance
5. **Soft Deletes Not Used:** Hard deletes for simplicity; historical data preserved in PickerHistory
6. **No Email in Membership:** Members identified by name only within teams; email only on User for auth

---

## 8. Core Algorithms

### 8.1 Next Picker Selection

**Purpose:** Determine which member should organize the upcoming week based on fairness (lowest accumulated points).

**Algorithm:**
```
FUNCTION getNextPicker(team_id):
    // Fetch all active members (not marked as away)
    // Note: Only select needed fields for efficiency
    active_members = SELECT id, name, points, user_id
                     FROM Membership
                     WHERE team_id = team_id
                     AND is_away = false
                     ORDER BY points ASC, name ASC
    // Requires index: (team_id, is_away, points, name) for optimal performance
    
    // Handle edge cases
    IF active_members.length == 0:
        RETURN null // No one available
    
    // Find minimum points value
    min_points = active_members[0].points
    
    // Get all members tied for lowest points
    tied_members = FILTER active_members WHERE points == min_points
    
    // Tie-breaker: alphabetical by name
    IF tied_members.length > 1:
        tied_members = SORT tied_members BY name ASC
    
    RETURN tied_members[0]
END FUNCTION
```

**Inputs:**
- `team_id`: UUID of the team

**Outputs:**
- `Membership` object representing next organizer, or `null` if no active members

**Edge Cases:**
- All members away → Return null, display "No active members" message
- New team with no members → Return null
- All members have equal points → Alphabetical tie-breaker ensures deterministic result
- Member removed while designated "Up Next" → Recalculate immediately

**Performance:**
- Time Complexity: O(n log n) due to sorting (n = number of members)
- Optimization: Index on `(team_id, points, name)` for fast query
- Typical team size: 5-10 members, so performance is negligible

---

### 8.2 Holiday/Skip Logic

**Purpose:** Pause rotation during team breaks without losing state.

**Algorithm:**
```
FUNCTION enableHolidayMode(team_id):
    UPDATE Team
    SET is_holiday_mode = true,
        holiday_mode_enabled_at = NOW()
    WHERE id = team_id
    
    // No points accrue during holiday mode
    // "Up Next" still displays but no action required
END FUNCTION

FUNCTION disableHolidayMode(team_id):
    UPDATE Team
    SET is_holiday_mode = false,
        holiday_mode_enabled_at = null
    WHERE id = team_id
    
    // Rotation resumes with same "Up Next" member
    // No points were incremented during break
END FUNCTION

FUNCTION markMemberAway(membership_id):
    UPDATE Membership
    SET is_away = true
    WHERE id = membership_id
    
    // Recalculate next picker
    team_id = SELECT team_id FROM Membership WHERE id = membership_id
    new_next_picker = getNextPicker(team_id)
    
    // Update UI to reflect new "Up Next"
END FUNCTION
```

**Inputs:**
- `team_id`: UUID of team for holiday mode
- `membership_id`: UUID of member for away status

**Outputs:**
- Updated state in database
- Recalculated "Up Next" if necessary

**Edge Cases:**
- Holiday mode enabled mid-week → Current week continues, next week delayed
- All members marked away → `getNextPicker()` returns null, show warning
- Member marked away while "Up Next" → Next picker recalculated immediately
- Member returns from away → Immediately eligible if they have lowest points

**Business Rules:**
- Holiday mode pauses week progression but doesn't affect current week
- Members away status is independent of holiday mode
- Admins can toggle holiday mode; members can only toggle self

---

### 8.3 Leaderboard Scoring

**Purpose:** Rank members by venue quality and participation (post-MVP feature with feedback system).

**Algorithm (Post-MVP - with feedback):**
```
FUNCTION calculateMemberReputation(membership_id, team_id):
    // Get all historical picks by this member
    history = SELECT * FROM PickerHistory
              WHERE membership_id = membership_id
              AND team_id = team_id
    
    IF history.length == 0:
        RETURN 0 // No picks yet
    
    // Calculate average feedback score
    total_feedback = SUM(history.feedback_score WHERE feedback_score IS NOT NULL)
    feedback_count = COUNT(history WHERE feedback_score IS NOT NULL)
    
    IF feedback_count == 0:
        avg_feedback = 3.0 // Neutral baseline
    ELSE:
        avg_feedback = total_feedback / feedback_count
    
    // Calculate participation factor
    total_picks = history.length
    participation_bonus = MIN(total_picks * 0.1, 2.0) // Max +2 bonus
    
    // Final reputation score (out of 5)
    reputation = (avg_feedback + participation_bonus) / 1.4
    reputation = MIN(reputation, 5.0) // Cap at 5
    
    RETURN ROUND(reputation, 2)
END FUNCTION

FUNCTION getLeaderboard(team_id):
    members = SELECT * FROM Membership WHERE team_id = team_id
    
    leaderboard = []
    FOR EACH member IN members:
        reputation = calculateMemberReputation(member.id, team_id)
        pick_count = COUNT PickerHistory WHERE membership_id = member.id
        
        leaderboard.APPEND({
            member_id: member.id,
            name: member.name,
            reputation: reputation,
            total_picks: pick_count,
            current_points: member.points
        })
    
    // Sort by reputation desc, then by pick_count desc
    leaderboard = SORT leaderboard BY reputation DESC, total_picks DESC
    
    RETURN leaderboard
END FUNCTION
```

**MVP Version (without feedback):**
```
FUNCTION getLeaderboardMVP(team_id):
    members = SELECT * FROM Membership WHERE team_id = team_id
    
    leaderboard = []
    FOR EACH member IN members:
        pick_count = COUNT PickerHistory WHERE membership_id = member.id
        
        leaderboard.APPEND({
            member_id: member.id,
            name: member.name,
            total_picks: pick_count,
            current_points: member.points
        })
    
    // Sort by total picks desc
    leaderboard = SORT leaderboard BY total_picks DESC
    
    RETURN leaderboard
END FUNCTION
```

**Inputs:**
- `team_id`: UUID of team
- `membership_id`: UUID of member (for individual score)

**Outputs:**
- Reputation score (0-5 scale)
- Leaderboard array sorted by reputation/picks

**Achievement Assignment Logic (Post-MVP):**
```
FUNCTION assignAchievements(membership_id, team_id):
    reputation = calculateMemberReputation(membership_id, team_id)
    pick_count = COUNT PickerHistory WHERE membership_id = membership_id
    
    IF reputation >= 4.5 AND pick_count >= 5:
        RETURN "🏆 Legendary Curator"
    ELSE IF reputation >= 4.0 AND pick_count >= 3:
        RETURN "⭐ Master Chef"
    ELSE IF pick_count >= 10:
        RETURN "🎖️ Veteran Organizer"
    ELSE IF pick_count == 1:
        RETURN "🌟 First Timer"
    ELSE:
        RETURN null // No achievement yet
END FUNCTION
```

**Edge Cases:**
- New member → Reputation = 0, no achievement
- All picks unrated → Baseline score of 3.0 (neutral)
- Seasonal reset → Archive old PickerHistory, restart counts (post-MVP)

**Performance:**
- Leaderboard calculated on-demand (not cached in MVP)
- For 10 members × 20 weeks avg: ~200 records scanned
- Post-MVP: Cache reputation scores, recalculate weekly

---

## 9. Risks & Edge Cases

### 9.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Magic link email delivery failure** | High (blocks login) | Medium | Retry mechanism, "Didn't receive?" button, rate limiting bypass for support |
| **Session token theft/hijacking** | High (security) | Low | httpOnly cookies, short expiration, HTTPS only, no client-side token access |
| **Invite code collision** | Medium (join failure) | Very Low | 6-char alphanumeric = 2.2B combinations; regenerate on collision |
| **Race condition in voting** | Low (incorrect count) | Low | Atomic vote count increment, database transaction isolation |
| **Data loss during deploy** | High (user frustration) | Very Low | Cloudflare KV replication, immutable deploys, health checks before promotion |
| **Browser compatibility** | Medium (feature broken) | Medium | Progressive enhancement, feature detection, polyfills for older browsers |
| **Cloudflare KV consistency lag** | Low (stale data) | Medium | Document eventual consistency, use read-after-write for critical paths |

### 9.2 Product & UX Edge Cases

| Scenario | Current Behavior | Handling |
|----------|------------------|----------|
| **User belongs to no teams** | Empty state screen | Prominent "Create Team" and "Join Team" CTAs with examples |
| **User belongs to 50+ teams** | All teams in switcher | Virtual scrolling in team list, search/filter capability (post-MVP) |
| **Team has 1 member** | Only member is always "Up Next" | Show message "Add more members to enable rotation" |
| **All members have equal points** | Alphabetical tie-breaker | Transparent rule, displayed in tooltip |
| **Organizer leaves before proposing venue** | Week can still complete | Admin can force-start with "No venue this week" |
| **Member marked away while "Up Next"** | Automatic re-assignment | Next lowest-points member becomes "Up Next", toast notification |
| **No votes cast on venue** | First venue wins by default | Allow week completion, show "No votes cast" indicator |
| **Voting never closes** | Week stalled | Admin "Force-Start Week" button manually advances |
| **New member joins during active voting** | Not eligible to vote current week | Can vote starting next week |
| **Duplicate member names in team** | Database constraint prevents | Show error "Name already exists in this team", suggest alternative |
| **Team deleted with active members** | Confirmation required | "Are you sure? All data will be lost" warning, members lose access |
| **Member removed while viewing app** | Real-time removal | Redirect to "You've been removed from this team" message |
| **Holiday mode enabled during voting** | Current week continues | Holiday mode takes effect _after_ current week completes |
| **User clicks multiple invite codes rapidly** | Idempotent join operation | Join only once, subsequent attempts show "Already a member" |
| **Organizer proposes 0 venues** | Valid state | Voting section shows "No venues proposed yet" |

### 9.3 Data Integrity Edge Cases

| Scenario | Risk | Prevention |
|----------|------|------------|
| **Orphaned votes after venue deletion** | Incorrect counts | Cascade delete: `ON DELETE CASCADE` for venue → votes |
| **Member deletion leaves gaps in rotation** | Next picker calculation fails | Recalculate on deletion, handle null gracefully |
| **Week completion without winner** | Historical data incomplete | Allow null `winning_venue_id`, mark as "No winner" |
| **Points overflow (>2B)** | Integer limit | Acceptable (would take 38M years of weekly picks) |
| **Negative points manipulation** | Unfair advantage | Validate points ≥ 0 on all updates |
| **Duplicate invite codes across teams** | Join wrong team | Unique constraint on `Team.invite_code` |
| **Session token reuse after logout** | Security issue | Invalidate token on logout, server-side token blacklist |

### 9.4 Scale & Performance Edge Cases

| Scenario | Threshold | Handling |
|----------|-----------|----------|
| **Team with 100+ members** | Slow roster render | Virtual scrolling, pagination (implement if needed) |
| **User in 100+ teams** | Slow team switcher | Search/filter UI, paginated team list |
| **100+ venue proposals in one week** | Voting UI cluttered | Unlikely (organizer submits 1-3); no limit in MVP |
| **1000+ concurrent voters** | Server load | Cloudflare edge caching, rate limiting per IP |
| **Historical data for 1000+ weeks** | Large query results | Paginate history view, index on timestamps |

---

## 10. Post-MVP Roadmap

### Phase 1: Engagement & Feedback (Weeks 1-4 post-launch)
**Goal:** Increase user retention and gather quality feedback

- **Post-lunch feedback system**
  - "Great pick!" ★ or "Pass" reactions after lunch
  - 5-star venue ratings
  - Average rating displayed on member cards
  - Reputation score calculation based on feedback

- **Achievement system**
  - Award titles: "🏆 Legendary Curator", "⭐ Master Chef", "🎖️ Veteran Organizer"
  - Display achievements on member cards and leaderboard
  - Seasonal stat tracking (quarterly resets for fresh starts)

- **Enhanced leaderboard**
  - Sort by reputation score, win count, participation
  - "Hall of Fame" section for all-time best performers
  - Team-wide stats (total lunches organized, participation rate)

**Success Metrics:** 60%+ feedback submission rate, 30%+ users earn achievements, leaderboard viewed 3+ times/user/month

---

### Phase 2: Notifications & Reminders (Weeks 5-8)
**Goal:** Reduce manual coordination, increase weekly participation

- **Email notifications**
  - "It's your turn this week!" reminder to organizer (Monday morning)
  - "Vote on this week's pick!" to all members (when venue proposed)
  - "Leaderboard updated!" weekly digest (Friday)
  - Configurable per-user preferences (opt-out)

- **Slack integration (bot)**
  - Post "Up Next" announcement in team channel
  - Prompt voting when venues are proposed
  - Share leaderboard updates
  - OAuth-based team connection

- **Microsoft Teams integration**
  - Similar functionality to Slack bot
  - Adaptive Cards for rich voting UI

**Success Metrics:** 40%+ teams enable notifications, 20%+ reduction in missed picks, 15%+ increase in voting participation

---

### Phase 3: Intelligence & Suggestions (Weeks 9-12)
**Goal:** Reduce organizer burden with smart recommendations

- **AI-powered venue suggestions**
  - ChatGPT integration for personalized recommendations
  - Based on team's past picks, preferences, location
  - "Not sure where to go? Get AI suggestions" button
  - Option to accept or customize suggestions

- **Location-based venue discovery**
  - Google Places API integration
  - Show nearby restaurants, ratings, hours
  - Filter by cuisine, price, distance
  - One-tap add to proposals

- **Randomizer wheel**
  - Fun UI for picking venue when team can't decide
  - Weighted by past popularity
  - Confetti animation on selection

**Success Metrics:** 25%+ organizers use AI suggestions, 50%+ suggested venues get voted on, 10%+ improvement in venue quality ratings

---

### Phase 4: Ritual Templates (Weeks 13-16)
**Goal:** Expand beyond lunch to other team rituals

- **Template system**
  - Pre-configured ritual types: "Lunch Rotation", "Coffee Runs", "Snack Duty", "Friday Picks", "Weekly MVP"
  - Custom ritual creation (user-defined name and rules)
  - Template-specific terminology (e.g., "Brew Master" for coffee runs)

- **Multi-ritual support**
  - Teams can run multiple rituals simultaneously
  - Separate rotations, voting, leaderboards per ritual
  - Ritual switcher UI (similar to team switcher)

- **Ritual-specific features**
  - Coffee runs: Track brew preferences
  - Weekly MVP: Peer nomination voting
  - Snack duty: Budget tracking

**Success Metrics:** 20%+ teams create 2+ rituals, 30%+ use non-lunch templates, template diversity (all 5 types adopted)

---

### Phase 5: Social & Community (Weeks 17-20)
**Goal:** Increase engagement through social features

- **Extended reactions**
  - Emoji reactions on venues beyond ★/Pass
  - "🔥 Hot pick!", "🤔 Interesting...", "💯 Classic choice"
  - Reaction leaderboard

- **Comments & discussion**
  - Optional short comments on venue proposals
  - "Why this spot?" organizer notes
  - Reply threads (keep lightweight, not Slack replacement)

- **Team polls**
  - Quick polls for non-lunch decisions
  - "Mexican or Italian?", "Early or late lunch?"
  - Reusable for recurring questions

- **Public team profiles (opt-in)**
  - Share your team's favorite venues publicly
  - Inspire other teams with your rotation
  - Privacy controls (default: private)

**Success Metrics:** 15%+ venues have comments, 40%+ teams use polls, 5%+ teams go public

---

### Phase 6: Analytics & Insights (Weeks 21-24)
**Goal:** Provide data-driven insights for teams

- **Team analytics dashboard**
  - Participation trends over time
  - Venue diversity score
  - Most active members
  - Peak voting times

- **Personal stats**
  - Your rotation history
  - Your most popular picks
  - Your voting patterns vs team average
  - Badges and milestones

- **Team streak tracking**
  - Consecutive weeks without skips
  - Longest streak displayed on team profile
  - Celebrate milestones (10 weeks, 50 weeks, 1 year)

- **Bad pick protection mode**
  - If member gets 3 consecutive low ratings, auto-skip next turn
  - Optional feature (default: off)
  - Promotes quality over fairness

**Success Metrics:** 50%+ users view personal stats, 30%+ teams achieve 10+ week streak, analytics engagement 2+ views/user/month

---

### Phase 7: Mobile Native Apps (Weeks 25-32)
**Goal:** Improve mobile experience with native features

- **iOS app**
  - Native UI components (SwiftUI)
  - Push notifications for votes and reminders
  - Widgets showing "Up Next" on home screen
  - Share Sheet integration for easy invites

- **Android app**
  - Native Material Design
  - Push notifications
  - Home screen widgets
  - Quick Actions for common tasks

- **Shared features**
  - Offline mode (view roster, last known state)
  - Biometric login (Face ID, fingerprint)
  - App Store / Play Store distribution

**Success Metrics:** 30%+ users install native app, 50%+ mobile users enable push, 4.0+ app store rating

---

### Beyond 6 Months: Advanced Features

- **Advanced analytics:** Predictive modeling for venue popularity, seasonal trend analysis
- **Third-party integrations:** Google Calendar, Uber Eats, DoorDash partnerships
- **Team customization:** Custom point systems, weighted voting, seniority-based rotation
- **Enterprise features:** SSO (SAML), admin consoles, org-wide analytics, billing
- **Gamification expansion:** Badges, challenges, team competitions, cross-team leaderboards
- **Internationalization:** Multi-language support, currency localization, regional preferences

---

## 11. Success Criteria & KPIs

### MVP Launch Success Criteria
- **Technical:** Zero critical bugs, 99.5% uptime, <2s page load
- **Adoption:** 50+ teams created in first month
- **Engagement:** 70%+ weekly active rate (WAU/MAU)
- **Retention:** 60%+ teams complete 4+ weeks of rotations
- **Satisfaction:** NPS ≥ 40, <5% churn rate

### North Star Metric
**Weekly Active Teams (WAT):** Number of teams with ≥1 voting session per week

### Supporting Metrics
- **Activation:** % of new users who join/create team within 24 hours
- **Engagement:** Average votes cast per member per month
- **Quality:** Average venue rating (post-MVP)
- **Viral Growth:** Invite code redemption rate, teams per user
- **Retention:** 7-day, 30-day, 90-day team retention

---

## 12. Appendix

### 12.1 Glossary

- **Magic Link:** Passwordless authentication method using time-limited email codes
- **Rotation:** The sequential assignment of organizing responsibility across team members
- **Organizer:** The team member designated to plan the current week's lunch
- **Up Next:** The member assigned to organize the upcoming week (lowest points)
- **Points:** Accumulated rotation count; higher points = more turns taken
- **Venue Proposal:** A restaurant or location suggested by the organizer for team voting
- **Voting Period:** The time window during which members can vote on venue options
- **Holiday Mode:** Team-wide pause in rotation (no points accrue, no turns assigned)
- **Away Status:** Individual member's temporary absence from rotation
- **Reputation Score:** Quality metric based on post-lunch feedback (future feature)
- **Achievement:** Fun title awarded for participation/quality milestones
- **Invite Code:** 6-character alphanumeric code for joining a team

### 12.2 References

- **Authentication:** OWASP Auth Cheat Sheet, JWT Best Practices
- **UI/UX:** Nielsen Norman Group - Heuristics, Material Design Guidelines
- **Accessibility:** WCAG 2.1 AA Standards
- **Performance:** Google Web Vitals, Lighthouse Audits
- **Security:** OWASP Top 10, Cloudflare Security Best Practices

### 12.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-20 | Product Owner | Initial PRD creation for MVP |
| 1.1 | 2025-11-21 | Product Owner | Clarified auth flow (magic link + OTP), added MVP+ scope |

---

# MVP+ (MVP Stretch) Requirements

## 13. Executive Summary - MVP+

**What MVP+ Adds:** Light gamification, lore-consistent theming, enhanced engagement features, and personalization that increase stickiness and differentiation without adding complexity. MVP+ transforms LunchSaga from a functional rotation tool into a delightful micro-ritual experience with narrative flavor.

**Why Now:** Early adopters respond strongly to personality and playfulness. Adding badges, streaks, and "saga" theming in the first release creates memorable moments that drive word-of-mouth and retention. These features are low-cost to implement but high-impact for user delight.

**Scope Discipline:** All MVP+ features maintain the core "zero admin" philosophy. Nothing requires configuration, moderation, or ongoing maintenance. Gamification is opt-out (always visible but ignorable). Theming is playful but professional.

**Key Additions:**
- **Gamification:** Badges, achievement titles, team streaks, weekly MVP recognition
- **Lore/Theming:** "Saga" narrative flavor text for picks, seasonal quest prompts, playful language
- **Engagement:** Weekly team summary emails, mini-achievements, organizer spotlight
- **Personalization:** User avatars, team banner images, custom member titles
- **Analytics:** Simple venue stats (most popular, win rates), member contribution metrics

**Success Metrics (MVP+ Specific):**
- 40%+ users earn at least one badge within 30 days
- 25%+ teams maintain a 4+ week streak
- 60%+ users customize their avatar
- Weekly summary email open rate >50%
- Badge/achievement views per user per month: 3+

---

## 14. MVP+ Feature List

### MUST HAVE (MVP+ Blockers)

**Gamification Core**
- Badge system with 8-12 core badges
- Achievement titles that display on member cards
- Team streak tracking (consecutive weeks without skips)
- Weekly MVP auto-selection (most votes received)
- Badge showcase on member profiles

**Lore & Theming**
- "Saga" terminology throughout (e.g., "Your Quest," "The Council Votes")
- Weekly flavor text for picks (optional, auto-generated)
- Seasonal quest prompts (simple text suggestions, no new mechanics)
- Playful achievement names aligned with "saga" theme

**Engagement Features**
- Weekly team summary (email digest with stats, MVP, next picker)
- Mini-achievements (first vote, first pick, 10 picks, etc.)
- Organizer spotlight in status bar when voting active

**Personalization**
- User avatar upload (or emoji/icon selector)
- Custom member titles (editable by admins, max 20 chars)
- Team banner image (optional header image)

**Simple Analytics**
- Venue win rate (how often each venue wins when proposed)
- Member contribution score (picks organized + votes cast)
- Most popular venue (team-wide)

### SHOULD HAVE (High Value, Post-MVP+ Week 1)

**Advanced Gamification**
- Seasonal badge resets (keeps competition fresh)
- Team-wide achievements (entire team earns collective badge)
- Badge rarity tiers (common, rare, legendary)
- Achievement progress bars (e.g., "7/10 picks organized")

**Enhanced Theming**
- Custom quest prompts (admins can write their own)
- Themed venue categories (tags like "Adventure," "Classic," "Hidden Gem")
- Seasonal event theming (winter, summer, holidays)

**Social Features**
- "Great pick!" quick reactions on venues (beyond star ratings)
- Organizer can add a note when proposing venues ("Why I chose this")
- Team announcement banner (admin can post short message)

**Profile Enhancements**
- Personal stats dashboard (your picks, your win rate, your streak)
- Member bio field (optional 100-char description)
- Favorite venues list

### WON'T HAVE (Out of Scope for MVP+)

**Over-Complex Gamification**
- Point systems beyond the rotation points (no separate "XP" or "coins")
- Leaderboards beyond simple stats (no ranked competitions)
- Purchasable rewards or premium badges
- Daily quests or check-ins (weekly only)
- Multiplayer/competitive features across teams

**Heavy Theming**
- Animations beyond simple badge reveals
- Sound effects or music
- Full narrative storylines or campaigns
- Character creation or role-playing elements
- Custom illustrations or artwork for each badge

**Admin Overhead**
- Manual badge assignment
- Custom achievement builders
- Complex quest logic or branching paths
- Content moderation tools (keep it simple and safe)

---

## 15. Gamification Features (MVP+ Scope)

### 15.1 Badge System

**Design Philosophy:** Badges celebrate participation and quality without creating pressure or elitism. All badges are achievable by active members. No badges are exclusive or time-limited (seasonal badges rotate but return yearly).

**Core Badges (8 Badges):**

1. **🌟 First Quest** - Organize your first lunch pick
   - **Trigger:** Complete first week as organizer
   - **Rarity:** Common (everyone earns this)

2. **🍜 Culinary Explorer** - Propose 5 different venues
   - **Trigger:** Organize 5 weeks with 5 unique venue choices
   - **Rarity:** Common

3. **🏆 Crowd Pleaser** - Win 3 votes with 80%+ team approval
   - **Trigger:** 3 of your picks receive votes from 80%+ of active members
   - **Rarity:** Uncommon

4. **⭐ Perfect Pick** - Achieve unanimous vote on a venue
   - **Trigger:** All active team members vote for your venue
   - **Rarity:** Rare

5. **🔥 Hot Streak** - Organize 3 consecutive weeks
   - **Trigger:** Be organizer 3 weeks in a row (through rotation fairness)
   - **Rarity:** Uncommon

6. **🗳️ Devoted Voter** - Vote in 10 consecutive weeks
   - **Trigger:** Cast vote every week for 10 weeks straight
   - **Rarity:** Uncommon

7. **🎖️ Veteran Organizer** - Complete 25 picks
   - **Trigger:** Organize 25 total lunch picks
   - **Rarity:** Rare

8. **👑 Legendary Curator** - Maintain 4.5+ average rating over 10 picks
   - **Trigger:** 10+ organized picks with average post-lunch rating ≥4.5 stars
   - **Rarity:** Legendary (requires post-lunch feedback feature)

**Badge Display:**
- Member cards show up to 3 most prestigious badges (legendary > rare > uncommon > common)
- Profile view shows all earned badges in grid
- Badge earned notification appears as toast when unlocked
- Team feed shows recent badge earns (optional, can be disabled)

**Anti-Cringe Measures:**
- No badges for "logging in X days in a row" (participation theater)
- No badges that require spending money or inviting friends
- No corporate language ("Synergy Master," "Team Player") - keep it food/adventure themed
- No badges that shame non-participants ("Slacker," "Ghost")
- Opt-out toggle: "Hide badges" in settings (still earn them, just don't see them)

### 15.2 Achievement Titles

**Concept:** Short, playful titles that appear next to member names on cards and leaderboards. These rotate based on current performance and seasonal context.

**Weekly Titles (Auto-Assigned):**
- **Weekly MVP:** Member who organized the highest-voted pick this week
- **Voting Champion:** Member with longest current voting streak
- **Fresh Face:** Newest team member (first 2 weeks only)

**Seasonal Titles (Assigned Quarterly, Retained Until Next Season):**
- **Spring: 🌸 Blossom Scout** - Most picks organized in Q1
- **Summer: ☀️ Sunshine Chef** - Highest average rating in Q2
- **Fall: 🍂 Harvest Hero** - Most consecutive votes in Q3
- **Winter: ❄️ Cozy Curator** - Most unanimous picks in Q4

**Permanent Titles (Unlock Once, Keep Forever):**
- **🏅 Founding Member:** Joined team in first week of its creation
- **💯 Century Club:** 100+ total picks organized
- **🎯 Sharpshooter:** 10+ perfect (unanimous) picks

**Title Display:**
- Shows below member name in smaller, muted text
- Max 1 active title per member
- Priority: Seasonal > Weekly > Permanent
- Users can select which permanent title to display (if multiple earned)

### 15.3 Team Streak Tracking

**Definition:** Consecutive weeks where at least one pick is organized and voting occurs. Streak breaks if a week is skipped (no organizer or no voting).

**Streak Display:**
- Status bar shows: "🔥 12 Week Streak"
- Team selection screen shows current streak next to team name
- Milestones celebrated: 4 weeks, 10 weeks, 25 weeks, 52 weeks (1 year!)

**Streak Milestones:**
- **4 Weeks:** "Getting Started" - Team badge unlocked
- **10 Weeks:** "Committed Crew" - Team badge unlocked
- **25 Weeks:** "Ritual Masters" - Team badge unlocked
- **52 Weeks:** "Saga Legends" - Special team badge + confetti animation

**Streak Protection:**
- Holiday mode pauses streak (doesn't break it)
- Admins can retroactively mark a week as "planned skip" to preserve streak (within 7 days)

### 15.4 Weekly MVP Recognition

**Selection Logic:**
```
FUNCTION selectWeeklyMVP(team_id, week_id):
    // Get organizer of this week
    organizer = SELECT organizer_id FROM Week WHERE id = week_id
    
    // Get their venue proposal
    venue = SELECT * FROM VenueProposal 
            WHERE week_id = week_id 
            AND proposed_by = organizer
            ORDER BY vote_count DESC
            LIMIT 1
    
    // MVP = organizer if their venue won with >50% of team votes
    total_members = COUNT(Membership WHERE team_id = team_id AND is_away = false)
    vote_percentage = venue.vote_count / total_members
    
    IF vote_percentage >= 0.5:
        RETURN organizer (award "Weekly MVP" title)
    ELSE:
        RETURN null (no MVP this week)
END FUNCTION
```

**MVP Benefits:**
- "Weekly MVP" title for the following week
- Highlighted in weekly summary email
- Badge progress toward "Crowd Pleaser" and "Legendary Curator"

### 15.5 Scoring Categories

**Member Contribution Score:** Simple metric visible on member profiles

```
Contribution Score = (Picks Organized × 2) + (Votes Cast × 1) + (Badges Earned × 5)

Example:
- Alice: (12 picks × 2) + (48 votes × 1) + (3 badges × 5) = 87 points
- Bob: (8 picks × 2) + (52 votes × 1) + (2 badges × 5) = 78 points
```

**Purpose:** Celebrate engagement without creating competition. Used only for "Most Active Member" stat, not for rotation or privileges.

**Venue Win Rate:** Percentage of times a venue wins when proposed

```
Win Rate = (Times Venue Won / Times Venue Proposed) × 100%

Example:
- "Taco Tuesday": Won 4 out of 5 proposals = 80% win rate
- "Sushi Palace": Won 2 out of 8 proposals = 25% win rate
```

**Display:** Shown on venue cards when re-proposed ("This venue has an 80% win rate!")

### 15.6 How Users See and Earn Badges

**Discovery:**
- Member profile shows all available badges (earned + locked)
- Locked badges show silhouette + unlock criteria
- Progress bars for badges in progress (e.g., "7/10 picks organized")

**Earning:**
- Automatic - no manual claiming required
- Toast notification when badge unlocked: "🎉 Badge Earned: Culinary Explorer!"
- Badge appears on member card immediately
- Team feed posts: "Alice just earned 🍜 Culinary Explorer!"

**Showcase:**
- Member cards: Up to 3 badges displayed (most prestigious first)
- Profile view: All badges in grid, sortable by rarity or date earned
- Team leaderboard: Badges shown next to names

**Engagement Loop:**
- Users check "next badge" on profile
- See clear criteria ("Organize 2 more picks to unlock Culinary Explorer")
- Natural motivation without forced mechanics

---

## 16. Lore & Theming (MVP+)

### 16.1 "Saga" Terminology

**Core Concept:** LunchSaga frames the weekly rotation as a shared adventure. Language shifts from corporate task management to playful quest narrative.

**Terminology Map:**

| Standard Term | Saga Term | Usage Example |
|---------------|-----------|---------------|
| Organizer | Quest Giver | "You're this week's Quest Giver!" |
| Venue Proposal | The Quest | "Propose your quest for the week" |
| Voting | Council Vote | "The council has voted: Taco Tuesday wins!" |
| Team | Guild / Fellowship | "Your fellowship: Mobile Team 🚀" |
| Weekly Rotation | The Saga Continues | "Week 12: The Saga Continues" |
| Next Picker | Next Hero | "Next Hero: Alice" |
| Leaderboard | Hall of Fame | "Hall of Fame - Top Quest Givers" |

**Implementation:**
- Primary UI uses Saga terms
- Tooltips provide context ("Quest Giver: The member organizing this week's lunch")
- Settings toggle: "Use standard terminology" for teams who prefer plain language

### 16.2 Weekly Flavor Text

**Auto-Generated Prompts:** When organizer proposes venues, system suggests optional flavor text

**Examples:**
- "Week 5: A new challenger approaches. What culinary adventure awaits?"
- "Week 12: The fellowship gathers. Where shall we feast?"
- "Week 18: Legends speak of a hidden gem nearby. Could this be it?"
- "Week 23: The saga continues. Choose wisely, brave Quest Giver."

**Customization:**
- Organizers can edit or replace flavor text
- Admins can disable auto-flavor text for team
- Seasonal variations (e.g., winter: "Warm hearth and good company beckon...")

### 16.3 Seasonal Quest Prompts

**Concept:** Light, optional suggestions that encourage venue variety without forcing it.

**Examples:**

**Spring Prompts:**
- "Seek out fresh flavors this week"
- "Find a spot with outdoor seating for the Fellowship"
- "Discover a new place the team hasn't tried"

**Summer Prompts:**
- "Cool treats on a hot day - ice cream or smoothies?"
- "A breezy patio could be perfect this week"
- "Beach-adjacent or waterfront dining adventure"

**Fall Prompts:**
- "Comfort food season - what's your pick?"
- "Warm soups and hearty meals await"
- "Celebrate harvest season with local ingredients"

**Winter Prompts:**
- "Cozy indoor dining for the cold months"
- "Hot beverages and warm company"
- "Festive atmosphere to lift spirits"

**Implementation:**
- Displayed on venue proposal screen as suggestion, not requirement
- Easily dismissible ("Not now" button)
- Rotate weekly within season
- Admins can write custom prompts

### 16.4 Playful Achievement Names

**Aligned with Saga Theme:**

Instead of generic names, use adventure/food/quest language:

- ✅ "First Quest" not "First Time Organizer"
- ✅ "Culinary Explorer" not "5 Venues Proposed"
- ✅ "Legendary Curator" not "High Rating Achiever"
- ✅ "Devoted Voter" not "10 Consecutive Votes"
- ✅ "Perfect Pick" not "Unanimous Vote Winner"

**Voice & Tone:**
- Playful but not childish
- Adventure-themed but not fantasy-heavy
- Food-centric when possible
- Professional enough for workplace use

---

## 17. MVP+ User Stories & Acceptance Criteria

### Epic 7: Gamification & Engagement

#### US-701: Earn First Badge
**As a** team member  
**I want to** earn badges for participation and quality  
**So that** I feel recognized for my contributions

**Acceptance Criteria:**
- **GIVEN** I complete a badge-earning action (e.g., organize first pick)
- **WHEN** the system detects badge unlock
- **THEN** I see a toast notification "🎉 Badge Earned: First Quest!"
- **AND** the badge appears on my member card
- **AND** the badge appears in my profile's badge grid
- **AND** my team feed shows "You earned First Quest" (if feed enabled)

#### US-702: View Badge Progress
**As a** team member  
**I want to** see which badges I can earn next  
**So that** I know what goals to work toward

**Acceptance Criteria:**
- **GIVEN** I view my profile
- **WHEN** I navigate to the badges section
- **THEN** I see all available badges (earned + locked)
- **AND** locked badges show silhouette + unlock criteria
- **AND** badges with progress show progress bar (e.g., "7/10 picks organized")
- **AND** I can filter by earned, locked, or rarity

#### US-703: Weekly MVP Selection
**As a** team member  
**I want** the system to automatically recognize the week's best pick  
**So that** great organizers get acknowledged

**Acceptance Criteria:**
- **GIVEN** voting closes for a week
- **WHEN** the organizer's venue won with >50% of team votes
- **THEN** that organizer is awarded "Weekly MVP" title
- **AND** the title appears below their name for the following week
- **AND** they are highlighted in the weekly summary email
- **AND** the status bar shows "Last week's MVP: [Name]"

#### US-704: Team Streak Tracking
**As a** team admin  
**I want** to see our team's consecutive week streak  
**So that** we can celebrate consistency and ritual commitment

**Acceptance Criteria:**
- **GIVEN** my team has completed multiple consecutive weeks
- **WHEN** I view the team dashboard
- **THEN** I see "🔥 [X] Week Streak" in the status bar
- **AND** the streak number increments after each completed week
- **AND** streak milestones trigger celebratory notifications (4, 10, 25, 52 weeks)
- **AND** holiday mode pauses (not breaks) the streak

### Epic 8: Personalization

#### US-801: Upload Avatar
**As a** team member  
**I want to** upload a profile picture or select an avatar  
**So that** my profile feels personal

**Acceptance Criteria:**
- **GIVEN** I am viewing my profile
- **WHEN** I click "Edit Avatar"
- **THEN** I can upload an image (max 2MB, JPG/PNG)
- **OR** I can select from emoji/icon library
- **AND** avatar preview updates immediately
- **AND** avatar appears on my member card across all teams

#### US-802: Custom Member Title
**As a** team admin  
**I want to** assign custom titles to members  
**So that** we can add personality or inside jokes

**Acceptance Criteria:**
- **GIVEN** I am a team admin
- **WHEN** I click a member's edit button
- **THEN** I see a "Custom Title" field (max 20 characters)
- **AND** I can enter text (e.g., "Taco Enthusiast," "Coffee Czar")
- **AND** the title appears below the member's name in muted text
- **AND** custom titles override achievement titles (user preference)

#### US-803: Team Banner Image
**As a** team admin  
**I want to** upload a team banner image  
**So that** our team page feels unique

**Acceptance Criteria:**
- **GIVEN** I am a team admin viewing team settings
- **WHEN** I click "Team Banner"
- **THEN** I can upload an image (max 5MB, JPG/PNG, 1200x300px recommended)
- **AND** the banner appears at the top of the team page
- **AND** banner is cropped/resized to fit without distortion
- **AND** I can remove the banner to revert to default

### Epic 9: Lore & Theming

#### US-901: Saga Terminology Toggle
**As a** team member  
**I want** the app to use playful "saga" language  
**So that** the experience feels more engaging

**Acceptance Criteria:**
- **GIVEN** I am using the app
- **WHEN** I view any team page
- **THEN** I see Saga terminology by default ("Quest Giver," "Council Vote," etc.)
- **AND** tooltips explain terms on hover ("Quest Giver: This week's organizer")
- **AND** in settings, I can toggle to "Standard Terminology" if preferred
- **AND** the toggle applies to my view only (doesn't affect other users)

#### US-902: Weekly Flavor Text
**As an** organizer  
**I want** to add narrative flavor to my venue proposal  
**So that** the weekly pick feels more fun

**Acceptance Criteria:**
- **GIVEN** I am proposing a venue as the Quest Giver
- **WHEN** the proposal dialog opens
- **THEN** I see an auto-generated flavor text suggestion (e.g., "What culinary adventure awaits?")
- **AND** I can edit or replace the text (max 100 characters)
- **AND** I can clear it entirely if I prefer no flavor text
- **AND** the flavor text appears above the venue options in the voting section

#### US-903: Seasonal Quest Prompts
**As an** organizer  
**I want** seasonal suggestions for venue types  
**So that** I have inspiration when choosing

**Acceptance Criteria:**
- **GIVEN** I am proposing a venue
- **WHEN** the dialog opens
- **THEN** I see a seasonal quest prompt (e.g., "Seek out fresh flavors this week" in spring)
- **AND** the prompt is dismissible ("Not now" button)
- **AND** prompts rotate weekly within each season
- **AND** admins can write custom prompts for the team

### Epic 10: Simple Analytics

#### US-1001: Venue Win Rate
**As a** team member  
**I want to** see which venues are most popular  
**So that** I can make informed choices

**Acceptance Criteria:**
- **GIVEN** a venue has been proposed multiple times
- **WHEN** I view venue history or propose it again
- **THEN** I see its win rate (e.g., "80% win rate - 4/5 times")
- **AND** win rate is calculated as (times won / times proposed)
- **AND** only venues with 3+ proposals show win rate (avoid misleading stats)

#### US-1002: Member Contribution Score
**As a** team member  
**I want to** see my overall engagement score  
**So that** I understand my participation level

**Acceptance Criteria:**
- **GIVEN** I view my profile
- **WHEN** I navigate to the stats section
- **THEN** I see my Contribution Score calculated as: (Picks × 2) + (Votes × 1) + (Badges × 5)
- **AND** I see a breakdown of the score components
- **AND** I see my rank within the team (e.g., "3rd most active")
- **AND** the score is purely informational (doesn't affect rotation)

#### US-1003: Weekly Team Summary Email
**As a** team member  
**I want** a weekly email summarizing our team's activity  
**So that** I stay connected even when I don't open the app

**Acceptance Criteria:**
- **GIVEN** I am a member of an active team
- **WHEN** the week closes (Sunday evening or Monday morning)
- **THEN** I receive an email with:
  - Last week's winning venue and organizer
  - Weekly MVP (if applicable)
  - Next week's Quest Giver
  - Current team streak
  - Recent badges earned
  - Link to vote on current pick (if voting active)
- **AND** I can unsubscribe from these emails in settings
- **AND** email is mobile-friendly and loads quickly

---

## 18. MVP+ Data Model Extensions

### New Fields on Existing Entities

**User (Extensions):**
- `avatar_url` (string, nullable): URL to uploaded avatar image
- `use_saga_terminology` (boolean, default: true): User's terminology preference
- `badge_notifications_enabled` (boolean, default: true): Show badge toast notifications

**Team (Extensions):**
- `banner_image_url` (string, nullable): URL to team banner image
- `current_streak` (integer, default: 0): Consecutive weeks completed
- `longest_streak` (integer, default: 0): All-time best streak
- `streak_started_at` (timestamp, nullable): When current streak began
- `custom_quest_prompts` (JSON, nullable): Admin-defined seasonal prompts

**Membership (Extensions):**
- `custom_title` (string, nullable, max 20 chars): Admin-assigned title
- `contribution_score` (integer, default: 0): Cached engagement score
- `weekly_mvp_count` (integer, default: 0): Times awarded Weekly MVP
- `longest_vote_streak` (integer, default: 0): Best consecutive voting streak

### New Entities (MVP+)

#### **Badge**
System-defined badges that members can earn.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `name` (string, required): Badge name (e.g., "First Quest")
- `description` (string, required): How to earn it
- `icon_emoji` (string, required): Emoji representation (e.g., "🌟")
- `rarity` (enum: 'common' | 'uncommon' | 'rare' | 'legendary'): Badge tier
- `unlock_criteria` (JSON, required): Trigger rules

**Example:**
```json
{
  "id": "badge-001",
  "name": "First Quest",
  "description": "Organize your first lunch pick",
  "icon_emoji": "🌟",
  "rarity": "common",
  "unlock_criteria": {
    "type": "picks_organized",
    "threshold": 1
  }
}
```

#### **MemberBadge**
Junction table tracking which members earned which badges.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `membership_id` (UUID, FK → Membership, required): Who earned it
- `badge_id` (UUID, FK → Badge, required): Which badge
- `earned_at` (timestamp): When unlocked
- `progress` (JSON, nullable): Progress toward multi-step badges

**Relationships:**
- Many-to-One → Membership
- Many-to-One → Badge

**Unique Constraints:**
- `(membership_id, badge_id)` (can only earn each badge once)

#### **TeamAchievement**
Team-wide achievements (collective milestones).

**Fields:**
- `id` (UUID, PK): Unique identifier
- `team_id` (UUID, FK → Team, required): Which team
- `achievement_type` (enum: 'streak_4' | 'streak_10' | 'streak_25' | 'streak_52'): Milestone
- `achieved_at` (timestamp): When unlocked
- `icon_emoji` (string): Display emoji

**Relationships:**
- Many-to-One → Team

---

## 19. MVP+ Algorithms

### 19.1 Badge Unlock Detection

**Purpose:** Automatically check if member earned a badge after each action.

**Algorithm:**
```
FUNCTION checkBadgeUnlocks(membership_id, action_type, action_data):
    member = SELECT * FROM Membership WHERE id = membership_id
    team_id = member.team_id
    
    // Get all badges this member hasn't earned yet
    available_badges = SELECT * FROM Badge
                       WHERE id NOT IN (
                           SELECT badge_id FROM MemberBadge 
                           WHERE membership_id = membership_id
                       )
    
    FOR EACH badge IN available_badges:
        criteria = badge.unlock_criteria
        
        SWITCH criteria.type:
            CASE "picks_organized":
                pick_count = COUNT(PickerHistory WHERE membership_id = membership_id)
                IF pick_count >= criteria.threshold:
                    unlockBadge(membership_id, badge.id)
            
            CASE "unanimous_votes":
                perfect_picks = COUNT(PickerHistory 
                                WHERE membership_id = membership_id 
                                AND vote_percentage = 1.0)
                IF perfect_picks >= criteria.threshold:
                    unlockBadge(membership_id, badge.id)
            
            CASE "consecutive_votes":
                current_streak = calculateVoteStreak(membership_id)
                IF current_streak >= criteria.threshold:
                    unlockBadge(membership_id, badge.id)
            
            CASE "average_rating":
                avg_rating = AVG(PickerHistory.feedback_score 
                                WHERE membership_id = membership_id)
                pick_count = COUNT(PickerHistory WHERE membership_id = membership_id)
                IF avg_rating >= criteria.min_rating 
                   AND pick_count >= criteria.min_picks:
                    unlockBadge(membership_id, badge.id)
    
END FUNCTION

FUNCTION unlockBadge(membership_id, badge_id):
    INSERT INTO MemberBadge (membership_id, badge_id, earned_at)
    VALUES (membership_id, badge_id, NOW())
    
    // Send notification
    sendBadgeNotification(membership_id, badge_id)
    
    // Update team feed
    postToTeamFeed(membership_id, "earned badge", badge_id)
END FUNCTION
```

**Trigger Points:**
- After organizing a pick (week completes)
- After casting a vote
- After venue proposal
- After receiving post-lunch feedback

### 19.2 Team Streak Calculation

**Purpose:** Track consecutive weeks and detect streak milestones.

**Algorithm:**
```
FUNCTION updateTeamStreak(team_id, week_id):
    team = SELECT * FROM Team WHERE id = team_id
    week = SELECT * FROM Week WHERE id = week_id
    
    // Check if week was completed (has winner or was force-closed)
    IF week.completed_at IS NULL:
        RETURN // Week not done yet
    
    // Check previous week
    previous_week = SELECT * FROM Week
                    WHERE team_id = team_id
                    AND week_number = week.week_number - 1
                    ORDER BY week_number DESC
                    LIMIT 1
    
    IF previous_week EXISTS AND previous_week.completed_at IS NOT NULL:
        // Streak continues
        team.current_streak = team.current_streak + 1
    ELSE:
        // Streak starts fresh
        team.current_streak = 1
        team.streak_started_at = week.completed_at
    
    // Update longest streak if needed
    IF team.current_streak > team.longest_streak:
        team.longest_streak = team.current_streak
    
    // Check for milestone achievements
    checkStreakMilestones(team_id, team.current_streak)
    
    UPDATE Team SET current_streak, longest_streak, streak_started_at
    WHERE id = team_id
END FUNCTION

FUNCTION checkStreakMilestones(team_id, streak_count):
    milestones = [4, 10, 25, 52]
    
    IF streak_count IN milestones:
        achievement_type = "streak_" + streak_count
        
        // Check if not already earned
        exists = SELECT * FROM TeamAchievement
                 WHERE team_id = team_id
                 AND achievement_type = achievement_type
        
        IF NOT exists:
            INSERT INTO TeamAchievement (team_id, achievement_type, achieved_at)
            VALUES (team_id, achievement_type, NOW())
            
            // Celebrate!
            sendStreakNotification(team_id, streak_count)
END FUNCTION
```

**Streak Break Conditions:**
- Week skipped with no pick organized
- More than 7 days gap between weeks
- Admin explicitly breaks streak (rare, for corrections)

**Streak Preservation:**
- Holiday mode active (pauses, doesn't break)
- Admin marks week as "planned skip" within 7 days

### 19.3 Weekly Summary Email Generation

**Purpose:** Compile and send engaging weekly digest to all team members.

**Algorithm:**
```
FUNCTION generateWeeklySummary(team_id):
    team = SELECT * FROM Team WHERE id = team_id
    
    // Get last completed week
    last_week = SELECT * FROM Week
                WHERE team_id = team_id
                AND completed_at IS NOT NULL
                ORDER BY completed_at DESC
                LIMIT 1
    
    IF last_week IS NULL:
        RETURN // No completed weeks yet
    
    // Gather summary data
    summary = {
        team_name: team.name,
        team_emoji: team.emoji,
        week_number: last_week.week_number,
        
        // Last week's results
        organizer: getMemberName(last_week.organizer_id),
        winning_venue: getVenueName(last_week.winning_venue_id),
        vote_count: getVoteCount(last_week.id),
        
        // Weekly MVP (if applicable)
        weekly_mvp: getWeeklyMVP(last_week.id),
        
        // Next week's info
        next_organizer: getNextPicker(team_id),
        current_week: last_week.week_number + 1,
        
        // Team stats
        current_streak: team.current_streak,
        recent_badges: getRecentBadges(team_id, 7), // Last 7 days
        
        // Current voting (if active)
        active_voting: getCurrentVoting(team_id)
    }
    
    // Generate HTML email
    email_html = renderTemplate("weekly_summary", summary)
    
    // Send to all active members
    members = SELECT * FROM Membership
              WHERE team_id = team_id
              AND is_away = false
    
    FOR EACH member IN members:
        IF member.user_id IS NOT NULL:
            user = SELECT * FROM User WHERE id = member.user_id
            sendEmail(user.email, "Weekly Saga Summary - " + team.name, email_html)
END FUNCTION
```

**Scheduling:** Run every Monday morning at 9am local time (team timezone inferred from majority of members)

---

## 20. MVP+ Non-Functional Requirements

### Performance (Additional)
- **Badge Check Time:** <50ms for all badge unlock checks after action
- **Avatar Upload:** <5 seconds for image processing and CDN upload
- **Weekly Email Generation:** <2 minutes for batch processing all teams
- **Team Feed Update:** Real-time (<500ms) when badge earned or MVP selected

### Storage
- **Avatars:** Max 2MB per image, stored on Cloudflare R2 or Images
- **Team Banners:** Max 5MB per image, auto-resized to 1200x300px
- **Badge Icons:** Emoji only (no custom images in MVP+)
- **Total Storage Growth:** ~10MB per 100 active users (mostly images)

### Moderation & Safety
- **Avatar Moderation:** Manual review queue for uploaded images (post-MVP+)
- **Custom Title Filtering:** Block profanity list for custom titles
- **Flavor Text:** Character limit prevents abuse (100 chars max)
- **Badge Names:** System-defined only (no user-generated badges)

---

## 21. MVP+ Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Gamification feels forced/corporate** | Medium (user disengagement) | Medium | Use playful saga language, make badges opt-out visible, avoid HR terminology |
| **Badge inflation (too many, too easy)** | Low (diluted meaning) | Medium | Limit to 8-12 core badges, require meaningful thresholds, test with real teams |
| **Avatar uploads contain inappropriate content** | High (HR/legal issue) | Low | Start with emoji/icon selector only, add image upload post-launch with moderation queue |
| **Weekly emails marked as spam** | Medium (reduced engagement) | Low | Clear unsubscribe, valuable content only, send from verified domain, limit to 1/week |
| **Streak pressure creates stress** | Medium (defeats "zero admin" goal) | Low | Emphasize streak is celebratory not mandatory, holiday mode preserves streaks, no negative consequences for breaks |
| **Seasonal prompts feel repetitive** | Low (minor annoyance) | Medium | 20+ prompts per season, rotate weekly, easily dismissible, admin custom prompts |
| **Custom titles used inappropriately** | Medium (professionalism concern) | Low | Admin-only assignment, profanity filter, max 20 chars, examples provided |

---

## 22. MVP+ Success Criteria

**Launch Criteria (Ready to Ship):**
- All 8 core badges functional and tested
- Badge unlock detection working for all trigger types
- Avatar upload/selector operational
- Weekly summary email sends successfully
- Team streak tracking accurate
- Saga terminology applied throughout with toggle functional
- No P0/P1 bugs in gamification features

**Engagement Metrics (30 days post-launch):**
- 40%+ users earn at least one badge
- 60%+ users customize avatar
- 50%+ weekly email open rate
- 25%+ teams maintain 4+ week streak
- 3+ badge/achievement views per user per month

**Quality Metrics:**
- <1% badge unlock errors (false positives/negatives)
- <5% email bounce rate
- 90%+ users keep saga terminology enabled
- NPS ≥ 50 (up from MVP's ≥40 target)

**Retention Impact:**
- 7-day retention: 75% (up from 70% MVP target)
- 30-day retention: 65% (up from 60% MVP target)
- 90-day retention: 55% (up from 50% estimated)

---

**END OF MVP+ SPECIFICATION**

---

**END OF DOCUMENT**
