#!/usr/bin/env python
"""
LunchSaga Test Data Rebuild Script

Nukes all tables and recreates with clean schema + test data.
Exercises all production API surfaces to ensure complete coverage.

Usage:
    cd /Users/mitchellcurrie/Projects/lunchsaga
    uv run python api/scripts/rebuild_test_data.py

    # Or specify a different base URL:
    uv run python api/scripts/rebuild_test_data.py --base-url http://localhost:3757

Requirements:
    - pywrangler server running (default port 3757)
    - DEV_OTP_CODE set to "000000" in wrangler.toml
"""

import argparse
import asyncio
import sys
from dataclasses import dataclass

import httpx


@dataclass
class TestUser:
    """Test user data"""
    email: str
    name: str
    avatar: str = ""
    token: str = ""
    user_id: str = ""


@dataclass
class TestTeam:
    """Test team data"""
    name: str
    emoji: str
    color: str
    team_id: str = ""
    invite_code: str = ""


@dataclass
class TestVenue:
    """Test venue data"""
    name: str
    description: str
    venue_id: str = ""


# Test data definitions
TEST_USERS = [
    TestUser(
        email="alice@lunchsaga.test",
        name="Alice Anderson",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=alice"
    ),
    TestUser(
        email="bob@lunchsaga.test",
        name="Bob Builder",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=bob"
    ),
    TestUser(
        email="charlie@lunchsaga.test",
        name="Charlie Chen",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=charlie"
    ),
    TestUser(
        email="diana@lunchsaga.test",
        name="Diana Duke",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=diana"
    ),
    TestUser(
        email="eve@lunchsaga.test",
        name="Eve Edwards",
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=eve"
    ),
]

TEST_TEAMS = [
    TestTeam(name="The Lunch Bunch", emoji="🍕", color="#10b981"),
    TestTeam(name="Food Fighters", emoji="🌮", color="#f59e0b"),
]

TEST_VENUES = [
    TestVenue(name="Sushi Palace", description="Amazing all-you-can-eat sushi with fresh fish daily"),
    TestVenue(name="Burger Junction", description="Gourmet smash burgers with craft beer selection"),
    TestVenue(name="Taco Fiesta", description="Authentic Mexican street tacos and margaritas"),
    TestVenue(name="Pho Paradise", description="Vietnamese noodle soup heaven with fresh herbs"),
    TestVenue(name="Pizza Perfection", description="Wood-fired Neapolitan pizzas, San Marzano tomatoes"),
    TestVenue(name="Curry Corner", description="Indian curries, tikka masala, fresh naan bread"),
]

# Dev OTP code for bypassing email verification
DEV_OTP_CODE = "000000"


