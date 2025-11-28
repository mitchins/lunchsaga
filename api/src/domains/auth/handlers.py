"""
Auth Handlers

HTTP handlers for authentication endpoints.
"""

from kinglet import Router

from domains.responses import error, server_error, unauthorized

from .service import AuthService
from .validators import AuthValidators

auth_router = Router()


@auth_router.post("/magic-link")
async def send_magic_link(request):
    """
    Send magic link email with OTP code.

    POST /api/auth/magic-link
    Body: { "email": "user@example.com" }
    Returns: { "sent": true, "email": "user@example.com" }
    """
    body = await request.json() or {}
    email = body.get("email", "")

    # Validate email
    is_valid, err_msg = AuthValidators.validate_email(email)
    if not is_valid:
        return error(err_msg, 400)

    email = AuthValidators.normalize_email(email)

    try:
        result = await AuthService.send_magic_link(request.env.DB, email, request.env)
        return result
    except Exception as e:
        return server_error(str(e))


@auth_router.post("/verify")
async def verify_code(request):
    """
    Verify OTP code or magic link token.

    POST /api/auth/verify
    Body: { "email": "user@example.com", "code": "123456" }
    Returns: { "token": "jwt...", "user": {...} }
    """
    body = await request.json() or {}
    email = body.get("email", "")
    code = body.get("code", "")

    # Validate inputs
    is_valid, err_msg = AuthValidators.validate_email(email)
    if not is_valid:
        return error(err_msg, 400)

    is_valid, err_msg = AuthValidators.validate_code(code)
    if not is_valid:
        return error(err_msg, 400)

    email = AuthValidators.normalize_email(email)

    try:
        result = await AuthService.verify(request.env.DB, email, code, request.env)
        if not result:
            return unauthorized("Invalid or expired code")
        return result
    except Exception as e:
        return server_error(str(e))


@auth_router.get("/me")
async def get_current_user(request):
    """
    Get current authenticated user.

    GET /api/auth/me
    Headers: Authorization: Bearer <token>
    Returns: { "id": "...", "email": "...", "name": "...", "avatar": "..." }
    """
    try:
        user = await AuthService.get_current_user(
            request.env.DB, request, request.env
        )
        if not user:
            return unauthorized()
        return {"user": user}
    except Exception as e:
        return server_error(str(e))


@auth_router.put("/me")
async def update_current_user(request):
    """
    Update current user's profile.

    PUT /api/auth/me
    Headers: Authorization: Bearer <token>
    Body: { "name": "New Name", "avatar": "https://..." }
    Returns: { "user": {...} }
    """
    try:
        user = await AuthService.get_current_user(
            request.env.DB, request, request.env
        )
        if not user:
            return unauthorized()

        body = await request.json() or {}
        updates = {}

        if "name" in body:
            name = body["name"]
            if not name or len(name) > 200:
                return error("Name must be between 1 and 200 characters", 400)
            updates["name"] = name

        if "avatar" in body:
            avatar = body.get("avatar")
            if avatar and len(avatar) > 500:
                return error("Avatar URL must be less than 500 characters", 400)
            updates["avatar"] = avatar

        if not updates:
            return {"user": user}

        updated_user = await AuthService.update_user(
            request.env.DB, user["id"], updates
        )
        if not updated_user:
            return server_error("Failed to update user")

        return {"user": updated_user}
    except Exception as e:
        return server_error(str(e))


@auth_router.post("/logout")
async def logout(request):
    """
    Logout current user.
    Note: JWT tokens are stateless, so this is mainly for client-side cleanup.

    POST /api/auth/logout
    Headers: Authorization: Bearer <token>
    Returns: { "success": true }
    """
    # Verify user is authenticated
    user = await AuthService.get_current_user(request.env.DB, request, request.env)
    if not user:
        return unauthorized()

    # JWT is stateless, so we just return success
    # Client should remove token from storage
    return {"success": True}
