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

    @pytest.mark.asyncio
    async def test_leave_team_returns_false_if_team_missing(self, db):
        assert await TeamService.leave_team(db, "missing-team", "owner@example.com") is False

    @pytest.mark.asyncio
    async def test_leave_team_returns_false_if_user_is_owner(self, db):
        owner = await User.objects.create(db, email="owner@example.com", name="Owner")
        team = await Team.objects.create(
            db,
            name="Owner Team",
            emoji="🍕",
            color="#10b981",
            owner_id=str(owner.id),
            invite_code="OWNER1",
        )
        await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=str(owner.id),
            name="Owner",
        )

        assert (
            await TeamService.leave_team(db, str(team.id), str(owner.id))
            is False
        )
        assert (
            await TeamMember.objects.filter(db, team_id=str(team.id), user_id=str(owner.id)).first()
            is not None
        )

    @pytest.mark.asyncio
    async def test_leave_team_returns_false_if_user_not_member(self, db):
        owner = await User.objects.create(db, email="owner@example.com", name="Owner")
        stranger = await User.objects.create(
            db, email="stranger@example.com", name="Stranger"
        )
        team = await Team.objects.create(
            db,
            name="Team Without Stranger",
            emoji="🍕",
            color="#10b981",
            owner_id=str(owner.id),
            invite_code="MEMBER1",
        )
        await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=str(owner.id),
            name="Owner",
        )

        assert (
            await TeamService.leave_team(db, str(team.id), str(stranger.id))
            is False
        )
        assert (
            await TeamMember.objects.filter(db, team_id=str(team.id), user_id=str(owner.id)).first()
            is not None
        )

    def test_is_invite_code_unique_error(self):
        assert (
            TeamService._is_invite_code_unique_error(
                Exception("UNIQUE constraint failed: teams.invite_code")
            )
            is True
        )
        assert (
            TeamService._is_invite_code_unique_error(
                Exception("UNIQUE constraint failed: teams.name")
            )
            is False
        )
