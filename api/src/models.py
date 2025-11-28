"""
LunchSaga Data Models

Kinglet ORM models for D1 database.
"""

from kinglet import (
    BooleanField,
    DateTimeField,
    IntegerField,
    JSONField,
    Model,
    StringField,
)


class User(Model):
    """Core user identity"""

    email = StringField(max_length=255, unique=True, null=False)
    name = StringField(max_length=200, null=False)
    avatar = StringField(max_length=500, null=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "users"
        indexes = [("email",)]


class Team(Model):
    """Team/fellowship entity"""

    name = StringField(max_length=100, null=False)
    emoji = StringField(max_length=10, default="🍕")
    color = StringField(max_length=7, default="#10b981")  # hex color
    owner_id = StringField(max_length=36, null=False)
    invite_code = StringField(max_length=8, unique=True, null=False)
    is_holiday_mode = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "teams"
        indexes = [("invite_code",), ("owner_id",)]


class TeamMember(Model):
    """Team membership with stats"""

    team_id = StringField(max_length=36, null=False)
    user_id = StringField(max_length=36, null=False)
    name = StringField(max_length=200, null=False)
    points = IntegerField(default=0)
    reputation_score = IntegerField(default=0)
    total_venues_proposed = IntegerField(default=0)
    total_wins = IntegerField(default=0)
    is_away = BooleanField(default=False)
    joined_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "team_members"
        indexes = [("team_id",), ("user_id",), ("team_id", "points")]


class LunchPeriod(Model):
    """Weekly lunch period"""

    team_id = StringField(max_length=36, null=False)
    organizer_id = StringField(max_length=36, null=False)
    start_date = DateTimeField(null=False)
    end_date = DateTimeField(null=True)
    status = StringField(max_length=20, default="proposing")  # proposing|voting|completed
    voting_deadline = DateTimeField(null=True)
    winning_venue_id = StringField(max_length=36, null=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "lunch_periods"
        indexes = [("team_id",), ("status",), ("team_id", "status")]


class VenueOption(Model):
    """Proposed venue for a period"""

    period_id = StringField(max_length=36, null=False)
    name = StringField(max_length=200, null=False)
    description = StringField(max_length=1000, null=True)
    proposed_by = StringField(max_length=36, null=False)
    vote_count = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "venue_options"
        indexes = [("period_id",)]


class Vote(Model):
    """Individual vote record"""

    period_id = StringField(max_length=36, null=False)
    venue_id = StringField(max_length=36, null=False)
    member_id = StringField(max_length=36, null=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        table_name = "votes"
        indexes = [("period_id", "member_id"), ("venue_id",)]


class MagicLink(Model):
    """Magic link auth tokens"""

    email = StringField(max_length=255, null=False)
    code = StringField(max_length=6, null=False)
    token = StringField(max_length=64, unique=True, null=False)
    expires_at = DateTimeField(null=False)
    used = BooleanField(default=False)

    class Meta:
        table_name = "magic_links"
        indexes = [("token",), ("email",)]


class Achievement(Model):
    """User achievements/badges"""

    member_id = StringField(max_length=36, null=False)
    badge_type = StringField(max_length=50, null=False)  # legendary_curator, streak_master
    earned_at = DateTimeField(auto_now_add=True)
    metadata = JSONField(default=dict)  # Additional context

    class Meta:
        table_name = "achievements"
        indexes = [("member_id",)]