class TestDataBuilder:
    """Builds test data using API calls - exercises all production surfaces"""

    def __init__(self, base_url: str, otp_code: str = DEV_OTP_CODE):
        self.base_url = base_url.rstrip("/")
        self.otp_code = otp_code
        self.client = httpx.AsyncClient(timeout=30.0)
        self.period_ids: dict[str, str] = {}  # team_name -> period_id

    async def close(self):
        await self.client.aclose()

    async def check_health(self) -> bool:
        """Check if the API server is healthy"""
        print("🏥 Checking server health...")
        try:
            response = await self.client.get(f"{self.base_url}/api/health")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Server healthy: {data.get('service', 'unknown')} ({data.get('environment', 'unknown')})")
                return True
            else:
                print(f"   ❌ Health check failed: {response.status_code}")
                return False
        except httpx.ConnectError:
            print(f"   ❌ Cannot connect to {self.base_url}")
            print("   💡 Start the server with:")
            print("      cd /Users/mitchellcurrie/Projects/lunchsaga")
            print("      uv run pywrangler dev --port 3757 --local")
            return False
        except Exception as e:
            print(f"   ❌ Health check error: {e}")
            return False

    async def reset_database(self) -> bool:
        """Reset the database to clean state"""
        print("💥 Resetting database...")
        try:
            response = await self.client.post(f"{self.base_url}/api/_reset")
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                print(f"   ✅ Database reset complete ({len(models)} tables recreated)")
                return True
            else:
                print(f"   ❌ Reset failed: {response.text}")
                return False
        except Exception as e:
            print(f"   ❌ Reset error: {e}")
            return False

    async def migrate_database(self) -> bool:
        """Run database migrations"""
        print("📊 Running migrations...")
        try:
            response = await self.client.post(f"{self.base_url}/api/_migrate")
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                print(f"   ✅ Migrated {len(models)} models: {', '.join(models)}")
                return True
            else:
                print(f"   ❌ Migration failed: {response.text}")
                return False
        except Exception as e:
            print(f"   ❌ Migration error: {e}")
            return False

    async def register_user(self, user: TestUser) -> bool:
        """Register a user via magic link flow"""
        print(f"👤 Registering {user.email}...")

        try:
            # Step 1: Send magic link
            response = await self.client.post(
                f"{self.base_url}/api/auth/magic-link",
                json={"email": user.email},
            )
            if response.status_code != 200:
                print(f"   ❌ Magic link failed: {response.text}")
                return False
            print("   📧 Magic link sent")

            # Step 2: Verify with OTP code
            response = await self.client.post(
                f"{self.base_url}/api/auth/verify",
                json={"email": user.email, "code": self.otp_code},
            )
            if response.status_code != 200:
                print(f"   ❌ Verification failed: {response.text}")
                return False

            data = response.json()
            user.token = data.get("token", "")
            user.user_id = data.get("user", {}).get("id", "")
            
            if not user.token:
                print("   ❌ No token in response")
                return False

            # Step 3: Update profile with name and avatar
            response = await self.client.put(
                f"{self.base_url}/api/auth/me",
                json={"name": user.name, "avatar": user.avatar},
                headers={"Authorization": f"Bearer {user.token}"},
            )
            if response.status_code != 200:
                print(f"   ⚠️  Profile update failed (continuing): {response.text}")

            print(f"   ✅ Registered: {user.name} ({user.user_id[:8]}...)")
            return True

        except Exception as e:
            print(f"   ❌ Registration error: {e}")
            return False

    async def create_team(self, team: TestTeam, owner: TestUser) -> bool:
        """Create a team with an owner"""
        print(f"🏢 Creating team '{team.name}'...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/teams",
                json={"name": team.name, "emoji": team.emoji, "color": team.color},
                headers={"Authorization": f"Bearer {owner.token}"},
            )
            if response.status_code not in [200, 201]:
                print(f"   ❌ Team creation failed: {response.text}")
                return False

            data = response.json()
            team_data = data.get("team", data)
            team.team_id = team_data.get("id", "")
            team.invite_code = team_data.get("invite_code", team_data.get("inviteCode", ""))

            print(f"   ✅ Created: {team.name} (invite: {team.invite_code})")
            return True

        except Exception as e:
            print(f"   ❌ Team creation error: {e}")
            return False

    async def join_team(self, team: TestTeam, user: TestUser) -> bool:
        """Have a user join a team"""
        print(f"   ➕ {user.name} joining {team.name}...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/teams/join",
                json={"inviteCode": team.invite_code},
                headers={"Authorization": f"Bearer {user.token}"},
            )
            if response.status_code not in [200, 201]:
                # Check if already a member
                if "already" in response.text.lower():
                    print("      ⚠️  Already a member")
                    return True
                print(f"      ❌ Join failed: {response.text}")
                return False

            print("      ✅ Joined")
            return True

        except Exception as e:
            print(f"      ❌ Join error: {e}")
            return False

    async def start_period(self, team: TestTeam, organizer: TestUser, voting_days: int = 3) -> str | None:
        """Start a new lunch period"""
        print(f"📅 Starting lunch period for {team.name}...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/voting/teams/{team.team_id}/period",
                json={"votingDays": voting_days},
                headers={"Authorization": f"Bearer {organizer.token}"},
            )
            if response.status_code not in [200, 201]:
                print(f"   ❌ Start period failed: {response.text}")
                return None

            data = response.json()
            period_data = data.get("period", data)
            period_id = period_data.get("id", "")
            status = period_data.get("status", "unknown")
            print(f"   ✅ Period started: {period_id[:8]}... (status: {status})")
            self.period_ids[team.name] = period_id
            return period_id

        except Exception as e:
            print(f"   ❌ Start period error: {e}")
            return None

    async def propose_venue(
        self, period_id: str, venue: TestVenue, user: TestUser
    ) -> bool:
        """Propose a venue"""
        print(f"   🍽️  {user.name} proposing '{venue.name}'...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/voting/periods/{period_id}/venues",
                json={"name": venue.name, "description": venue.description},
                headers={"Authorization": f"Bearer {user.token}"},
            )
            if response.status_code not in [200, 201]:
                print(f"      ❌ Propose failed: {response.text}")
                return False

            data = response.json()
            venue_data = data.get("venue", data)
            venue.venue_id = venue_data.get("id", "")
            print(f"      ✅ Proposed: {venue.venue_id[:8]}...")
            return True

        except Exception as e:
            print(f"      ❌ Propose error: {e}")
            return False

    async def cast_vote(self, period_id: str, venue: TestVenue, user: TestUser) -> bool:
        """Cast a vote for a venue"""
        print(f"   🗳️  {user.name} voting for '{venue.name}'...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/voting/periods/{period_id}/vote",
                json={"venueId": venue.venue_id},
                headers={"Authorization": f"Bearer {user.token}"},
            )
            if response.status_code not in [200, 201]:
                # Check if already voted
                if "already" in response.text.lower():
                    print("      ⚠️  Already voted")
                    return True
                print(f"      ❌ Vote failed: {response.text}")
                return False

            print("      ✅ Vote cast")
            return True

        except Exception as e:
            print(f"      ❌ Vote error: {e}")
            return False

    async def start_voting(self, period_id: str, organizer: TestUser) -> bool:
        """Transition period from proposing to voting state"""
        print(f"   🗳️  Starting voting phase...")

        try:
            response = await self.client.post(
                f"{self.base_url}/api/voting/periods/{period_id}/start-voting",
                headers={"Authorization": f"Bearer {organizer.token}"},
            )
            if response.status_code not in [200, 201]:
                print(f"      ❌ Start voting failed: {response.text}")
                return False

            print("      ✅ Voting phase started")
            return True

        except Exception as e:
            print(f"      ❌ Start voting error: {e}")
            return False


