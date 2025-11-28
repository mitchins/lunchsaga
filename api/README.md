# LunchSaga API

Python Workers backend for LunchSaga, using Kinglet ORM and Cloudflare D1.

## Architecture

- **Runtime**: Python Workers (Cloudflare Workers with Python)
- **Framework**: [Kinglet](https://github.com/mitchins/Kinglet) - Lightweight Python web framework for Workers
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Kinglet ORM with automatic migrations

## Project Structure

```
api/
├── pyproject.toml      # Python dependencies (for reference)
├── wrangler.toml       # Cloudflare Worker configuration (for reference)
├── src/
│   ├── entry.py        # Main application entry point
│   ├── models.py       # ORM model definitions
│   └── domains/
│       ├── auth/       # Authentication (magic link, JWT)
│       ├── teams/      # Team management
│       ├── voting/     # Lunch voting system
│       └── members/    # Member management
├── scripts/
│   ├── rebuild_test_data.py  # API-based test data seeding
│   └── setup_test_data.sh    # Convenience wrapper
└── tests/
    ├── conftest.py     # Shared test fixtures
    └── test_api.py     # API integration tests
```

**Note:** The main `pyproject.toml` and `wrangler.toml` are at the project root.
pywrangler is always run from the project root.

## Setup

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) - Python package manager

### Install Dependencies

From project root:

```bash
uv sync
```

### Run Development Server

From project root:

```bash
uv run pywrangler dev --port 3757
```

The API will be available at `http://localhost:3757`.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name (`development`, `staging`, `production`) | `development` |
| `JWT_SECRET` | Secret key for JWT signing | Auto-generated |
| `DEV_OTP_CODE` | Fixed OTP for dev/staging bypass | `000000` |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/magic-link` | Request magic link email |
| `POST` | `/api/auth/verify` | Verify OTP code |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/me` | Update current user |
| `POST` | `/api/auth/logout` | Logout |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | List user's teams |
| `POST` | `/api/teams` | Create a team |
| `GET` | `/api/teams/:id` | Get team details |
| `PUT` | `/api/teams/:id` | Update team |
| `DELETE` | `/api/teams/:id` | Delete team |
| `POST` | `/api/teams/join` | Join via invite code |
| `POST` | `/api/teams/:id/leave` | Leave team |
| `GET` | `/api/teams/:id/members` | List team members |
| `GET` | `/api/teams/:id/next-organizer` | Get next organizer |
| `POST` | `/api/teams/:id/regenerate-invite` | Generate new invite code |

### Voting

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/voting/teams/:id/period` | Start new period |
| `GET` | `/api/voting/periods/:id` | Get period details |
| `GET` | `/api/voting/periods/:id/venues` | List venues |
| `POST` | `/api/voting/periods/:id/venues` | Propose venue |
| `POST` | `/api/voting/periods/:id/start-voting` | Start voting phase |
| `POST` | `/api/voting/venues/:id/vote` | Cast vote |
| `POST` | `/api/voting/periods/:id/complete` | Complete period |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/teams/:id/members/me/away` | Set away status |
| `GET` | `/api/teams/:id/members/me/stats` | Get member stats |
| `PUT` | `/api/teams/:id/members/me/name` | Update display name |

### Admin (Dev/Staging Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/_migrate` | Run database migrations |
| `POST` | `/api/_reset` | Reset database |
| `GET` | `/api/health` | Health check |

## Testing

### Run API Tests

From project root, ensure the dev server is running, then:

```bash
uv run pytest api/tests/ -v
```

### Rebuild Test Data

To reset the database and populate with test data (from project root):

```bash
./api/scripts/setup_test_data.sh
```

Or manually:

```bash
uv run python api/scripts/rebuild_test_data.py --base-url http://localhost:3757
```

## Development

### Dev Authentication Bypass

In `development` and `staging` environments, you can use the fixed OTP code `000000` instead of receiving an actual magic link email.

### Database Migrations

Migrations are automatic. The `_migrate` endpoint creates tables for all registered models.

### Adding New Models

1. Define the model in `src/models.py`
2. Import it in `src/entry.py`
3. Call `POST /api/_migrate` to create the table

### CORS

When using the Vite dev server, requests to `/api/*` are proxied to `localhost:3757`, avoiding CORS issues entirely.

## Deployment

From project root:

```bash
uv run pywrangler deploy
```

This deploys to Cloudflare Workers with the D1 database binding.

## License

MIT - See LICENSE file in the project root.
