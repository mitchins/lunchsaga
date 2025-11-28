"""
Teams Service

Business logic for team management including CRUD operations,
invite codes, and member rotation.
"""

import secrets
from datetime import datetime, timezone

from models import Team, TeamMember, User


class TeamService:
    """Service for team operations"""

    @staticmethod
    def _generate_invite_code() -> str:
        """Generate a unique 6-character invite code"""
        return secrets.token_urlsafe(4).upper()[:6]

    @classmethod
    async def create_team(
        cls, db, owner_id: str, name: str, emoji: str = "🍕", color: str = "#10b981"
    ) -> dict:
        """Create a new team and add owner as first member"""
        # Generate unique invite code
        invite_code = cls._generate_invite_code()

        # Ensure uniqueness (retry if collision)
        for _ in range(5):
            existing = await Team.objects.filter(db, invite_code=invite_code).first()
            if not existing:
                break
            invite_code = cls._generate_invite_code()

        # Get owner's name
        owner = await User.objects.filter(db, id=owner_id).first()
        owner_name = owner.name if owner else "Unknown"

        # Create team
        team = await Team.objects.create(
            db,
            name=name,
            emoji=emoji,
            color=color,
            owner_id=owner_id,
            invite_code=invite_code,
        )

        # Add owner as first member
        await TeamMember.objects.create(
            db,
            team_id=str(team.id),
            user_id=owner_id,
            name=owner_name,
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

        # Remove membership
        await TeamMember.objects.filter(db, team_id=team_id, user_id=user_id).delete()
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

        new_code = cls._generate_invite_code()

        # Ensure uniqueness
        for _ in range(5):
            existing = await Team.objects.filter(db, invite_code=new_code).first()
            if not existing:
                break
            new_code = cls._generate_invite_code()

        await Team.objects.filter(db, id=team_id).update(invite_code=new_code)
        return new_code
