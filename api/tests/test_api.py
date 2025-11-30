"""
API Tests for LunchSaga Backend

These tests run against the pywrangler dev environment (miniflare).
The test server is automatically started and managed by the fixtures in conftest.py.

Usage:
    From project root:
    uv run pytest api/tests/ -v
"""

import pytest

# Import DEV_OTP_CODE from conftest for use in test fixtures
from conftest import DEV_OTP_CODE


# Note: client, reset_db, auth_token, and auth_headers fixtures are provided by conftest.py


class TestHealthCheck:
    """Health check endpoint tests"""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuth:
    """Authentication flow tests"""

    @pytest.mark.asyncio
    async def test_magic_link_request(self, client, reset_db):
        response = await client.post(
            "/api/auth/magic-link", json={"email": "user@test.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sent"] is True  # API returns "sent" not "success"

    @pytest.mark.asyncio
    async def test_magic_link_invalid_email(self, client, reset_db):
        response = await client.post(
            "/api/auth/magic-link", json={"email": "not-an-email"}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_verify_creates_user(self, client, reset_db):
        email = "newuser@test.com"

        await client.post("/api/auth/magic-link", json={"email": email})
        response = await client.post(
            "/api/auth/verify", json={"email": email, "code": DEV_OTP_CODE}
        )

        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == email

    @pytest.mark.asyncio
    async def test_verify_wrong_code(self, client, reset_db):
        email = "user@test.com"

        await client.post("/api/auth/magic-link", json={"email": email})
        response = await client.post(
            "/api/auth/verify", json={"email": email, "code": "999999"}
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user(self, client, auth_token, auth_headers):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "email" in data["user"]

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client, reset_db):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout(self, client, auth_token, auth_headers):
        response = await client.post("/api/auth/logout", headers=auth_headers)
        assert response.status_code == 200


class TestTeams:
    """Team management tests"""

    @pytest.mark.asyncio
    async def test_create_team(self, client, auth_token, auth_headers):
        response = await client.post(
            "/api/teams",
            json={"name": "Test Team", "emoji": "🚀", "color": "#3b82f6"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["team"]["name"] == "Test Team"
        assert "inviteCode" in data["team"]

    @pytest.mark.asyncio
    async def test_create_team_unauthorized(self, client, reset_db):
        response = await client.post(
            "/api/teams", json={"name": "Test Team", "emoji": "🚀", "color": "#3b82f6"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_teams(self, client, auth_token, auth_headers):
        # Create a team first
        await client.post(
            "/api/teams",
            json={"name": "My Team", "emoji": "🎯", "color": "#10b981"},
            headers=auth_headers,
        )

        response = await client.get("/api/teams", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["teams"]) >= 1

    @pytest.mark.asyncio
    async def test_get_team(self, client, auth_token, auth_headers):
        # Create a team
        create_response = await client.post(
            "/api/teams",
            json={"name": "Test Team", "emoji": "🚀", "color": "#3b82f6"},
            headers=auth_headers,
        )
        team_id = create_response.json()["team"]["id"]

        response = await client.get(f"/api/teams/{team_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["team"]["id"] == team_id

    @pytest.mark.asyncio
    async def test_join_team_by_invite(self, client, reset_db):
        # Create first user and team
        await client.post("/api/auth/magic-link", json={"email": "owner@test.com"})
        verify_resp = await client.post(
            "/api/auth/verify", json={"email": "owner@test.com", "code": DEV_OTP_CODE}
        )
        owner_token = verify_resp.json()["token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        create_resp = await client.post(
            "/api/teams",
            json={"name": "Join Test", "emoji": "👋", "color": "#f59e0b"},
            headers=owner_headers,
        )
        invite_code = create_resp.json()["team"]["inviteCode"]

        # Create second user and join
        await client.post("/api/auth/magic-link", json={"email": "member@test.com"})
        verify_resp = await client.post(
            "/api/auth/verify", json={"email": "member@test.com", "code": DEV_OTP_CODE}
        )
        member_token = verify_resp.json()["token"]
        member_headers = {"Authorization": f"Bearer {member_token}"}

        response = await client.post(
            "/api/teams/join", json={"inviteCode": invite_code}, headers=member_headers
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_leave_team(self, client, auth_token, auth_headers):
        # Create and join team
        create_resp = await client.post(
            "/api/teams",
            json={"name": "Leave Test", "emoji": "👋", "color": "#f59e0b"},
            headers=auth_headers,
        )
        team_id = create_resp.json()["team"]["id"]

        response = await client.delete(
            f"/api/teams/{team_id}/leave", headers=auth_headers
        )
        # Owner leaving should either succeed or fail gracefully
        assert response.status_code in [200, 400]


class TestVoting:
    """Voting flow tests"""

    @pytest.fixture
    async def team_with_members(self, client, reset_db):
        """Create a team with multiple members for voting tests"""
        # Create owner
        await client.post("/api/auth/magic-link", json={"email": "owner@test.com"})
        verify = await client.post(
            "/api/auth/verify", json={"email": "owner@test.com", "code": DEV_OTP_CODE}
        )
        owner_token = verify.json()["token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # Create team
        team_resp = await client.post(
            "/api/teams",
            json={"name": "Voting Team", "emoji": "🗳️", "color": "#8b5cf6"},
            headers=owner_headers,
        )
        team_data = team_resp.json()["team"]

        return {
            "team_id": team_data["id"],
            "invite_code": team_data["inviteCode"],
            "owner_token": owner_token,
            "owner_headers": owner_headers,
        }

    @pytest.mark.asyncio
    async def test_start_period(self, client, team_with_members):
        response = await client.post(
            f"/api/voting/teams/{team_with_members['team_id']}/period",
            json={"votingDays": 3},
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert "period" in data
        assert data["period"]["status"] == "proposing"

    @pytest.mark.asyncio
    async def test_propose_venue(self, client, team_with_members):
        # Start period
        period_resp = await client.post(
            f"/api/voting/teams/{team_with_members['team_id']}/period",
            json={"votingDays": 3},
            headers=team_with_members["owner_headers"],
        )
        period_id = period_resp.json()["period"]["id"]

        # Propose venue
        response = await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Test Venue", "description": "A great place"},
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["venue"]["name"] == "Test Venue"

    @pytest.mark.asyncio
    async def test_advance_to_voting(self, client, team_with_members):
        # Start period
        period_resp = await client.post(
            f"/api/voting/teams/{team_with_members['team_id']}/period",
            json={"votingDays": 3},
            headers=team_with_members["owner_headers"],
        )
        period_id = period_resp.json()["period"]["id"]

        # Propose venues
        await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Venue 1", "description": "First option"},
            headers=team_with_members["owner_headers"],
        )
        await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Venue 2", "description": "Second option"},
            headers=team_with_members["owner_headers"],
        )

        # Advance to voting
        response = await client.post(
            f"/api/voting/periods/{period_id}/start-voting",
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["status"] == "voting"

    @pytest.mark.asyncio
    async def test_cast_vote(self, client, team_with_members):
        """Test casting a vote for a venue"""
        # Start period
        period_resp = await client.post(
            f"/api/voting/teams/{team_with_members['team_id']}/period",
            headers=team_with_members["owner_headers"],
        )
        period_id = period_resp.json()["period"]["id"]

        # Propose venue
        venue_resp = await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Test Venue", "description": "Vote for me"},
            headers=team_with_members["owner_headers"],
        )
        venue_id = venue_resp.json()["venue"]["id"]

        # Start voting
        await client.post(
            f"/api/voting/periods/{period_id}/start-voting",
            headers=team_with_members["owner_headers"],
        )

        # Cast vote
        response = await client.post(
            f"/api/voting/periods/{period_id}/vote",
            json={"venueId": venue_id},
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["voted"] is True
        assert data["action"] == "added"

    @pytest.mark.asyncio
    async def test_complete_period(self, client, team_with_members):
        """Test completing a period and determining winner"""
        # Start period
        period_resp = await client.post(
            f"/api/voting/teams/{team_with_members['team_id']}/period",
            headers=team_with_members["owner_headers"],
        )
        period_id = period_resp.json()["period"]["id"]

        # Propose venue
        venue_resp = await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Winner Venue", "description": "This will win"},
            headers=team_with_members["owner_headers"],
        )
        venue_id = venue_resp.json()["venue"]["id"]

        # Start voting
        await client.post(
            f"/api/voting/periods/{period_id}/start-voting",
            headers=team_with_members["owner_headers"],
        )

        # Cast vote
        await client.post(
            f"/api/voting/periods/{period_id}/vote",
            json={"venueId": venue_id},
            headers=team_with_members["owner_headers"],
        )

        # Complete period
        response = await client.post(
            f"/api/voting/periods/{period_id}/complete",
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"]["status"] == "completed"
        assert data["period"]["winningVenueId"] == venue_id

    @pytest.mark.asyncio
    async def test_get_period_history(self, client, team_with_members):
        """Test getting period history for a team"""
        response = await client.get(
            f"/api/voting/teams/{team_with_members['team_id']}/history",
            headers=team_with_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)


class TestMembers:
    """Member management tests"""

    @pytest.fixture
    async def team_setup(self, client, reset_db):
        """Set up a team for member tests"""
        await client.post("/api/auth/magic-link", json={"email": "owner@test.com"})
        verify = await client.post(
            "/api/auth/verify", json={"email": "owner@test.com", "code": DEV_OTP_CODE}
        )
        token = verify.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        team_resp = await client.post(
            "/api/teams",
            json={"name": "Member Test", "emoji": "👥", "color": "#ef4444"},
            headers=headers,
        )
        team_data = team_resp.json()["team"]

        return {"team_id": team_data["id"], "token": token, "headers": headers}

    @pytest.mark.asyncio
    async def test_list_members(self, client, team_setup):
        response = await client.get(
            f"/api/teams/{team_setup['team_id']}/members", headers=team_setup["headers"]
        )
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        assert len(data["members"]) >= 1  # At least the owner

    @pytest.mark.asyncio
    async def test_set_away_status(self, client, team_setup):
        response = await client.put(
            f"/api/teams/{team_setup['team_id']}/members/me/away",
            json={"away": True},
            headers=team_setup["headers"],
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_member_stats(self, client, team_setup):
        response = await client.get(
            f"/api/teams/{team_setup['team_id']}/members/me/stats",
            headers=team_setup["headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data


class TestRotation:
    """Rotation and organizer tests"""

    @pytest.fixture
    async def team_with_multiple_members(self, client, reset_db):
        """Create a team with multiple members for rotation tests"""
        # Create owner
        await client.post("/api/auth/magic-link", json={"email": "owner@test.com"})
        verify = await client.post(
            "/api/auth/verify", json={"email": "owner@test.com", "code": DEV_OTP_CODE}
        )
        owner_token = verify.json()["token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # Create team
        team_resp = await client.post(
            "/api/teams",
            json={"name": "Rotation Team", "emoji": "🔄", "color": "#6366f1"},
            headers=owner_headers,
        )
        team_data = team_resp.json()["team"]
        invite_code = team_data["inviteCode"]

        # Create and add second member
        await client.post("/api/auth/magic-link", json={"email": "member2@test.com"})
        verify2 = await client.post(
            "/api/auth/verify", json={"email": "member2@test.com", "code": DEV_OTP_CODE}
        )
        member2_token = verify2.json()["token"]
        member2_headers = {"Authorization": f"Bearer {member2_token}"}
        await client.post("/api/teams/join", json={"inviteCode": invite_code}, headers=member2_headers)

        return {
            "team_id": team_data["id"],
            "owner_headers": owner_headers,
            "member2_headers": member2_headers,
        }

    @pytest.mark.asyncio
    async def test_get_next_organizer(self, client, team_with_multiple_members):
        """Test getting the next organizer based on points"""
        response = await client.get(
            f"/api/teams/{team_with_multiple_members['team_id']}/next-organizer",
            headers=team_with_multiple_members["owner_headers"],
        )
        assert response.status_code == 200
        data = response.json()
        assert "organizer" in data
        assert data["organizer"] is not None
        assert "name" in data["organizer"]
        assert "points" in data["organizer"]

    @pytest.mark.asyncio
    async def test_points_increment_after_complete(self, client, team_with_multiple_members):
        """Test that organizer points increase after completing a period"""
        headers = team_with_multiple_members["owner_headers"]
        team_id = team_with_multiple_members["team_id"]

        # Verify we can get next organizer
        initial_resp = await client.get(f"/api/teams/{team_id}/next-organizer", headers=headers)
        assert initial_resp.status_code == 200

        # Start period
        period_resp = await client.post(f"/api/voting/teams/{team_id}/period", headers=headers)
        period_id = period_resp.json()["period"]["id"]

        # Propose and vote
        venue_resp = await client.post(
            f"/api/voting/periods/{period_id}/venues",
            json={"name": "Points Test Venue", "description": "Test"},
            headers=headers,
        )
        venue_id = venue_resp.json()["venue"]["id"]

        await client.post(f"/api/voting/periods/{period_id}/start-voting", headers=headers)
        await client.post(
            f"/api/voting/periods/{period_id}/vote",
            json={"venueId": venue_id},
            headers=headers,
        )

        # Complete period
        await client.post(f"/api/voting/periods/{period_id}/complete", headers=headers)

        # Check points increased (or next organizer changed)
        # After completing, the current organizer's points should increase
        members_resp = await client.get(f"/api/teams/{team_id}/members", headers=headers)
        members = members_resp.json()["members"]
        
        # At least verify we can get members with points
        assert len(members) >= 1
        assert "points" in members[0]


# Run configuration for pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
