"""
Response Helpers

Provides standardized response functions for API handlers.
Kinglet doesn't support Flask-style tuple returns, so we use Response objects.
"""

from kinglet import Response


def success(data: dict, status: int = 200) -> Response:
    """Create a successful response"""
    return Response(data, status=status)


def error(message: str, status: int = 400) -> Response:
    """Create an error response"""
    return Response({"error": message}, status=status)


def unauthorized(message: str = "Unauthorized") -> Response:
    """Create a 401 Unauthorized response"""
    return Response({"error": message}, status=401)


def forbidden(message: str = "Forbidden") -> Response:
    """Create a 403 Forbidden response"""
    return Response({"error": message}, status=403)


def not_found(message: str = "Not found") -> Response:
    """Create a 404 Not Found response"""
    return Response({"error": message}, status=404)


def server_error(message: str = "Internal server error") -> Response:
    """Create a 500 Internal Server Error response"""
    return Response({"error": message}, status=500)
