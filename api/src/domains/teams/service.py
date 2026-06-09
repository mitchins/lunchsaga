"""
Teams Service

Business logic for team management including CRUD operations,
invite codes, and member rotation.
"""

import secrets
from datetime import datetime, timezone
import string

from models import Team, TeamMember, User


class TeamService:
    """Service for team operations"""

    INVITE_CODE_LENGTH = 8

    @staticmethod
    def _generate_invite_code() -> str:
        """Generate an 8-character invite code"""
        alphabet = string.ascii_uppercase + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(TeamService.INVITE_CODE_LENGTH))

    @staticmethod
    def _is_invite_code_unique_error(exc: Exception) -> bool:
        message = str(exc).lower()
        return "invite_code" in message and "unique" in message

    @classmethod
    async def create_team(
        cls, db, owner_id: str, name: str, emoji: str = "🍕", color: str = "#10b981"
    ) -> dict:
        """Create a new team and add owner as first member"""
        # Get owner's name
        owner = await User.objects.filter(db, id=owner_id).first()
        owner_name = owner.name if owner else "Unknown"
        now = int(datetime.now(timezone.utc).timestamp())

        for _ in range(10):
            invite_code = cls._generate_invite_code()

            team_insert = db.prepare(
                """
                INSERT INTO teams (name, emoji, color, owner_id, invite_code, is_holiday_mode, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """
            ).bind(name, emoji, color, owner_id, invite_code, 0, now)

            owner_insert = db.prepare(
                """
                INSERT INTO team_members (
                    team_id,
                    user_id,
                    name,
                    points,
                    reputation_score,
                    total_venues_proposed,
                    total_wins,
                    is_away,
                    joined_at
                )
                SELECT id, ?, ?, 0, 0, 0, 0, 0, ? FROM teams WHERE invite_code = ?
                """
            ).bind(owner_id, owner_name, now, invite_code)

            try:
                create_results = await db.batch([team_insert, owner_insert])
                if create_results[1].meta.changes != 1:
                    raise RuntimeError("Failed to add owner as first team member")
                team_id = str(create_results[0].meta.last_row_id)
                team = await Team.objects.filter(db, id=team_id).first()

                if not team:
                    raise RuntimeError("Failed to create team row")

                break
            except Exception as exc:
                if not cls._is_invite_code_unique_error(exc):
                    raise
                continue
        else:
            raise RuntimeError("Unable to generate a unique invite code")

        return {
            "id": str(team.id),
            "name": team.name,
            "emoji": team.emoji,
            "color": team.color,
            "ownerId": team.owner_id,
            "inviteCode": team.invite_code,
            "isHolidayMode": team.is_holiday_mode,
            "createdAt": int(team.created_at.timestamp() * 1000),
        }

    @classmethod
    async def get_teams_for_user(cls, db, user_id: str) -> list[dict]:
        """Get all teams a user is a member of"""
        # Get team memberships
        memberships = await TeamMember.objects.filter(db, user_id=user_id).all()

        if not memberships:
            return []

        teams = []
        for membership in memberships:
            team = await Team.objects.filter(db, id=membership.team_id).first()
            if team:
                teams.append(
                    {
                        "id": str(team.id),
                        "name": team.name,
                        "emoji": team.emoji,
                        "color": team.color,
                        "ownerId": team.owner_id,
                        "inviteCode": team.invite_code,
                        "isHolidayMode": team.is_holiday_mode,
                        "createdAt": int(team.created_at.timestamp() * 1000),
                    }
                )

        return teams

    @classmethod
    async def get_team(cls, db, team_id: str, user_id: str) -> dict | None:
        """Get team details (user must be a member)"""
        # Check membership
        membership = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=user_id
        ).first()
        if not membership:
            return None

        team = await Team.objects.filter(db, id=team_id).first()
        if not team:
            return None

        return {
            "id": str(team.id),
            "name": team.name,
            "emoji": team.emoji,
            "color": team.color,
            "ownerId": team.owner_id,
            "inviteCode": team.invite_code,
            "isHolidayMode": team.is_holiday_mode,
            "createdAt": int(team.created_at.timestamp() * 1000),
        }

    @classmethod
    async def update_team(
        cls, db, team_id: str, user_id: str, updates: dict
    ) -> dict | None:
        """Update team (user must be owner)"""
        team = await Team.objects.filter(db, id=team_id).first()
        if not team or team.owner_id != user_id:
            return None

        allowed_fields = {"name", "emoji", "color", "is_holiday_mode"}
        # Map camelCase to snake_case
        field_mapping = {"isHolidayMode": "is_holiday_mode"}

        filtered_updates = {}
        for k, v in updates.items():
            key = field_mapping.get(k, k)
            if key in allowed_fields:
                filtered_updates[key] = v

        if filtered_updates:
            await Team.objects.filter(db, id=team_id).update(**filtered_updates)

        # Return updated team
        return await cls.get_team(db, team_id, user_id)

    @classmethod
    async def join_team(cls, db, user_id: str, invite_code: str) -> dict | None:
        """Join a team using invite code"""
        team = await Team.objects.filter(db, invite_code=invite_code).first()
        if not team:
            return None

        # Check if already a member
        existing = await TeamMember.objects.filter(
            db, team_id=str(team.id), user_id=user_id
        ).first()
        if existing:
            return {
                "id": str(team.id),
                "name": team.name,
                "emoji": team.emoji,
                "color": team.color,
                "ownerId": team.owner_id,
                "inviteCode": team.invite_code,
                "isHolidayMode": team.is_holiday_mode,
                "createdAt": int(team.created_at.timestamp() * 1000),
                "alreadyMember": True,
            }

        # Get user's name
        user = await User.objects.filter(db, id=user_id).first()
        user_name = user.name if user else "Unknown"

        # Add as member
        await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=user_id,
            name=user_name,
        )

        return {
            "id": str(team.id),
            "name": team.name,
            "emoji": team.emoji,
            "color": team.color,
            "ownerId": team.owner_id,
            "inviteCode": team.invite_code,
            "isHolidayMode": team.is_holiday_mode,
            "createdAt": int(team.created_at.timestamp() * 1000),
            "alreadyMember": False,
        }

    @classmethod
    async def leave_team(cls, db, team_id: str, user_id: str) -> bool:
        """Leave a team (owner cannot leave)"""
        team = await Team.objects.filter(db, id=team_id).first()
        if not team:
            return False

        # Owner cannot leave
        if team.owner_id == user_id:
            return False

        member = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=user_id
        ).first()
        if not member:
            return False

        # Remove achievements tied to this membership before deleting the row.
        from models import Achievement

        await Achievement.objects.filter(db, member_id=str(member.id)).delete()
        await TeamMember.objects.filter(db, id=str(member.id)).delete()
        return True

    @classmethod
    async def get_team_members(cls, db, team_id: str, user_id: str) -> list[dict] | None:
        """Get all members of a team (user must be a member)"""
        # Check membership
        membership = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=user_id
        ).first()
        if not membership:
            return None

        members = await TeamMember.objects.filter(db, team_id=team_id).all()

        return [
            {
                "id": str(m.id),
                "teamId": m.team_id,
                "userId": m.user_id,
                "name": m.name,
                "points": m.points,
                "reputationScore": m.reputation_score,
                "totalVenuesProposed": m.total_venues_proposed,
                "totalWins": m.total_wins,
                "isAway": m.is_away,
                "joinedAt": int(m.joined_at.timestamp() * 1000),
            }
            for m in members
        ]

    @classmethod
    async def regenerate_invite_code(cls, db, team_id: str, user_id: str) -> str | None:
        """Regenerate invite code (owner only)"""
        team = await Team.objects.filter(db, id=team_id).first()
        if not team or team.owner_id != user_id:
            return None

        for _ in range(10):
            new_code = cls._generate_invite_code()
            try:
                await Team.objects.filter(db, id=team_id).update(invite_code=new_code)
                return new_code
            except Exception as exc:
                if not cls._is_invite_code_unique_error(exc):
                    raise

        raise RuntimeError("Unable to regenerate a unique invite code")
