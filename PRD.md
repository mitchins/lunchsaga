# Planning Guide

Micro-rituals for micro-teams: A zero-admin webapp for managing weekly team lunch rotations with fair turn-taking, democratic venue voting, and playful recognition for great picks—built for small teams who want ritual without overhead.

**Experience Qualities**:
1. **Frictionless** - Magic-link login, instant team creation, no setup friction—add card and you're done
2. **Ritual-focused** - Simple weekly rhythm with "Up Next" clarity makes participation effortless and expected
3. **Delightful** - Fun layer with achievements, voting feedback, and celebratory moments without feeling childish

**Complexity Level**: Light Application (multiple features with basic state)
  - Manages magic-link authentication, multiple teams per user, automatic rotation logic, venue voting, reputation scoring, and achievement tracking with persistent state

**Product Category**: Micro Rituals for Micro Teams
  - Universal workplace need (lunch turns, coffee runs, Friday picks, snack duty, weekly MVP, rotating chores)
  - Small enough that nobody built it properly, universal enough that every team has a broken spreadsheet doing this
  - Zero admin overhead, high social stickiness through weekly check-ins

## Essential Features

### User Authentication (Magic Link)
- **Functionality**: Email-based authentication using magic link codes, no password required
- **Purpose**: Zero-friction entry ideal for small teams—identify users across teams without login overhead
- **Trigger**: User visits app without being logged in
- **Progression**: Enter email → Receive magic link code → Enter code → Authenticated
- **Success criteria**: User remains logged in across sessions, can access all their teams, no password memory burden

### Team Management
- **Functionality**: Create teams with custom names, emojis, and colors, or join existing teams via invite codes—supports infinite teams per user
- **Purpose**: People are in multiple micro-teams (Mobile Team, Design Team, Friday Coffee Club, Housemates, Project sub-squads)
- **Trigger**: Authenticated user needs to create or join a team
- **Progression**: Click Create Team → Choose name/emoji/color → Get shareable invite code → Share with teammates OR Click Join Team → Enter invite code → Join existing team
- **Success criteria**: Users can belong to unlimited teams, team switcher makes context switching seamless, each team has isolated rosters and voting

### Team Member Management
- **Functionality**: Add/remove team members within a specific team
- **Purpose**: Establish who participates in each team's lunch rotation
- **Trigger**: User clicks "Add Member" within a team context
- **Progression**: Select team → Click Add Member → Enter name → Member appears in roster with average points
- **Success criteria**: Members are tied to specific teams, display with current point totals and achievements

### Points-Based Round Robin Scheduling
- **Functionality**: Automatically determines whose turn it is based on accumulated points (lowest points = next organizer)
- **Purpose**: Ensure fair distribution of organizing responsibility
- **Trigger**: System automatically calculates on app load and after each completed turn
- **Progression**: Check all member points → Identify member(s) with lowest points → Display as "Up Next" → After organizing, increment their points
- **Success criteria**: Turn assignment is always fair, members with fewer turns are prioritized

### Venue Selection & Submission
- **Functionality**: Current organizer proposes venue options for the team lunch
- **Purpose**: Let the designated organizer fulfill their role by suggesting where to eat
- **Trigger**: Organizer clicks "Propose Venue" or "Start This Week's Lunch"
- **Progression**: Organizer designated → Propose 2-3 venue options → Submit for team voting → Voting period opens
- **Success criteria**: Venues are clearly associated with the organizer who proposed them

### Team Voting on Venues (with Post-Lunch Feedback)
- **Functionality**: Team members vote on proposed venue options, then optionally rate the pick after lunch
- **Purpose**: Democratic selection with quality feedback loop—turns good picks into social recognition
- **Trigger**: Team members view active venue proposals (pre-lunch), or complete period (post-lunch)
- **Progression**: View venue options → Cast vote for preferred venue → See live vote counts → Voting closes → Winner announced → After lunch → "Great pick!" ★ or "Pass" reactions → Leaderboards update with average scores
- **Success criteria**: Each member votes once, votes are tallied accurately, winning venue is clearly displayed, post-lunch feedback influences reputation/leaderboards

