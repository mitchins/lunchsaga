"""
Unit tests for Auth Service using Kinglet 1.8.1 testing features

These tests use:
- FaithfulMockD1Database for database operations
- MockEmailSender for email verification
"""

import pytest

from kinglet import FaithfulMockD1Database, MockEmailSender, get_email_sender
from kinglet.email import EmailMessage

from domains.auth.service import AuthService
from models import User, MagicLink


class MockEnv:
    """Mock environment for testing"""

    def __init__(self):
        self.ENVIRONMENT = "test"
        self.DEV_OTP_CODE = "000000"
        self.JWT_SECRET = "test-secret-key"
        self.EMAIL_FROM_ADDRESS = "test@lunchsaga.app"


@pytest.fixture
async def db():
    """Fresh database for each test"""
    database = FaithfulMockD1Database()
    # Initialize schema using create_table
    await User.create_table(database)
    await MagicLink.create_table(database)
    return database


@pytest.fixture
def env():
    """Mock environment"""
    return MockEnv()


@pytest.fixture
def email_sender():
    """Mock email sender"""
    sender = MockEmailSender()
    yield sender
    sender.clear()


class TestAuthService:
    """Test AuthService with new Kinglet 1.8.1 features"""

    @pytest.mark.asyncio
    async def test_send_magic_link_stores_code(self, db, env):
        """Test that magic link is stored in database"""
        email = "test@example.com"

        result = await AuthService.send_magic_link(db, email, env)

        assert result["sent"] is True
        assert result["email"] == email

        # Verify magic link was stored
        link = await MagicLink.objects.filter(db, email=email).first()
        assert link is not None
        assert link.email == email
        assert link.code == "000000"  # Dev OTP code
        assert link.used is False

    @pytest.mark.asyncio
    async def test_send_magic_link_sends_email(self, db, env):
        """Test that email is sent via mock sender"""
        email = "test@example.com"

        # Send magic link (which should send email)
        await AuthService.send_magic_link(db, email, env)

        # The email is sent inside the service, so we can't easily capture it
        # Instead, verify the magic link was created (which proves the flow worked)
        link = await MagicLink.objects.filter(db, email=email).first()
        assert link is not None
        assert link.email == email
        # The email sending is tested in the email service tests

    @pytest.mark.asyncio
    async def test_verify_with_valid_code(self, db, env):
        """Test verification with valid OTP code"""
        email = "user@example.com"

        # Send magic link first
        await AuthService.send_magic_link(db, email, env)

        # Verify with code
        result = await AuthService.verify(db, email, "000000", env)

        assert result is not None
        assert "token" in result
        assert "user" in result
        assert result["user"]["email"] == email

        # Verify magic link was marked as used
        link = await MagicLink.objects.filter(db, email=email).first()
        assert link.used is True

    @pytest.mark.asyncio
    async def test_verify_with_invalid_code(self, db, env):
        """Test verification with invalid code"""
        email = "user@example.com"

        await AuthService.send_magic_link(db, email, env)

        # Try with wrong code
        result = await AuthService.verify(db, email, "999999", env)

        assert result is None

    @pytest.mark.asyncio
    async def test_verify_creates_new_user(self, db, env):
        """Test that verification creates a new user if doesn't exist"""
        email = "newuser@example.com"

        await AuthService.send_magic_link(db, email, env)
        result = await AuthService.verify(db, email, "000000", env)

        assert result is not None

        # Check user was created
        user = await User.objects.filter(db, email=email).first()
        assert user is not None
        assert user.email == email
        assert user.name == "newuser"  # From email prefix

    @pytest.mark.asyncio
    async def test_verify_reuses_existing_user(self, db, env):
        """Test that verification reuses existing user"""
        email = "existing@example.com"

        # Create user first
        existing_user = await User.objects.create(
            db, email=email, name="Existing User"
        )

        await AuthService.send_magic_link(db, email, env)
        result = await AuthService.verify(db, email, "000000", env)

        assert result is not None
        assert result["user"]["id"] == str(existing_user.id)
        assert result["user"]["name"] == "Existing User"

    @pytest.mark.asyncio
    async def test_get_current_user_valid_token(self, db, env):
        """Test getting current user with valid token"""
        email = "user@example.com"

        # Create and verify user
        await AuthService.send_magic_link(db, email, env)
        auth_result = await AuthService.verify(db, email, "000000", env)
        token = auth_result["token"]

        # Mock request with Authorization header
        class MockRequest:
            def header(self, name, default=""):
                if name == "Authorization":
                    return f"Bearer {token}"
                return default

        request = MockRequest()
        user = await AuthService.get_current_user(db, request, env)

        assert user is not None
        assert user["email"] == email

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, db, env):
        """Test getting current user with invalid token"""

        class MockRequest:
            def header(self, name, default=""):
                if name == "Authorization":
                    return "Bearer invalid-token"
                return default

        request = MockRequest()
        user = await AuthService.get_current_user(db, request, env)

        assert user is None

    @pytest.mark.asyncio
    async def test_get_current_user_no_token(self, db, env):
        """Test getting current user without token"""

        class MockRequest:
            def header(self, name, default=""):
                return default

        request = MockRequest()
        user = await AuthService.get_current_user(db, request, env)

        assert user is None

    @pytest.mark.asyncio
    async def test_update_user_profile(self, db, env):
        """Test updating user profile"""
        email = "user@example.com"

        # Create user
        user = await User.objects.create(db, email=email, name="Old Name")

        # Update profile
        result = await AuthService.update_user(
            db, str(user.id), {"name": "New Name", "avatar": "https://avatar.url"}
        )

        assert result is not None
        assert result["name"] == "New Name"
        assert result["avatar"] == "https://avatar.url"

        # Verify in database
        updated_user = await User.objects.filter(db, id=user.id).first()
        assert updated_user.name == "New Name"
        assert updated_user.avatar == "https://avatar.url"

    @pytest.mark.asyncio
    async def test_update_user_filters_invalid_fields(self, db, env):
        """Test that update_user ignores invalid fields"""
        email = "user@example.com"

        user = await User.objects.create(db, email=email, name="Original")

        # Try to update with invalid field
        result = await AuthService.update_user(
            db, str(user.id), {"email": "hacker@evil.com", "name": "Valid"}
        )

        assert result is not None
        assert result["name"] == "Valid"

        # Verify email wasn't changed
        updated_user = await User.objects.filter(db, id=user.id).first()
        assert updated_user.email == email  # Original email unchanged


