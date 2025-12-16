"""
Test email service module - Kinglet 1.8.1 feature

These tests demonstrate the new email capabilities in Kinglet 1.8.1:
- MockEmailSender for testing
- SESEmailSender for production (requires boto3)
- EmailMessage and EmailSendResult data classes
"""

import pytest

from kinglet.email import (
    EmailMessage,
    EmailSendResult,
    MockEmailSender,
    SESEmailSender,
    get_email_sender,
)


class TestMockEmailSender:
    """Test the mock email sender for development/testing"""

    @pytest.mark.asyncio
    async def test_send_email_success(self):
        """Test sending a single email"""
        sender = MockEmailSender()

        message = EmailMessage(
            to=["user@example.com"],
            subject="Test Email",
            body_text="This is a test message",
            from_address="noreply@app.com",
        )

        result = await sender.send_email(message)

        assert result.success is True
        assert result.message_id is not None
        assert result.error is None

    @pytest.mark.asyncio
    async def test_send_email_with_html(self):
        """Test sending email with HTML body"""
        sender = MockEmailSender()

        message = EmailMessage(
            to=["user@example.com"],
            subject="HTML Email",
            body_text="Plain text fallback",
            body_html="<h1>HTML Content</h1>",
        )

        result = await sender.send_email(message)

        assert result.success is True
        assert len(sender.sent_emails) == 1
        assert sender.sent_emails[0].body_html == "<h1>HTML Content</h1>"

    @pytest.mark.asyncio
    async def test_send_email_captures_in_memory(self):
        """Test that emails are captured for assertions"""
        sender = MockEmailSender()

        # Send multiple emails
        for i in range(3):
            message = EmailMessage(
                to=[f"user{i}@example.com"],
                subject=f"Email {i}",
                body_text=f"Message {i}",
            )
            await sender.send_email(message)

        assert len(sender.sent_emails) == 3
        assert sender.sent_emails[0].to == ["user0@example.com"]
        assert sender.sent_emails[2].subject == "Email 2"

    @pytest.mark.asyncio
    async def test_get_sent_to_filter(self):
        """Test filtering emails by recipient"""
        sender = MockEmailSender()

        await sender.send_email(
            EmailMessage(to=["alice@example.com"], subject="To Alice", body_text="Hi")
        )
        await sender.send_email(
            EmailMessage(to=["bob@example.com"], subject="To Bob", body_text="Hello")
        )
        await sender.send_email(
            EmailMessage(
                to=["alice@example.com"], subject="To Alice Again", body_text="Hey"
            )
        )

        alice_emails = sender.get_sent_to("alice@example.com")
        assert len(alice_emails) == 2
        assert all("alice@example.com" in email.to for email in alice_emails)

    @pytest.mark.asyncio
    async def test_get_latest_email(self):
        """Test getting the most recent email"""
        sender = MockEmailSender()

        await sender.send_email(
            EmailMessage(to=["user1@example.com"], subject="First", body_text="1")
        )
        await sender.send_email(
            EmailMessage(to=["user2@example.com"], subject="Second", body_text="2")
        )

        latest = sender.get_latest_email()
        assert latest is not None
        assert latest.subject == "Second"

    @pytest.mark.asyncio
    async def test_clear_emails(self):
        """Test clearing sent emails"""
        sender = MockEmailSender()

        await sender.send_email(
            EmailMessage(to=["user@example.com"], subject="Test", body_text="Test")
        )
        assert len(sender.sent_emails) == 1

        sender.clear()
        assert len(sender.sent_emails) == 0

    @pytest.mark.asyncio
    async def test_simulate_failure(self):
        """Test simulating email send failures"""
        sender = MockEmailSender()
        sender.should_fail = True

        message = EmailMessage(
            to=["user@example.com"], subject="Test", body_text="Test"
        )

        result = await sender.send_email(message)

        assert result.success is False
        assert result.error is not None
        assert len(sender.sent_emails) == 0  # Failed emails not captured

    @pytest.mark.asyncio
    async def test_send_bulk_email(self):
        """Test sending multiple emails at once"""
        sender = MockEmailSender()

        messages = [
            EmailMessage(to=[f"user{i}@example.com"], subject=f"Email {i}", body_text=f"Message {i}")
            for i in range(5)
        ]

        results = await sender.send_bulk_email(messages)

        assert len(results) == 5
        assert all(r.success for r in results)
        assert len(sender.sent_emails) == 5

    @pytest.mark.asyncio
    async def test_send_delay_simulation(self):
        """Test simulating network delay"""
        import time

        sender = MockEmailSender()
        sender.set_send_delay(0.1)  # 100ms delay

        message = EmailMessage(
            to=["user@example.com"], subject="Test", body_text="Test"
        )

        start = time.time()
        result = await sender.send_email(message)
        elapsed = time.time() - start

        assert elapsed >= 0.1
        assert result.success is True


class TestEmailFactory:
    """Test the email sender factory function"""

    def test_get_mock_sender_in_test_env(self):
        """Test that test environment gets MockEmailSender"""

        class MockEnv:
            ENVIRONMENT = "test"

        sender = get_email_sender(MockEnv())
        assert isinstance(sender, MockEmailSender)

    def test_get_mock_sender_in_dev_env(self):
        """Test that development environment gets MockEmailSender"""

        class MockEnv:
            ENVIRONMENT = "development"

        sender = get_email_sender(MockEnv())
        assert isinstance(sender, MockEmailSender)

    def test_get_ses_sender_in_prod_env(self):
        """Test that production environment gets SESEmailSender"""

        class MockEnv:
            ENVIRONMENT = "production"
            AWS_REGION = "us-east-1"
            EMAIL_FROM_ADDRESS = "noreply@app.com"

        sender = get_email_sender(MockEnv())
        assert isinstance(sender, SESEmailSender)

    def test_force_mock_with_override(self):
        """Test forcing mock sender with use_mock parameter"""

        class MockEnv:
            ENVIRONMENT = "production"

        sender = get_email_sender(MockEnv(), use_mock=True)
        assert isinstance(sender, MockEmailSender)

    def test_force_ses_with_override(self):
        """Test forcing SES sender with use_mock parameter"""

        class MockEnv:
            ENVIRONMENT = "development"
            AWS_REGION = "us-west-2"
            EMAIL_FROM_ADDRESS = "noreply@app.com"

        sender = get_email_sender(MockEnv(), use_mock=False)
        assert isinstance(sender, SESEmailSender)


class TestEmailMessage:
    """Test EmailMessage data class"""

    def test_create_simple_message(self):
        """Test creating a basic email message"""
        message = EmailMessage(
            to=["user@example.com"], subject="Test", body_text="Hello"
        )

        assert message.to == ["user@example.com"]
        assert message.subject == "Test"
        assert message.body_text == "Hello"
        assert message.body_html is None
        assert message.cc == []
        assert message.bcc == []

    def test_create_full_message(self):
        """Test creating a message with all fields"""
        message = EmailMessage(
            to=["user1@example.com", "user2@example.com"],
            subject="Important",
            body_text="Plain text",
            body_html="<p>HTML content</p>",
            from_address="sender@example.com",
            reply_to=["reply@example.com"],
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
            headers={"X-Custom": "value"},
            metadata={"campaign_id": "123"},
        )

        assert len(message.to) == 2
        assert message.from_address == "sender@example.com"
        assert message.reply_to == ["reply@example.com"]
        assert message.headers == {"X-Custom": "value"}
        assert message.metadata == {"campaign_id": "123"}
