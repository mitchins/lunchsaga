"""
LunchSaga API - Minimal test entry point
"""

from kinglet import Kinglet

app = Kinglet(debug=True)


# Health check endpoint
@app.get("/api/health")
async def health_check(request):
    """Health check endpoint"""
    try:
        env_val = getattr(request.env, "ENVIRONMENT", "unknown")
        return {
            "status": "healthy",
            "service": "lunchsaga-api",
            "environment": env_val,
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }


# Worker entry point
async def on_fetch(request, env):
    try:
        return await app(request, env)
    except Exception as e:
        import traceback
        from js import Response as JSResponse
        error_body = f"FATAL: {type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        return JSResponse.new(error_body, status=500)
