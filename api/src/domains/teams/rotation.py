"""
Rotation Service

Logic for determining the next organizer based on points.
"""

from models import TeamMember


class RotationService:
    """Service for organizer rotation logic"""

    @classmethod
    async def get_next_organizer(cls, db, team_id: str) -> dict | None:
        """
        Get the member with lowest points who should organize next.
        Excludes members who are marked as away.
        """
        members = (
            await TeamMember.objects.filter(db, team_id=team_id, is_away=False)
            .order_by("points")
            .all()
        )

        if not members:
            return None

        # Find all members tied for lowest points
        min_points = members[0].points
        candidates = [m for m in members if m.points == min_points]

        # If multiple candidates, pick the one who joined earliest
        candidates.sort(key=lambda m: m.joined_at)
        next_organizer = candidates[0]

        return {
            "id": str(next_organizer.id),
            "teamId": next_organizer.team_id,
            "userId": next_organizer.user_id,
            "name": next_organizer.name,
            "points": next_organizer.points,
        }

    @classmethod
    async def increment_organizer_points(cls, db, member_id: str) -> bool:
        """Increment points for the organizer after completing a period"""
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return False

        await TeamMember.objects.filter(db, id=member_id).update(
            points=member.points + 1,
            total_venues_proposed=member.total_venues_proposed + 1,
        )
        return True

    @classmethod
    async def record_winner(cls, db, member_id: str) -> bool:
        """Record a win for the member whose venue was selected"""
        member = await TeamMember.objects.filter(db, id=member_id).first()
        if not member:
            return False

        await TeamMember.objects.filter(db, id=member_id).update(
            total_wins=member.total_wins + 1,
            reputation_score=member.reputation_score + 10,
        )
        return True
