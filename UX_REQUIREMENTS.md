# LunchSaga MVP+ UX Requirements Specification

**Version:** 1.0  
**Last Updated:** 2025-11-21  
**Document Owner:** UX & Accessibility Agent  
**Status:** Draft for Engineering Review

---

## 1. Executive Summary

This document specifies the complete user experience, visual design, and interaction patterns for LunchSaga MVP+. It provides concrete guidance for engineers to implement screens and flows before backend architecture is finalized.

**Key Principles:**
- **Zero-friction onboarding** - Magic link auth, no passwords
- **Mobile-first responsive** - 375px+ screens fully supported
- **WCAG 2.1 AA compliant** - Accessible to all users
- **Playful but professional** - "Saga" theming without corporate bloat
- **Instant feedback** - Real-time updates, optimistic UI

---

## 2. Screen Inventory

### 2.1 Authentication Screens

#### Screen: Login Entry
**Purpose:** Initial authentication entry point  
**Layout:** Centered card on gradient background  
**Components:**
- App logo/emoji (🍽️)
- App name ("LunchSaga" or "Team Lunch")
- Tagline ("Tiny rituals for tiny teams")
- Email input field
- "Send Magic Link" button
- Footer text (privacy/terms optional)

**Interactions:**
- Email validation on blur
- Enter key submits form
- Loading state on button during send

#### Screen: Code Verification
**Purpose:** OTP code entry for magic link fallback  
**Layout:** Centered card on gradient background  
**Components:**
- "Enter Your Code" heading
- "We sent a code to {email}" subtitle
- 6-character code input (uppercase, monospace)
- "Verify & Sign In" button
- "Use a different email" link
- Console hint text for demo mode

**Interactions:**
- Auto-focus code input
- Auto-uppercase on typing
- Enter key submits
- Back link returns to email entry

---

### 2.2 Team Management Screens

#### Screen: Team Selection
**Purpose:** Choose or create teams after login  
**Layout:** Full-page grid or list of team cards  
**Components:**
- Welcome message with user name
- "Create Team" button (primary CTA)
- "Join Team" button (secondary CTA)
- List/grid of user's teams (if any)
- Each team card shows: emoji, name, color, member count

**States:**
- **Empty state:** No teams yet - prominent CTAs with examples
- **Single team:** Auto-select and skip to team view (optional)
- **Multiple teams:** Grid/list with search if 10+ teams

**Interactions:**
- Click team card to select
- Hover effect on team cards
- Create/Join open respective dialogs

#### Screen: Create Team Dialog
**Purpose:** Configure new team  
**Layout:** Modal dialog, centered  
**Components:**
- "Create Team" heading
- Team name input (3-50 chars, required)
- Emoji picker button
- Color picker (preset palette)
- Preview of team badge
- "Create Team" button
- "Cancel" button

**Validation:**
- Name length 3-50 characters
- Must select emoji (default: 🍽️)
- Must select color (default: primary)
- Live preview updates as user types

#### Screen: Join Team Dialog
**Purpose:** Enter invite code  
**Layout:** Modal dialog, centered  
**Components:**
- "Join Team" heading
- 6-character invite code input (uppercase)
- "Join Team" button
- "Cancel" button
- Error message area

**Validation:**
- Code must be exactly 6 characters
- Auto-uppercase on input
- Show error if invalid code
- Success toast on join, redirect to team

---

### 2.3 Main Team Screens

#### Screen: Team Dashboard (Roster Tab)
**Purpose:** View team members and rotation status  
**Layout:** Full-page with tabs, header, and content area  
**Components:**
- **Header Section:**
  - Team emoji and name
  - Member count badge
  - Back to teams button
  - Invite code button
- **Status Bar** (if multiple teams):
  - Current team indicator
  - Team switcher dropdown
  - Current week number
  - Next organizer name
- **Holiday Mode Toggle:**
  - Switch with label
  - Active badge when enabled
  - Explanation tooltip
- **Action Bar:**
  - "Next: {Name}" indicator
  - "Start This Week" button (when ready)
  - OR "Complete Voting" button (when all voted)
- **Tab Navigation:**
  - Roster (active)
  - Vote
  - History
- **Roster Content:**
  - "Team Members" heading
  - "Sorted by turns taken" badge
  - "Add Member" button
  - Member cards (sorted by points, ascending)
  - Leaderboard section

**Empty State:**
- Large user icon
- "No team members yet" heading
- Explanation text
- "Add Member" CTA button

#### Screen: Team Dashboard (Vote Tab)
**Purpose:** View and vote on venue proposals  
**Layout:** Full-page with tabs, header, and content area  
**Components:**
- Same header, status bar, holiday toggle as Roster
- **Active Voting:**
  - "Vote for This Week's Venue" heading
  - "Organized by {Name}" subtitle
  - Vote progress indicator: "{X} of {Y} votes cast"
  - Grid of venue cards (2 columns on desktop, 1 on mobile)
