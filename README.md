# 🍽️ Team Lunch - Tiny Rituals for Tiny Teams

A zero-admin webapp for managing weekly team lunch rotations with fair turn-taking, democratic venue voting, and playful recognition for great picks.

## What This Does

Every workplace has broken spreadsheets or Slack threads trying to manage lunch turns, coffee runs, or weekly picks. This app solves that with:

- **Magic-link login** - No passwords, just email → code → you're in
- **Multiple teams** - Mobile Team, Design Team, Friday Coffee Club—each with its own rotation
- **Fair rotation** - Points-based system ensures everyone gets an equal turn
- **Democratic voting** - Team votes on venue options each week
- **Fun achievements** - Recognition for consistently great picks (🏆 Legendary Curator, ⭐ Master Chef)
- **Holiday mode** - Pause rotation during breaks
- **Away mode** - Mark members as away without removing them

## Key Features

### Current Implementation
✅ Magic-link authentication  
✅ Multi-team support with team switcher  
✅ Expandable member cards with away/attendance toggles  
✅ Status bar showing current week and next picker  
✅ Points-based rotation with automatic fairness  
✅ Venue voting with live results  
✅ Achievement system and leaderboards  
✅ Holiday break mode  

### Future Enhancements
🔮 Slack/Teams integration for notifications  
🔮 AI-powered venue suggestions  
🔮 Post-lunch rating system (★ Great pick!)  
🔮 Extended ritual types (coffee runs, snack duty, etc.)  
🔮 Team streaks and seasonal stats  

## Product Category

**Micro Rituals for Micro Teams**

This isn't HR bloat. It's the tiny version nobody built properly—simple recurring rotation with picks, voting, and fun stats. Perfect for:
- Weekly lunch picks
- Coffee runs
- Friday picks
- Snack duty
- Weekly MVP
- Rotating chores

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Python Cloudflare Worker ([Kinglet](https://github.com/mitchins/Kinglet) framework)
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: Magic-link email + JWT

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup, commands, and architecture details.