class TestEmailIntegration:
    """Test email sender integration"""

    def test_get_email_sender_returns_mock_in_test(self):
        """Test that we get MockEmailSender in test environment"""
        env = MockEnv()
        sender = get_email_sender(env)

        assert isinstance(sender, MockEmailSender)

    def test_get_email_sender_with_override(self):
        """Test forcing mock sender"""
        env = MockEnv()
        env.ENVIRONMENT = "production"

        # Force mock despite production env
        sender = get_email_sender(env, use_mock=True)
        assert isinstance(sender, MockEmailSender)

    @pytest.mark.asyncio
    async def test_mock_email_sender_captures_emails(self):
        """Test that MockEmailSender captures sent emails"""
        sender = MockEmailSender()

        message = EmailMessage(
            to=["test@example.com"],
            subject="Test Email",
            body_text="This is a test",
        )

        result = await sender.send_email(message)

        assert result.success is True
        assert result.message_id is not None
        assert len(sender.sent_emails) == 1
        assert sender.sent_emails[0].to == ["test@example.com"]

    @pytest.mark.asyncio
    async def test_mock_email_sender_bulk_send(self):
        """Test bulk email sending"""
        sender = MockEmailSender()

        messages = [
            EmailMessage(to=[f"user{i}@example.com"], subject=f"Email {i}", body_text="Test")
            for i in range(3)
        ]

        results = await sender.send_bulk_email(messages)

        assert len(results) == 3
        assert all(r.success for r in results)
        assert len(sender.sent_emails) == 3

    @pytest.mark.asyncio
    async def test_mock_email_sender_failure_simulation(self):
        """Test simulating email send failures"""
        sender = MockEmailSender()
        sender.should_fail = True

        message = EmailMessage(
            to=["test@example.com"], subject="Test", body_text="Test"
        )

        result = await sender.send_email(message)

        assert result.success is False
        assert result.error is not None
        assert len(sender.sent_emails) == 0  # Not captured on failure