- **Voting Complete:**
  - Winner highlighted with badge
  - Final vote counts visible
  - "Week complete" indicator

**Empty States:**
- **No active voting:** Calendar icon, explanation, "Start This Week" CTA
- **Holiday mode active:** Different message explaining pause
- **No members:** Prompt to add members first

#### Screen: Team Dashboard (History Tab)
**Purpose:** Review past lunch selections  
**Layout:** Full-page with tabs, header, and content area  
**Components:**
- Same header, status bar as other tabs
- "Past Lunches" heading
- Chronological list of completed periods
- Each history item shows:
  - Week number
  - Date
  - Organizer name
  - Winning venue
  - Vote count
  - Expand for full details

**Empty State:**
- Clock icon
- "No history yet"
- "Complete your first week to see history"

---

### 2.4 Component-Level Screens

#### Component: Member Card (Collapsed)
**Purpose:** Display member info at a glance  
**Layout:** Horizontal card with avatar, info, and actions  
**Components:**
- Avatar (initials or image)
- Member name
- Achievement title (if earned)
- Stats row: turns, wins, reputation
- Points badge
- Expand/collapse icon
- "Up Next" badge (if applicable)
- "Away" badge (if marked away)

**Visual States:**
- Default: Standard card
- Up Next: Accent ring, pulse animation, badge
- Away: Reduced opacity, away badge
- Hover: Subtle background change

#### Component: Member Card (Expanded)
**Purpose:** Show member details and actions  
**Layout:** Card with expanded section below  
**Components:**
- All collapsed components
- Separator
- **Expanded Section:**
  - "Mark as Away" toggle with explanation
  - "Remove from Team" button (destructive)
  - Stats details (optional)

**Animations:**
- Smooth height expansion (200ms ease)
- Fade in expanded content

#### Component: Venue Voting Card
**Purpose:** Display venue option and accept votes  
**Layout:** Vertical card with venue info and vote button  
**Components:**
- Venue name (heading)
- Venue description (optional)
- Venue address (optional)
- Vote count (after user votes)
- Vote progress bar (visual indicator)
- "Vote" button
- Winner badge (if won)

**States:**
- **Before voting:** "Vote" button enabled
- **User hasn't voted:** All cards show vote buttons
- **User voted:** Buttons disabled except voted card, show counts
- **Voting complete:** Winner badge, final counts visible

**Interactions:**
- Click vote button to cast vote
- Optimistic UI update
- Toast confirmation
- Real-time count updates

---

### 2.5 Dialog Components

#### Dialog: Add Member
**Purpose:** Add new team member  
**Components:**
- "Add Member" heading
- Name input (2-50 chars)
- Starting points display (calculated average)
- "Add Member" button
- "Cancel" button

**Validation:**
- Name required, 2-50 characters
- No duplicate names in team
- Live character count

#### Dialog: Propose Venues
**Purpose:** Organizer submits venue options  
**Components:**
- "Propose Venues" heading
- "You're organizing week {N}" subtitle
- Venue entry form (repeatable):
  - Venue name (required, 3-100 chars)
  - Description (optional)
  - Address (optional)
  - Flavor text (optional, 100 chars)
- "Add Another Venue" button
- Seasonal quest prompt (dismissible)
- "Start Voting" button
- "Cancel" button

**Validation:**
- At least 1 venue required
- Each venue needs name
- Max 5 venues (recommended)

#### Dialog: Invite Code Display
**Purpose:** Show and copy team invite code  
**Components:**
- Team name and emoji
- 6-character code (large, monospace)
- "Copy to Clipboard" button
- Success checkmark on copy
- "Close" button

**Interactions:**
- Auto-select code on open
- Click to copy
- Toast confirmation

---

### 2.6 MVP+ Additional Screens

#### Screen: Member Profile
**Purpose:** View member details, badges, stats  
**Layout:** Full-page or modal overlay  
**Components:**
- Large avatar
- Member name
- Custom title (editable by admin)
- Current achievement title
- Badge showcase grid (earned + locked)
- Stats dashboard:
  - Total picks organized
  - Total votes cast
  - Contribution score
  - Win rate
  - Longest voting streak
- Personal history list

**Badge Display:**
- Earned badges: Full color, with name
- Locked badges: Grayscale silhouette, unlock criteria
- Progress bars for in-progress badges
- Rarity indicators (common/uncommon/rare/legendary)

#### Screen: Team Settings
**Purpose:** Admin configuration  
**Components:**
- Team name edit
- Emoji picker
- Color picker
- Banner image upload
- Custom quest prompts
- Regenerate invite code
- Holiday mode toggle
- Delete team (destructive)

