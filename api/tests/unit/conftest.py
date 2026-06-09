"""
Pytest configuration for unit tests

Unit tests use Kinglet's built-in testing utilities and don't require pywrangler.
"""

import pytest
import sys
from pathlib import Path

# Add api/src to path for application imports
api_src = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(api_src))


# Override the autouse pywrangler_server fixture from parent conftest
# to prevent it from trying to start pywrangler for unit tests
@pytest.fixture(scope="session", autouse=True)
def pywrangler_server():
    """Disabled for unit tests - we don't need pywrangler"""
    yield None
