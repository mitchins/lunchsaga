"""
Voting Service

Business logic for lunch period management and voting.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from domains.teams.rotation import RotationService
from models import LunchPeriod, TeamMember, VenueOption, Vote


class VotingService:
    """Service for voting operations"""

    @classmethod
    async def _increment_venue_vote_count(cls, db, venue_id: str, delta: int) -> None:
        """Adjust vote count with a single atomic SQL statement."""
        await db.prepare(
            """
            UPDATE venue_options
            SET vote_count = CASE
                WHEN vote_count + ? < 0 THEN 0
                ELSE vote_count + ?
            END
            WHERE id = ?
            """
        ).bind(delta, delta, str(venue_id)).run()

    @classmethod
    async def get_current_period(cls, db, team_id: str) -> dict | None:
        """Get the current active lunch period for a team"""
        period = (
            await LunchPeriod.objects.filter(db, team_id=team_id)
            .filter(status__in=["proposing", "voting"])
            .order_by("-created_at")
            .first()
        )

        if not period:
            return None

        return await cls._format_period(db, period)

    @classmethod
    async def _format_period(
        cls,
        db,
        period,
        venues: list | None = None,
        votes: list | None = None,
    ) -> dict:
        """Format a period with its venue options"""
        venue_options_raw = venues if venues is not None else await VenueOption.objects.filter(
            db, period_id=str(period.id)
        ).all()
        votes_raw = votes if votes is not None else await Vote.objects.filter(
            db, period_id=str(period.id)
        ).all()
        votes_by_venue: dict[str, list[str]] = defaultdict(list)
        for vote in votes_raw:
            votes_by_venue[str(vote.venue_id)].append(str(vote.member_id))

        venue_options = []
        for v in venue_options_raw:
            voter_ids = votes_by_venue.get(str(v.id), [])

            venue_options.append(
                {
                    "id": str(v.id),
                    "name": v.name,
                    "description": v.description,
                    "proposedBy": v.proposed_by,
                    "votes": voter_ids,
                }
            )

        # Handle timezone-naive datetimes from DB
        start_date = period.start_date
        if start_date and start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=timezone.utc)
        
        end_date = period.end_date
        if end_date and end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        
        voting_deadline = period.voting_deadline
        if voting_deadline and voting_deadline.tzinfo is None:
            voting_deadline = voting_deadline.replace(tzinfo=timezone.utc)

        return {
            "id": str(period.id),
            "teamId": period.team_id,
            "organizerId": period.organizer_id,
            "startDate": int(start_date.timestamp() * 1000) if start_date else None,
            "endDate": int(end_date.timestamp() * 1000) if end_date else None,
            "status": period.status,
            "votingDeadline": int(voting_deadline.timestamp() * 1000) if voting_deadline else None,
            "winningVenueId": period.winning_venue_id,
            "venueOptions": venue_options,
        }

    @classmethod
    async def start_period(
        cls, db, team_id: str, user_id: str, voting_days: int = 3
    ) -> dict | None:
        """Start a new lunch period"""
        # Get current member (just to verify they're a team member)
        member = await TeamMember.objects.filter(
            db, team_id=team_id, user_id=user_id
        ).first()
        if not member:
            return None

        # Check if there's already an active period
        existing = (
            await LunchPeriod.objects.filter(db, team_id=team_id)
            .filter(status__in=["proposing", "voting"])
            .first()
        )
        if existing:
            return None  # Can't start new period while one is active

        # Get the next organizer (lowest points, not away)
        next_organizer = await RotationService.get_next_organizer(db, team_id)
        if not next_organizer:
            return None  # No eligible members

        now = datetime.now(timezone.utc)
        voting_deadline = now + timedelta(days=voting_days)

        period = await LunchPeriod.objects.create(
            db,
            team_id=team_id,
            organizer_id=next_organizer["id"],  # Use rotation logic, not caller
            start_date=now,
            status="proposing",
            voting_deadline=voting_deadline,
        )

        return await cls._format_period(db, period)

    @classmethod
    async def propose_venue(
        cls, db, period_id: str, member_id: str, name: str, description: str = ""
    ) -> dict | None:
        """Propose a venue for the current period"""
        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        if not period or period.status != "proposing":
            return None

        venue = await VenueOption.objects.create(
            db,
            period_id=period_id,
            name=name,
            description=description,
            proposed_by=member_id,
        )

        return {
            "id": str(venue.id),
            "name": venue.name,
            "description": venue.description,
            "proposedBy": venue.proposed_by,
            "votes": [],
        }

    @classmethod
    async def start_voting(cls, db, period_id: str, organizer_id: str) -> bool:
        """Transition period from proposing to voting"""
        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        if not period:
            return False

        # Verify organizer
        if period.organizer_id != organizer_id:
            return False

        if period.status != "proposing":
            return False

        # Must have at least one venue
        venues = await VenueOption.objects.filter(db, period_id=period_id).all()
        if not venues:
            return False

        await LunchPeriod.objects.filter(db, id=period_id).update(status="voting")
        return True

    @classmethod
    async def cast_vote(
        cls, db, period_id: str, venue_id: str, member_id: str
    ) -> dict:
        """Cast or change a vote"""
        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        if not period or period.status != "voting":
            return {"error": "Voting is not open"}

        # Check venue exists for this period
        venue = await VenueOption.objects.filter(
            db, id=venue_id, period_id=period_id
        ).first()
        if not venue:
            return {"error": "Venue not found"}

        await db.prepare("BEGIN IMMEDIATE").run()
        try:
            # Check for existing vote
            existing = await Vote.objects.filter(
                db, period_id=period_id, member_id=member_id
            ).first()

            if existing:
                if existing.venue_id == venue_id:
                    # Already voted for this venue - remove vote (toggle)
                    await Vote.objects.filter(db, id=existing.id).delete()
                    await cls._increment_venue_vote_count(db, venue_id, -1)
                    result = {"voted": False, "action": "removed"}
                else:
                    # Change vote - decrement old, increment new
                    await cls._increment_venue_vote_count(db, existing.venue_id, -1)

                    await Vote.objects.filter(db, id=existing.id).update(venue_id=venue_id)
                    await cls._increment_venue_vote_count(db, venue_id, 1)
                    result = {"voted": True, "action": "changed"}
            else:
                # New vote
                await Vote.objects.create(
                    db,
                    period_id=period_id,
                    venue_id=venue_id,
                    member_id=member_id,
                )
                await cls._increment_venue_vote_count(db, venue_id, 1)
                result = {"voted": True, "action": "added"}

            await db.prepare("COMMIT").run()
            return result
        except Exception:
            await db.prepare("ROLLBACK").run()
            raise

    @classmethod
    async def complete_period(cls, db, period_id: str, organizer_id: str) -> dict | None:
        """Complete the voting period and determine winner"""
        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        if not period:
            return None

        # Verify organizer
        if period.organizer_id != organizer_id:
            return None

        if period.status == "completed":
            return await cls._format_period(db, period)

        if period.status != "voting":
            return None

        # Find venue with most votes
        venues = await VenueOption.objects.filter(db, period_id=period_id).all()

        if not venues:
            return None

        winner = sorted(
            venues,
            key=lambda candidate: (
                -candidate.vote_count,
                candidate.created_at,
                str(candidate.id),
            ),
        )[0]
        now = datetime.now(timezone.utc)
        await db.prepare(
            """
            UPDATE lunch_periods
            SET status = 'completed',
                winning_venue_id = ?,
                end_date = ?
            WHERE id = ? AND status = 'voting'
            """
        ).bind(str(winner.id), now, str(period_id)).run()

        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        if not period or period.status != "completed":
            # Someone else won this period in parallel or transition failed.
            return await cls._format_period(db, period) if period else None
        if period.winning_venue_id != str(winner.id):
            winner = await VenueOption.objects.filter(
                db, id=period.winning_venue_id
            ).first()
            if winner is None:
                return await cls._format_period(db, period)
            return await cls._format_period(db, period)

        # Update organizer stats
        await RotationService.increment_organizer_points(db, organizer_id)

        # Update winner stats if there were votes
        if winner.vote_count > 0:
            await RotationService.record_winner(db, winner.proposed_by)

        # Return updated period
        period = await LunchPeriod.objects.filter(db, id=period_id).first()
        return await cls._format_period(db, period)

    @classmethod
    async def get_period_history(
        cls, db, team_id: str, limit: int = 10, offset: int = 0
    ) -> list[dict]:
        """Get completed periods for a team"""
        try:
            periods = await LunchPeriod.objects.filter(db, team_id=team_id, status="completed").all()
            
            # Sort by end_date descending (handle None)
            periods = sorted(periods, key=lambda p: p.end_date or p.created_at, reverse=True)
            
            # Apply pagination
            periods = periods[offset:offset + limit]

            period_ids = [str(period.id) for period in periods]
            if not period_ids:
                return []

            venues = await VenueOption.objects.filter(db, period_id__in=period_ids).all()
            votes = await Vote.objects.filter(db, period_id__in=period_ids).all()
            venues_by_period: dict[str, list] = defaultdict(list)
            for venue in venues:
                venues_by_period[str(venue.period_id)].append(venue)

            votes_by_period: dict[str, list] = defaultdict(list)
            for vote in votes:
                votes_by_period[str(vote.period_id)].append(vote)
            
            result = []
            for period in periods:
                period_id = str(period.id)
                venue_options = venues_by_period.get(period_id, [])
                period_votes = votes_by_period.get(period_id, [])
                formatted = await cls._format_period(
                    db,
                    period,
                    venue_options,
                    period_votes,
                )
                result.append(formatted)

            return result
        except Exception as e:
            print(f"[ERROR] get_period_history: {e}")
            raise

    @classmethod
    async def get_member_for_user(cls, db, team_id: str, user_id: str) -> dict | None:
        """Get team member record for a user"""
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
        }