**Access Control:**
- Only admins see this screen
- Confirmation dialogs for destructive actions

---

## 3. Navigation Model

### 3.1 Screen Flow Diagram

```
[Login Entry]
     ↓
[Code Verification]
     ↓
[Team Selection] ←→ [Create Team Dialog]
     ↓                ↓
     ↓          [Join Team Dialog]
     ↓
[Team Dashboard]
     ├─ [Roster Tab] ←→ [Add Member Dialog]
     │       ↓
     │  [Member Card] ←→ [Member Profile (MVP+)]
     │
     ├─ [Vote Tab] ←→ [Propose Venue Dialog]
     │       ↓
     │  [Venue Cards]
     │
     └─ [History Tab]
            ↓
       [History Items]
```

### 3.2 Navigation Patterns

**Tab Navigation:**
- Horizontal tabs (Roster, Vote, History)
- Active tab highlighted
- Keyboard accessible (arrow keys)
- Swipe gestures on mobile (optional)

**Back Navigation:**
- "Back to Teams" button in header
- Breadcrumbs optional
- Browser back button supported

**Team Switching:**
- Dropdown in status bar (if multiple teams)
- Shows all teams with emoji and name
- Current team highlighted
- Instant context switch (no page reload)

**Modal Dialogs:**
- Overlay with backdrop
- Close on backdrop click or ESC key
- Focus trap inside dialog
- Return focus on close

### 3.3 Keyboard Navigation

**Tab Order:**
- Logical left-to-right, top-to-bottom
- Skip links for screen readers
- Focus indicators visible (2px outline)
- Tab through all interactive elements

**Keyboard Shortcuts:**
- ESC: Close dialogs/modals
- Enter: Submit forms, activate buttons
- Arrow keys: Navigate tabs, lists
- Space: Toggle switches, checkboxes

---

## 4. Component Design System

### 4.1 Typography

**Headings:**
- H1: 2.5rem (40px), font-weight: 600, letter-spacing: -0.02em
- H2: 2rem (32px), font-weight: 600, letter-spacing: -0.01em
- H3: 1.5rem (24px), font-weight: 600
- H4: 1.25rem (20px), font-weight: 600

**Body Text:**
- Base: 1rem (16px), font-weight: 400, line-height: 1.5
- Small: 0.875rem (14px), line-height: 1.4
- Tiny: 0.75rem (12px), line-height: 1.3

**Monospace:**
- Code/invite codes: monospace font, letter-spacing: 0.05em

### 4.2 Color System

**Semantic Colors:**
- Primary: Team-specific color or default accent
- Secondary: Muted variant
- Accent: Highlight color (for "Up Next", CTAs)
- Destructive: Red/error color
- Success: Green
- Warning: Yellow/orange

**UI Colors:**
- Background: Light mode white, dark mode near-black
- Foreground: High contrast text
- Muted: Secondary text, disabled states
- Border: Subtle separators

**Contrast Requirements:**
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum
- Interactive elements: 3:1 against adjacent colors

### 4.3 Spacing Scale

**Base unit:** 0.25rem (4px)  
**Scale:** 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64

**Common Patterns:**
- Card padding: 1rem (16px)
- Button padding: 0.5rem 1rem (8px 16px)
- Section spacing: 1.5rem (24px)
- Page margins: 1rem mobile, 2rem desktop

### 4.4 Component Library

#### Buttons
**Variants:**
- Default: Primary color, white text
- Secondary: Muted background
- Ghost: Transparent, hover background
- Destructive: Red background
- Link: Text-only, underline on hover

**Sizes:**
- Small: 2rem (32px) height
- Medium: 2.5rem (40px) height
- Large: 3rem (48px) height

**States:**
- Default, Hover, Active, Focus, Disabled
- Loading: Spinner replaces content

#### Cards
**Structure:**
- Border radius: 0.5rem (8px)
- Border: 1px solid border color
- Shadow: Optional, subtle
- Hover: Slight shadow increase

**Variants:**
- Default: White/dark background
- Highlighted: Accent ring (Up Next)
- Muted: Reduced opacity (Away)

#### Badges
**Variants:**
- Default: Primary background
- Secondary: Muted background
- Outline: Border only
- Destructive: Red background

**Sizes:**
- Small: 1.25rem (20px) height
- Medium: 1.5rem (24px) height

#### Form Inputs
**Text Input:**
- Height: 2.5rem (40px)
- Padding: 0.5rem (8px)
- Border: 1px solid
- Focus: 2px ring in primary color

**Switch:**
- Width: 2.75rem (44px)
- Height: 1.5rem (24px)
- Thumb: 1.25rem (20px) circle
- Smooth transition: 200ms

**Select/Dropdown:**
- Same dimensions as text input
- Chevron icon indicator
- Keyboard navigable

---

## 5. User Flows

