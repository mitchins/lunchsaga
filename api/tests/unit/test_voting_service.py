"""
Unit tests for VotingService edge cases.

These tests cover code paths that were not being exercised by the integration suite
or existing happy-path unit tests.
"""

import pytest
from datetime import datetime, timedelta, timezone

from kinglet.testing import D1Result, D1ResultMeta, MockD1Database

from domains.voting.service import VotingService
from models import LunchPeriod, Vote, VenueOption


@pytest.fixture
async def db():
    database = MockD1Database()
    await LunchPeriod.create_table(database)
    await VenueOption.create_table(database)
    await Vote.create_table(database)
    return database


class TestVotingService:
    @pytest.mark.asyncio
    async def test_increment_venue_vote_count_does_not_go_below_zero(self, db):
        venue = await VenueOption.objects.create(
            db,
            period_id="test-period",
            name="Pizza",
            description="A test venue",
            proposed_by="member-1",
        )

        await VotingService._increment_venue_vote_count(db, str(venue.id), -1)

        updated = await VenueOption.objects.filter(db, id=str(venue.id)).first()
        assert updated is not None
        assert updated.vote_count == 0

    @pytest.mark.asyncio
    async def test_complete_period_returns_current_period_if_completed_elsewhere(self, db, monkeypatch):
        now = datetime.now(timezone.utc)
        period = await LunchPeriod.objects.create(
            db,
            team_id="team-1",
            organizer_id="member-1",
            start_date=now,
            voting_deadline=now + timedelta(hours=1),
            status="voting",
        )
        await VenueOption.objects.create(
            db,
            period_id=str(period.id),
            name="Pizza",
            description="Venue that would win",
            proposed_by="member-1",
        )

        original_prepare = db.prepare

        class _PreparedWrapper:
            def __init__(self, wrapped, sql):
                self._wrapped = wrapped
                self._sql = sql

            def bind(self, *args):
                self._wrapped.bind(*args)
                return self

            async def run(self):
                if (
                    "UPDATE lunch_periods" in self._sql
                    and "status = 'completed'" in self._sql
                ):
                    return D1Result(
                        results=[],
                        meta=D1ResultMeta(
                            duration=0.0,
                            last_row_id=None,
                            changes=0,
                            rows_read=0,
                            rows_written=0,
                            size_after=None,
                        ),
                    )
                return await self._wrapped.run()

        def prepare(sql):
            stmt = original_prepare(sql)
            if "UPDATE lunch_periods" in sql and "status = 'completed'" in sql:
                return _PreparedWrapper(stmt, sql)
            return stmt

        monkeypatch.setattr(db, "prepare", prepare)

        result = await VotingService.complete_period(
            db, str(period.id), "member-1"
        )

        assert result is not None
        assert result["status"] == "voting"
        assert result["winningVenueId"] is None
