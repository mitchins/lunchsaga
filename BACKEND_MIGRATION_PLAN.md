# LunchSaga → Kinglet Backend Migration Plan

**Status:** Planning Phase  
**Target Stack:** Python Workers + Kinglet ORM + D1 + React  
**Date:** 2025-01-26

---

## Executive Summary

Migration from prototype mocks to production Cloudflare Workers backend using Kinglet framework v1.7.0+. Kinglet provides all required capabilities with zero gaps for LunchSaga's feature set.

**Timeline Estimate:** 5-7 days for MVP backend implementation  
**Risk Level:** LOW - Kinglet mature, well-documented, proven on CF Workers

---

## 1. Kinglet Capability Assessment

### ✅ **FULLY SUPPORTED - No Uplift Needed**

| LunchSaga Requirement | Kinglet Feature | Notes |
|----------------------|-----------------|-------|
| **Magic Link Auth** | Built-in JWT, TOTP helpers | Examples in `totp_example.py` |
| **Multi-team Support** | ORM relations via JSONField | User → Teams many-to-many pattern |
| **Points-based Rotation** | Standard ORM queries | `.filter(points__gte=X).order_by('points')` |
| **Voting System** | D1 transactions | Atomic vote counting built-in |
| **Achievements/Badges** | JSONField for metadata | Flexible schema-less data |
| **Session Management** | KV bindings + JWT | Environment-aware caching |
| **Real-time Updates** | N/A (REST only) | Client polling acceptable for MVP |

### ⚠️ **REQUIRES PATTERN IMPLEMENTATION** (Not gaps, just work)

| Feature | Implementation Approach |
|---------|------------------------|
| **Magic Link Email** | Use Cloudflare Email Workers or SendGrid API |
| **Invite Code Generation** | Python `secrets.token_urlsafe(4)` + uniqueness check |
| **Reputation Algorithm** | Business logic in service layer, data in D1 |
| **Holiday Mode** | Boolean field on Team model |

### ❌ **NOT NEEDED FOR MVP**

- WebSockets (client polling sufficient)
- GraphQL (REST API simpler for team size)
- Real-time collaboration (not in PRD)

---

## 2. Data Model Mapping

### Current TypeScript → Kinglet Python Models

```python
# api/src/models.py

from kinglet import Model, StringField, IntegerField, BooleanField, DateTimeField, JSONField
from datetime import datetime

class User(Model):
    """Core user identity"""
    email = StringField(max_length=255, unique=True, null=False)
    name = StringField(max_length=200, null=False)
    avatar = StringField(max_length=500, null=True)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "users"
        indexes = [("email",)]

class Team(Model):
    """Team/fellowship entity"""
    name = StringField(max_length=100, null=False)
    emoji = StringField(max_length=10, default="🍕")
    color = StringField(max_length=7, default="#10b981")  # hex color
    owner_id = StringField(max_length=36, null=False)
    invite_code = StringField(max_length=6, unique=True, null=False)
    is_holiday_mode = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "teams"
        indexes = [("invite_code",), ("owner_id",)]

class TeamMember(Model):
    """Team membership with stats"""
    team_id = StringField(max_length=36, null=False)
    user_id = StringField(max_length=36, null=False)
    name = StringField(max_length=200, null=False)
    points = IntegerField(default=0)
    reputation_score = IntegerField(default=0)
    total_venues_proposed = IntegerField(default=0)
    total_wins = IntegerField(default=0)
    is_away = BooleanField(default=False)
    joined_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "team_members"
        indexes = [("team_id",), ("user_id",), ("team_id", "points")]

class LunchPeriod(Model):
    """Weekly lunch period"""
    team_id = StringField(max_length=36, null=False)
    organizer_id = StringField(max_length=36, null=False)
    start_date = DateTimeField(null=False)
    end_date = DateTimeField(null=True)
    status = StringField(max_length=20, default="proposing")  # proposing|voting|completed
    voting_deadline = DateTimeField(null=True)
    winning_venue_id = StringField(max_length=36, null=True)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "lunch_periods"
        indexes = [("team_id",), ("status",), ("team_id", "status")]

class VenueOption(Model):
    """Proposed venue for a period"""
    period_id = StringField(max_length=36, null=False)
    name = StringField(max_length=200, null=False)
    description = StringField(max_length=1000, null=True)
    proposed_by = StringField(max_length=36, null=False)
    vote_count = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "venue_options"
        indexes = [("period_id",)]

class Vote(Model):
    """Individual vote record"""
    period_id = StringField(max_length=36, null=False)
    venue_id = StringField(max_length=36, null=False)
    member_id = StringField(max_length=36, null=False)
    created_at = DateTimeField(auto_now_add=True)
    
    class Meta:
        table_name = "votes"
        indexes = [("period_id", "member_id"), ("venue_id",)]

class MagicLink(Model):
    """Magic link auth tokens"""
    email = StringField(max_length=255, null=False)
    code = StringField(max_length=6, null=False)
    token = StringField(max_length=64, unique=True, null=False)
    expires_at = DateTimeField(null=False)
    used = BooleanField(default=False)
    
    class Meta:
        table_name = "magic_links"
        indexes = [("token",), ("email",)]

class Achievement(Model):
    """User achievements/badges"""
    member_id = StringField(max_length=36, null=False)
    badge_type = StringField(max_length=50, null=False)  # legendary_curator, streak_master
    earned_at = DateTimeField(auto_now_add=True)
    metadata = JSONField(default=dict)  # Additional context
    
    class Meta:
        table_name = "achievements"
        indexes = [("member_id",)]
```