### 5.1 Authentication Flow

**Step 1: Email Entry**
1. User lands on login screen
2. Sees app branding and email input
3. Types email address
4. Clicks "Send Magic Link" or presses Enter
5. Button shows loading state
6. Email validation occurs

**Step 2: Code Verification**
7. Screen transitions to code entry
8. User sees "We sent a code to {email}"
9. In demo mode, code appears in console
10. User types 6-character code (auto-uppercase)
11. Clicks "Verify & Sign In" or presses Enter
12. System validates code

**Step 3: Success**
13. Success toast appears
14. Smooth transition to Team Selection screen
15. Welcome message shows user's name

**Error Handling:**
- Invalid email: Inline error below field
- Code wrong: "Invalid code" error, field clears, retry allowed
- Expired code: Prompt to request new code
- Rate limit: "Too many attempts, try again in X minutes"

### 5.2 Team Creation Flow

**Step 1: Initiate**
1. User on Team Selection screen
2. Clicks "Create Team" button
3. Dialog opens with focus on name input

**Step 2: Configure**
4. User types team name (3-50 chars)
5. Clicks emoji picker, selects emoji
6. Clicks color picker, selects color
7. Preview updates in real-time
8. Clicks "Create Team"

**Step 3: Complete**
9. Dialog closes
10. Success toast: "Team created!"
11. Redirect to team dashboard
12. Invite code displayed (auto-copy option)
13. User is first member and admin

**Validation:**
- Name too short: "Must be at least 3 characters"
- Name too long: Character counter, block at 50
- Missing emoji: Default to 🍽️
- Missing color: Default to primary

### 5.3 Weekly Rotation Flow

**Scenario: Happy Path**

**Monday Morning:**
1. User opens app, sees Team Dashboard
2. Status bar shows "Week 12" and "Next: Alice"
3. Alice is highlighted with "Up Next" badge and accent ring
4. "Start This Week" button visible if no active voting

**Alice Proposes Venues:**
5. Alice clicks "Start This Week"
6. Dialog opens with venue entry form
7. Sees seasonal quest prompt: "Comfort food season"
8. Adds Venue 1: "Taco Palace" with description
9. Clicks "Add Another Venue"
10. Adds Venue 2: "Sushi Express"
11. Clicks "Start Voting"
12. Dialog closes, toast: "Voting has started! 🗳️"

**Team Votes:**
13. Vote tab now shows 2 venue cards
14. Each member sees "Vote" buttons
15. Bob clicks vote on "Taco Palace"
16. Button changes to "Voted", shows checkmark
17. Other cards gray out
18. Progress indicator: "1 of 5 votes cast"
19. Real-time updates as others vote

**Voting Completes:**
20. Last member votes
21. Progress: "5 of 5 votes cast - All votes in! ✨"
22. "Complete Voting" button appears
23. Admin (or auto-timer) clicks Complete
24. Winner determined (highest votes)
25. Confetti animation triggers 🎉
26. Toast: "🎉 Taco Palace won with 3 votes!"
27. Alice's points increment by 1
28. Next organizer recalculated (lowest points)
29. History entry created

**Next Week:**
30. System ready for new rotation
31. New "Up Next" member highlighted
32. Cycle repeats

**Edge Cases:**
- **Tie:** First-submitted venue wins, clear indicator
- **No votes:** First venue wins by default
- **Organizer doesn't propose:** Admin can force-start without venue
- **Member removed mid-vote:** Votes still counted
- **All members away:** "No active members" message

### 5.4 Badge Earning Flow (MVP+)

**Scenario: User earns first badge**

1. User completes trigger action (e.g., organizes first lunch)
2. System detects badge unlock
3. Toast notification appears: "🎉 Badge Earned: First Quest!"
4. Badge appears on member card (if in top 3)
5. Badge appears in profile badge grid
6. Team feed posts: "You earned First Quest!" (optional)

**User Views Badge Progress:**
7. User clicks member card to expand
8. Clicks name to open profile
9. Sees badge showcase grid
10. Earned badges: Full color, with description
11. Locked badges: Grayscale, with unlock criteria
12. Progress badges: "7/10 picks organized" progress bar

**Badge Showcase:**
- Badges sorted by rarity (legendary → common)
- Tooltip on hover shows full description
- Click badge for detailed view (optional)

---

## 6. Error & Empty States

### 6.1 Error States

**Network Error:**
- Toast: "Connection lost. Changes may not save."
- Retry button in toast
- Offline indicator in status bar
- Queue actions for retry when back online

**Authentication Error:**
- Invalid email: "Please enter a valid email address"
- Invalid code: "Invalid code. Please try again." + clear field
- Expired session: Redirect to login with message
- Rate limit: "Too many attempts. Try again in 5 minutes."

