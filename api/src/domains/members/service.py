"""
Members Service

Business logic for team member management.
"""

from domains.auth.validators import AuthValidators
from models import Achievement, TeamMember, User


class MembersService:
    """Service for member operations"""

    @classmethod
    async def get_member_for_user(cls, db, team_id: str, user_id: str) -> dict | None:
        """Get the member record for a user in a team"""
        member = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=user_id
        ).first()
        if not member:
            return None
        
        return {
            "id": str(member.id),
            "teamId": member.team_id,
            "userId": member.user_id,
            "name": member.name,
            "points": member.points,
            "reputationScore": member.reputation_score,
            "totalVenuesProposed": member.total_venues_proposed,
            "totalWins": member.total_wins,
            "isAway": member.is_away,
            "joinedAt": int(member.joined_at.timestamp() * 1000),
        }

    @classmethod
    async def add_member(
        cls, db, team_id: str, email: str, adder_user_id: str
    ) -> dict | None:
        """
        Add a member to a team by email.
        Returns None if user doesn't exist or adder is not the owner.
        """
        from models import Team

        is_valid, err_msg = AuthValidators.validate_email(email)
        if not is_valid:
            return {"error": err_msg}

        normalized_email = AuthValidators.normalize_email(email)

        # Verify adder is team owner
        team = await Team.objects.filter(db, id=team_id).first()
        if not team or team.owner_id != adder_user_id:
            return None

        # Find user by email, or create a placeholder user
        user = await User.objects.filter(db, email=normalized_email).first()
        if not user:
            # Auto-create user with email as name (they'll update on first login)
            user = await User.objects.create(
                db,
                email=normalized_email,
                name=normalized_email.split("@")[0],  # Use email prefix as default name
            )

        # Check if already a member
        existing = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=str(user.id)
        ).first()
        if existing:
            return {"error": "User is already a member"}

        # Add member
        member = await TeamMember.objects.create(
            db,
            team_id=team_id,
            user_id=str(user.id),
            name=user.name,
        )

        return {
            "id": str(member.id),
            "teamId": member.team_id,
            "userId": member.user_id,
            "name": member.name,
            "points": member.points,
            "reputationScore": member.reputation_score,
            "totalVenuesProposed": member.total_venues_proposed,
            "totalWins": member.total_wins,
            "isAway": member.is_away,
            "joinedAt": int(member.joined_at.timestamp() * 1000),
        }

    @classmethod
    async def remove_member(
        cls, db, team_id: str, member_id: str, remover_user_id: str
    ) -> bool:
        """
        Remove a member from a team.
        Only owner can remove members, and owner cannot be removed.
        """
        from models import Team

        # Verify remover is team owner
        team = await Team.objects.filter(db, id=team_id).first()
        if not team or team.owner_id != remover_user_id:
            return False

        # Get member
        member = await TeamMember.objects.filter(
            db, id=member_id, team_id=team_id
        ).first()
        if not member:
            return False

        # Cannot remove owner
        if member.user_id == team.owner_id:
            return False

        # Remove member
        await TeamMember.objects.filter(db, id=member_id).delete()

        # Also remove their achievements for this team
        await Achievement.objects.filter(db, member_id=member_id).delete()

        return True

    @classmethod
    async def update_away_status(
        cls, db, member_id: str, is_away: bool, user_id: str
    ) -> dict | None:
        """
        Update member's away status.
        Members can only update their own status, or owner can update any.
        """
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return None

        # Check if user is the member or team owner
        from models import Team

        team = await Team.objects.filter(db, id=member.team_id).first()
        if not team:
            return None

        is_owner = team.owner_id == user_id
        is_self = member.user_id == user_id

        if not is_owner and not is_self:
            return None

        await TeamMember.objects.filter(db, id=member_id).update(is_away=is_away)

        # Return updated member
        member = await TeamMember.objects.filter(db, id=member_id).first()
        return {
            "id": str(member.id),
            "teamId": member.team_id,
            "userId": member.user_id,
            "name": member.name,
            "points": member.points,
            "reputationScore": member.reputation_score,
            "totalVenuesProposed": member.total_venues_proposed,
            "totalWins": member.total_wins,
            "isAway": member.is_away,
            "joinedAt": int(member.joined_at.timestamp() * 1000),
        }

    @classmethod
    async def get_member_stats(cls, db, member_id: str, user_id: str) -> dict | None:
        """Get detailed stats for a member"""
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return None

        # Verify user is in the same team
        user_membership = await TeamMember.objects.filter(
            db, team_id=member.team_id, user_id=user_id
        ).first()
        if not user_membership:
            return None

        # Get achievements
        achievements = await Achievement.objects.filter(db, member_id=member_id).all()

        return {
            "id": str(member.id),
            "teamId": member.team_id,
            "userId": member.user_id,
            "name": member.name,
            "points": member.points,
            "reputationScore": member.reputation_score,
            "totalVenuesProposed": member.total_venues_proposed,
            "totalWins": member.total_wins,
            "isAway": member.is_away,
            "joinedAt": int(member.joined_at.timestamp() * 1000),
            "achievements": [
                {
                    "type": a.badge_type,
                    "earnedAt": int(a.earned_at.timestamp() * 1000),
                    "metadata": a.metadata,
                }
                for a in achievements
            ],
        }

    @classmethod
    async def update_member_name(
        cls, db, member_id: str, name: str, user_id: str
    ) -> dict | None:
        """Update member's display name (self or owner only)"""
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return None

        # Check if user is the member or team owner
        from models import Team

        team = await Team.objects.filter(db, id=member.team_id).first()
        if not team:
            return None

        is_owner = team.owner_id == user_id
        is_self = member.user_id == user_id

        if not is_owner and not is_self:
            return None

        await TeamMember.objects.filter(db, id=member_id).update(name=name)

        # Return updated member
        member = await TeamMember.objects.filter(db, id=member_id).first()
        return {
            "id": str(member.id),
            "teamId": member.team_id,
            "userId": member.user_id,
            "name": member.name,
            "points": member.points,
            "reputationScore": member.reputation_score,
            "totalVenuesProposed": member.total_venues_proposed,
            "totalWins": member.total_wins,
            "isAway": member.is_away,
            "joinedAt": int(member.joined_at.timestamp() * 1000),
        }

    @classmethod
    async def award_achievement(
        cls, db, member_id: str, badge_type: str, metadata: dict | None = None
    ) -> dict | None:
        """Award an achievement to a member"""
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return None

        # Check if already has this achievement
        existing = await Achievement.objects.filter(
            db, member_id=member_id, badge_type=badge_type
        ).first()
        if existing:
            return {"alreadyAwarded": True}

        achievement = await Achievement.objects.create(
            db,
            member_id=member_id,
            badge_type=badge_type,
            metadata=metadata or {},
        )

        return {
            "type": achievement.badge_type,
            "earnedAt": int(achievement.earned_at.timestamp() * 1000),
            "metadata": achievement.metadata,
        }