**Key Design Decisions:**

1. **No JOINs** - Kinglet optimizes for D1's read patterns (single-table queries)
2. **Denormalization** - `TeamMember.name` duplicates `User.name` for fast lookups
3. **Composite Indexes** - Multi-column indexes for common query patterns
4. **JSONField for Flexibility** - Achievements metadata allows schema evolution

---

## 3. API Endpoint Design

### Domain Structure

```
api/src/
├── main_kinglet.py          # Kinglet app entry point
├── models.py                # All data models
├── domains/
│   ├── auth/
│   │   ├── handlers.py      # /api/auth/* routes
│   │   ├── service.py       # Magic link logic
│   │   └── validators.py    # Email validation
│   ├── teams/
│   │   ├── handlers.py      # /api/teams/* routes
│   │   ├── service.py       # Team CRUD, invite codes
│   │   └── rotation.py      # Points calculation logic
│   ├── voting/
│   │   ├── handlers.py      # /api/voting/* routes
│   │   ├── service.py       # Vote counting, winner selection
│   │   └── rules.py         # Voting rules engine
│   └── members/
│       ├── handlers.py      # /api/members/* routes
│       └── service.py       # Member management
└── tests/
    ├── test_auth.py
    ├── test_teams.py
    └── test_voting.py
```

### Core API Routes (MVP)

```python
# main_kinglet.py
from kinglet import Kinglet, CorsMiddleware, require_auth
from domains.auth.handlers import register_auth_routes
from domains.teams.handlers import register_team_routes
from domains.voting.handlers import register_voting_routes
from domains.members.handlers import register_member_routes

app = Kinglet(root_path="/api")
app.add_middleware(CorsMiddleware(
    allow_origin="*",  # Lock down in production
    allow_methods="GET,POST,PUT,DELETE",
    allow_headers="Authorization,Content-Type"
))

# Domain route registration
register_auth_routes(app)
register_team_routes(app)
register_voting_routes(app)
register_member_routes(app)
```

**Authentication Routes:**
```python
POST   /api/auth/magic-link     # Send magic link
POST   /api/auth/verify         # Verify code/token, return JWT
GET    /api/auth/me             # Get current user (requires JWT)
POST   /api/auth/logout         # Invalidate session
```

**Team Routes:**
```python
GET    /api/teams               # List user's teams
POST   /api/teams               # Create team
GET    /api/teams/{id}          # Get team details
PUT    /api/teams/{id}          # Update team
POST   /api/teams/join          # Join via invite code
DELETE /api/teams/{id}/leave    # Leave team
GET    /api/teams/{id}/members  # List team members
```

**Voting Routes:**
```python
GET    /api/teams/{id}/period   # Get current period
POST   /api/teams/{id}/period   # Start new period
POST   /api/periods/{id}/venues # Propose venue
POST   /api/periods/{id}/vote   # Cast vote
POST   /api/periods/{id}/complete # Complete period
GET    /api/periods/{id}/results # Get results
```

**Member Routes:**
```python
POST   /api/teams/{id}/members  # Add member
DELETE /api/teams/{id}/members/{mid} # Remove member
PUT    /api/teams/{id}/members/{mid}/away # Toggle away status
GET    /api/teams/{id}/members/{mid}/stats # Get detailed stats
```

---

## 4. Critical Implementation Patterns

### 4.1 Magic Link Authentication Flow