**Validation Errors:**
- Inline below field, red text
- Icon indicator (exclamation mark)
- Focus on first error field
- Clear on correction

**Permission Errors:**
- "You don't have permission for this action"
- Suggest contacting admin
- Hide restricted UI elements for non-admins

**Data Errors:**
- "Failed to save. Please try again."
- "Failed to load. Refresh to retry."
- Retry button inline
- Preserve user input on error

### 6.2 Empty States

**No Teams:**
- Large team icon (Users)
- Heading: "Welcome to LunchSaga!"
- Text: "Create your first team or join an existing one"
- Two prominent CTAs: "Create Team" and "Join Team"
- Example use cases listed

**No Members:**
- Large user icon
- Heading: "No team members yet"
- Text: "Add your teammates to start the fair rotation"
- "Add Member" CTA button
- Helpful tip: "Team rotations work best with 3-15 members"

**No Active Voting:**
- Calendar icon
- Heading varies by state:
  - Holiday mode: "Holiday mode is active"
  - No organizer: "Add team members to start"
  - Ready to start: "Ready to start this week"
- Context-specific CTA
- Next organizer displayed if available

**No History:**
- Clock icon
- Heading: "No history yet"
- Text: "Complete your first week to see past lunches here"
- Optional: Preview of what history looks like

**No Badges (MVP+):**
- Badge icon
- "No badges earned yet"
- List of available badges with unlock criteria
- Motivational text: "Complete actions to unlock achievements"

### 6.3 Loading States

**Page Load:**
- Skeleton screens for cards
- Pulsing placeholders
- Preserve layout (no content shift)

**Button Actions:**
- Spinner replaces button text
- Button disabled during action
- Success feedback after completion

**Infinite Scroll:**
- Spinner at bottom of list
- "Loading more..." text
- Smooth append of new items

**Optimistic UI:**
- Immediate visual feedback
- Revert if action fails
- Toast on failure with retry option

---

## 7. Gamification Display Rules (MVP+)

### 7.1 Badge Display Hierarchy

**Member Card (Collapsed):**
- Show top 3 most prestigious badges
- Priority: Legendary > Rare > Uncommon > Common
- If tied, show most recently earned
- Badges displayed as small icons next to name

**Member Card (Expanded):**
- Same top 3 badges
- "View All Badges" link to profile

**Member Profile:**
- Full badge grid (3-4 columns)
- Earned badges: Full color
- Locked badges: 30% opacity, silhouette
- Progress indicators below in-progress badges
- Tooltips on hover with full description

### 7.2 Achievement Title Display

**Display Location:**
- Below member name on card
- Smaller text, muted color
- Italicized or distinct font weight

**Priority System:**
1. Custom title (admin-assigned) - always shown if set
2. Weekly MVP (current week only)
3. Seasonal title (current season)
4. Permanent title (user-selected from earned)

**No Title State:**
- Empty space, no placeholder text
- Layout doesn't shift when title appears

### 7.3 Team Streak Display

**Status Bar:**
- 🔥 emoji + streak count: "�� 12 Week Streak"
- Changes to "🏖️ On Break" during holiday mode
- Pulsing animation on milestone (4, 10, 25, 52 weeks)

**Milestone Celebrations:**
- Confetti on 4, 10, 25 week milestones
- Fireworks on 52 weeks (annual)
- Toast notification
- Team feed announcement (optional)

**Streak Protection Indicator:**
- "Streak paused" during holiday mode
- Calendar icon with pause symbol
- Resume countdown visible

### 7.4 Leaderboard Display

**Layout:**
- Ordered list (1, 2, 3, ...)
- Top 3 have medal icons (��🥈🥉)
- Columns: Rank, Name, Picks, Wins, Reputation

**Sorting:**
- Default: By reputation score (MVP+) or total picks (MVP)
- Clickable column headers to re-sort
- Visual indicator of current sort

**User Highlighting:**
- Current user row has subtle background
- Scroll to user's position on load
- "You" indicator next to user's name

---

## 8. Profile Customization (MVP+)

### 8.1 Avatar System

**Upload Flow:**
1. Click avatar on profile or settings
2. File picker opens (JPG/PNG, max 2MB)
3. Image preview with crop tool
4. "Save Avatar" button
5. Upload to CDN
6. Thumbnail generated (48x48, 96x96, 192x192)
7. Avatar updates everywhere instantly

**Fallback:**
- Initials avatar (2 letters)
- Deterministic background color from name hash
- High contrast text

**Emoji/Icon Selector:**
- Alternative to image upload
- Grid of emojis/icons
- Search functionality
- Recent/favorites section

### 8.2 Custom Titles

**Admin Assignment:**
1. Admin clicks "Edit" on member card
2. "Custom Title" field appears (max 20 chars)
3. Live character counter
4. Profanity filter validation
5. "Save" applies immediately
6. Title appears below member name