### Organizer Reputation Score & Achievements
- **Functionality**: Track "venue quality" score based on votes received and post-lunch ratings, award fun achievement titles (not corporate badges)
- **Purpose**: Light gamification - recognize members who consistently pick popular spots with playful titles, not serious performance metrics
- **Trigger**: After voting completes and post-lunch feedback is gathered
- **Progression**: Votes tallied → Post-lunch ratings collected → Calculate organizer's average venue rating → Update reputation score → Check win count → Award achievement title ("🏆 Legendary Curator", "⭐ Master Chef") → Display in leaderboard with seasonal stats
- **Success criteria**: Scores reflect voting patterns + quality feedback, achievement titles appear on member cards, leaderboard shows "Hall of Fame" for best performers, stats reset each season for fresh starts

### Member Profiles & Attendance
- **Functionality**: Member cards expand to show attendance toggles, per-member holiday mode, edit name/avatar
- **Purpose**: Tappable cards make individual management easy—mark someone away without removing them from rotation
- **Trigger**: Tap/click on member card in roster
- **Progression**: Tap member → Card expands → Toggle attendance/holiday → Rotation automatically skips them → Toggle back when they return
- **Success criteria**: Expanded state shows all member controls, attendance toggles immediately affect rotation logic, visual feedback confirms state

### Team Switcher (Multi-Team Navigation)
- **Functionality**: Slack-style left sidebar or top dropdown for switching between teams
- **Purpose**: People belong to multiple micro-teams and need effortless context switching
- **Trigger**: User in any team view wants to switch to different team
- **Progression**: Click team switcher → View all joined teams → Select team → Context switches to selected team's roster/voting/history
- **Success criteria**: Switching is instant, current team is visually highlighted, teams show unread activity indicators

### Status Bar (Ritual Context)
- **Functionality**: Persistent status bar showing current week, next picker, team name, quick profile/team switch
- **Purpose**: TMUX-like always-visible context for the current ritual state
- **Trigger**: Always visible at top or bottom of app
- **Progression**: Glanceable info → Current week number → "Up Next: [Name]" → Active team name → Quick switchers
- **Success criteria**: Never disappears, updates in real-time, accessible on all screens

### Holiday/Break Mode
- **Functionality**: Pause the rotation during company holidays or team breaks
- **Purpose**: Avoid assigning turns when team lunches aren't happening
- **Trigger**: Admin/team marks period as "Holiday Break"
- **Progression**: Toggle holiday mode → Rotation pauses → No turns assigned → Resume when break ends
- **Success criteria**: No points accrue during breaks, rotation resumes cleanly afterward

## Future Enhancements
_Valuable features marked for post-prototype iterations_

### Slack / Teams Integration
- Bot notifications: "It's Misun Kim's turn this week!" / "Vote on this week's pick!" / "Leaderboard updated!"
- This is a big future lever for virality and adoption within orgs

### AI-Powered Suggestions
- ChatGPT-powered "Pick of the Week" venue suggestions based on past preferences
- Randomizer wheel for lunch picks

### Extended Ritual Types
- Adapt the same rotation/voting/achievement system for: coffee runs, Friday picks, snack duty, weekly MVP, rotating chores
- Each becomes a separate "ritual template" within the app

### Advanced Analytics
- Team streaks, season comparisons, "bad pick protection mode"
- Place suggestions based on location and team history

### Social Features
- "Great pick!" emoji reactions beyond star ratings
- Optional short comments on venue feedback
- Team polls for non-lunch decisions

## Edge Case Handling