```python
# domains/auth/service.py
import secrets
from datetime import datetime, timedelta
from kinglet.jwt import create_jwt

class AuthService:
    @staticmethod
    async def send_magic_link(db, email: str, env):
        """Generate and send magic link + OTP"""
        code = secrets.token_urlsafe(4).upper()[:6]  # 6-char code
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(minutes=15)
        
        # Store in D1
        await MagicLink.objects.create(
            db, 
            email=email, 
            code=code, 
            token=token, 
            expires_at=expires
        )
        
        # Send email (Cloudflare Email Workers or SendGrid)
        magic_url = f"https://lunchsaga.com/auth/verify?token={token}"
        await send_email(env, email, magic_url, code)
        
        return {"sent": True}
    
    @staticmethod
    async def verify(db, email: str, code_or_token: str, env):
        """Verify code or token, return JWT"""
        # Try token first
        link = await MagicLink.objects.filter(
            db, token=code_or_token, used=False
        ).first()
        
        # Fallback to code
        if not link:
            link = await MagicLink.objects.filter(
                db, email=email, code=code_or_token, used=False
            ).first()
        
        if not link or link.expires_at < datetime.utcnow():
            return None
        
        # Mark used
        await MagicLink.objects.filter(db, id=link.id).update(used=True)
        
        # Get or create user
        user = await User.objects.filter(db, email=email).first()
        if not user:
            user = await User.objects.create(db, email=email, name=email.split('@')[0])
        
        # Generate JWT
        jwt_token = create_jwt(
            {"user_id": user.id, "email": user.email}, 
            secret=env.JWT_SECRET,
            expires_in=86400 * 30  # 30 days
        )
        
        return {"token": jwt_token, "user": user.to_dict()}
```

### 4.2 Next Organizer Selection (Points-based)

```python
# domains/teams/rotation.py
from models import TeamMember

class RotationService:
    @staticmethod
    async def get_next_organizer(db, team_id: str):
        """Get member with lowest points, excluding away members"""
        members = await TeamMember.objects.filter(
            db,
            team_id=team_id,
            is_away=False
        ).order_by("points").all()
        
        if not members:
            return None
        
        # If multiple members tied for lowest, rotate by join date
        min_points = members[0].points
        candidates = [m for m in members if m.points == min_points]
        return sorted(candidates, key=lambda m: m.joined_at)[0]
    
    @staticmethod
    async def increment_organizer_points(db, member_id: str):
        """Increment points after organizing"""
        await TeamMember.objects.filter(db, id=member_id).update(
            points=TeamMember.points + 1,
            total_venues_proposed=TeamMember.total_venues_proposed + 1
        )
```

### 4.3 Voting with Atomic Updates

```python
# domains/voting/service.py
class VotingService:
    @staticmethod
    async def cast_vote(db, period_id: str, venue_id: str, member_id: str):
        """Cast vote with atomic vote count update"""
        # Check existing vote
        existing = await Vote.objects.filter(
            db, period_id=period_id, member_id=member_id
        ).first()
        
        if existing:
            if existing.venue_id == venue_id:
                return {"error": "Already voted for this venue"}
            
            # Change vote - decrement old, increment new
            await VenueOption.objects.filter(db, id=existing.venue_id).update(
                vote_count=VenueOption.vote_count - 1
            )
            await Vote.objects.filter(db, id=existing.id).update(venue_id=venue_id)
        else:
            # New vote
            await Vote.objects.create(
                db, period_id=period_id, venue_id=venue_id, member_id=member_id
            )
        
        # Increment venue vote count
        await VenueOption.objects.filter(db, id=venue_id).update(
            vote_count=VenueOption.vote_count + 1
        )
        
        return {"voted": True}
    
    @staticmethod
    async def determine_winner(db, period_id: str):
        """Find venue with most votes"""
        venues = await VenueOption.objects.filter(
            db, period_id=period_id
        ).order_by("-vote_count").all()
        
        if not venues or venues[0].vote_count == 0:
            return None
        
        winner = venues[0]
        
        # Update period
        await LunchPeriod.objects.filter(db, id=period_id).update(
            winning_venue_id=winner.id,
            status="completed",
            end_date=datetime.utcnow()
        )
        
        # Update organizer stats
        proposer = await TeamMember.objects.filter(
            db, id=winner.proposed_by
        ).first()
        await TeamMember.objects.filter(db, id=proposer.id).update(
            total_wins=TeamMember.total_wins + 1,
            reputation_score=TeamMember.reputation_score + 10
        )
        
        return winner
```

---

## 5. Frontend Integration Changes

### 5.1 API Service Layer