**User Selection (Permanent Titles):**
1. User opens profile
2. "Achievements" section shows earned titles
3. Radio buttons to select active title
4. "Set as Active Title" button
5. Change applies immediately

### 8.3 Team Customization

**Banner Image:**
1. Admin opens team settings
2. "Team Banner" section
3. Upload image (max 5MB, 1200x300px recommended)
4. Preview with crop tool
5. "Save Banner" button
6. Banner appears at top of team dashboard
7. Responsive: Full width on desktop, cropped on mobile

**Team Colors:**
- Color picker with preset palette
- Custom hex input
- Live preview of team badge
- Applied to: Team cards, status bar, accents

**Custom Quest Prompts:**
1. Admin opens team settings
2. "Seasonal Prompts" section
3. Text inputs for each season (100 chars each)
4. "Use Default" checkbox to revert
5. Save applies to next venue proposal

---

## 9. Weekly Summary UX (MVP+)

### 9.1 Email Design

**Structure:**
- Header: Team emoji + name
- Hero: "Week {N} Summary"
- Sections:
  1. Last Week's Winner
  2. Weekly MVP (if applicable)
  3. Next Organizer
  4. Team Streak
  5. Recent Badges
  6. CTA: Vote on Current Pick (if active)
- Footer: Unsubscribe, settings link

**Visual Style:**
- Mobile-first responsive
- Inline CSS (email clients)
- High contrast, accessible
- Images optional (text fallback)

**Content Example:**
```
🍽️ Mobile Team - Week 12 Summary

Last Week's Winner
🏆 Taco Palace - organized by Alice
3 votes | Great choice! 

Weekly MVP
⭐ Alice - unanimous vote!

Up Next
Bob is organizing week 13

Team Streak
🔥 12 weeks strong!

Recent Achievements
• Alice earned "Perfect Pick"
• Bob earned "Devoted Voter"

[Vote on This Week's Pick →]

Unsubscribe | Settings
```

### 9.2 In-App Weekly Summary

**Location:** History tab or dedicated summary view  
**Layout:** Card or full-page  
**Components:**
- Week number and date range
- Winner with vote breakdown
- MVP callout
- Participation stats
- Trend indicators (up/down vs previous week)
- Share button (copy summary text)

---

## 10. Accessibility Guidelines

### 10.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: 4.5:1 minimum against background
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 against adjacent colors
- Focus indicators: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Visible focus indicators (2px outline)
- No keyboard traps
- Skip links to main content

**Screen Reader Support:**
- Semantic HTML (headings, lists, buttons)
- ARIA labels where needed
- Alt text for images
- Form labels properly associated
- Live regions for dynamic content (votes, toasts)

**Visual Indicators:**
- Don't rely on color alone
- Use icons + text for states
- Patterns for differentiation (not just color)

### 10.2 Responsive Behavior

**Breakpoints:**
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile Optimizations:**
- Single column layouts
- Touch targets: 44x44px minimum
- Larger text (bump up 1-2px)
- Simplified navigation (hamburger menu if needed)
- Bottom sheet dialogs instead of modals
- Swipe gestures for navigation

**Desktop Enhancements:**
- Multi-column layouts
- Hover states
- Tooltips on hover
- Keyboard shortcuts visible
- Wider spacing

### 10.3 Motion & Animation

**Respect Preferences:**
- Check `prefers-reduced-motion`
- Disable animations if set
- Provide instant transitions instead

**Animation Types:**
- Micro-interactions: 150-200ms
- Page transitions: 200-300ms
- Confetti/celebrations: 1-2s
- Loading spinners: Continuous

**Motion Principles:**
- Purposeful (not decoration)
- Smooth easing curves
- Maintain context (no jarring jumps)
- Cancelable (user can skip)

---

## 11. Microinteraction Patterns

### 11.1 Button Interactions

**Click Feedback:**
- Immediate scale down (95%) on press
- Return to normal on release
- Ripple effect from click point (optional)
- Color shift on hover

**Loading States:**
- Spinner replaces text
- Button disabled
- Maintain size (no layout shift)
- Success checkmark briefly before revert

### 11.2 Card Interactions

**Hover:**
- Subtle shadow increase
- Border color shift
- Slight scale up (102%)
- Cursor: pointer

**Expand/Collapse:**
- Smooth height transition (200ms)
- Icon rotation (chevron)
- Fade in content
- Scroll into view if needed

### 11.3 Form Interactions

**Input Focus:**
- Border color change
- 2px ring appears
- Placeholder fades out
- Label moves/shrinks (optional)

**Validation:**
- Inline on blur
- Live for some fields (e.g., character count)
- Success checkmark on valid
- Error icon + message on invalid

### 11.4 Toast Notifications

