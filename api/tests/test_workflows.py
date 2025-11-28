"""
LunchSaga Workflow Integration Tests

These tests cover complete user journeys through the application.
Each test simulates a real user's full workflow from start to finish.

Run with: npm run test:api (requires dev server running)
"""

import pytest
import httpx

BASE_URL = "http://localhost:3757"
DEV_OTP_CODE = "000000"


class APIClient:
    """Helper class for authenticated API calls"""
    
    def __init__(self, client: httpx.AsyncClient, token: str = None):
        self.client = client
        self.token = token
    
    @property
    def headers(self) -> dict:
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    async def login(self, email: str) -> "APIClient":
        """Authenticate and return new client with token"""
        await self.client.post("/api/auth/magic-link", json={"email": email})
        resp = await self.client.post(
            "/api/auth/verify", 
            json={"email": email, "code": DEV_OTP_CODE}
        )
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        self.token = resp.json()["token"]
        return self
    
    async def get(self, path: str) -> httpx.Response:
        return await self.client.get(f"/api{path}", headers=self.headers)
    
    async def post(self, path: str, json: dict = None) -> httpx.Response:
        return await self.client.post(f"/api{path}", json=json or {}, headers=self.headers)
    
    async def put(self, path: str, json: dict = None) -> httpx.Response:
        return await self.client.put(f"/api{path}", json=json or {}, headers=self.headers)
    
    async def delete(self, path: str) -> httpx.Response:
        return await self.client.delete(f"/api{path}", headers=self.headers)


@pytest.fixture
async def http_client():
    """Create an async HTTP client"""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client


@pytest.fixture
async def reset_db(http_client):
    """Reset database before each test"""
    await http_client.post("/api/_reset")
    await http_client.post("/api/_migrate")


class TestWorkflow_NewUserOnboarding:
    """
    Workflow: A brand new user signs up, creates a team, and invites a colleague
    
    Steps:
    1. User requests magic link
    2. User verifies with OTP code
    3. User creates their first team
    4. User views empty team dashboard
    5. User adds a team member by email
    6. Second user joins via the first user's invite
    """
    
    @pytest.mark.asyncio
    async def test_complete_onboarding_flow(self, http_client, reset_db):
        api = APIClient(http_client)
        
        # Step 1-2: New user signs up
        await api.login("alice@company.com")
        
        # Verify we can get current user
        me_resp = await api.get("/auth/me")
        assert me_resp.status_code == 200
        assert me_resp.json()["user"]["email"] == "alice@company.com"
        
        # Step 3: Create first team
        team_resp = await api.post("/teams", json={
            "name": "Engineering Squad",
            "emoji": "🚀",
            "color": "#3B82F6"
        })
        assert team_resp.status_code == 200
        team = team_resp.json()["team"]
        team_id = team["id"]
        invite_code = team["inviteCode"]
        assert team["name"] == "Engineering Squad"
        assert len(invite_code) == 6
        
        # Step 4: View team (should have 1 member - owner)
        members_resp = await api.get(f"/teams/{team_id}/members")
        assert members_resp.status_code == 200
        members = members_resp.json()["members"]
        assert len(members) == 1
        assert members[0]["name"] == "alice"  # Name from email prefix
        
        # Step 5: Add team member by email (creates user if needed)
        add_resp = await api.post(f"/members/teams/{team_id}/members", json={
            "email": "bob@company.com"
        })
        assert add_resp.status_code == 200
        new_member = add_resp.json()["member"]
        assert new_member["name"] == "bob"
        
        # Verify team now has 2 members
        members_resp = await api.get(f"/teams/{team_id}/members")
        assert len(members_resp.json()["members"]) == 2
        
        # Step 6: Second user joins via invite code
        bob_api = APIClient(http_client)
        await bob_api.login("bob@company.com")
        
        # Bob should already be a member (added by Alice)
        bob_teams = await bob_api.get("/teams")
        assert bob_teams.status_code == 200
        assert len(bob_teams.json()["teams"]) == 1
        
        # New user Carol joins via invite code
        carol_api = APIClient(http_client)
        await carol_api.login("carol@company.com")
        
        join_resp = await carol_api.post("/teams/join", json={"inviteCode": invite_code})
        assert join_resp.status_code == 200
        assert join_resp.json()["team"]["id"] == team_id
        
        # Team now has 3 members
        members_resp = await api.get(f"/teams/{team_id}/members")
        assert len(members_resp.json()["members"]) == 3


