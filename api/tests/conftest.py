"""
Pytest configuration and shared fixtures for API integration tests.

This module provides fixtures that automatically manage the pywrangler dev server
lifecycle for integration testing. The server is started once per test session
and shared across all tests.

Usage:
    pytest api/tests/ -v

The fixtures will automatically:
1. Start pywrangler dev on an available port
2. Wait for the server to be ready
3. Provide an async HTTP client for tests
4. Clean up the server after all tests complete
"""

import asyncio
import os
import signal
import socket
import subprocess
import sys
import time
from contextlib import closing
from pathlib import Path

import httpx
import pytest


# Test configuration
DEV_OTP_CODE = "000000"
STARTUP_TIMEOUT = 60  # seconds to wait for server
HEALTH_CHECK_INTERVAL = 0.5  # seconds between health checks


def find_free_port() -> int:
    """Find an available port on localhost."""
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(("", 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]


def get_project_root() -> Path:
    """Get the project root directory (where wrangler.toml is)."""
    current = Path(__file__).parent
    while current != current.parent:
        if (current / "wrangler.toml").exists():
            return current
        current = current.parent
    raise RuntimeError("Could not find project root (no wrangler.toml found)")


class PywranglerServer:
    """Manages the pywrangler dev server lifecycle."""
    
    def __init__(self, port: int):
        self.port = port
        self.base_url = f"http://localhost:{port}"
        self.process: subprocess.Popen | None = None
        self.project_root = get_project_root()
    
    def start(self) -> None:
        """Start the pywrangler dev server."""
        if self.process is not None:
            return
        
        # Use 'uv' command directly (not python -m uv) 
        cmd = [
            "uv", "run", "pywrangler", "dev",
            "--port", str(self.port),
            "--local",
        ]
        
        # Start the server process
        self.process = subprocess.Popen(
            cmd,
            cwd=str(self.project_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            # Use process group so we can kill all child processes
            preexec_fn=os.setsid if sys.platform != "win32" else None,
        )
        
        # Wait for server to be ready
        start_time = time.time()
        while time.time() - start_time < STARTUP_TIMEOUT:
            try:
                response = httpx.get(f"{self.base_url}/api/health", timeout=2.0)
                if response.status_code == 200:
                    return
            except (httpx.ConnectError, httpx.TimeoutException):
                pass
            
            # Check if process died
            if self.process.poll() is not None:
                stdout, _ = self.process.communicate()
                raise RuntimeError(
                    f"pywrangler dev failed to start:\n{stdout}"
                )
            
            time.sleep(HEALTH_CHECK_INTERVAL)
        
        # Timeout - kill the process and raise
        self.stop()
        raise RuntimeError(
            f"pywrangler dev did not become ready within {STARTUP_TIMEOUT}s"
        )
    
    def stop(self) -> None:
        """Stop the pywrangler dev server."""
        if self.process is None:
            return
        
        # Kill the entire process group
        if sys.platform != "win32":
            try:
                os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)
            except ProcessLookupError:
                pass
        else:
            self.process.terminate()
        
        # Wait for process to exit
        try:
            self.process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            if sys.platform != "win32":
                os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
            else:
                self.process.kill()
            self.process.wait()
        
        self.process = None


# Session-scoped server instance
_server: PywranglerServer | None = None


@pytest.fixture(scope="session")
def server_port() -> int:
    """Get an available port for the test server."""
    return find_free_port()


@pytest.fixture(scope="session")
def base_url(server_port: int) -> str:
    """Base URL for the API."""
    return f"http://localhost:{server_port}"


@pytest.fixture(scope="session")
def otp_code() -> str:
    """Dev OTP code for auth bypass."""
    return DEV_OTP_CODE


@pytest.fixture(scope="session", autouse=True)
def pywrangler_server(server_port: int) -> PywranglerServer:
    """
    Start pywrangler dev server for the test session.
    
    This fixture is session-scoped and autouse, so it starts once
    before any tests run and stops after all tests complete.
    """
    global _server
    
    _server = PywranglerServer(server_port)
    _server.start()
    
    yield _server
    
    _server.stop()
    _server = None


@pytest.fixture
async def client(base_url: str) -> httpx.AsyncClient:
    """Async HTTP client for API tests."""
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        yield client


@pytest.fixture
async def reset_db(client: httpx.AsyncClient) -> None:
    """Reset and migrate database before a test."""
    await client.post("/api/_reset")
    await client.post("/api/_migrate")


@pytest.fixture
async def auth_token(client: httpx.AsyncClient, reset_db: None) -> str:
    """Get an auth token for testing."""
    email = "test@lunchsaga.test"
    
    # Request magic link
    response = await client.post("/api/auth/magic-link", json={"email": email})
    assert response.status_code == 200
    
    # Verify with dev OTP
    response = await client.post(
        "/api/auth/verify", json={"email": email, "code": DEV_OTP_CODE}
    )
    assert response.status_code == 200
    return response.json()["token"]


@pytest.fixture
def auth_headers(auth_token: str) -> dict[str, str]:
    """Auth headers for authenticated requests."""
    return {"Authorization": f"Bearer {auth_token}"}


# Helper functions for test setup
async def create_authenticated_user(
    client: httpx.AsyncClient, email: str, otp_code: str = DEV_OTP_CODE
) -> dict:
    """Helper to create and authenticate a user."""
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


async def create_team_with_owner(
    client: httpx.AsyncClient, owner_headers: dict[str, str], team_data: dict
) -> dict:
    """Helper to create a team."""
    response = await client.post("/api/teams", json=team_data, headers=owner_headers)
    return response.json()["team"]