- **User authentication failure** - Clear error messages, ability to retry or use different email
- **Invalid invite code** - Show error toast, allow user to retry with helpful hint
- **User belongs to no teams** - Show team creation/join prompts prominently with example use cases
- **New member joining mid-rotation** - Start with average points of existing team members to avoid immediate heavy rotation
- **Member leaving team** - Remove from rotation, redistribute any active turns to next person
- **Member on holiday/away** - Attendance toggle skips them in rotation without removing from team
- **Tied points for next organizer** - Use secondary sort (alphabetical by name) for consistent fairness
- **No votes cast on venues** - Still allow completion, winner determined by first option or organizer's choice
- **Organizer forgets to propose venues** - Team can manually start new period or skip to next organizer
- **Multiple teams with same user** - Data properly isolated per team, no cross-contamination, clear team context in UI
- **Team switcher confusion** - Always show current team name prominently, highlight active team in switcher
- **Stale rotation state** - "Force-start week" button for manual override when automation gets stuck

## Design Direction

The design should feel like a "Lunch Club for Tiny Teams"—playful without being childish, ritual-focused without feeling corporate. Think: minimal overhead UI that gets out of the way, but celebrates participation with vibrant team colors, fun achievement titles, and satisfying micro-interactions. The experience should feel social and human, emphasizing weekly rhythm and shared moments over productivity metrics. Visual personality comes from team emojis and colors, not busy interfaces.

**Tagline Options**:
- "Tiny Rituals for Tiny Teams"
- "Weekly picks without the drama"
- "Your team's lunch rotation, automated"
- "Micro-rituals that keep teams human"

## Color Selection

Complementary color scheme with warm and cool tones to balance friendliness with professionalism.

- **Primary Color**: Warm teal (oklch(0.65 0.15 200)) - Conveys collaboration and approachability, used for primary actions
- **Secondary Colors**: Soft slate (oklch(0.45 0.02 240)) for supporting UI elements, maintains professionalism
- **Accent Color**: Vibrant coral (oklch(0.70 0.18 30)) - Draws attention to "your turn" indicators and voting CTAs
- **Foreground/Background Pairings**:
  - Background (White oklch(0.98 0 0)): Foreground dark slate (oklch(0.20 0.02 240)) - Ratio 14.2:1 ✓
  - Card (Light gray oklch(0.96 0 0)): Card foreground (oklch(0.20 0.02 240)) - Ratio 13.1:1 ✓
  - Primary (Warm teal oklch(0.65 0.15 200)): White text (oklch(1 0 0)) - Ratio 4.9:1 ✓
  - Secondary (Soft slate oklch(0.45 0.02 240)): White text (oklch(1 0 0)) - Ratio 8.1:1 ✓
  - Accent (Vibrant coral oklch(0.70 0.18 30)): Dark slate (oklch(0.20 0.02 240)) - Ratio 7.2:1 ✓
  - Muted (Light gray oklch(0.93 0 0)): Muted foreground (oklch(0.50 0.01 240)) - Ratio 6.8:1 ✓

## Font Selection

Typography should be clean, friendly, and highly legible for scanning rosters and voting options—Inter provides excellent readability at all sizes while feeling modern and approachable.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter SemiBold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers "Up Next", "Vote"): Inter SemiBold/24px/normal/-0.01em
  - H3 (Member Names, Venue Names): Inter Medium/18px/normal
  - Body (Descriptions, Info): Inter Regular/16px/relaxed/line-height 1.6
  - Small (Points, Stats): Inter Medium/14px/normal/text-muted-foreground
  - Caption (Timestamps, Helper Text): Inter Regular/12px/normal/text-muted-foreground

## Animations

Animations should feel celebratory and encouraging—moments of delight that reinforce participation without slowing down usage. Think: satisfying feedback when votes are cast, playful bounces when creating teams, gentle recognition when someone earns an achievement. Keep motion subtle and purposeful, never blocking or distracting from the core ritual flow.