**Appearance:**
- Slide in from top or bottom
- Fade in (200ms)
- Auto-dismiss after 3-5 seconds
- Persistent on hover

**Types:**
- Success: Green with checkmark
- Error: Red with X
- Info: Blue with info icon
- Warning: Yellow with exclamation

**Interactions:**
- Click to dismiss
- Swipe to dismiss (mobile)
- Undo action (optional, for some toasts)

### 11.5 Vote Casting

**Sequence:**
1. User clicks "Vote" button
2. Button immediately shows checkmark (optimistic)
3. Other cards' buttons disable with opacity
4. Vote count increments with number flip animation
5. Progress bar fills smoothly
6. Toast: "Vote recorded! ✨"
7. Confetti if all votes are in

**Undo Vote (before close):**
1. User clicks voted card again
2. Confirmation: "Change vote?" dialog
3. On confirm: Vote moves, counts update, animation reverses

### 11.6 Badge Unlock

**Sequence:**
1. Trigger action completes
2. Brief delay (500ms)
3. Badge appears with scale-in animation
4. Glow/shine effect sweeps across
5. Toast: "🎉 Badge Earned: {Name}!"
6. Confetti burst
7. Badge settles on member card

**Shine Animation:**
- Diagonal gradient sweep (1s)
- Subtle scale pulse (1.05x)
- Rotate slightly (+2deg, -2deg)

---

## 12. Interaction States

### 12.1 Button States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Standard styling | Awaits interaction |
| Hover | Slight brightness increase, shadow | Cursor: pointer |
| Active | Scale down 95%, darker | Mouse down |
| Focus | 2px ring in primary color | Keyboard focused |
| Disabled | 50% opacity, no hover | Not clickable, cursor: not-allowed |
| Loading | Spinner, disabled | Action in progress |

### 12.2 Card States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Standard border and shadow | Awaits interaction |
| Hover | Shadow increase, slight scale | Cursor: pointer if clickable |
| Active/Selected | Accent border or ring | Indicates selection |
| Disabled/Away | Reduced opacity (60%) | Muted appearance |
| Highlighted | Accent ring, pulse animation | "Up Next" or featured |

### 12.3 Form Input States

| State | Visual | Behavior |
|-------|--------|----------|
| Default | Light border, placeholder | Awaits input |
| Focus | Accent border, 2px ring | Active typing |
| Filled | Border stays, placeholder gone | Contains value |
| Valid | Green checkmark icon | Validation passed |
| Invalid | Red border, error message | Validation failed |
| Disabled | Gray background, no cursor | Not editable |

---

## 13. Animation Specifications

### 13.1 Timing Functions

**Standard Easing:**
- Ease-out: Elements entering (200ms)
- Ease-in: Elements exiting (150ms)
- Ease-in-out: State changes (200ms)
- Spring: Playful interactions (custom bezier)

**Bezier Curves:**
- Ease-out: cubic-bezier(0, 0, 0.2, 1)
- Ease-in: cubic-bezier(0.4, 0, 1, 1)
- Spring: cubic-bezier(0.34, 1.56, 0.64, 1)

### 13.2 Animation Durations

| Element | Duration | Purpose |
|---------|----------|---------|
| Button click | 150ms | Immediate feedback |
| Card expand | 200ms | Content reveal |
| Page transition | 300ms | Screen change |
| Toast appear | 200ms | Notification |
| Confetti | 2000ms | Celebration |
| Badge unlock | 1000ms | Achievement reveal |
| Vote count | 300ms | Number change |
| Pulse (continuous) | 2000ms | Attention draw |

### 13.3 Confetti Specification

**Trigger Conditions:**
- Voting complete (winner decided)
- Badge unlock (first time)
- Milestone reached (4, 10, 25, 52 week streak)

**Parameters:**
- Duration: 2 seconds
- Particle count: 50-100
- Colors: Team color + complementary
- Gravity: Realistic fall
- Origin: Center top or button location
- Spread: 120 degree cone

