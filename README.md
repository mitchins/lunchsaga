# LunchSaga

A small web app for managing weekly team lunch rotations. Someone nominates venues, the team votes, the winner is recorded, and the rotation advances fairly based on points. Auth is magic-link — no passwords.

Self-hostable on Cloudflare Workers + D1.

## Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Python Cloudflare Worker ([Kinglet](https://github.com/mitchins/Kinglet) framework)
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: Magic-link email + JWT

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup and commands.