async def rebuild_test_data(base_url: str, otp_code: str = DEV_OTP_CODE):
    """Main function to rebuild all test data"""
    print("\n🚀 LunchSaga Test Data Rebuild")
    print("=" * 60)
    print(f"Base URL: {base_url}")
    print(f"OTP Code: {otp_code}")
    print("=" * 60 + "\n")

    builder = TestDataBuilder(base_url, otp_code)

    try:
        # Step 0: Check server health
        if not await builder.check_health():
            return False
        print()

        # Step 1: Reset database (drops all tables and recreates)
        if not await builder.reset_database():
            return False
        print()

        # Step 2: Register all users
        print("=" * 40)
        print("PHASE 1: User Registration")
        print("=" * 40)
        for user in TEST_USERS:
            if not await builder.register_user(user):
                print("⚠️  Continuing despite user registration failure...")
        print()

        # Step 3: Create teams (first user is owner)
        print("=" * 40)
        print("PHASE 2: Team Creation")
        print("=" * 40)
        # Alice owns The Lunch Bunch, Bob owns Food Fighters
        if not await builder.create_team(TEST_TEAMS[0], TEST_USERS[0]):
            print("⚠️  Team 1 creation failed, continuing...")
        if not await builder.create_team(TEST_TEAMS[1], TEST_USERS[1]):
            print("⚠️  Team 2 creation failed, continuing...")
        print()

        # Step 4: Add members to teams
        print("=" * 40)
        print("PHASE 3: Team Membership")
        print("=" * 40)
        # The Lunch Bunch: Alice (owner), Bob, Charlie
        print(f"Team: {TEST_TEAMS[0].name}")
        for user in TEST_USERS[1:3]:  # Bob, Charlie
            await builder.join_team(TEST_TEAMS[0], user)

        # Food Fighters: Bob (owner), Diana, Eve
        print(f"Team: {TEST_TEAMS[1].name}")
        for user in TEST_USERS[3:5]:  # Diana, Eve
            await builder.join_team(TEST_TEAMS[1], user)
        print()

        # Step 5: Create lunch periods with venues
        print("=" * 40)
        print("PHASE 4: Lunch Periods & Venues")
        print("=" * 40)
        
        # Team 1 period with 3 venues
        if TEST_TEAMS[0].team_id:
            period1_id = await builder.start_period(TEST_TEAMS[0], TEST_USERS[0])
            if period1_id:
                print(f"Proposing venues for {TEST_TEAMS[0].name}:")
                await builder.propose_venue(period1_id, TEST_VENUES[0], TEST_USERS[0])  # Alice: Sushi
                await builder.propose_venue(period1_id, TEST_VENUES[1], TEST_USERS[1])  # Bob: Burger
                await builder.propose_venue(period1_id, TEST_VENUES[2], TEST_USERS[2])  # Charlie: Taco
        print()

        # Team 2 period with 3 venues
        if TEST_TEAMS[1].team_id:
            period2_id = await builder.start_period(TEST_TEAMS[1], TEST_USERS[1])
            if period2_id:
                print(f"Proposing venues for {TEST_TEAMS[1].name}:")
                await builder.propose_venue(period2_id, TEST_VENUES[3], TEST_USERS[1])  # Bob: Pho
                await builder.propose_venue(period2_id, TEST_VENUES[4], TEST_USERS[3])  # Diana: Pizza
                await builder.propose_venue(period2_id, TEST_VENUES[5], TEST_USERS[4])  # Eve: Curry
        print()

        # Step 6: Cast some votes
        print("=" * 40)
        print("PHASE 5: Voting")
        print("=" * 40)
        
        # Team 1 votes (Alice, Bob, Charlie vote for different venues)
        if TEST_TEAMS[0].team_id and builder.period_ids.get(TEST_TEAMS[0].name):
            period1_id = builder.period_ids[TEST_TEAMS[0].name]
            print(f"Voting in {TEST_TEAMS[0].name}:")
            # First, start the voting phase (organizer is Alice)
            if await builder.start_voting(period1_id, TEST_USERS[0]):
                # Each person votes for someone else's venue
                if TEST_VENUES[1].venue_id:  # Alice votes for Bob's Burger
                    await builder.cast_vote(period1_id, TEST_VENUES[1], TEST_USERS[0])
                if TEST_VENUES[2].venue_id:  # Bob votes for Charlie's Taco
                    await builder.cast_vote(period1_id, TEST_VENUES[2], TEST_USERS[1])
                if TEST_VENUES[0].venue_id:  # Charlie votes for Alice's Sushi
                    await builder.cast_vote(period1_id, TEST_VENUES[0], TEST_USERS[2])
        print()

        # Team 2 votes
        if TEST_TEAMS[1].team_id and builder.period_ids.get(TEST_TEAMS[1].name):
            period2_id = builder.period_ids[TEST_TEAMS[1].name]
            print(f"Voting in {TEST_TEAMS[1].name}:")
            # First, start the voting phase (organizer is Bob)
            if await builder.start_voting(period2_id, TEST_USERS[1]):
                if TEST_VENUES[4].venue_id:  # Bob votes for Diana's Pizza
                    await builder.cast_vote(period2_id, TEST_VENUES[4], TEST_USERS[1])
                if TEST_VENUES[5].venue_id:  # Diana votes for Eve's Curry
                    await builder.cast_vote(period2_id, TEST_VENUES[5], TEST_USERS[3])
                if TEST_VENUES[3].venue_id:  # Eve votes for Bob's Pho
                    await builder.cast_vote(period2_id, TEST_VENUES[3], TEST_USERS[4])
        print()

        # Print summary
        print("=" * 60)
        print("✅ TEST DATA REBUILD COMPLETE!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print(f"   Users: {len([u for u in TEST_USERS if u.user_id])}")
        print(f"   Teams: {len([t for t in TEST_TEAMS if t.team_id])}")
        print(f"   Periods: {len(builder.period_ids)}")
        print(f"   Venues: {len([v for v in TEST_VENUES if v.venue_id])}")
        print()
        print("🔑 Test Credentials (use OTP code: 000000):")
        for user in TEST_USERS:
            status = "✓" if user.user_id else "✗"
            print(f"   {status} {user.email} - {user.name}")
        print()
        print("🏢 Teams:")
        for team in TEST_TEAMS:
            if team.team_id:
                print(f"   • {team.emoji} {team.name} (invite: {team.invite_code})")
        print()

        return True

    finally:
        await builder.close()


def main():
    parser = argparse.ArgumentParser(
        description="Rebuild LunchSaga test data using API calls"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3757",
        help="Base URL of the API (default: http://localhost:3757)",
    )
    parser.add_argument(
        "--otp-code",
        default=DEV_OTP_CODE,
        help=f"OTP code for dev bypass (default: {DEV_OTP_CODE})",
    )
    args = parser.parse_args()

    success = asyncio.run(rebuild_test_data(args.base_url, args.otp_code))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
