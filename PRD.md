# Planning Guide

A collaborative team lunch rostering system that uses points-based round-robin scheduling to fairly distribute the responsibility of organizing team lunches, while adding light gamification through venue voting to recognize members who consistently choose great spots.

**Experience Qualities**:
1. **Fair** - The points system ensures everyone gets an equal turn and no one feels burdened by organizing too often
2. **Engaging** - Light gamification through voting makes lunch planning fun rather than a chore
3. **Flexible** - Easy deferrals and holiday handling accommodate real-world scheduling needs

**Complexity Level**: Light Application (multiple features with basic state)
  - Manages team member rotation, voting, and points tracking with persistent state across sessions

## Essential Features

### Team Member Management
- **Functionality**: Add/remove team members, view current roster
- **Purpose**: Establish who participates in the lunch rotation
- **Trigger**: User clicks "Add Member" or manages existing members
- **Progression**: Click Add Member → Enter name/details → Save → Member appears in roster with 0 points
- **Success criteria**: Members persist across sessions, display in roster with current point totals

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

### Organizer Reputation Score
- **Functionality**: Track "venue quality" score based on votes received for proposed venues
- **Purpose**: Light gamification - recognize members who consistently pick popular spots
- **Trigger**: After voting completes, calculate average votes or "wins"
- **Progression**: Votes tallied → Calculate organizer's venue rating → Update reputation score → Display leaderboard
- **Success criteria**: Scores reflect voting patterns, leaderboard shows top organizers

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

- **New member joining mid-rotation** - Start with average points of existing members to avoid immediate heavy rotation
- **Member leaving team** - Remove from rotation, redistribute any active turns to next person
- **Tied points for next organizer** - Randomly select or use secondary sort (alphabetical, join date)
- **No votes cast on venues** - Default to organizer's first choice or mark as "No decision"
- **Organizer forgets to propose venues** - Send reminder, allow auto-skip after deadline
- **Multiple concurrent lunch periods** - System handles one active lunch period at a time

## Design Direction

The design should feel collaborative and friendly, like a team dashboard rather than a corporate tool—approachable and lightweight with clear visual indicators of who's up next and gentle encouragement to participate. A minimal interface serves best here, keeping cognitive load low while making the key actions (viewing rotation, voting, proposing venues) immediately obvious.

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

Animations should feel responsive and encouraging—subtle transitions that guide attention to rotation changes and voting results, with moments of delight when celebrating voting winners or acknowledging completed turns.

- **Purposeful Meaning**: Motion emphasizes collaboration—smooth transitions when turns change hands, celebratory micro-interactions when venues win votes, gentle pulses on "your turn" indicators
- **Hierarchy of Movement**: Highest priority animations for turn changes and voting results (300ms), medium for navigation (200ms), subtle for hover states (150ms)

## Component Selection

- **Components**:
  - **Card** - Primary container for roster list, venue proposals, voting panels (add subtle shadow and border)
  - **Avatar** - Display team member profile images with fallback to initials
  - **Button** - Primary actions (Propose Venue, Cast Vote, Add Member), secondary for defer/skip
  - **Dialog** - Add member form, venue proposal form, defer confirmation
  - **Badge** - Display point totals, "Up Next" indicator, reputation scores
  - **Progress** - Visual indicator for voting progress or point distribution
  - **Tabs** - Switch between "Roster", "Vote", "History" views
  - **Separator** - Divide sections within cards
  - **Tooltip** - Explain point system, reputation scores on hover

- **Customizations**:
  - **Roster List Component** - Custom component combining Avatar, member info, points badge, and action buttons
  - **Venue Voting Card** - Custom component with venue details, vote button, and live vote count
  - **Leaderboard Component** - Custom ranked list with reputation scores and sparkle icons for top performers

- **States**:
  - Buttons: Default with clear affordance, hover lifts slightly, active shows pressed state, disabled when not member's turn
  - Vote buttons: Unselected (secondary), selected (primary with checkmark), disabled after voting
  - "Up Next" indicator: Accent color with subtle pulsing animation

- **Icon Selection**:
  - CalendarBlank (schedule/rotation)
  - Users (team roster)
  - MapPin (venues)
  - ThumbsUp (voting)
  - Trophy (reputation/leaderboard)
  - SkipForward (defer turn)
  - Plus (add member)
  - X (remove member)

- **Spacing**: Consistent 4px base unit - cards use p-6, sections gap-4, list items gap-3, inline elements gap-2

- **Mobile**: 
  - Stack roster cards vertically on mobile
  - Tabs become full-width on small screens
  - Venue voting cards stack instead of grid layout
  - Dialogs take full screen on mobile with slide-up animation
  - Touch targets minimum 44px for all interactive elements