- **Purposeful Meaning**: Motion celebrates participation and accomplishment—confetti-like effects for voting winners (small, tasteful), gentle pulsing on "Up Next" indicators, smooth spring physics when selecting team emojis/colors, scale animation when achievements unlock
- **Hierarchy of Movement**: 
  - High priority (400ms spring): Achievement unlocks, voting completion, winner announcement
  - Medium priority (250ms): Team creation, team switching, venue card interactions
  - Subtle (150ms): Hover states, button presses, UI transitions
  - Always smooth: Never jarring or mechanical—prefer spring/ease-out over linear

## Component Selection

- **Components**:
  - **Card** - Primary container for roster list, venue proposals, voting panels, team selection cards (add subtle shadow, use border for state indication)
  - **Avatar** - Display team member profile images with fallback to initials (2-letter, colorful backgrounds)
  - **Button** - Primary actions (Create Team, Join Team, Propose Venue, Cast Vote, Add Member), secondary for defer/skip, "Force-start week" for manual override
  - **Dialog** - Magic link verification, team creation, join team, add member form, venue proposal form
  - **Badge** - Display point totals, "Up Next" indicator with pulse animation, reputation scores, achievement titles, team owner badge
  - **Progress** - Visual indicator for voting progress (how many votes cast vs total members)
  - **Tabs** - Switch between "Roster", "Vote", "History" views within a team
  - **Separator** - Divide sections within cards
  - **Tooltip** - Explain point system, reputation scores, achievements on hover
  - **Switch** - Holiday mode toggle (per team)
  - **Input** - Email entry, code verification, team names, member names, venue details

- **Customizations**:
  - **Team Switcher Component** - Slack-style sidebar or top dropdown with team emoji, color indicator, unread activity dots
  - **Status Bar Component** - Persistent bar (top or bottom) showing current week, "Up Next: [Name]", active team, quick switchers
  - **Team Selection Grid** - Large touch-friendly cards with emoji displays and color-coded backgrounds, hover effects
  - **Team Header** - Shows team emoji/color, member count, invite button with one-click copy-to-clipboard
  - **Expandable Member Card** - Tap to expand: shows attendance toggle, holiday mode per member, edit controls
  - **Roster List Component** - Combines Avatar, member info, achievement titles, points badge, wins counter, reputation score
  - **Venue Voting Card** - Custom component with venue details, vote button, live vote count, post-lunch rating option (★/Pass)
  - **Leaderboard Component** - Ranked list with reputation scores, achievement icons, seasonal stats, "Hall of Fame" section for top performers
  - **Login Screen** - Full-page gradient background with centered card, two-step magic link flow, friendly copy

- **States**:
  - Buttons: Default with clear affordance, hover lifts slightly, active shows pressed state, disabled when not member's turn
  - Vote buttons: Unselected (secondary), selected (primary with checkmark), disabled after voting
  - "Up Next" indicator: Accent color with pulsing animation
  - Achievement badges: Appear with subtle scale animation when earned
  - Team color selectors: Ring on selected color, hover effect on all
  - Emoji selectors: Accent background on selected, hover scale on all

- **Icon Selection**:
  - EnvelopeSimple (email/magic link)
  - Check (verification success)
  - SignIn (join team)
  - ShareNetwork (invite)
  - Copy (copy invite code)
  - ArrowLeft (back navigation)
  - CalendarBlank (schedule/rotation)
  - Users (team roster)
  - MapPin (venues)
  - Trophy (reputation/leaderboard)
  - Crown (wins counter)
  - SkipForward (defer turn)
  - Plus (add member/create)
  - X (remove member/close)

- **Spacing**: Consistent 4px base unit - cards use p-6, sections gap-4, list items gap-3, inline elements gap-2

- **Mobile**: 
  - Stack roster cards vertically on mobile
  - Tabs become full-width on small screens
  - Venue voting cards stack instead of grid layout
  - Dialogs take full screen on mobile with slide-up animation
  - Touch targets minimum 44px for all interactive elements