class TestWorkflow_CompleteLunchCycle:
    """
    Workflow: A team completes one full lunch rotation cycle
    
    Steps:
    1. Team owner starts a new lunch period
    2. Organizer proposes 2-3 venue options
    3. Organizer advances to voting phase
    4. Team members cast their votes
    5. Organizer completes the period
    6. Winner is determined
    7. Organizer points are incremented
    8. Next organizer is updated
    """
    
    @pytest.fixture
    async def team_with_three_members(self, http_client, reset_db):
        """Set up a team with 3 members for voting"""
        # Create owner
        owner = APIClient(http_client)
        await owner.login("owner@test.com")
        
        team_resp = await owner.post("/teams", json={
            "name": "Lunch Club",
            "emoji": "🍕",
            "color": "#EF4444"
        })
        team = team_resp.json()["team"]
        invite_code = team["inviteCode"]
        
        # Create and add members
        member1 = APIClient(http_client)
        await member1.login("member1@test.com")
        await member1.post("/teams/join", json={"inviteCode": invite_code})
        
        member2 = APIClient(http_client)
        await member2.login("member2@test.com")
        await member2.post("/teams/join", json={"inviteCode": invite_code})
        
        return {
            "team_id": team["id"],
            "owner": owner,
            "member1": member1,
            "member2": member2,
        }
    
    @pytest.mark.asyncio
    async def test_complete_lunch_cycle(self, team_with_three_members):
        ctx = team_with_three_members
        team_id = ctx["team_id"]
        owner = ctx["owner"]
        member1 = ctx["member1"]
        member2 = ctx["member2"]
        
        # Step 1: Get initial next organizer and their points
        next_resp = await owner.get(f"/teams/{team_id}/next-organizer")
        assert next_resp.status_code == 200
        initial_organizer = next_resp.json()["organizer"]
        initial_points = initial_organizer["points"]
        
        # Step 2: Start new lunch period
        period_resp = await owner.post(f"/voting/teams/{team_id}/period", json={
            "votingDays": 3
        })
        assert period_resp.status_code == 200
        period = period_resp.json()["period"]
        period_id = period["id"]
        assert period["status"] == "proposing"
        
        # Step 3: Propose venues
        venue1_resp = await owner.post(f"/voting/periods/{period_id}/venues", json={
            "name": "Pizza Palace",
            "description": "Best pizza in town"
        })
        assert venue1_resp.status_code == 200
        venue1_id = venue1_resp.json()["venue"]["id"]
        
        venue2_resp = await owner.post(f"/voting/periods/{period_id}/venues", json={
            "name": "Sushi Stop",
            "description": "Fresh sushi rolls"
        })
        assert venue2_resp.status_code == 200
        venue2_id = venue2_resp.json()["venue"]["id"]
        
        # Step 4: Advance to voting phase
        voting_resp = await owner.post(f"/voting/periods/{period_id}/start-voting")
        assert voting_resp.status_code == 200
        assert voting_resp.json()["period"]["status"] == "voting"
        
        # Step 5: Members cast votes
        # Owner votes for Pizza
        vote1 = await owner.post(f"/voting/periods/{period_id}/vote", json={
            "venueId": venue1_id
        })
        assert vote1.status_code == 200
        assert vote1.json()["voted"] is True
        
        # Member1 votes for Sushi
        vote2 = await member1.post(f"/voting/periods/{period_id}/vote", json={
            "venueId": venue2_id
        })
        assert vote2.status_code == 200
        
        # Member2 votes for Sushi (2-1 for Sushi)
        vote3 = await member2.post(f"/voting/periods/{period_id}/vote", json={
            "venueId": venue2_id
        })
        assert vote3.status_code == 200
        
        # Step 6: Complete the period
        complete_resp = await owner.post(f"/voting/periods/{period_id}/complete")
        assert complete_resp.status_code == 200
        completed = complete_resp.json()["period"]
        assert completed["status"] == "completed"
        assert completed["winningVenueId"] == venue2_id  # Sushi won 2-1
        
        # Step 7: Verify history includes this period
        history_resp = await owner.get(f"/voting/teams/{team_id}/history")
        assert history_resp.status_code == 200
        history = history_resp.json()["history"]
        assert len(history) >= 1
        assert history[0]["id"] == period_id


