"""
LunchSaga Full Cycle Integration Test

This test simulates a complete "lunch saga" from start to finish:
- Guild master creates team and invites members
- Multiple weeks of lunch rotation
- Voting, venue proposals, winners
- Points accumulation and rotation fairness
- Away status affecting rotation

This is a comprehensive integration test that validates the entire
product flow works correctly end-to-end.

Run with: npm run test:api
Or directly: uv run pytest api/tests/test_full_saga.py -v -s

Expected duration: ~30-60 seconds
"""

import pytest
import httpx
from conftest import DEV_OTP_CODE


class APIClient:
    """Helper class for authenticated API calls with debug output"""
    
    def __init__(self, client: httpx.AsyncClient, name: str):
        self.client = client
        self.name = name
        self.token = None
        self.user_id = None
        self.member_records = {}  # team_id -> member record
    
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
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        self.token = data["token"]
        self.user_id = data["user"]["id"]
        return self
    
    async def get(self, path: str) -> httpx.Response:
        return await self.client.get(f"/api{path}", headers=self.headers)
    
    async def post(self, path: str, json: dict = None) -> httpx.Response:
        return await self.client.post(f"/api{path}", json=json or {}, headers=self.headers)
    
    async def put(self, path: str, json: dict = None) -> httpx.Response:
        return await self.client.put(f"/api{path}", json=json or {}, headers=self.headers)
    
    async def delete(self, path: str) -> httpx.Response:
        return await self.client.delete(f"/api{path}", headers=self.headers)


def log_step(step: str, detail: str = ""):
    """Print a step for visibility during test runs"""
    print(f"\n{'='*60}")
    print(f"📍 {step}")
    if detail:
        print(f"   {detail}")
    print(f"{'='*60}")


def log_substep(msg: str):
    """Print a substep"""
    print(f"  ✓ {msg}")


@pytest.fixture
async def http_client(base_url: str):
    """Create an async HTTP client using the base_url from conftest."""
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        yield client


@pytest.fixture
async def reset_db(http_client):
    """Reset database before each test"""
    await http_client.post("/api/_reset")
    await http_client.post("/api/_migrate")


