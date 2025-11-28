"""
Voting Handlers

HTTP handlers for voting endpoints.
"""

from kinglet import Router

from domains.auth.service import AuthService
from domains.responses import error, forbidden, not_found, server_error, unauthorized
from domains.teams.service import TeamService

from .service import VotingService

voting_router = Router()


async def _get_authenticated_user(request) -> dict | None:
    """Helper to get authenticated user from request"""
    return await AuthService.get_current_user(request.env.DB, request, request.env)


@voting_router.get("/teams/{team_id}/period")
async def get_current_period(request):
    """
    Get the current lunch period for a team.

    GET /api/voting/teams/{team_id}/period
    Headers: Authorization: Bearer <token>
    Returns: { "period": {...} | null }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    # Verify membership
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    try:
        period = await VotingService.get_current_period(request.env.DB, team_id)
        return {"period": period}
    except Exception as e:
        return server_error(str(e))


@voting_router.post("/teams/{team_id}/period")
async def start_period(request):
    """
    Start a new lunch period.

    POST /api/voting/teams/{team_id}/period
    Headers: Authorization: Bearer <token>
    Body: { "votingDays": 3 }  (optional)
    Returns: { "period": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    # Verify membership
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    body = await request.json() or {}
    voting_days = body.get("votingDays", 3)

    try:
        period = await VotingService.start_period(
            request.env.DB, team_id, user["id"], voting_days
        )
        if not period:
            return error("Cannot start new period (one may already be active)", 400)
        return {"period": period}
    except Exception as e:
        return server_error(str(e))


@voting_router.post("/periods/{period_id}/venues")
async def propose_venue(request):
    """
    Propose a venue for a period.

    POST /api/voting/periods/{period_id}/venues
    Headers: Authorization: Bearer <token>
    Body: { "name": "Restaurant Name", "description": "Optional description" }
    Returns: { "venue": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    period_id = request.path_param("period_id")
    body = await request.json() or {}

    name = body.get("name", "").strip()
    if not name:
        return error("Venue name is required", 400)
    if len(name) > 200:
        return error("Venue name must be less than 200 characters", 400)

    description = body.get("description", "").strip()
    if len(description) > 1000:
        return error("Description must be less than 1000 characters", 400)

    # Get period to find team
    from models import LunchPeriod

    period = await LunchPeriod.objects.filter(request.env.DB, id=period_id).first()
    if not period:
        return not_found("Period not found")

    # Get member for this user in this team
    member = await VotingService.get_member_for_user(
        request.env.DB, period.team_id, user["id"]
    )
    if not member:
        return forbidden("Not a member of this team")

    try:
        venue = await VotingService.propose_venue(
            request.env.DB, period_id, member["id"], name, description
        )
        if not venue:
            return error("Cannot propose venue (period may not be in proposing state)", 400)
        return {"venue": venue}
    except Exception as e:
        return server_error(str(e))


@voting_router.post("/periods/{period_id}/start-voting")
async def start_voting(request):
    """
    Transition period to voting state (organizer only).

    POST /api/voting/periods/{period_id}/start-voting
    Headers: Authorization: Bearer <token>
    Returns: { "period": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    period_id = request.path_param("period_id")

    # Get period to find team
    from models import LunchPeriod

    period = await LunchPeriod.objects.filter(request.env.DB, id=period_id).first()
    if not period:
        return not_found("Period not found")

    # Get member for this user in this team
    member = await VotingService.get_member_for_user(
        request.env.DB, period.team_id, user["id"]
    )
    if not member:
        return forbidden("Not a member of this team")

    try:
        success = await VotingService.start_voting(request.env.DB, period_id, member["id"])
        if not success:
            return error("Cannot start voting (not organizer or no venues proposed)", 400)
        
        # Fetch the updated period to return
        updated_period = await VotingService.get_current_period(request.env.DB, period.team_id)
        return {"period": updated_period}
    except Exception as e:
        return server_error(str(e))


@voting_router.post("/periods/{period_id}/vote")
async def cast_vote(request):
    """
    Cast a vote for a venue.

    POST /api/voting/periods/{period_id}/vote
    Headers: Authorization: Bearer <token>
    Body: { "venueId": "venue-uuid" }
    Returns: { "voted": true, "action": "added" | "changed" | "removed" }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    period_id = request.path_param("period_id")
    body = await request.json() or {}

    venue_id = body.get("venueId", "")
    if not venue_id:
        return error("Venue ID is required", 400)

    # Get period to find team
    from models import LunchPeriod

    period = await LunchPeriod.objects.filter(request.env.DB, id=period_id).first()
    if not period:
        return not_found("Period not found")

    # Get member for this user in this team
    member = await VotingService.get_member_for_user(
        request.env.DB, period.team_id, user["id"]
    )
    if not member:
        return forbidden("Not a member of this team")

    try:
        result = await VotingService.cast_vote(
            request.env.DB, period_id, venue_id, member["id"]
        )
        if "error" in result:
            return error(result["error"], 400)
        return result
    except Exception as e:
        return server_error(str(e))


@voting_router.post("/periods/{period_id}/complete")
async def complete_period(request):
    """
    Complete voting and determine winner (organizer only).

    POST /api/voting/periods/{period_id}/complete
    Headers: Authorization: Bearer <token>
    Returns: { "period": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    period_id = request.path_param("period_id")

    # Get period to find team
    from models import LunchPeriod

    period = await LunchPeriod.objects.filter(request.env.DB, id=period_id).first()
    if not period:
        return not_found("Period not found")

    # Get member for this user in this team
    member = await VotingService.get_member_for_user(
        request.env.DB, period.team_id, user["id"]
    )
    if not member:
        return forbidden("Not a member of this team")

    try:
        completed = await VotingService.complete_period(
            request.env.DB, period_id, member["id"]
        )
        if not completed:
            return error("Cannot complete period (not organizer or not in voting state)", 400)
        return {"period": completed}
    except Exception as e:
        return server_error(str(e))


@voting_router.get("/teams/{team_id}/history")
async def get_period_history(request):
    """
    Get completed periods for a team.

    GET /api/voting/teams/{team_id}/history?limit=10&offset=0
    Headers: Authorization: Bearer <token>
    Returns: { "history": [...] }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    # Verify membership
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    # Parse pagination params
    limit = int(request.query_param("limit", "10"))
    offset = int(request.query_param("offset", "0"))

    limit = min(max(limit, 1), 50)  # Clamp between 1 and 50
    offset = max(offset, 0)

    try:
        history = await VotingService.get_period_history(
            request.env.DB, team_id, limit, offset
        )
        return {"history": history}
    except Exception as e:
        return server_error(str(e))