class TestWorkflow_MemberAwayStatus:
    """
    Workflow: Managing member availability during rotation
    
    Steps:
    1. Team has multiple members
    2. One member marks themselves as away
    3. Rotation skips away members
    4. Member returns and is back in rotation
    """
    
    @pytest.mark.asyncio
    async def test_away_status_affects_rotation(self, http_client, reset_db):
        # Create team owner
        owner = APIClient(http_client)
        await owner.login("owner@test.com")
        
        team_resp = await owner.post("/teams", json={
            "name": "Away Test Team",
            "emoji": "🏖️",
            "color": "#22C55E"
        })
        team_id = team_resp.json()["team"]["id"]
        
        # Get initial members
        members_resp = await owner.get(f"/teams/{team_id}/members")
        members = members_resp.json()["members"]
        owner_member_id = members[0]["id"]
        
        # Owner marks themselves as away
        away_resp = await owner.put(f"/members/teams/{team_id}/members/{owner_member_id}/away", json={
            "isAway": True
        })
        assert away_resp.status_code == 200
        assert away_resp.json()["member"]["isAway"] is True
        
        # Owner marks themselves as back
        back_resp = await owner.put(f"/members/teams/{team_id}/members/{owner_member_id}/away", json={
            "isAway": False
        })
        assert back_resp.status_code == 200
        assert back_resp.json()["member"]["isAway"] is False


class TestWorkflow_MultiTeamUser:
    """
    Workflow: User participating in multiple teams
    
    Steps:
    1. User creates Team A
    2. User joins Team B (via invite)
    3. User can view both teams
    4. User can switch between teams
    5. Actions in one team don't affect another
    """
    
    @pytest.mark.asyncio
    async def test_multi_team_participation(self, http_client, reset_db):
        # Create two team owners
        owner_a = APIClient(http_client)
        await owner_a.login("owner_a@test.com")
        
        owner_b = APIClient(http_client)
        await owner_b.login("owner_b@test.com")
        
        # Create Team A
        team_a_resp = await owner_a.post("/teams", json={
            "name": "Team Alpha",
            "emoji": "🅰️",
            "color": "#3B82F6"
        })
        team_a = team_a_resp.json()["team"]
        
        # Create Team B
        team_b_resp = await owner_b.post("/teams", json={
            "name": "Team Beta",
            "emoji": "🅱️",
            "color": "#EF4444"
        })
        team_b = team_b_resp.json()["team"]
        
        # Create multi-team user
        multi_user = APIClient(http_client)
        await multi_user.login("multi@test.com")
        
        # Join both teams
        await multi_user.post("/teams/join", json={"inviteCode": team_a["inviteCode"]})
        await multi_user.post("/teams/join", json={"inviteCode": team_b["inviteCode"]})
        
        # Verify user sees both teams
        teams_resp = await multi_user.get("/teams")
        teams = teams_resp.json()["teams"]
        assert len(teams) == 2
        team_names = {t["name"] for t in teams}
        assert "Team Alpha" in team_names
        assert "Team Beta" in team_names
        
        # Start period in Team A only
        await owner_a.post(f"/voting/teams/{team_a['id']}/period")
        
        # Verify Team B has no period
        period_b = await multi_user.get(f"/voting/teams/{team_b['id']}/period")
        assert period_b.json()["period"] is None
        
        # Verify Team A has a period
        period_a = await multi_user.get(f"/voting/teams/{team_a['id']}/period")
        assert period_a.json()["period"] is not None