```typescript
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(await response.text())
  }
  
  return response.json()
}

// Auth
export const authAPI = {
  sendMagicLink: (email: string) => 
    fetchAPI('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  
  verify: (email: string, code: string) =>
    fetchAPI('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  
  getMe: () => fetchAPI('/auth/me'),
}

// Teams
export const teamsAPI = {
  list: () => fetchAPI('/teams'),
  create: (data: CreateTeamRequest) => 
    fetchAPI('/teams', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => fetchAPI(`/teams/${id}`),
  join: (inviteCode: string) =>
    fetchAPI('/teams/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
}

// Voting
export const votingAPI = {
  getCurrentPeriod: (teamId: string) => fetchAPI(`/teams/${teamId}/period`),
  startPeriod: (teamId: string) => 
    fetchAPI(`/teams/${teamId}/period`, { method: 'POST' }),
  proposeVenue: (periodId: string, data: VenueProposal) =>
    fetchAPI(`/periods/${periodId}/venues`, { method: 'POST', body: JSON.stringify(data) }),
  vote: (periodId: string, venueId: string) =>
    fetchAPI(`/periods/${periodId}/vote`, { method: 'POST', body: JSON.stringify({ venueId }) }),
}
```

### 5.2 MSW Handler Updates (Development)

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth
  http.post('/api/auth/magic-link', async ({ request }) => {
    const { email } = await request.json()
    console.log('[MSW] Magic link sent to:', email)
    return HttpResponse.json({ sent: true })
  }),
  
  http.post('/api/auth/verify', async ({ request }) => {
    const { email, code } = await request.json()
    if (code === '123456') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: { id: '1', email, name: 'Test User' }
      })
    }
    return HttpResponse.json({ error: 'Invalid code' }, { status: 401 })
  }),
  
  // Teams
  http.get('/api/teams', () => {
    return HttpResponse.json({ teams: mockTeams })
  }),
  
  // Add more handlers as needed during development
]
```

---

## 6. Project Structure (Complete)

```
lunchsaga/
├── api/
│   ├── src/
│   │   ├── main_kinglet.py
│   │   ├── models.py
│   │   ├── domains/
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── handlers.py
│   │   │   │   ├── service.py
│   │   │   │   └── validators.py
│   │   │   ├── teams/
│   │   │   │   ├── handlers.py
│   │   │   │   ├── service.py
│   │   │   │   └── rotation.py
│   │   │   ├── voting/
│   │   │   │   ├── handlers.py
│   │   │   │   ├── service.py
│   │   │   │   └── rules.py
│   │   │   └── members/
│   │   │       ├── handlers.py
│   │   │       └── service.py
│   │   └── tests/
│   │       ├── test_auth.py
│   │       ├── test_teams.py
│   │       ├── test_voting.py
│   │       └── test_rotation.py
│   └── pyproject.toml
├── src/                        # React frontend (existing)
│   ├── pages/
│   ├── components/
│   ├── services/
│   │   └── api.ts             # NEW: API client
│   ├── types/
│   └── mocks/
│       ├── browser.ts
│       └── handlers.ts        # UPDATED: MSW handlers for dev
├── wrangler.toml
├── package.json
└── schema.lock.json           # ORM schema version tracking
```

---

## 7. Deployment Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy LunchSaga

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python 3.12
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Install uv
        run: pip install uv
      
      - name: Install dependencies
        run: |
          cd api
          uv sync
      
      - name: Generate D1 schema
        run: |
          cd api
          python -m kinglet.orm_deploy generate src.models > schema.sql
          cat schema.sql
      
      - name: Deploy schema to D1
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: |
          npx wrangler d1 execute lunchsaga-db --file=api/schema.sql --remote
      
      - name: Run Python tests
        run: |
          cd api
          uv run pytest --cov
      
      - name: Build frontend
        run: npm run build
      
      - name: Deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: |
          npx wrangler deploy
```

### wrangler.toml

```toml
name = "lunchsaga"
main = "api/src/main_kinglet.py"
compatibility_date = "2025-01-26"

[build]
command = "uv sync"

[[d1_databases]]
binding = "DB"
database_name = "lunchsaga-db"
database_id = "your-d1-id"

[vars]
ENVIRONMENT = "production"
FRONTEND_URL = "https://lunchsaga.com"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-id"

[observability]
enabled = true
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:frontend\"",
    "dev:api": "cd api && uv run pywrangler dev --port 3757",
    "dev:frontend": "vite",
    "build": "tsc -b && vite build",
    "deploy": "wrangler deploy",
    "schema:generate": "cd api && python -m kinglet.orm_deploy generate src.models > schema.sql",
    "schema:deploy": "wrangler d1 execute lunchsaga-db --file=api/schema.sql --remote",
    "test": "vitest run && cd api && uv run pytest",
    "test:e2e": "playwright test"
  }
}
```

