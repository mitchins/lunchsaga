"""
Pytest configuration and shared fixtures for API tests.
"""

import pytest
import httpx

# Test server configuration
BASE_URL = "http://localhost:3757"
DEV_OTP_CODE = "000000"


@pytest.fixture(scope="session")
def base_url():
    """Base URL for the API"""
    return BASE_URL


@pytest.fixture(scope="session")
def otp_code():
    """Dev OTP code for auth bypass"""
    return DEV_OTP_CODE


@pytest.fixture
async def async_client():
    """Async HTTP client for API tests"""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        yield client


@pytest.fixture
async def clean_db(async_client):
    """Reset and migrate database"""
    await async_client.post("/api/_reset")
    await async_client.post("/api/_migrate")
    return True


async def create_authenticated_user(client, email: str, otp_code: str):
    """Helper to create and authenticate a user"""
    await client.post("/api/auth/magic-link", json={"email": email})
    response = await client.post(
        "/api/auth/verify", json={"email": email, "code": otp_code}
    )
    data = response.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


async def create_team_with_owner(client, owner_headers: dict, team_data: dict):
    """Helper to create a team"""
    response = await client.post("/api/teams", json=team_data, headers=owner_headers)
    return response.json()["team"]
