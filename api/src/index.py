"""
LunchSaga API Entry Point

Main entry point for the Cloudflare Python Worker using Kinglet framework.
"""

import logging

from kinglet import Kinglet
from kinglet.middleware import CorsMiddleware

from domains.auth.handlers import auth_router
from domains.members.handlers import members_router
from domains.teams.handlers import teams_router
from domains.voting.handlers import voting_router

app = Kinglet(debug=False)

# CORS middleware for development
app.add_middleware(
    CorsMiddleware(
        allow_origin="*",  # Will be restricted in production
        allow_methods="GET,POST,PUT,DELETE,OPTIONS",
        allow_headers="Authorization,Content-Type,X-Request-ID",
    )
)

# Register domain routers
app.include_router("/api/auth", auth_router)
app.include_router("/api/teams", teams_router)
app.include_router("/api/voting", voting_router)
app.include_router("/api/members", members_router)


# Health check endpoint
@app.get("/api/health")
async def health_check(request):
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "lunchsaga-api",
        "environment": getattr(request.env, "ENVIRONMENT", "unknown"),
    }


# Schema migration endpoint (dev/staging only)
@app.post("/api/_migrate")
async def migrate_database(request):
    """
    Run database migrations.
    Only available in development/staging environments.
    """
    from kinglet import SchemaManager

    from models import (
        Achievement,
        LunchPeriod,
        MagicLink,
        Team,
        TeamMember,
        User,
        VenueOption,
        Vote,
    )

    env = getattr(request.env, "ENVIRONMENT", "development")
    if env == "production":
        return {"error": "Migrations not allowed in production"}, 403

    # Check for migration token in staging
    if env == "staging":
        auth_header = request.header("Authorization", "")
        expected_token = getattr(request.env, "MIGRATION_TOKEN", "")
        if not expected_token or auth_header != f"Bearer {expected_token}":
            return {"error": "Unauthorized"}, 401

    models = [
        User,
        Team,
        TeamMember,
        LunchPeriod,
        VenueOption,
        Vote,
        MagicLink,
        Achievement,
    ]

    try:
        results = await SchemaManager.migrate_all(request.env.DB, models)
    except Exception as e:
        logging.exception("Migration failed")
        return {"error": "Migration failed"}, 500

    return {
        "status": "migration_complete",
        "results": results,
        "models": [model.__name__ for model in models],
    }


# Reset database endpoint (dev/staging only)
@app.post("/api/_reset")
async def reset_database(request):
    """
    Drop and recreate all tables.
    Only available in development/staging environments.
    """
    from kinglet import SchemaManager

    from models import (
        Achievement,
        LunchPeriod,
        MagicLink,
        Team,
        TeamMember,
        User,
        VenueOption,
        Vote,
    )

    env = getattr(request.env, "ENVIRONMENT", "development")
    if env == "production":
        return {"error": "Reset not allowed in production"}, 403

    # Check for migration token in staging
    if env == "staging":
        auth_header = request.header("Authorization", "")
        expected_token = getattr(request.env, "MIGRATION_TOKEN", "")
        if not expected_token or auth_header != f"Bearer {expected_token}":
            return {"error": "Unauthorized"}, 401

    models = [
        User,
        Team,
        TeamMember,
        LunchPeriod,
        VenueOption,
        Vote,
        MagicLink,
        Achievement,
    ]

    dropped_tables = []
    drop_failures = []

    # Drop tables in reverse order (to handle foreign keys)
    for model in reversed(models):
        try:
            table_name = model.Meta.table_name
            await request.env.DB.prepare(f"DROP TABLE IF EXISTS {table_name}").run()
            dropped_tables.append(table_name)
        except Exception:
            drop_failures.append(model.Meta.table_name)

    if drop_failures:
        return {
            "error": "Failed to drop tables",
            "droppedTables": dropped_tables,
            "failed": drop_failures,
        }, 500

    # Recreate all tables
    try:
        results = await SchemaManager.migrate_all(request.env.DB, models)
    except Exception as e:
        logging.exception("Reset failed")
        return {
            "error": "Reset failed",
            "droppedTables": dropped_tables,
            "droppedTableErrors": drop_failures,
        }, 500

    return {
        "status": "reset_complete",
        "results": results,
        "models": [model.__name__ for model in models],
        "droppedTables": dropped_tables,
        "droppedTableErrors": drop_failures,
    }


# Worker entry point
async def on_fetch(request, env):
    return await app(request, env)