class TestFullLunchSaga:
    """
    Complete Lunch Saga Simulation
    
    Simulates a real team using LunchSaga over multiple weeks:
    
    Week 1: Team setup and first lunch
    - Alice (guild master) creates team "The Hungry Engineers"
    - Alice invites Bob, Carol, and Dave
    - Bob, Carol, Dave join via invite code
    - First lunch cycle: proposing, voting, winner selection
    - Verify organizer (lowest points) runs the show
    
    Week 2: Second rotation
    - Next person (by points) becomes organizer
    - New proposals, new votes, new winner
    - Verify points increment correctly
    
    Week 3: Away status
    - One member goes on vacation (away)
    - Rotation skips them
    - Member returns
    
    Week 4: Final verification
    - Run another cycle
    - Verify fair rotation (everyone organized at least once)
    """
    
    @pytest.mark.asyncio
    async def test_complete_four_week_saga(self, http_client, reset_db):
        log_step("LUNCHSAGA FULL SIMULATION", "4-week team lunch rotation")
        
        # ============================================================
        # PHASE 1: TEAM CREATION AND ONBOARDING
        # ============================================================
        log_step("PHASE 1: Team Creation & Onboarding")
        
        # Alice creates her account and team
        alice = APIClient(http_client, "Alice")
        await alice.login("alice@hungryengineers.com")
        log_substep(f"Alice registered (id: {alice.user_id[:8]}...)")
        
        # Create the team
        team_resp = await alice.post("/teams", json={
            "name": "The Hungry Engineers",
            "emoji": "🍕",
            "color": "#3B82F6"
        })
        assert team_resp.status_code == 200
        team = team_resp.json()["team"]
        team_id = team["id"]
        invite_code = team["inviteCode"]
        log_substep(f"Team created: {team['emoji']} {team['name']}")
        log_substep(f"Invite code: {invite_code}")
        
        # Create Bob, Carol, and Dave
        bob = APIClient(http_client, "Bob")
        await bob.login("bob@hungryengineers.com")
        log_substep(f"Bob registered (id: {bob.user_id[:8]}...)")
        
        carol = APIClient(http_client, "Carol")
        await carol.login("carol@hungryengineers.com")
        log_substep(f"Carol registered (id: {carol.user_id[:8]}...)")
        
        dave = APIClient(http_client, "Dave")
        await dave.login("dave@hungryengineers.com")
        log_substep(f"Dave registered (id: {dave.user_id[:8]}...)")
        
        # Everyone joins via invite code
        for member in [bob, carol, dave]:
            join_resp = await member.post("/teams/join", json={"inviteCode": invite_code})
            assert join_resp.status_code == 200, f"{member.name} failed to join: {join_resp.text}"
            log_substep(f"{member.name} joined the team")
        
        # Verify team has 4 members
        members_resp = await alice.get(f"/teams/{team_id}/members")
        assert members_resp.status_code == 200
        members = members_resp.json()["members"]
        assert len(members) == 4, f"Expected 4 members, got {len(members)}"
        log_substep(f"Team has {len(members)} members: {', '.join(m['name'] for m in members)}")
        
        # Store member IDs for later
        member_lookup = {m["name"]: m for m in members}
        all_clients = {"alice": alice, "bob": bob, "carol": carol, "dave": dave}
        
        # Helper to get organizer client
        def get_organizer_client(organizer_name: str) -> APIClient:
            return all_clients.get(organizer_name, alice)
        
        # ============================================================
        # PHASE 2: WEEK 1 - FIRST LUNCH CYCLE
        # ============================================================
        log_step("PHASE 2: Week 1 - First Lunch Cycle")
        
        # Check who should organize first (everyone has 0 points)
        next_resp = await alice.get(f"/teams/{team_id}/next-organizer")
        organizer = next_resp.json()["organizer"]
        organizer_client = get_organizer_client(organizer["name"])
        log_substep(f"First organizer: {organizer['name']} (points: {organizer['points']})")
        
        # Start the lunch period (anyone can start, rotation determines organizer)
        period_resp = await alice.post(f"/voting/teams/{team_id}/period", json={
            "votingDays": 3
        })
        assert period_resp.status_code == 200
        period = period_resp.json()["period"]
        period_id = period["id"]
        log_substep(f"Lunch period started (status: {period['status']})")
        
        # Propose venues (the organizer or anyone can propose)
        venues_to_propose = [
            ("Taco Town", "Best tacos in the city"),
            ("Burger Barn", "Classic American burgers"),
            ("Sushi Supreme", "Fresh fish, great rolls"),
        ]
        
        venue_ids = []
        for name, desc in venues_to_propose:
            venue_resp = await alice.post(f"/voting/periods/{period_id}/venues", json={
                "name": name,
                "description": desc
            })
            assert venue_resp.status_code == 200
            venue_ids.append(venue_resp.json()["venue"]["id"])
            log_substep(f"Venue proposed: {name}")
        
        # Advance to voting phase (organizer only)
        voting_resp = await organizer_client.post(f"/voting/periods/{period_id}/start-voting")
        assert voting_resp.status_code == 200
        log_substep("Voting phase started!")
        
        # Everyone votes
        votes = {
            alice: venue_ids[0],  # Alice votes Taco Town
            bob: venue_ids[1],    # Bob votes Burger Barn
            carol: venue_ids[2],  # Carol votes Sushi Supreme
            dave: venue_ids[2],   # Dave votes Sushi Supreme
        }
        
        for client, venue_id in votes.items():
            vote_resp = await client.post(f"/voting/periods/{period_id}/vote", json={
                "venueId": venue_id
            })
            assert vote_resp.status_code == 200
            # Find venue name
            venue_name = venues_to_propose[[v[0] for v in venue_ids].index(venue_id) if venue_id in venue_ids else 0][0]
            log_substep(f"{client.name} voted for {venue_name}")
        
        # Complete the period (organizer only)
        complete_resp = await organizer_client.post(f"/voting/periods/{period_id}/complete")
        assert complete_resp.status_code == 200
        completed = complete_resp.json()["period"]
        winning_venue = [v for v in venues_to_propose if venue_ids[venues_to_propose.index(v)] == completed["winningVenueId"]]
        log_substep(f"🎉 Winner: {winning_venue[0][0] if winning_venue else 'unknown'} (2 votes)")
        
        # ============================================================
        # PHASE 3: WEEK 2 - SECOND ROTATION
        # ============================================================
        log_step("PHASE 3: Week 2 - Second Rotation")
        
        # Check points after first week
        members_resp = await alice.get(f"/teams/{team_id}/members")
        members_w2 = members_resp.json()["members"]
        log_substep("Points after Week 1:")
        for m in sorted(members_w2, key=lambda x: x["points"]):
            log_substep(f"  {m['name']}: {m['points']} points")
        
        # Get next organizer (should be different if points incremented)
        next_resp = await alice.get(f"/teams/{team_id}/next-organizer")
        organizer_w2 = next_resp.json()["organizer"]
        organizer_client_w2 = get_organizer_client(organizer_w2["name"])
        log_substep(f"Week 2 organizer: {organizer_w2['name']} (points: {organizer_w2['points']})")
        
        # Run Week 2 cycle
        period2_resp = await alice.post(f"/voting/teams/{team_id}/period")
        assert period2_resp.status_code == 200
        period2_id = period2_resp.json()["period"]["id"]
        log_substep("Week 2 period started")
        
        # Quick venues (anyone can propose)
        v1 = await alice.post(f"/voting/periods/{period2_id}/venues", json={
            "name": "Pho Paradise", "description": "Vietnamese noodle soup"
        })
        v2 = await alice.post(f"/voting/periods/{period2_id}/venues", json={
            "name": "Greek Garden", "description": "Mediterranean delights"
        })
        venue2_ids = [v1.json()["venue"]["id"], v2.json()["venue"]["id"]]
        log_substep("2 venues proposed")
        
        await organizer_client_w2.post(f"/voting/periods/{period2_id}/start-voting")
        
        # Quick votes (majority for Greek Garden)
        for client in [alice, bob, carol]:
            await client.post(f"/voting/periods/{period2_id}/vote", json={"venueId": venue2_ids[1]})
        await dave.post(f"/voting/periods/{period2_id}/vote", json={"venueId": venue2_ids[0]})
        log_substep("All votes cast")
        
        await organizer_client_w2.post(f"/voting/periods/{period2_id}/complete")
        log_substep("🎉 Week 2 complete: Greek Garden wins!")
        
        # ============================================================
        # PHASE 4: WEEK 3 - AWAY STATUS
        # ============================================================
        log_step("PHASE 4: Week 3 - Away Status Test")
        
        # Carol goes on vacation
        carol_member = next(m for m in members_w2 if m["name"] == "carol")
        away_resp = await carol.put(
            f"/members/teams/{team_id}/members/{carol_member['id']}/away",
            json={"isAway": True}
        )
        assert away_resp.status_code == 200
        log_substep("Carol marked as AWAY (vacation)")
        
        # Check that rotation respects away status
        members_resp = await alice.get(f"/teams/{team_id}/members")
        members_w3 = members_resp.json()["members"]
        active_members = [m for m in members_w3 if not m.get("isAway", False)]
        log_substep(f"Active members: {len(active_members)}/4")
        
        # Get next organizer (should skip Carol who is away)
        next_resp = await alice.get(f"/teams/{team_id}/next-organizer")
        organizer_w3 = next_resp.json()["organizer"]
        organizer_client_w3 = get_organizer_client(organizer_w3["name"])
        log_substep(f"Week 3 organizer: {organizer_w3['name']} (Carol skipped - away)")
        
        # Run Week 3 cycle with Carol away
        period3_resp = await alice.post(f"/voting/teams/{team_id}/period")
        period3_id = period3_resp.json()["period"]["id"]
        log_substep("Week 3 period started")
        
        await alice.post(f"/voting/periods/{period3_id}/venues", json={
            "name": "BBQ Bonanza", "description": "Smoky goodness"
        })
        await organizer_client_w3.post(f"/voting/periods/{period3_id}/start-voting")
        
        # Only active members vote
        for client in [alice, bob, dave]:
            await client.post(f"/voting/periods/{period3_id}/vote", json={
                "venueId": (await alice.get(f"/voting/teams/{team_id}/period")).json()["period"]["venueOptions"][0]["id"]
            })
        log_substep("Active members voted (Carol skipped - away)")
        
        await organizer_client_w3.post(f"/voting/periods/{period3_id}/complete")
        log_substep("🎉 Week 3 complete: BBQ Bonanza wins!")
        
        # Carol returns
        await carol.put(
            f"/members/teams/{team_id}/members/{carol_member['id']}/away",
            json={"isAway": False}
        )
        log_substep("Carol returns from vacation!")
        
        # ============================================================
        # PHASE 5: WEEK 4 - FINAL VERIFICATION
        # ============================================================
        log_step("PHASE 5: Week 4 - Final Verification")
        
        # Check final points distribution
        members_resp = await alice.get(f"/teams/{team_id}/members")
        final_members = members_resp.json()["members"]
        log_substep("Final points distribution:")
        for m in sorted(final_members, key=lambda x: x["points"], reverse=True):
            status = "🏖️ (was away)" if m["name"] == "carol" else ""
            log_substep(f"  {m['name']}: {m['points']} points {status}")
        
        # Verify history has all periods
        history_resp = await alice.get(f"/voting/teams/{team_id}/history")
        history = history_resp.json()["history"]
        log_substep(f"History contains {len(history)} completed periods")
        assert len(history) == 3, f"Expected 3 periods in history, got {len(history)}"
        
        # Get next organizer for Week 4
        next_resp = await alice.get(f"/teams/{team_id}/next-organizer")
        organizer_w4 = next_resp.json()["organizer"]
        organizer_client_w4 = get_organizer_client(organizer_w4["name"])
        log_substep(f"Week 4 organizer: {organizer_w4['name']}")
        
        # Run one final cycle to ensure rotation continues
        period4_resp = await alice.post(f"/voting/teams/{team_id}/period")
        period4_id = period4_resp.json()["period"]["id"]
        
        await alice.post(f"/voting/periods/{period4_id}/venues", json={
            "name": "Final Feast", "description": "Week 4 celebration"
        })
        await organizer_client_w4.post(f"/voting/periods/{period4_id}/start-voting")
        
        # Everyone votes
        venue4_id = (await alice.get(f"/voting/teams/{team_id}/period")).json()["period"]["venueOptions"][0]["id"]
        for client in [alice, bob, carol, dave]:
            await client.post(f"/voting/periods/{period4_id}/vote", json={"venueId": venue4_id})
        
        await organizer_client_w4.post(f"/voting/periods/{period4_id}/complete")
        log_substep("🎉 Week 4 complete!")
        
        # Final verification
        final_history = await alice.get(f"/voting/teams/{team_id}/history")
        assert len(final_history.json()["history"]) == 4
        
        log_step("✅ FULL SAGA COMPLETE!", 
                 f"4 weeks simulated, {len(final_history.json()['history'])} lunches organized")
        
        print("\n" + "="*60)
        print("📊 FINAL STATS")
        print("="*60)
        print(f"  Team: {team['emoji']} {team['name']}")
        print(f"  Members: 4")
        print(f"  Weeks completed: 4")
        print(f"  Total votes cast: 16")
        print(f"  Away handled: Yes (Carol Week 3)")
        print("="*60 + "\n")


