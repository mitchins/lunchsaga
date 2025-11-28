"""
Teams Handlers

HTTP handlers for team management endpoints.
"""

from kinglet import Router

from domains.auth.service import AuthService
from domains.responses import error, forbidden, not_found, server_error, unauthorized

from .rotation import RotationService
from .service import TeamService

teams_router = Router()


async def _get_authenticated_user(request) -> dict | None:
    """Helper to get authenticated user from request"""
    return await AuthService.get_current_user(request.env.DB, request, request.env)


@teams_router.get("")
async def list_teams(request):
    """
    List all teams the current user is a member of.

    GET /api/teams
    Headers: Authorization: Bearer <token>
    Returns: { "teams": [...] }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    try:
        teams = await TeamService.get_teams_for_user(request.env.DB, user["id"])
        return {"teams": teams}
    except Exception as e:
        return server_error(str(e))


@teams_router.post("")
async def create_team(request):
    """
    Create a new team.

    POST /api/teams
    Headers: Authorization: Bearer <token>
    Body: { "name": "Team Name", "emoji": "🍕", "color": "#10b981" }
    Returns: { "team": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    body = await request.json() or {}
    name = body.get("name", "").strip()

    if not name:
        return error("Team name is required", 400)
    if len(name) > 100:
        return error("Team name must be less than 100 characters", 400)

    emoji = body.get("emoji", "🍕")
    color = body.get("color", "#10b981")

    try:
        team = await TeamService.create_team(
            request.env.DB, user["id"], name, emoji, color
        )
        return {"team": team}
    except Exception as e:
        return server_error(str(e))


@teams_router.get("/{team_id}")
async def get_team(request):
    """
    Get team details.

    GET /api/teams/{team_id}
    Headers: Authorization: Bearer <token>
    Returns: { "team": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    try:
        team = await TeamService.get_team(request.env.DB, team_id, user["id"])
        if not team:
            return not_found("Team not found or not a member")
        return {"team": team}
    except Exception as e:
        return server_error(str(e))


@teams_router.put("/{team_id}")
async def update_team(request):
    """
    Update team details (owner only).

    PUT /api/teams/{team_id}
    Headers: Authorization: Bearer <token>
    Body: { "name": "New Name", "emoji": "🍔", "color": "#ff0000", "isHolidayMode": true }
    Returns: { "team": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    body = await request.json() or {}

    try:
        team = await TeamService.update_team(request.env.DB, team_id, user["id"], body)
        if not team:
            return forbidden("Team not found or not the owner")
        return {"team": team}
    except Exception as e:
        return server_error(str(e))


@teams_router.post("/join")
async def join_team(request):
    """
    Join a team using an invite code.

    POST /api/teams/join
    Headers: Authorization: Bearer <token>
    Body: { "inviteCode": "ABC123" }
    Returns: { "team": {...}, "alreadyMember": false }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    body = await request.json() or {}
    invite_code = body.get("inviteCode", "").strip().upper()

    if not invite_code:
        return error("Invite code is required", 400)

    try:
        result = await TeamService.join_team(request.env.DB, user["id"], invite_code)
        if not result:
            return not_found("Invalid invite code")
        return {"team": result, "alreadyMember": result.get("alreadyMember", False)}
    except Exception as e:
        return server_error(str(e))


@teams_router.delete("/{team_id}/leave")
async def leave_team(request):
    """
    Leave a team.

    DELETE /api/teams/{team_id}/leave
    Headers: Authorization: Bearer <token>
    Returns: { "success": true }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    try:
        success = await TeamService.leave_team(request.env.DB, team_id, user["id"])
        if not success:
            return error("Cannot leave team (owner cannot leave)", 400)
        return {"success": True}
    except Exception as e:
        return server_error(str(e))


@teams_router.get("/{team_id}/members")
async def get_team_members(request):
    """
    Get all members of a team.

    GET /api/teams/{team_id}/members
    Headers: Authorization: Bearer <token>
    Returns: { "members": [...] }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    try:
        members = await TeamService.get_team_members(request.env.DB, team_id, user["id"])
        if members is None:
            return not_found("Team not found or not a member")
        return {"members": members}
    except Exception as e:
        return server_error(str(e))


@teams_router.get("/{team_id}/next-organizer")
async def get_next_organizer(request):
    """
    Get the next organizer for the team.

    GET /api/teams/{team_id}/next-organizer
    Headers: Authorization: Bearer <token>
    Returns: { "organizer": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    # Verify membership
    members = await TeamService.get_team_members(request.env.DB, team_id, user["id"])
    if members is None:
        return not_found("Team not found or not a member")

    try:
        organizer = await RotationService.get_next_organizer(request.env.DB, team_id)
        return {"organizer": organizer}
    except Exception as e:
        return server_error(str(e))


@teams_router.post("/{team_id}/regenerate-invite")
async def regenerate_invite_code(request):
    """
    Regenerate the team's invite code (owner only).

    POST /api/teams/{team_id}/regenerate-invite
    Headers: Authorization: Bearer <token>
    Returns: { "inviteCode": "NEWCODE" }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    try:
        new_code = await TeamService.regenerate_invite_code(
            request.env.DB, team_id, user["id"]
        )
        if not new_code:
            return forbidden("Team not found or not the owner")
        return {"inviteCode": new_code}
    except Exception as e:
        return server_error(str(e))


@teams_router.put("/{team_id}/members/me/away")
async def update_my_away_status(request):
    """
    Update current user's away status in a team.

    PUT /api/teams/{team_id}/members/me/away
    Headers: Authorization: Bearer <token>
    Body: { "away": true }
    Returns: { "member": {...} }
    """
    from domains.members.service import MembersService
    
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    body = await request.json() or {}

    is_away = body.get("away", body.get("isAway", False))

    # Get current user's member record for this team
    member = await MembersService.get_member_for_user(request.env.DB, team_id, user["id"])
    if not member:
        return not_found("Not a member of this team")

    try:
        result = await MembersService.update_away_status(
            request.env.DB, member["id"], is_away, user["id"]
        )
        if not result:
            return forbidden("Failed to update away status")
        return {"member": result}
    except Exception as e:
        return server_error(str(e))


@teams_router.get("/{team_id}/members/me/stats")
async def get_my_stats(request):
    """
    Get detailed stats for the current user in a team.

    GET /api/teams/{team_id}/members/me/stats
    Headers: Authorization: Bearer <token>
    Returns: { "stats": {...} }
    """
    from domains.members.service import MembersService
    
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")

    # Get current user's member record for this team
    member = await MembersService.get_member_for_user(request.env.DB, team_id, user["id"])
    if not member:
        return not_found("Not a member of this team")

    try:
        stats = await MembersService.get_member_stats(
            request.env.DB, member["id"], user["id"]
        )
        if not stats:
            return not_found("Stats not available")
        return {"stats": stats}
    except Exception as e:
        return server_error(str(e))