**Accessibility:**
- Skipped if `prefers-reduced-motion`
- Non-blocking (doesn't prevent interactions)
- No sound (visual only)

---

## 14. Responsive Layout Patterns

### 14.1 Mobile (375px - 767px)

**Team Dashboard:**
- Single column layout
- Tabs: Full width buttons
- Member cards: Stack vertically
- Venue cards: Single column
- Status bar: Simplified, key info only
- Dialogs: Full-screen overlays

**Typography:**
- H1: 2rem (32px)
- H2: 1.5rem (24px)
- Body: 1rem (16px)
- Comfortable line height: 1.6

**Spacing:**
- Page margins: 1rem (16px)
- Card padding: 0.75rem (12px)
- Section gaps: 1rem (16px)

### 14.2 Tablet (768px - 1023px)

**Team Dashboard:**
- Optional sidebar for team switcher
- Tabs: Horizontal with icons
- Member cards: 2 columns possible
- Venue cards: 2 columns
- Status bar: More info visible
- Dialogs: Centered modals (max 600px width)

**Typography:**
- Standard sizes (as defined in design system)

**Spacing:**
- Page margins: 1.5rem (24px)
- Card padding: 1rem (16px)
- Section gaps: 1.5rem (24px)

### 14.3 Desktop (1024px+)

**Team Dashboard:**
- Sidebar for team switcher (if multiple teams)
- Max width container: 1200px, centered
- Member cards: 2-3 columns
- Venue cards: 2-3 columns
- Status bar: Full information
- Dialogs: Centered modals (max 600px)

**Typography:**
- Standard sizes

**Spacing:**
- Page margins: 2rem (32px)
- Card padding: 1.5rem (24px)
- Section gaps: 2rem (32px)

**Enhancements:**
- Hover states active
- Tooltips on hover
- Keyboard shortcuts
- Multi-column layouts

---

## 15. Implementation Notes

### 15.1 Performance Targets

**Metrics:**
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

**Optimization:**
- Lazy load images
- Code splitting by route
- Prefetch likely next screens
- Optimize images (WebP, responsive)
- Minimize JavaScript bundle

### 15.2 Browser Support

**Modern Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+

**Not Supported:**
- Internet Explorer (any version)
- Legacy mobile browsers

### 15.3 Testing Checklist

**Functional:**
- All user flows work end-to-end
- Form validation correct
- Error states display properly
- Empty states show correct content

**Visual:**
- All screens match designs
- Spacing consistent
- Typography correct
- Colors accessible

**Accessibility:**
- Keyboard navigation works
- Screen reader compatible
- Color contrast passes
- ARIA labels correct

**Responsive:**
- Mobile (375px) works
- Tablet layouts correct
- Desktop optimized
- No horizontal scroll

**Performance:**
- Lighthouse score >90
- No console errors
- Images optimized
- Animations smooth (60fps)

---

## 16. Design Tokens

### 16.1 Spacing Tokens

```
spacing-1: 0.25rem   (4px)
spacing-2: 0.5rem    (8px)
spacing-3: 0.75rem   (12px)
spacing-4: 1rem      (16px)
spacing-6: 1.5rem    (24px)
spacing-8: 2rem      (32px)
spacing-12: 3rem     (48px)
spacing-16: 4rem     (64px)
```

### 16.2 Color Tokens

```
primary: Team-specific or default
secondary: Muted variant
accent: Highlight color
destructive: Red (#DC2626)
success: Green (#10B981)
warning: Yellow (#F59E0B)
background: White / #0A0A0A (dark)
foreground: #0A0A0A / White (dark)
muted: #6B7280
border: #E5E7EB / #27272A (dark)
```

### 16.3 Typography Tokens

```
font-family-sans: system-ui, -apple-system, "Segoe UI", sans-serif
font-family-mono: "SF Mono", Monaco, "Cascadia Code", monospace

font-size-xs: 0.75rem    (12px)
font-size-sm: 0.875rem   (14px)
font-size-base: 1rem     (16px)
font-size-lg: 1.125rem   (18px)
font-size-xl: 1.25rem    (20px)
font-size-2xl: 1.5rem    (24px)
font-size-3xl: 2rem      (32px)
font-size-4xl: 2.5rem    (40px)

font-weight-normal: 400
font-weight-medium: 500
font-weight-semibold: 600
font-weight-bold: 700
```

### 16.4 Shadow Tokens

```
shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
shadow: 0 1px 3px rgba(0,0,0,0.1)
shadow-md: 0 4px 6px rgba(0,0,0,0.1)
shadow-lg: 0 10px 15px rgba(0,0,0,0.1)
shadow-xl: 0 20px 25px rgba(0,0,0,0.1)
```

### 16.5 Border Radius Tokens

```
radius-sm: 0.25rem   (4px)
radius: 0.5rem       (8px)
radius-md: 0.75rem   (12px)
radius-lg: 1rem      (16px)
radius-full: 9999px  (circle)
```

---

## 17. Conclusion

This UX Requirements Specification provides comprehensive guidance for implementing LunchSaga MVP+. It covers all screens, user flows, interaction patterns, and accessibility requirements needed to build a delightful, accessible, and performant application.

**Key Takeaways:**
- Mobile-first, responsive design
- WCAG 2.1 AA compliant
- Playful "saga" theming
- Zero-friction authentication
- Real-time, optimistic UI
- Comprehensive gamification (MVP+)
- Professional yet fun experience

**Next Steps:**
1. Review this spec with engineering team
2. Create high-fidelity mockups (optional)
3. Build component library
4. Implement screens iteratively
5. Test accessibility throughout
6. Gather user feedback early

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-21  
**Status:** Ready for Engineering Review