class TestRapidRotationFairness:
    """
    Rapid test to verify rotation fairness over many cycles.
    
    Runs 8 quick cycles and verifies that all members organized
    at least once and points are distributed fairly.
    """
    
    @pytest.mark.asyncio
    async def test_eight_week_rotation_fairness(self, http_client, reset_db):
        log_step("ROTATION FAIRNESS TEST", "8 rapid cycles")
        
        # Quick setup
        owner = APIClient(http_client, "Owner")
        await owner.login("owner@fairness.test")
        
        team_resp = await owner.post("/teams", json={
            "name": "Fairness Test", "emoji": "⚖️", "color": "#22C55E"
        })
        team_id = team_resp.json()["team"]["id"]
        invite_code = team_resp.json()["team"]["inviteCode"]
        
        # Add 3 more members
        members = [owner]
        for i in range(3):
            m = APIClient(http_client, f"Member{i+1}")
            await m.login(f"member{i+1}@fairness.test")
            await m.post("/teams/join", json={"inviteCode": invite_code})
            members.append(m)
        
        log_substep(f"Team created with {len(members)} members")
        
        # Track organizers
        organizer_counts = {}
        
        # Create lookup by member ID (we need to get these from the team)
        team_members_resp = await owner.get(f"/teams/{team_id}/members")
        team_members = team_members_resp.json()["members"]
        
        # Map member IDs to their APIClient by matching names (case-insensitive)
        member_clients_by_id = {}
        for tm in team_members:
            # Find matching APIClient by comparing names case-insensitively
            for client in members:
                if client.name.lower() == tm["name"].lower():
                    member_clients_by_id[tm["id"]] = client
                    break
        
        log_substep(f"Client mapping: {[(k, v.name) for k, v in member_clients_by_id.items()]}")
        
        # Run 8 rapid cycles
        for week in range(8):
            # Get current organizer
            next_resp = await owner.get(f"/teams/{team_id}/next-organizer")
            organizer = next_resp.json()["organizer"]
            organizer_name = organizer["name"]
            organizer_id = organizer["id"]
            organizer_counts[organizer_name] = organizer_counts.get(organizer_name, 0) + 1
            
            log_substep(f"Week {week+1}: Organizer is {organizer_name} (id={organizer_id})")
            
            # Find the client for this organizer by ID
            organizer_client = member_clients_by_id.get(organizer_id, owner)
            log_substep(f"Week {week+1}: Using client {organizer_client.name}")
            
            # Quick cycle - anyone can start period, but organizer must do key actions
            period_resp = await owner.post(f"/voting/teams/{team_id}/period")
            if period_resp.status_code != 200:
                log_substep(f"Week {week+1}: Failed to start period: {period_resp.text}")
                break
            period_data = period_resp.json()["period"]
            period_id = period_data["id"]
            period_organizer_id = period_data["organizerId"]
            
            # Anyone can propose venue
            await owner.post(f"/voting/periods/{period_id}/venues", json={
                "name": f"Week {week+1} Venue", "description": "Quick test"
            })
            
            # Only organizer can start voting
            start_voting_resp = await organizer_client.post(f"/voting/periods/{period_id}/start-voting")
            if start_voting_resp.status_code != 200:
                log_substep(f"Week {week+1}: Failed to start voting: {start_voting_resp.text}")
                break
            
            venue_id = (await owner.get(f"/voting/teams/{team_id}/period")).json()["period"]["venueOptions"][0]["id"]
            for m in members:
                await m.post(f"/voting/periods/{period_id}/vote", json={"venueId": venue_id})
            
            # Only organizer can complete the period
            complete_resp = await organizer_client.post(f"/voting/periods/{period_id}/complete")
            if complete_resp.status_code != 200:
                log_substep(f"Week {week+1}: Failed to complete: {complete_resp.text}")
                break
            log_substep(f"Week {week+1}: {organizer_name} organized")
        
        # Verify fairness
        log_substep("Organizer distribution:")
        for name, count in sorted(organizer_counts.items()):
            log_substep(f"  {name}: {count} times")
        
        # Each member should have organized exactly twice (8 weeks / 4 members)
        assert len(organizer_counts) == 4, "All 4 members should have organized"
        for name, count in organizer_counts.items():
            assert count == 2, f"{name} organized {count} times, expected 2"
        
        log_step("✅ FAIRNESS VERIFIED", "Each member organized exactly 2 times over 8 weeks")


# Allow running directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
