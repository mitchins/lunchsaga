import pytest

from kinglet.testing import MockD1Database

from domains.teams.service import TeamService
from models import Achievement, Team, TeamMember, User


@pytest.fixture
async def db():
    database = MockD1Database()
    await User.create_table(database)
    await Team.create_table(database)
    await TeamMember.create_table(database)
    await Achievement.create_table(database)
    return database


class TestTeamService:
    @pytest.mark.asyncio
    async def test_leave_team_removes_achievements(self, db):
        owner = await User.objects.create(db, email="owner@example.com", name="Owner")
        member_user = await User.objects.create(
            db, email="member@example.com", name="Member"
        )
        team = await Team.objects.create(
            db,
            name="Test Team",
            emoji="🍕",
            color="#10b981",
            owner_id=str(owner.id),
            invite_code="ABC123",
        )
        await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=str(owner.id),
            name="Owner",
        )
        member = await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=str(member_user.id),
            name="Member",
        )
        await Achievement.objects.create(
            db,
            member_id=str(member.id),
            badge_type="legendary_curator",
            metadata={},
        )

        result = await TeamService.leave_team(db, str(team.id), str(member_user.id))

        assert result is True
        assert await TeamMember.objects.filter(db, id=str(member.id)).first() is None
        assert (
            await Achievement.objects.filter(db, member_id=str(member.id)).first() is None
        )
