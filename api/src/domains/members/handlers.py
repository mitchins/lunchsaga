"""
Members Handlers

HTTP handlers for member management endpoints.
"""

from kinglet import Router

from domains.auth.service import AuthService
from domains.responses import error, forbidden, not_found, server_error, unauthorized
from domains.teams.service import TeamService

from .service import MembersService

members_router = Router()


async def _get_authenticated_user(request) -> dict | None:
    """Helper to get authenticated user from request"""
    return await AuthService.get_current_user(request.env.DB, request, request.env)


@members_router.post("/teams/{team_id}/members")
async def add_member(request):
    """
    Add a member to a team by email (owner only).

    POST /api/members/teams/{team_id}/members
    Headers: Authorization: Bearer <token>
    Body: { "email": "user@example.com" }
    Returns: { "member": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    body = await request.json() or {}

    email = body.get("email", "").strip().lower()
    if not email:
        return error("Email is required", 400)

    try:
        result = await MembersService.add_member(
            request.env.DB, team_id, email, user["id"]
        )
        if result is None:
            return forbidden("Team not found or not the owner")
        if "error" in result:
            return error(result["error"], 400)
        return {"member": result}
    except Exception as e:
        return server_error(str(e))


@members_router.delete("/teams/{team_id}/members/{member_id}")
async def remove_member(request):
    """
    Remove a member from a team (owner only).

    DELETE /api/members/teams/{team_id}/members/{member_id}
    Headers: Authorization: Bearer <token>
    Returns: { "success": true }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    member_id = request.path_param("member_id")

    try:
        success = await MembersService.remove_member(
            request.env.DB, team_id, member_id, user["id"]
        )
        if not success:
            return forbidden("Cannot remove member (not owner or member is owner)")
        return {"success": True}
    except Exception as e:
        return server_error(str(e))


@members_router.put("/teams/{team_id}/members/me/away")
async def update_my_away_status(request):
    """
    Update current user's away status.

    PUT /api/members/teams/{team_id}/members/me/away
    Headers: Authorization: Bearer <token>
    Body: { "away": true }
    Returns: { "member": {...} }
    """
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


@members_router.get("/teams/{team_id}/members/me/stats")
async def get_my_stats(request):
    """
    Get detailed stats for the current user.

    GET /api/members/teams/{team_id}/members/me/stats
    Headers: Authorization: Bearer <token>
    Returns: { "stats": {...} }
    """
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


@members_router.put("/teams/{team_id}/members/{member_id}/away")
async def update_away_status(request):
    """
    Update member's away status.

    PUT /api/members/teams/{team_id}/members/{member_id}/away
    Headers: Authorization: Bearer <token>
    Body: { "isAway": true }
    Returns: { "member": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    member_id = request.path_param("member_id")
    body = await request.json() or {}

    is_away = body.get("isAway", False)

    # Verify membership in team
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    try:
        result = await MembersService.update_away_status(
            request.env.DB, member_id, is_away, user["id"]
        )
        if not result:
            return forbidden("Member not found or not authorized")
        return {"member": result}
    except Exception as e:
        return server_error(str(e))


@members_router.get("/teams/{team_id}/members/{member_id}/stats")
async def get_member_stats(request):
    """
    Get detailed stats for a member.

    GET /api/members/teams/{team_id}/members/{member_id}/stats
    Headers: Authorization: Bearer <token>
    Returns: { "stats": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    member_id = request.path_param("member_id")

    # Verify membership in team
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    try:
        stats = await MembersService.get_member_stats(
            request.env.DB, member_id, user["id"]
        )
        if not stats:
            return not_found("Member not found")
        return {"stats": stats}
    except Exception as e:
        return server_error(str(e))


@members_router.put("/teams/{team_id}/members/{member_id}/name")
async def update_member_name(request):
    """
    Update member's display name.

    PUT /api/members/teams/{team_id}/members/{member_id}/name
    Headers: Authorization: Bearer <token>
    Body: { "name": "New Name" }
    Returns: { "member": {...} }
    """
    user = await _get_authenticated_user(request)
    if not user:
        return unauthorized()

    team_id = request.path_param("team_id")
    member_id = request.path_param("member_id")
    body = await request.json() or {}

    name = body.get("name", "").strip()
    if not name:
        return error("Name is required", 400)
    if len(name) > 200:
        return error("Name must be less than 200 characters", 400)

    # Verify membership in team
    team = await TeamService.get_team(request.env.DB, team_id, user["id"])
    if not team:
        return not_found("Team not found or not a member")

    try:
        result = await MembersService.update_member_name(
            request.env.DB, member_id, name, user["id"]
        )
        if not result:
            return forbidden("Member not found or not authorized")
        return {"member": result}
    except Exception as e:
        return server_error(str(e))
