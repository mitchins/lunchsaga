# Planning Guide

A collaborative team lunch rostering system with user authentication and multi-team support that uses points-based round-robin scheduling to fairly distribute the responsibility of organizing team lunches, while adding gamification through venue voting and achievements to recognize members who consistently choose great spots.

**Experience Qualities**:
1. **Fair** - The points system ensures everyone gets an equal turn and no one feels burdened by organizing too often
2. **Social** - Multi-team support and profile system makes it feel like a shared experience across the organization
3. **Delightful** - Achievements, emojis, colors, and playful interactions make lunch planning genuinely fun

**Complexity Level**: Light Application (multiple features with basic state)
  - Manages user authentication, multiple teams, member rotation, voting, and points tracking with persistent state across sessions

## Essential Features

### User Authentication (Magic Link)
- **Functionality**: Email-based authentication using magic link codes
- **Purpose**: Identify users across teams and persist their preferences
- **Trigger**: User visits app without being logged in
- **Progression**: Enter email → Receive magic link code → Enter code → Authenticated
- **Success criteria**: User remains logged in across sessions, can access all their teams

### Team Management
- **Functionality**: Create teams with custom names, emojis, and colors, or join existing teams via invite codes
- **Purpose**: Support multiple independent lunch groups within an organization
- **Trigger**: Authenticated user needs to create or join a team
- **Progression**: Click Create Team → Choose name/emoji/color → Get invite code → Share with teammates OR Click Join Team → Enter invite code → Join existing team
- **Success criteria**: Users can belong to multiple teams, each team has isolated rosters and voting

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

### Team Voting on Venues
- **Functionality**: Team members vote on proposed venue options
- **Purpose**: Democratic selection and quality feedback for organizers
- **Trigger**: Team members view active venue proposals
- **Progression**: View venue options → Cast vote for preferred venue → See live vote counts → Voting closes → Winner announced
- **Success criteria**: Each member votes once, votes are tallied accurately, winning venue is clearly displayed

### Organizer Reputation Score & Achievements
- **Functionality**: Track "venue quality" score based on votes received, award achievement titles based on performance
- **Purpose**: Gamification - recognize members who consistently pick popular spots with fun titles
- **Trigger**: After voting completes, calculate reputation and check for achievement milestones
- **Progression**: Votes tallied → Calculate organizer's venue rating → Update reputation score → Check win count → Award achievement title → Display in leaderboard
- **Success criteria**: Scores reflect voting patterns, achievement titles appear on member cards (🏆 Legendary Curator, ⭐ Master Chef, etc.)

### Defer Turn
- **Functionality**: Allow members to defer their organizing turn to the next period
- **Purpose**: Accommodate vacations, busy weeks, or other conflicts
- **Trigger**: Member clicks "Skip My Turn" or "Defer"
- **Progression**: Member up next → Click Defer → Points don't increment → Next-lowest member becomes organizer → Deferred member returns to queue
- **Success criteria**: Deferrals don't break rotation fairness, member can rejoin rotation later

### Holiday/Break Mode
- **Functionality**: Pause the rotation during company holidays or team breaks
- **Purpose**: Avoid assigning turns when team lunches aren't happening
- **Trigger**: Admin/team marks period as "Holiday Break"
- **Progression**: Toggle holiday mode → Rotation pauses → No turns assigned → Resume when break ends
- **Success criteria**: No points accrue during breaks, rotation resumes cleanly afterward

## Edge Case Handling

- **User authentication failure** - Clear error messages, ability to retry or use different email
- **Invalid invite code** - Show error toast, allow user to retry
- **User belongs to no teams** - Show team creation/join prompts prominently
- **New member joining mid-rotation** - Start with average points of existing team members to avoid immediate heavy rotation
- **Member leaving team** - Remove from rotation, redistribute any active turns to next person
- **Tied points for next organizer** - Use secondary sort (alphabetical by name)
- **No votes cast on venues** - Still allow completion, winner determined by first option
- **Organizer forgets to propose venues** - Team can start new period manually
- **Multiple teams with same user** - Data properly isolated per team, no cross-contamination

## Design Direction

The design should feel playful and celebratory, like a shared team activity rather than task management—vibrant team colors and emojis give each group personality, while achievement titles and animated interactions create moments of delight that encourage ongoing participation. A clean interface with personality serves best here, keeping the experience fun while making key actions (creating teams, voting, viewing achievements) immediately obvious and rewarding.

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

Animations should feel celebratory and encouraging—smooth transitions with personality that highlight achievements and voting results, with playful micro-interactions when creating teams (emoji/color selection), moments of delight when someone earns a new achievement title, and satisfying feedback when votes are cast.

- **Purposeful Meaning**: Motion emphasizes celebration and accomplishment—smooth transitions when earning achievements, confetti-like effects for voting winners, gentle pulses on "your turn" indicators, bouncy interactions when selecting team emojis
- **Hierarchy of Movement**: Highest priority for achievement unlocks and voting results (400ms with spring easing), medium for team creation/selection (250ms), subtle for hover states and UI transitions (150ms)

## Component Selection

- **Components**:
  - **Card** - Primary container for roster list, venue proposals, voting panels, team selection cards (add subtle shadow and border)
  - **Avatar** - Display team member profile images with fallback to initials
  - **Button** - Primary actions (Create Team, Join Team, Propose Venue, Cast Vote, Add Member), secondary for defer/skip
  - **Dialog** - Magic link verification, team creation, join team, add member form, venue proposal form
  - **Badge** - Display point totals, "Up Next" indicator, reputation scores, achievement titles, team owner badge
  - **Progress** - Visual indicator for voting progress or point distribution
  - **Tabs** - Switch between "Roster", "Vote", "History" views
  - **Separator** - Divide sections within cards
  - **Tooltip** - Explain point system, reputation scores, achievements on hover
  - **Switch** - Holiday mode toggle
  - **Input** - Email entry, code verification, team names, member names

- **Customizations**:
  - **Team Selection Grid** - Large touch-friendly cards with emoji displays and color-coded backgrounds
  - **Team Header** - Shows team emoji/color, member count, invite button with copy-to-clipboard
  - **Roster List Component** - Custom component combining Avatar, member info, achievement titles, points badge, wins counter
  - **Venue Voting Card** - Custom component with venue details, vote button, and live vote count
  - **Leaderboard Component** - Custom ranked list with reputation scores and achievement icons for top performers
  - **Login Screen** - Full-page gradient background with centered card, two-step magic link flow

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