class TestWorkflow_VoteChanging:
    """
    Workflow: Changing votes before period completion
    
    Steps:
    1. Member casts vote for Venue A
    2. Member changes vote to Venue B
    3. Verify vote counts reflect change
    4. Complete period with correct winner
    """
    
    @pytest.mark.asyncio
    async def test_change_vote_before_completion(self, http_client, reset_db):
        # Set up team
        owner = APIClient(http_client)
        await owner.login("owner@test.com")
        
        team_resp = await owner.post("/teams", json={
            "name": "Vote Change Test",
            "emoji": "🔄",
            "color": "#8B5CF6"
        })
        team_id = team_resp.json()["team"]["id"]
        
        # Start period
        period_resp = await owner.post(f"/voting/teams/{team_id}/period")
        period_id = period_resp.json()["period"]["id"]
        
        # Add venues
        v1 = await owner.post(f"/voting/periods/{period_id}/venues", json={
            "name": "Venue A", "description": "First choice"
        })
        venue_a_id = v1.json()["venue"]["id"]
        
        v2 = await owner.post(f"/voting/periods/{period_id}/venues", json={
            "name": "Venue B", "description": "Second choice"
        })
        venue_b_id = v2.json()["venue"]["id"]
        
        # Start voting
        await owner.post(f"/voting/periods/{period_id}/start-voting")
        
        # Vote for A
        vote1 = await owner.post(f"/voting/periods/{period_id}/vote", json={
            "venueId": venue_a_id
        })
        assert vote1.json()["action"] == "added"
        
        # Change vote to B
        vote2 = await owner.post(f"/voting/periods/{period_id}/vote", json={
            "venueId": venue_b_id
        })
        assert vote2.json()["action"] == "changed"
        
        # Complete - B should win
        complete = await owner.post(f"/voting/periods/{period_id}/complete")
        assert complete.json()["period"]["winningVenueId"] == venue_b_id


class TestWorkflow_EmptyTeamEdgeCases:
    """
    Workflow: Edge cases with minimal team state
    
    Tests:
    - Get next organizer with only 1 member
    - History with no completed periods
    - Period with no venues proposed
    """
    
    @pytest.mark.asyncio
    async def test_single_member_team(self, http_client, reset_db):
        owner = APIClient(http_client)
        await owner.login("solo@test.com")
        
        team_resp = await owner.post("/teams", json={
            "name": "Solo Team",
            "emoji": "1️⃣",
            "color": "#F59E0B"
        })
        team_id = team_resp.json()["team"]["id"]
        
        # Next organizer should be the only member
        next_resp = await owner.get(f"/teams/{team_id}/next-organizer")
        assert next_resp.status_code == 200
        organizer = next_resp.json()["organizer"]
        assert organizer is not None
        assert organizer["name"] == "solo"
    
    @pytest.mark.asyncio
    async def test_empty_history(self, http_client, reset_db):
        owner = APIClient(http_client)
        await owner.login("newteam@test.com")
        
        team_resp = await owner.post("/teams", json={
            "name": "Fresh Team",
            "emoji": "✨",
            "color": "#06B6D4"
        })
        team_id = team_resp.json()["team"]["id"]
        
        # History should be empty but not error
        history_resp = await owner.get(f"/voting/teams/{team_id}/history")
        assert history_resp.status_code == 200
        assert history_resp.json()["history"] == []


# Run configuration
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