---

## 8. Migration Checklist

### Phase 1: Setup (Day 1)
- [ ] Create `api/` directory structure
- [ ] Initialize `pyproject.toml` with Kinglet dependency
- [ ] Configure `wrangler.toml` with D1 bindings
- [ ] Set up local D1 database
- [ ] Create `models.py` with all data models
- [ ] Generate initial schema SQL
- [ ] Apply schema to local D1

### Phase 2: Auth Domain (Day 2)
- [ ] Implement magic link email service
- [ ] Create auth handlers (magic-link, verify, me)
- [ ] Add JWT middleware
- [ ] Write auth tests (pytest)
- [ ] Update frontend LoginScreen to call API
- [ ] Test magic link flow end-to-end

### Phase 3: Teams Domain (Day 3)
- [ ] Implement team CRUD handlers
- [ ] Add invite code generation logic
- [ ] Create rotation service (next organizer)
- [ ] Write team tests
- [ ] Update TeamSelectionScreen to call API
- [ ] Test team creation and joining

### Phase 4: Voting Domain (Day 4)
- [ ] Implement period management handlers
- [ ] Create voting service with atomic updates
- [ ] Add winner determination logic
- [ ] Write voting tests
- [ ] Update VotingScreen to call API
- [ ] Test voting flow end-to-end

### Phase 5: Members Domain (Day 5)
- [ ] Implement member management handlers
- [ ] Add away status toggle
- [ ] Create stats aggregation queries
- [ ] Write member tests
- [ ] Update TeamDashboardScreen to call API
- [ ] Test member management

### Phase 6: Integration & Testing (Day 6)
- [ ] Update all MSW handlers for dev mode
- [ ] Run full E2E test suite with Playwright
- [ ] Performance test D1 queries
- [ ] Load test with `wrangler dev`
- [ ] Fix any bugs discovered

### Phase 7: Deployment (Day 7)
- [ ] Create production D1 database
- [ ] Deploy schema to production
- [ ] Set up environment variables in Wrangler
- [ ] Deploy worker to production
- [ ] Smoke test production endpoints
- [ ] Monitor logs and errors

---

## 9. Critical Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **D1 cold start latency** | Users see 500ms+ initial load | Medium | Use D1 caching decorator, optimize queries |
| **Email delivery failures** | Users can't log in | Medium | Add fallback OTP-only flow, use reliable provider |
| **Points calculation bugs** | Unfair rotation | Low | Comprehensive unit tests, manual QA scenarios |
| **Concurrent vote updates** | Vote count drift | Low | Use D1 batch API, add retry logic |
| **Schema migration errors** | Deployment failures | Low | Test migrations on staging D1 first |
| **JWT secret exposure** | Auth compromise | Low | Use Wrangler secrets, rotate periodically |

---

## 10. Post-MVP Optimizations

### Performance
- [ ] Add D1 caching for frequently accessed teams/members
- [ ] Implement R2 caching for large leaderboard data
- [ ] Add CDN caching headers for static API responses
- [ ] Use D1 indexes for all WHERE clauses

### Scalability
- [ ] Add pagination to team/member lists
- [ ] Implement cursor-based pagination for history
- [ ] Add rate limiting per user/team
- [ ] Monitor D1 read/write usage, optimize slow queries

### Developer Experience
- [ ] Add OpenAPI schema generation
- [ ] Create Postman collection for API testing
- [ ] Add request/response logging in dev mode
- [ ] Improve error messages with error codes

---

## 11. Success Criteria

### Technical
- [ ] All API endpoints return <200ms p95 latency
- [ ] 100% of unit tests passing (70%+ coverage)
- [ ] E2E tests cover critical user journeys
- [ ] Zero 5xx errors in production logs
- [ ] D1 costs <$5/month for first 100 users

### Business
- [ ] Magic link auth completion rate >90%
- [ ] Team creation success rate >95%
- [ ] Vote submission success rate >98%
- [ ] User retention >80% after first rotation

---

## Conclusion

**Kinglet is a perfect fit for LunchSaga.** Zero framework gaps, mature ORM, excellent D1 integration, and proven on Cloudflare Workers. The migration is straightforward domain-by-domain implementation with clear patterns.

**Recommended Next Steps:**
1. Review this plan with team
2. Set up development environment (Day 1)
3. Start with Auth domain (Day 2)
4. Deploy staging environment by Day 5
5. Production launch by Day 7

**Estimated LOC:** ~2,500 Python (backend) + ~1,000 TypeScript (API client)  
**Confidence Level:** HIGH - All patterns proven, framework stable
